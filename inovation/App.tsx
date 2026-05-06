import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { registerRootComponent } from 'expo';
import TabNavigator from './src/navigation/TabNavigator';

SplashScreen.preventAutoHideAsync();

function App() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <TabNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// registerRootComponent ensures the component is registered under the correct
// name ("main") that the native Android shell looks for at startup.
registerRootComponent(App);
