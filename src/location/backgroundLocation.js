import BackgroundService from 'react-native-background-actions';
import Geolocation from 'react-native-geolocation-service';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { base_url } from '../../App';

const TRACKING_AUTH_KEY = 'FD_TRACKING_AUTH'; // { token }
const LAST_SENT_KEY = 'FD_LAST_SENT_TS';
const SEND_LOCK_KEY = 'FD_LOC_SEND_LOCK'; // prevents parallel sends

const LOCATION_POST_URL = `${base_url}api/rider/location`;
const TRACKING_STATUS_URL = `${base_url}api/rider/tracking`;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function getCurrentPositionOnce() {
    return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
            pos => resolve(pos),
            err => reject(err),
            {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 0,
                forceRequestLocation: true,
                showLocationDialog: true,
            },
        );
    });
}

export async function getRemoteTrackingStatus(token) {
    const res = await axios.get(TRACKING_STATUS_URL, {
        timeout: 20000,
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    });

    const payload = res?.data;
    const trackingRaw =
        payload?.data?.[0]?.tracking ??
        payload?.data?.tracking ??
        payload?.tracking ??
        '';

    const tracking = String(trackingRaw).toLowerCase().trim();
    return tracking === 'start' || tracking === 'stop' ? tracking : 'stop';
}

async function postLocation({ token, coords }) {
    return axios.post(
        LOCATION_POST_URL,
        { latitude: coords.latitude, longitude: coords.longitude },
        {
            timeout: 20000,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        },
    );
}

/**
 * Lock to prevent double-send if the task overlaps/restarts.
 * TTL avoids deadlock if app crashes mid-send.
 */
async function acquireSendLock(ttlMs = 30000) {
    const now = Date.now();
    const raw = await AsyncStorage.getItem(SEND_LOCK_KEY);
    const lockTs = raw ? Number(raw) : 0;

    if (lockTs && now - lockTs < ttlMs) return false;

    await AsyncStorage.setItem(SEND_LOCK_KEY, String(now));
    return true;
}

async function releaseSendLock() {
    await AsyncStorage.removeItem(SEND_LOCK_KEY);
}

async function getNextSendTime(intervalMs) {
    const last = await AsyncStorage.getItem(LAST_SENT_KEY);
    const lastTs = last ? Number(last) : 0;
    if (!lastTs || !Number.isFinite(lastTs)) return Date.now(); // first time: allow immediate
    return Math.max(Date.now(), lastTs + intervalMs);
}

const trackingTask = async taskData => {
    const intervalMs = Number(taskData?.intervalMs ?? 60 * 1000);     // send location every 1 min
    const statusPollMs = Number(taskData?.statusPollMs ?? 15 * 1000); // check switch every 15 sec

    let remoteStatus = 'stop';
    let nextStatusAt = 0;
    let nextSendAt = await getNextSendTime(intervalMs);

    while (BackgroundService.isRunning()) {
        try {
            const authRaw = await AsyncStorage.getItem(TRACKING_AUTH_KEY);
            if (!authRaw) {
                await BackgroundService.stop();
                return;
            }

            const { token } = JSON.parse(authRaw);
            if (!token) {
                await BackgroundService.stop();
                return;
            }

            const now = Date.now();

            // 1) Poll backend switch on schedule
            if (now >= nextStatusAt) {
                try {
                    remoteStatus = await getRemoteTrackingStatus(token);
                } catch {
                    // if tracking API fails temporarily, keep last known state (safer)
                }
                nextStatusAt = now + statusPollMs;
            }

            // 2) If backend says START and time reached -> send one location
            if (remoteStatus === 'start' && now >= nextSendAt) {
                const net = await NetInfo.fetch();
                if (net.isConnected) {
                    const locked = await acquireSendLock(30000);
                    if (locked) {
                        try {
                            const pos = await getCurrentPositionOnce();

                            // Send
                            await postLocation({ token, coords: pos.coords });

                            // Update last sent AFTER success
                            await AsyncStorage.setItem(LAST_SENT_KEY, String(Date.now()));

                            // Compute next send strictly +interval
                            nextSendAt = (await getNextSendTime(intervalMs));
                        } finally {
                            await releaseSendLock();
                        }
                    }
                } else {
                    // no internet, try again next interval
                    nextSendAt = now + intervalMs;
                }
            }

            // 3) Sleep until next scheduled event
            const nextWake = remoteStatus === 'start'
                ? Math.min(nextStatusAt, nextSendAt)
                : nextStatusAt;

            const sleepFor = Math.max(1000, nextWake - Date.now());
            await sleep(sleepFor);

        } catch (e) {
            // Token expired / unauthorized => stop completely
            if (e?.response?.status === 401) {
                await stopBackgroundLocation({ clearAuth: true });
                return;
            }
            await sleep(2000);
        }
    }
};

export async function startBackgroundLocation({
    token,
    intervalMs = 60 * 1000,
    statusPollMs = 15 * 1000,
}) {
    await AsyncStorage.setItem(TRACKING_AUTH_KEY, JSON.stringify({ token }));

    const options = {
        taskName: 'RiderTrackingWatcher',
        taskTitle: 'Rider tracking service',
        taskDesc: 'Listening for tracking start/stop',
        taskIcon: { name: 'ic_launcher', type: 'mipmap' },

        // IMPORTANT: keeps service when app is swiped away (if supported by your version)
        // stopWithTask: false,

        parameters: { intervalMs, statusPollMs },
    };

    if (!BackgroundService.isRunning()) {
        await BackgroundService.start(trackingTask, options);
    }
}

export async function stopBackgroundLocation({ clearAuth = true } = {}) {
    await AsyncStorage.multiRemove([LAST_SENT_KEY, SEND_LOCK_KEY]);

    if (clearAuth) {
        await AsyncStorage.removeItem(TRACKING_AUTH_KEY);
    }

    if (BackgroundService.isRunning()) {
        await BackgroundService.stop();
    }
}