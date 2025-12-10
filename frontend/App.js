import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from "./src/navigation/AuthContext";
import { useFonts, SpaceGrotesk_400Regular, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { ActivityIndicator, View } from 'react-native';

export default function App() {
  let [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#181711' }}>
        <ActivityIndicator size="large" color="#FACC15" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}