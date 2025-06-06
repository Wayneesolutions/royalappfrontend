// SaleOrderStart.tsx
import React from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import styles from './salesOrderStyles'

const SaleOrderApprove = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Sale Order Approved</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('DashboardHome')}>
        <Text style={styles.buttonText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SaleOrderApprove;