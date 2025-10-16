import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import styles from "./salesOrderStyles";
import { ToastAndroid } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';



const SaleOrderEntry = ({ navigation, route }: any) => {
    const [isApproved, setIsApproved] = useState(false);
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => {
        const updatedItems = route?.params?.updatedItems;
        if (updatedItems) {
            setItems(updatedItems);
            navigation.setParams({ updatedItems: null }); // clear to avoid loops
        }
    }, [route?.params?.updatedItems]);





    // Totals
    const totalQty = items.reduce((sum, item) => sum + parseFloat(item.quantity), 0);
    const totalAmount = items.reduce((sum, item) => sum + item.rate * item.quantity, 0);
    const cgst = 0; // Future enhancement
    const sgst = 0;
    const grandTotal = totalAmount + cgst + sgst;

    return (
        <View style={{ flex: 1, backgroundColor: "#fff", marginTop: 40 }}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerText}>Royal Software</Text>
            </View>

            {/* Main content wrapper */}
            <View style={{ flex: 1, justifyContent: "space-between" }}>
                {/* Scrollable content */}
                <ScrollView contentContainerStyle={{ padding: 16 }}>
                    <Text style={styles.subHeader}>Sales order Entry</Text>

                    {/* Order ID + Approve */}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                        <Text style={{ flex: 1 }}>Order id : 115148423186df84</Text>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <TouchableOpacity
                                onPress={() => setIsApproved(!isApproved)}
                                style={{
                                    width: 20,
                                    height: 20,
                                    borderWidth: 2,
                                    borderColor: "#0f6cbf",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    marginRight: 4,
                                }}
                            >
                                {isApproved && <Ionicons name="checkmark" size={14} color="#0f6cbf" />}
                            </TouchableOpacity>
                            <Text>Approve Order</Text>
                        </View>
                    </View>

                    {/* Date & Time */}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
                        <Text>Order Date : 2025/06/11</Text>
                        <Text>12:32:35</Text>
                    </View>

                    {/* Bal & Credit */}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                        <Text>Bal : 0.0 Dr</Text>
                        <Text>Credit Limit</Text>
                    </View>

                    {/* Other Info */}
                    <Text style={{ marginTop: 4 }}>Price Level :-</Text>
                    <Text style={{ marginTop: 4 }}>Address: Loream Ipsum</Text>

                    {/* Highlighted Message */}
                    <View style={{ marginTop: 12, backgroundColor: "#077BC3", padding: 2 }}>
                        <Text style={{ color: "#fff", fontWeight: "bold" }}>Credit Limit Exceed</Text>
                    </View>

                    {/* Items Header */}
                    <View
                        style={{
                            borderColor: "#000",
                            borderWidth: 1,
                            marginTop: 10,
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <Text style={{ fontWeight: "bold", padding: 12 }}>ITEMS</Text>
                        <TouchableOpacity
                            onPress={() =>
                                navigation.navigate("SaleOrderItemSelect", {
                                    currentItems: items, // pass current list
                                })
                            }
                            style={{
                                backgroundColor: "#077BC3",
                                paddingVertical: 12,
                                paddingHorizontal: 20,
                            }}
                        >
                            <Text style={{ color: "#fff", fontWeight: "bold" }}>ADD</Text>
                        </TouchableOpacity>

                    </View>

                    {/* Items List */}
                    {items.length > 0 ? (
                        items.map((item, index) => (
                            <View
                                key={index}
                                style={{
                                    borderBottomWidth: 1,
                                    borderBottomColor: "#ddd",
                                    paddingVertical: 10,
                                }}
                            >
                                <Text style={{ fontWeight: "bold" }}>{item.itemName}</Text>
                                <Text>Qty: {item.quantity}</Text>
                                <Text>Rate: {item.rate}</Text>
                                <Text>Amount: {(item.quantity * item.rate).toFixed(2)}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={{ marginTop: 10 }}>No items added yet.</Text>
                    )}
                </ScrollView>

                {/* Fixed Summary */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, marginTop: 8 }}>
                    <View>
                        <Text style={{ marginBottom: 6 }}>Delterms</Text>
                        <Text style={{ marginBottom: 6 }}>Payterms</Text>
                        <Text style={{ marginBottom: 6 }}>Quantity Total : {totalQty}</Text>
                        <Text>Cash Discount</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ marginBottom: 6 }}>Amount : {totalAmount.toFixed(2)}</Text>
                        <Text style={{ marginBottom: 6 }}>CGST : {cgst.toFixed(2)}</Text>
                        <Text style={{ marginBottom: 6 }}>SGST : {sgst.toFixed(2)}</Text>
                        <Text style={{ fontWeight: "bold" }}>Grand Total : {grandTotal.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Footer Buttons */}
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor: "#077BC3",
                        paddingHorizontal: 20,
                        paddingVertical: 12,
                        margin: 10,
                        marginBottom: 50,
                        borderRadius: 6,
                    }}
                >
                    <TouchableOpacity>
                        <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={async () => {
                            if (!isApproved) {
                                ToastAndroid.show("Please approve the order before saving.", ToastAndroid.SHORT);
                                return;
                            }

                            const orderData = {
                                customerName: "John Doe",
                                date: "2025-06-11",
                                quantity: totalQty,
                            };

                            try {
                                const existingData = await AsyncStorage.getItem("saleOrders");
                                const orders = existingData ? JSON.parse(existingData) : [];

                                orders.push(orderData); // add new order

                                await AsyncStorage.setItem("saleOrders", JSON.stringify(orders));

                                ToastAndroid.show("Order Saved Successfully!", ToastAndroid.SHORT);
                            } catch (error) {
                                console.error("Saving order failed:", error);
                                ToastAndroid.show("Failed to save order", ToastAndroid.SHORT);
                            }
                        }}

                    >
                        <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>SAVE ORDER</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </View>
    );
};

export default SaleOrderEntry;
