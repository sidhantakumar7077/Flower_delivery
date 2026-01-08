import BackgroundService from 'react-native-background-actions';
import Geolocation from 'react-native-geolocation-service';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { base_url } from '../../App';

const TRACKING_FLAG_KEY = 'FD_TRACKING_ENABLED';
const TRACKING_AUTH_KEY = 'FD_TRACKING_AUTH'; // store { token, riderId }
const LAST_SENT_KEY = 'FD_LAST_SENT_TS';

const YOUR_API_URL = `${base_url}api/rider/location`; // <-- change

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

async function postLocation({ token, riderId, coords, timestamp }) {
    // You decide your server schema
    return axios.post(
        YOUR_API_URL,
        {
            // riderId,
            latitude: coords.latitude,
            longitude: coords.longitude,
            // accuracy: coords.accuracy,
            // speed: coords.speed,
            // heading: coords.heading,
            // altitude: coords.altitude,
            // timestamp,
        },
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

async function shouldSendNow(minIntervalMs) {
    const last = await AsyncStorage.getItem(LAST_SENT_KEY);
    if (!last) return true;
    const lastTs = Number(last);
    return Number.isFinite(lastTs) ? Date.now() - lastTs >= minIntervalMs : true;
}

const trackingTask = async taskData => {
    const { intervalMs } = taskData;

    // Keep running until stop() is called
    while (BackgroundService.isRunning()) {
        try {
            // Optional: enforce a minimum interval even if loop is restarted
            const okToSend = await shouldSendNow(intervalMs);
            if (!okToSend) {
                await sleep(1000);
                continue;
            }

            const net = await NetInfo.fetch();
            if (!net.isConnected) {
                // No internet: wait and retry next cycle
                await sleep(intervalMs);
                continue;
            }

            const authRaw = await AsyncStorage.getItem(TRACKING_AUTH_KEY);
            if (!authRaw) {
                // Not logged in / no token: stop tracking
                await BackgroundService.stop();
                return;
            }

            const auth = JSON.parse(authRaw);
            const pos = await getCurrentPositionOnce();
            const timestamp = pos.timestamp || Date.now();

            // ✅ Debug log (keep for verification)
            console.log(
                `[BG-LOC] ${new Date(timestamp).toISOString()} lat=${pos.coords.latitude} lng=${pos.coords.longitude}`,
            );
            // return;

            // ✅ Send to your API (saves to DB on backend)
            const resp = await postLocation({ token: auth.token, coords: pos.coords });

            // Optional log
            console.log('[BG-LOC] Sent OK:', resp?.data);

            await AsyncStorage.setItem(LAST_SENT_KEY, String(Date.now()));
        } catch (e) {
            // ✅ Log errors so you can see why request failed
            const msg =
                e?.response?.data?.message ||
                e?.response?.data ||
                e?.message ||
                'Unknown error';
            console.log('[BG-LOC] Send failed:', msg);

            // If token expired / unauthorized -> stop tracking
            if (e?.response?.status === 401) {
                await stopBackgroundLocation();
                return;
            }
        }

        await sleep(intervalMs);
    }
};

export async function startBackgroundLocation({ token }) {
    // Save token for background usage
    await AsyncStorage.setItem(TRACKING_AUTH_KEY, JSON.stringify({ token }));
    await AsyncStorage.setItem(TRACKING_FLAG_KEY, '1');

    const options = {
        taskName: 'RiderLocationTracking',
        taskTitle: 'Tracking location',
        taskDesc: 'Updating location periodically',
        taskIcon: { name: 'ic_launcher', type: 'mipmap' },
        parameters: {
            intervalMs: 60 * 1000, // 1 minute for testing (change to 5 * 60 * 1000 later)
        },
    };

    if (!BackgroundService.isRunning()) {
        await BackgroundService.start(trackingTask, options);
    }
}

export async function stopBackgroundLocation() {
    await AsyncStorage.multiRemove([TRACKING_FLAG_KEY, TRACKING_AUTH_KEY, LAST_SENT_KEY]);
    if (BackgroundService.isRunning()) {
        await BackgroundService.stop();
    }
}

export async function resumeBackgroundLocationIfEnabled() {
    const enabled = await AsyncStorage.getItem(TRACKING_FLAG_KEY);
    if (enabled !== '1') return;

    const authRaw = await AsyncStorage.getItem(TRACKING_AUTH_KEY);
    if (!authRaw) return;

    const auth = JSON.parse(authRaw);
    if (!auth?.token) return;

    await startBackgroundLocation({ token: auth.token });
}