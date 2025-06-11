import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";

const itemList = [
  { name: "WBC", code: "1101", rate: 50 },
  { name: "Round", code: "1102", rate: 60 },
  { name: "PVC", code: "1103", rate: 40 },
  { name: "Calcium", code: "1104", rate: 45 },
  { name: "Film Code", code: "1105", rate: 55 },
  { name: "1104", code: "1106", rate: 35 },
  { name: "1104 WBC", code: "1107", rate: 65 },
];

const SaleOrderItemSelect = ({ navigation, route }: any) => {
  const currentItems = route?.params?.currentItems || [];

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", marginTop: 40 }}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Royal Software</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {itemList.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() =>
              navigation.navigate("SaleOrderItemDetail", {
                itemName: item.name,
                itemCode: item.code,
                rate: item.rate,
                currentItems,  // pass current items forward
              })
            }
            style={styles.listItem}
          >
            <Text style={styles.itemCode}>{item.name}</Text>
            <Text style={styles.itemDetails}>
              Code: {item.code}   Rate: {item.rate}   CGST%: 0.0   SGST%: 0.0
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};


const styles = StyleSheet.create({
  header: {
    backgroundColor: '#077BC3',
    paddingVertical: 16,
    alignItems: "center",
  },
  headerText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  container: {
    padding: 16,
  },
  listItem: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  itemCode: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  itemDetails: {
    color: "#555",
  },
});

export default SaleOrderItemSelect;
