import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import AppNavigator from '../navigation/AppNavigator';
import PreloaderScreen from '../screens/PreloaderScreen';

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const prepareApp = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.warn('Initialization error:', error);
      } finally {
        if (isMounted) {
          setIsAppReady(true);
        }
      }
    };

    prepareApp();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isAppReady) {
    return <PreloaderScreen />;
  }

  return (
    <View style={styles.container}>
      <AppNavigator />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});