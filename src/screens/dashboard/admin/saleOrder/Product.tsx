import React, { useState } from 'react';

import {
    View,
    Text,
    StyleSheet,
    TextInput,
    FlatList,
    Image,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import GlobalFAB from '../GlobalFAB';
import ProductImage from "../../../../../assets/images/image 5.png"
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../../navigation/types';

type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

const products = new Array(10).fill(null).map(() => ({
    id: Math.random().toString(),
    title: 'Lorem Ipsum',
    price: '230',
    rating: '4.5',
    image: ProductImage
}));

const ProductCard = ({ product, onAddToCart }) => (
    <View style={styles.card}>
        <Image
            source={typeof product.image === 'string' ? { uri: product.image } : product.image}
            style={styles.image}
        />
        <Text style={styles.title}>tittle : {product.title}</Text>
        <View style={styles.row}>
            <Text style={styles.price}>₹ {product.price}</Text>
            <View style={styles.rating}>
                <Text style={{ color: '#fff', fontSize: 12 }}>{product.rating}</Text>
            </View>
        </View>
        <TouchableOpacity onPress={() => onAddToCart(product)}>
            <Text style={styles.addToCart}>Add to Cart</Text>
        </TouchableOpacity>
    </View>
);


const Product = () => {
    const navigation = useNavigation<NavigationProps>();

    const [cart, setCart] = useState([]);

    return (
        <View style={styles.root}>
            {/* Top Bar */}
            <View style={styles.topBar}>
                <Feather name="more-vertical" size={20} color="black" />
                <Text style={styles.topTitle}>Royal Software</Text>
                <Image
                    source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
                    style={styles.avatar}
                />
            </View>

            {/* Search Input */}
            <TextInput
                style={styles.search}
                placeholder="Search by product Keyword"
                placeholderTextColor="#999"
            />

            {/* Header */}
            <Text style={styles.heading}>Product For You</Text>

            {/* Grid List */}
            <FlatList
                data={products}
                keyExtractor={(item, index) => item.id + index}
                numColumns={2}
                columnWrapperStyle={styles.rowBetween}
                contentContainerStyle={{ paddingBottom: 100 }}
                renderItem={({ item }) => (
                    <ProductCard product={item} onAddToCart={(prod) => setCart([...cart, prod])} />
                )}

                showsVerticalScrollIndicator={false}
            />

            {/* Bottom Navigation */}
            <View style={styles.bottomBar}>
                {/* My Orders button */}
                <TouchableOpacity
                    style={styles.ordersButton}
                    onPress={() => navigation.navigate('ProductSummary', { cart })}
                >
                    <Text style={styles.bottomText}>My Orders</Text>
                    <Text style={styles.itemsCount}>Items: {cart.length}</Text>
                </TouchableOpacity>

                {/* Order Summary label */}
                <Text style={styles.summaryText}>Order Summary</Text>
            </View>




            {/* Floating Button */}
            <GlobalFAB />
        </View>
    );
};

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 20,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    topTitle: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    avatar: {
        height: 32,
        width: 32,
        borderRadius: 16,
    },
    search: {
        borderWidth: 1,
        borderColor: '#ccc',
        margin: 16,
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 40,
    },
    heading: {
        fontSize: 16,
        fontWeight: 'bold',
        marginHorizontal: 16,
        marginBottom: 8,
    },
    rowBetween: {
        justifyContent: 'space-between',
        marginHorizontal: 16,
        marginBottom: 16,
    },
    card: {
        width: cardWidth,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 8,
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: 110,
        resizeMode: 'contain',
        marginBottom: 8,
    },
    title: {
        fontSize: 12,
        color: '#444',
        marginBottom: 4,
    },
    price: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#000',
    },
    rating: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        marginLeft: 6,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    addToCart: {
        color: '#007bff',
        fontWeight: '600',
        fontSize: 13,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        backgroundColor: '#fff',
        left: 0,
        right: 0,
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    bottomText: {
        fontWeight: '500',
        color: 'white'
    },
    summaryBtn: {
        backgroundColor: '#007bff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    summaryText: {
        color: '#fff',
        fontWeight: '600',
    },
    orderSummary: {
        marginLeft: 16,
        alignItems: 'flex-end',
    },
    ordersSection: {
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    itemsCount: {
        fontSize: 12,
        color: 'white',
    },
    ordersButton: {
        backgroundColor: '#007bff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },



});

export default Product;
