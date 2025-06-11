import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";

const SaleOrderItemDetail = ({ route, navigation }: any) => {
    const itemName = route?.params?.itemName ?? "Unknown Item";
    const itemCode = route?.params?.itemCode ?? "N/A";
    const rate = route?.params?.rate ?? 0;
    const [quantity, setQuantity] = useState("1");
    const currentItems = route?.params?.currentItems || [];

    const amount = parseFloat(quantity) * rate;
    const cgst = 0;
    const sgst = 0;
    const total = amount + cgst + sgst;

    return (
        <View style={{ flex: 1, backgroundColor: "#fff", marginTop: 40 }}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerText}>Royal Software</Text>
            </View>

            {/* Content */}
            <View style={styles.container}>
                <Text style={styles.label}>Item Name: {itemName}</Text>

                <Text style={styles.label}>Quantity:</Text>
                <TextInput
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                    style={styles.input}
                />

                <Text style={styles.label}>Rate: {rate}</Text>
                <Text style={styles.label}>Amount: {amount.toFixed(2)}</Text>
                <Text style={styles.label}>CGST %: {cgst.toFixed(1)}</Text>
                <Text style={styles.label}>SGST %: {sgst.toFixed(1)}</Text>
                <Text style={styles.label}>Tot. Amt with Tax: {total.toFixed(2)}</Text>

                {/* Floating Action Button */}
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => {
                        const newItem = {
                            itemName,
                            itemCode,
                            quantity: parseFloat(quantity),
                            rate,
                        };
                        const updatedItems = [...currentItems, newItem];

                        navigation.navigate("SaleOrderEntry", { updatedItems });
                    }}
                >
                    <Text style={styles.fabText}>+</Text>
                </TouchableOpacity>


            </View>
        </View>
    );
};

const styles = StyleSheet.create({
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
    container: {
        flex: 1,
        padding: 20,
    },
    label: {
        marginBottom: 10,
        fontSize: 16,
        color: "#333",
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 10,
        marginBottom: 16,
        borderRadius: 6,
    },
    fab: {
        position: "absolute",
        bottom: 70,
        right: 50,
        backgroundColor: "#0f6cbf",
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: "center",
        alignItems: "center",
        elevation: 4,
    },
    fabText: {
        color: "#fff",
        fontSize: 28,
        fontWeight: "bold",
    },
});

export default SaleOrderItemDetail;
