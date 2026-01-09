import { StyleSheet, Text, View, StatusBar } from 'react-native'
import React, { useEffect, useState } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from "@react-native-community/netinfo";

import { ensureTrackingPermissions } from './src/location/permissions';
import {
  startBackgroundLocation,
  stopBackgroundLocation,
  getRemoteTrackingStatus,
} from './src/location/backgroundLocation';

// SplashScreen
import SplashScreen from './src/screens/SplashScreen/Index'

// No Internet Page
import NoInternet from './src/screens/NoInternet/Index'

// Auth
import Login from './src/screens/Auth/Login'
import Otp from './src/screens/Auth/OTP'

// Pages
import Home from './src/screens/Home/Index'
import Profile from './src/screens/Profile/Index'
import Pickup from './src/screens/Pickup/Index'

const Stack = createNativeStackNavigator();

export const base_url = "https://pandit.33crores.com/";

const App = () => {

  const [showSplash, setShowSplash] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [access_token, setAccess_token] = useState('');

  const getAccessToken = async () => {
    try {
      const value = await AsyncStorage.getItem('storeAccesstoken');
      if (value) {
        setAccess_token(value);
        console.log("Access token retrieved:", value);
      } else {
        setAccess_token('');
      }
    } catch (e) {
      setAccess_token('');
    }
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      // console.log("Connection type", state.type);
      // console.log("Is connected?", state.isConnected);
      setIsConnected(state.isConnected ?? false);
    });
    return () => {
      unsubscribe();
      // setTimeout(unsubscribe, 5000);
    }
  }, []);

  useEffect(() => {
    getAccessToken();
    setTimeout(() => {
      setShowSplash(false);
    }, 5000)
  }, []);

  // ✅ Sync background tracking with backend "tracking" switch
  useEffect(() => {
    const run = async () => {
      if (!access_token) {
        await stopBackgroundLocation({ clearAuth: true });
        return;
      }

      const perm = await ensureTrackingPermissions();
      if (!perm.ok) return;

      // Start watcher service (it will send only when backend says start)
      await startBackgroundLocation({
        token: access_token,
        intervalMs: 60 * 1000,     // one location per minute
        statusPollMs: 15 * 1000,   // check backend start/stop every 15 sec
      });
    };

    run();
  }, [access_token]);

  return (
    <NavigationContainer>
      {/* <StatusBar backgroundColor="#1E293B" barStyle="light-content" /> */}
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {showSplash ? (<Stack.Screen name="SplashScreen" component={SplashScreen} options={{ presentation: 'modal', animationTypeForReplace: 'push', animation: 'slide_from_right' }} />) : null}
        {!isConnected ? (
          <Stack.Screen name="NoInternet" component={NoInternet} />
        ) : (
          <>
            {access_token ? <Stack.Screen name="Home" component={Home} /> : <Stack.Screen name="Login" component={Login} />}
            {!access_token ? <Stack.Screen name="Home" component={Home} /> : <Stack.Screen name="Login" component={Login} />}
            <Stack.Screen name="Otp" component={Otp} />
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen name="Pickup" component={Pickup} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default App

const styles = StyleSheet.create({})