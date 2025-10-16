import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SaleOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);

  const fetchOrders = async () => {
    try {
      const data = await AsyncStorage.getItem("saleOrders");
      if (data) {
        setOrders(JSON.parse(data));
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching sale orders:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.orderBox}>
      <View style={styles.rowSpace}>
        <Text style={styles.customerName}>John Doe</Text>
        <Text style={styles.amountText}>0</Text>
      </View>
      <Text style={styles.subText}>
        Order ref.: {item.date || "2024-07-05"}
      </Text>
      <Text style={styles.subText}>Quantity : {item.quantity}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", marginTop: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Royal Software</Text>
      </View>

      {/* Header Filter Bar */}
      <View style={styles.headerRow}>
        <Text style={styles.periodLabel}>
          Period : <Text style={styles.date}>2024/6/26</Text>
        </Text>
        <Text style={styles.periodLabel}>
          To : <Text style={styles.date}>2024/7/6</Text>
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchOrders}>
          <Text style={styles.refreshText}>REFRESH</Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      <FlatList
        data={orders}
        renderItem={renderItem}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#077BC3",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#075BA2",
    paddingHorizontal: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  periodLabel: {
    color: "#fff",
    fontSize: 13,
    marginRight: 8,
  },
  date: {
    fontWeight: "bold",
    color: "#fff",
  },
  refreshButton: {
    backgroundColor: "#FF5C1B",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: "auto",
  },
  refreshText: {
    color: "#fff",
    fontWeight: "bold",
  },
  orderBox: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rowSpace: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  customerName: {
    fontWeight: "bold",
    fontSize: 16,
  },
  amountText: {
    fontSize: 16,
    color: "#000",
  },
  subText: {
    color: "#555",
    fontSize: 13,
    marginTop: 2,
  },
});

export default SaleOrders;
