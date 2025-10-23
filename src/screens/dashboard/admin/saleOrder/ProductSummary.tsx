import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ScrollView
} from 'react-native';

import { Feather } from '@expo/vector-icons';
import ProductImage from '../../../../../assets/images/image 5.png';
import { useRoute, useNavigation } from '@react-navigation/native';

const ProductSummary = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { cart } = route.params as { cart: any[] };

    const [cartItems, setCartItems] = useState(cart);
    const [approved, setApproved] = useState(false);

    const updateQuantity = (id, change) => {
        setCartItems(prev =>
            prev.map(item => {
                if (item.id === id) {
                    const newQty = item.quantity + change;
                    return { ...item, quantity: newQty > 0 ? newQty : 1 };
                }
                return item;
            })
        );
    };


    const removeItem = id => {
        setCartItems(prev => prev.filter(item => item.id !== id));
    };

    const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalProducts = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <Image source={item.image || ProductImage} style={styles.image} />
            <View style={styles.details}>
                <Text style={styles.title}>Title: {item.title}</Text>
                <Text style={styles.price}>₹ {item.price}</Text>
                <View style={styles.rating}>
                    <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
                <View style={styles.quantityRow}>
                    <TouchableOpacity onPress={() => updateQuantity(item.id, -1)}>
                        <Text style={styles.qBtn}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qty}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => updateQuantity(item.id, 1)}>
                        <Text style={styles.qBtn}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <TouchableOpacity onPress={() => removeItem(item.id)}>
                <Feather name="trash" size={18} color="black" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.root}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={24} color="green" />
                </TouchableOpacity>
                <Text style={styles.headerText}>View Cart</Text>
                <Image
                    source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
                    style={styles.avatar}
                />
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 240 }}>
                <FlatList
                    data={cartItems}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    scrollEnabled={false} // prevent nested scroll conflict
                />

                {/* Approval Checkbox */}
                <View style={[styles.checkboxContainer, { marginTop: 10 }]}>
                    <TouchableOpacity
                        onPress={() => setApproved(!approved)}
                        style={{
                            width: 20,
                            height: 20,
                            borderRadius: 4,
                            borderWidth: 2,
                            borderColor: '#007bff',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {approved && <Feather name="check" size={16} color="#007bff" />}
                    </TouchableOpacity>

                    <Text style={styles.checkboxLabel}>I approve the selected products</Text>
                </View>

                {!approved && (
                    <Text style={{ color: 'red', marginLeft: 20, marginBottom: 6 }}>
                        Please approve the products to continue
                    </Text>
                )}
            </ScrollView>



            {/* Total & Continue Box */}
            <View style={styles.summaryBox}>
                <TouchableOpacity style={styles.continueBtn}>
                    <Text style={styles.continueText}>Continue</Text>
                </TouchableOpacity>
                <View style={styles.summaryDetails}>
                    <Text>Total Amount</Text>
                    <Text style={styles.bold}>₹ {totalAmount}</Text>
                    <Text>Products</Text>
                    <Text style={styles.bold}>{totalProducts}</Text>
                </View>
            </View>

            {/* Proceed to Checkout */}
            <TouchableOpacity
                disabled={!approved}
                style={[
                    styles.checkoutBtn,
                    { backgroundColor: approved ? '#28a745' : '#ccc' },
                ]}
                onPress={() => {
                    // Save logic or navigation can go here
                    alert('Products saved & proceeding to next step!');
                }}
            >
                <Text style={styles.checkoutText}>Save & Proceed</Text>
            </TouchableOpacity>

        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#fff', paddingTop: 40 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    headerText: { fontSize: 16, fontWeight: 'bold', color: 'green' },
    avatar: { width: 32, height: 32, borderRadius: 16 },

    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        marginHorizontal: 16,
        marginVertical: 6,
        alignItems: 'center',
        elevation: 2,
    },
    image: { width: 60, height: 60, resizeMode: 'contain' },
    details: { flex: 1, marginLeft: 12 },
    title: { fontSize: 12, color: '#444' },
    price: { fontWeight: 'bold', fontSize: 14 },
    rating: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        marginTop: 4,
        alignSelf: 'flex-start',
    },
    ratingText: { color: '#fff', fontSize: 12 },
    quantityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    qBtn: { fontSize: 18, paddingHorizontal: 8 },
    qty: { fontSize: 14, fontWeight: '600' },

    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 10,
    },
    checkboxLabel: {
        marginLeft: 8,
        fontSize: 14,
        color: '#333',
    },

    summaryBox: {
        position: 'absolute',
        bottom: 60,
        backgroundColor: '#fff',
        width: '90%',
        alignSelf: 'center',
        padding: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 5,
    },
    continueBtn: {
        backgroundColor: '#007bff',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    continueText: { color: '#fff', fontWeight: 'bold' },
    summaryDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
    },
    bold: { fontWeight: 'bold' },

    checkoutBtn: {
        padding: 16,
        borderRadius: 8,
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    checkoutText: { color: '#fff', fontWeight: 'bold' },
});

export default ProductSummary;
