import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import styles from "./salesOrderStyles";

const SaleOrderStart = ({ navigation }: any) => {
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" , marginTop:40 }}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Royal Software</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} style={{ padding:20}}>
        <TouchableOpacity
          style={styles.listItem}
          onPress={() => navigation.navigate("SaleOrderEntry")}
        >
          <Text style={{ fontWeight: "bold", fontSize: 16 }}>John Doe</Text>
          <Text style={{ color: "#555" }}>Model Town</Text>
          <Text style={{ color: "#555" }}>Ludhiana</Text>
        </TouchableOpacity>

        {["Cash", "Purchase", "Sale Account", "Supplier"].map((label, idx) => (
          <View key={idx} style={styles.listItem}>
            <Text>{label}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};



export default SaleOrderStart;
