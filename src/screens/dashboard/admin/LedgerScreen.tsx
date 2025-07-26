import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const LedgerScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to LedgerScreen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
});

export default LedgerScreen;
