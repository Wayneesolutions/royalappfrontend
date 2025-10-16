import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DistributorsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to DistributorsScreen</Text>
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

export default DistributorsScreen;
