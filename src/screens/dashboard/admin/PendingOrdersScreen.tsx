import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PendingOrdersScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to PendingOrdersScreen</Text>
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

export default PendingOrdersScreen;
