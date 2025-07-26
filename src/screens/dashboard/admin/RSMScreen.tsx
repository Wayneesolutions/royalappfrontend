import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const RSMScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to RSMScreen</Text>
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

export default RSMScreen;
