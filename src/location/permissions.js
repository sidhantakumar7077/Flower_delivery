import { PermissionsAndroid, Platform } from 'react-native';

export async function ensureTrackingPermissions() {
    if (Platform.OS !== 'android') {
        return { ok: false, reason: 'ANDROID_ONLY' };
    }

    const fine = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
            title: 'Location Permission',
            message: 'We need your location to track deliveries.',
            buttonPositive: 'OK',
            buttonNegative: 'Cancel',
        },
    );

    if (fine !== PermissionsAndroid.RESULTS.GRANTED) {
        return { ok: false, reason: 'LOCATION_DENIED' };
    }

    return { ok: true };
}