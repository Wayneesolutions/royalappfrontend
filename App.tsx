import React from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

function  AppContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  React.useEffect(() => {
    if (fontsLoaded) {
      // Add a small delay to ensure smooth transition
      setTimeout(() => {
        SplashScreen.hideAsync();
      }, 500);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#077BC3"
        translucent={false}
      />
      
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <NavigationContainer>
          <AppNavigator user={user} 
        isAuthenticated={isAuthenticated} />
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </PersistGate>
    </Provider>
  );
}