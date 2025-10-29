import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';

interface OrderItem {
  productId: string;
  productCode: string;
  productName: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  totalAmount: number;
  availableStock: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  role: string;
}

interface Product {
  _id: string;
  productName: string;
  productCode: string;
  price: number;
  unit: string;
  stock: {
    current: number;
    minimum: number;
    maximum: number;
  };
  isAvailable: boolean;
  isActive: boolean;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerId: string | {
    _id: string;
    email: string;
    name: string;
    mobile: string;
    role: string;
  };
  customerName: string;
  customerEmail?: string;
  customerMobile?: string;
  dealerId?: string | {
    _id: string;
    email: string;
    name: string;
    mobile: string;
    role: string;
  };
  dealerName?: string;
  subDealerId?: string | {
    _id: string;
    email: string;
    name: string;
    mobile: string;
    role: string;
  };
  subDealerName?: string;
  shippingAddress: {
    subDealerId?: string;
    name: string;
    address: string;
    mobile: string;
  };
  items: OrderItem[];
  totalQuantity: number;
  totalAmount: number;
  notes?: string;
  status: string;
  orderType: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

const AdminEditOrder = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { order } = route.params as { order: Order };
  
  const { 
    getUsersByRole, 
    getProducts, 
    getProductById, 
    updateOrder 
  } = useAuth();
  
  // Helper function to format address object to string
  const formatAddress = (address?: { street?: string; city?: string; state?: string; pincode?: string; country?: string }) => {
    if (!address) return 'Address not specified';
    
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.pincode) parts.push(address.pincode);
    if (address.country) parts.push(address.country);
    
    return parts.length > 0 ? parts.join(', ') : 'Address not specified';
  };
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingQuantity, setUpdatingQuantity] = useState<string | null>(null);
  
  // Form state
  const [selectedDealer, setSelectedDealer] = useState<User | null>(null);
  const [selectedSubDealer, setSelectedSubDealer] = useState<User | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderNotes, setOrderNotes] = useState('');
  
  // Data state
  const [dealers, setDealers] = useState<User[]>([]);
  const [subDealers, setSubDealers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // UI state
  const [showDealerDropdown, setShowDealerDropdown] = useState(false);
  const [showSubDealerDropdown, setShowSubDealerDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInitialData();
    initializeForm();
  }, []);

  const initializeForm = () => {
    // Initialize form with existing order data and normalize items
    const normalizedItems: OrderItem[] = (order.items || []).map((it: any) => {
      const productIdStr = typeof it.productId === 'object' ? it.productId?._id : it.productId;
      const productCode = it.productCode || (typeof it.productId === 'object' ? it.productId?.productCode : '');
      const productName = it.productName || (typeof it.productId === 'object' ? it.productId?.productName : '');
      const unit = it.unit || '';
      const unitPrice = it.unitPrice ?? it.price ?? 0;
      const quantity = it.quantity ?? 0;
      const totalAmount = (it.totalAmount ?? it.totalPrice ?? (unitPrice * quantity)) ?? 0;
      return {
        productId: productIdStr,
        productCode,
        productName,
        unit,
        unitPrice,
        quantity,
        totalAmount,
        availableStock: it.availableStock ?? 0,
      } as OrderItem;
    });

    setOrderItems(normalizedItems);
    setOrderNotes(order.notes || '');
    
    console.log('🔍 Initializing form with order data:', {
      customerId: order.customerId,
      dealerId: order.dealerId,
      subDealerId: order.subDealerId,
      shippingAddress: order.shippingAddress
    });
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch dealers
      const dealersResponse = await getUsersByRole('dealers');
      let dealersList = [];
      if (Array.isArray(dealersResponse)) {
        dealersList = dealersResponse;
        setDealers(dealersResponse);
      } else if (dealersResponse?.success) {
        // Response with success field - handle nested data.users structure
        dealersList = dealersResponse.data?.users || dealersResponse.data || dealersResponse.users || [];
        setDealers(Array.isArray(dealersList) ? dealersList : []);
      } else if (dealersResponse?.users && Array.isArray(dealersResponse.users)) {
        // Response structure: {users: [...], role: 'dealers', count: 1}
        dealersList = dealersResponse.users;
        setDealers(dealersResponse.users);
      }
      
      // Fetch sub dealers
      const subDealersResponse = await getUsersByRole('subdealer');
      let subDealersList = [];
      if (Array.isArray(subDealersResponse)) {
        subDealersList = subDealersResponse;
        setSubDealers(subDealersResponse);
      } else if (subDealersResponse?.success) {
        // Response with success field - handle nested data.users structure
        subDealersList = subDealersResponse.data?.users || subDealersResponse.data || subDealersResponse.subDealers || subDealersResponse.users || [];
        setSubDealers(Array.isArray(subDealersList) ? subDealersList : []);
      } else if (subDealersResponse?.users && Array.isArray(subDealersResponse.users)) {
        // Response structure: {users: [...], role: 'subdealer', count: 3}
        subDealersList = subDealersResponse.users;
        setSubDealers(subDealersResponse.users);
      }
      
      // Fetch products
      const productsResponse = await getProducts();
      if (productsResponse?.success) {
        setProducts(productsResponse.products || []);
      }
      
      // Find and set current dealer and subdealer from order data
      console.log('🔍 Setting dealer and subdealer from order data...');
      
      // Set dealer - try dealerId first, then customerId as fallback
      let dealerId: string | undefined = undefined;
      if (typeof order.dealerId === 'string') {
        dealerId = order.dealerId;
      } else if (typeof order.dealerId === 'object' && order.dealerId?._id) {
        dealerId = order.dealerId._id;
      }
      
      if (!dealerId) {
        if (typeof order.customerId === 'string') {
          dealerId = order.customerId;
        } else if (typeof order.customerId === 'object' && order.customerId?._id) {
          dealerId = order.customerId._id;
        }
      }
      
      if (dealerId) {
        const currentDealer = dealersList.find((d: any) => d._id === dealerId);
        if (currentDealer) {
          setSelectedDealer(currentDealer);
          console.log('✅ Dealer set:', currentDealer.name);
        } else {
          console.log('❌ Dealer not found in list:', dealerId);
        }
      }
      
      // Set subdealer - try subDealerId first, then shippingAddress.subDealerId as fallback
      let subDealerId: string | undefined = undefined;
      if (typeof order.subDealerId === 'string') {
        subDealerId = order.subDealerId;
      } else if (typeof order.subDealerId === 'object' && order.subDealerId?._id) {
        subDealerId = order.subDealerId._id;
      }
      
      if (!subDealerId) {
        subDealerId = order.shippingAddress?.subDealerId;
      }
      
      if (subDealerId) {
        const currentSubDealer = subDealersList.find((s: any) => s._id === subDealerId);
        if (currentSubDealer) {
          setSelectedSubDealer(currentSubDealer);
          console.log('✅ SubDealer set:', currentSubDealer.name);
        } else {
          console.log('❌ SubDealer not found in list:', subDealerId);
        }
      } else {
        console.log('ℹ️ No subdealer in order data');
      }
      
    } catch (error) {
      console.error('Error fetching initial data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const addProductToOrder = async (product: Product) => {
    // Check if the exact same product (same ID, price, and unit) already exists
    const existingItem = orderItems.find(item => 
      item.productId === product._id && 
      item.unitPrice === product.price && 
      item.unit === product.unit
    );
    
    if (existingItem) {
      Alert.alert(
        'Product Already Added', 
        'This exact product (same price and unit) is already in the order. Would you like to increase its quantity by 1?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Increase Quantity',
            onPress: () => updateQuantityForVariant(product._id, existingItem.unitPrice, existingItem.unit, existingItem.quantity + 1)
          }
        ]
      );
      return;
    }
    
    // Check if the same product ID exists but with different price/unit
    const sameProductDifferentPrice = orderItems.find(item => 
      item.productId === product._id && 
      (item.unitPrice !== product.price || item.unit !== product.unit)
    );
    
    if (sameProductDifferentPrice) {
      Alert.alert(
        'Same Product, Different Price/Unit', 
        `This product already exists with different pricing (₹${sameProductDifferentPrice.unitPrice}/${sameProductDifferentPrice.unit}). Do you want to add this variant (₹${product.price}/${product.unit})?`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Add Variant',
            onPress: async () => {
              // Proceed with adding the new variant
              await addProductVariant(product);
            }
          }
        ]
      );
      return;
    }
    
    // If no duplicates found, add the product normally
    await addProductVariant(product);
  };

  const addProductVariant = async (product: Product) => {
    try {
      // Get fresh product data
      const productResponse = await getProductById(product._id);
      const freshProduct = (productResponse?.success
        ? (productResponse.data?.product || productResponse.product)
        : null) || product;

      const newItem: OrderItem = {
        productId: freshProduct._id,
        productCode: freshProduct.productCode,
        productName: freshProduct.productName,
        unit: freshProduct.unit,
        unitPrice: freshProduct.price,
        quantity: 0,
        totalAmount: 0,
        availableStock: freshProduct.stock?.current ?? product.stock.current,
      };
      
      setOrderItems(prevItems => [...prevItems, newItem]);
      setShowProductDropdown(false);
    } catch (error) {
      console.error('Error adding product to order:', error);
      Alert.alert('Error', 'Failed to add product to order');
    }
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    const item = orderItems.find(item => item.productId === productId);
    if (!item) return;
    
    if (newQuantity < 0) return;
    
    setUpdatingQuantity(productId);
    
    try {
      console.log(`🔄 Updating quantity for product ${productId} to ${newQuantity}`);
      
      // Check stock availability by calling API
      const productResponse = await getProductById(productId);
      console.log('📦 Product response:', productResponse);
      
      let currentStock = item.availableStock; // fallback to existing stock
      
      if (productResponse?.success && productResponse.product) {
        // Extract stock from the response
        const product = productResponse.product;
        currentStock = product.stock?.current || product.currentStock || item.availableStock;
        console.log(`📊 Current stock from API: ${currentStock}`);
      } else {
        console.log('⚠️ Failed to get fresh stock data, using existing:', item.availableStock);
        console.log('📦 Full response:', productResponse);
      }

      if (newQuantity > currentStock) {
        Alert.alert('Insufficient Stock', `Only ${currentStock} ${item.unit} available in stock.`);
        return;
      }

      const totalAmount = newQuantity * item.unitPrice;
      const updatedItems = orderItems.map(it => 
        it.productId === productId 
          ? { 
              ...it, 
              quantity: newQuantity, 
              totalAmount: totalAmount,
              availableStock: currentStock
            }
          : it
      );

      setOrderItems(updatedItems);
      console.log(`✅ Quantity updated to ${newQuantity}, total amount: ₹${totalAmount}`);
    } catch (error) {
      console.error('💥 Error updating quantity:', error);
      Alert.alert('Error', 'Failed to update quantity. Please try again.');
    } finally {
      setUpdatingQuantity(null);
    }
  };

  // Update quantity for an exact variant (productId + unitPrice + unit)
  const updateQuantityForVariant = async (
    productId: string,
    unitPrice: number,
    unit: string,
    newQuantity: number
  ) => {
    const idx = orderItems.findIndex(
      it => it.productId === productId && it.unitPrice === unitPrice && it.unit === unit
    );
    if (idx === -1) return;
    const target = orderItems[idx];
    if (newQuantity < 0) return;
    try {
      console.log(`🔄 Updating variant quantity for product ${productId} to ${newQuantity}`);
      
      // Check stock availability by calling API
      const productResponse = await getProductById(productId);
      console.log('📦 Variant product response:', productResponse);
      
      let currentStock = target.availableStock; // fallback to existing stock
      
      if (productResponse?.success && productResponse.product) {
        // Extract stock from the response
        const product = productResponse.product;
        currentStock = product.stock?.current || product.currentStock || target.availableStock;
        console.log(`📊 Current stock from API for variant: ${currentStock}`);
      } else {
        console.log('⚠️ Failed to get fresh stock data for variant, using existing:', target.availableStock);
        console.log('📦 Variant response:', productResponse);
      }

      if (newQuantity > currentStock) {
        Alert.alert('Insufficient Stock', `Only ${currentStock} ${target.unit} available.`);
        return;
      }

      setOrderItems(prev => {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          quantity: newQuantity,
          totalAmount: newQuantity * copy[idx].unitPrice,
          availableStock: currentStock
        };
        return copy;
      });
      
      console.log(`✅ Variant quantity updated to ${newQuantity}, total amount: ₹${newQuantity * target.unitPrice}`);
    } catch (e) {
      console.error('💥 Error updating variant quantity:', e);
      Alert.alert('Error', 'Failed to update quantity. Please try again.');
    }
  };

  const removeProduct = (productId: string) => {
    setOrderItems(prevItems => prevItems.filter(item => item.productId !== productId));
  };

  const calculateTotalQuantity = () => {
    return orderItems.reduce((total, item) => total + item.quantity, 0);
  };

  const calculateTotalAmount = () => {
    return orderItems.reduce((total, item) => total + item.totalAmount, 0);
  };

  const handleUpdateOrder = async () => {
    console.log('🚀 handleUpdateOrder called');
    
    if (!selectedDealer) {
      console.log('❌ No dealer selected');
      Alert.alert('Validation Error', 'Please select a dealer');
      return;
    }
    
    const itemsWithQuantity = orderItems.filter(item => item.quantity > 0);
    if (itemsWithQuantity.length === 0) {
      console.log('❌ No items with quantity > 0');
      Alert.alert('Validation Error', 'Please set quantity for at least one product');
      return;
    }
    
    console.log('✅ Validation passed, proceeding with update...');
    
    try {
      setSaving(true);
      console.log('🔄 Starting order update...');
      
      // Final stock validation
      for (const item of itemsWithQuantity) {
        const productResponse = await getProductById(item.productId);
        if (productResponse?.success) {
          const currentStock = productResponse.product.stock.current;
          if (item.quantity > currentStock) {
            Alert.alert(
              'Stock Validation Failed', 
              `${item.productName}: Only ${currentStock} ${item.unit} available, but ${item.quantity} requested.`
            );
            setSaving(false);
            return;
          }
        }
      }
      
      const orderData = {
        customerId: selectedDealer._id,
        customerName: selectedDealer.name,
        customerEmail: selectedDealer.email,
        customerMobile: selectedDealer.mobile,
        dealerId: selectedDealer._id, // Save dealer ID separately
        dealerName: selectedDealer.name,
        subDealerId: selectedSubDealer ? selectedSubDealer._id : null, // Save subdealer ID separately
        subDealerName: selectedSubDealer ? selectedSubDealer.name : null,
        shippingAddress: selectedSubDealer ? {
          subDealerId: selectedSubDealer._id,
          name: selectedSubDealer.name,
          address: formatAddress(selectedSubDealer.address),
          mobile: selectedSubDealer.mobile,
        } : {
          subDealerId: null,
          name: selectedDealer.name,
          address: formatAddress(selectedDealer.address),
          mobile: selectedDealer.mobile,
        },
        items: itemsWithQuantity.map(item => ({
          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          unit: item.unit,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          totalPrice: item.totalAmount, // Send totalPrice instead of totalAmount
        })),
        totalQuantity: calculateTotalQuantity(),
        totalAmount: calculateTotalAmount(),
        notes: orderNotes,
        status: order.status, // Keep current status
        orderType: order.orderType,
      };
      
      console.log('📤 Sending order data:', orderData);
      console.log('📤 Order ID:', order._id);
      
      const response = await updateOrder(order._id, orderData);
      
      console.log('📥 API Response:', response);
      
      if (response?.success) {
        console.log('✅ Order updated successfully');
        const updatedOrder = response.order;
        
        // Navigate back to previous screen (AdminOrderList) immediately
        // The useFocusEffect in AdminOrderList will automatically refresh the orders
        navigation.goBack();
        
        // Show success message after a brief delay
        setTimeout(() => {
          Alert.alert('Success', 'Order updated successfully!');
        }, 300);
      } else {
        console.log('❌ Order update failed:', response?.message);
        Alert.alert('Error', response?.message || 'Failed to update order');
      }
    } catch (error) {
      console.error('💥 Error updating order:', error);
      Alert.alert('Error', 'Failed to update order. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.productCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderOrderItem = ({ item }: { item: OrderItem }) => (
    <View style={styles.orderItemCard}>
      <View style={styles.orderItemHeader}>
        <View style={styles.orderItemInfo}>
          <Text style={styles.orderItemName}>{item.productName}</Text>
          <Text style={styles.orderItemCode}>{item.productCode}</Text>
          <Text style={styles.orderItemPrice}>₹{item.unitPrice} / {item.unit}</Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeProduct(item.productId)}
        >
          <Ionicons name="close-circle" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.quantityContainer}>
        <Text style={styles.quantityLabel}>Quantity:</Text>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={[
              styles.quantityButton,
              (item.quantity <= 0 || updatingQuantity === item.productId) && styles.disabledButton
            ]}
            onPress={() => updateQuantity(item.productId, item.quantity - 1)}
            disabled={item.quantity <= 0 || updatingQuantity === item.productId}
          >
            {updatingQuantity === item.productId ? (
              <ActivityIndicator size="small" color="#6B7280" />
            ) : (
              <Ionicons name="remove" size={20} color="#6B7280" />
            )}
          </TouchableOpacity>
          
          <TextInput
            style={[
              styles.quantityInput,
              updatingQuantity === item.productId && styles.disabledInput
            ]}
            value={item.quantity.toString()}
            onChangeText={(text) => {
              const newQuantity = parseInt(text) || 0;
              updateQuantity(item.productId, newQuantity);
            }}
            keyboardType="numeric"
            selectTextOnFocus
            editable={updatingQuantity !== item.productId}
          />
          
          <TouchableOpacity
            style={[
              styles.quantityButton,
              (item.quantity >= item.availableStock || updatingQuantity === item.productId) && styles.disabledButton
            ]}
            onPress={() => updateQuantity(item.productId, item.quantity + 1)}
            disabled={item.quantity >= item.availableStock || updatingQuantity === item.productId}
          >
            {updatingQuantity === item.productId ? (
              <ActivityIndicator size="small" color="#6B7280" />
            ) : (
              <Ionicons name="add" size={20} color="#6B7280" />
            )}
          </TouchableOpacity>
        </View>
        
        <Text style={styles.stockText}>
          Stock: {item.availableStock} {item.unit}
          {updatingQuantity === item.productId && ' (Updating...)'}
        </Text>
      </View>
      
      <View style={styles.orderItemTotal}>
        <Text style={styles.totalLabel}>Total:</Text>
        <Text style={styles.totalAmount}>₹{item.totalAmount}</Text>
      </View>
    </View>
  );

  const renderProductItem = ({ item }: { item: Product }) => {
    // Check if exact same product (same ID, price, unit) is already added
    const isExactMatch = orderItems.some(orderItem => 
      orderItem.productId === item._id && 
      orderItem.unitPrice === item.price && 
      orderItem.unit === item.unit
    );
    
    // Check if same product ID exists but with different price/unit
    const isSameProductDifferentPrice = orderItems.some(orderItem => 
      orderItem.productId === item._id && 
      (orderItem.unitPrice !== item.price || orderItem.unit !== item.unit)
    );
    
    const isAlreadyAdded = isExactMatch || isSameProductDifferentPrice;
    
    return (
      <TouchableOpacity
        style={[
          styles.productItem,
          isAlreadyAdded && styles.addedProductItem
        ]}
        onPress={() => addProductToOrder(item)}
      >
        <View style={styles.productInfo}>
          <Text style={[
            styles.productName,
            isAlreadyAdded && styles.addedProductText
          ]}>
            {item.productName}
          </Text>
          <Text style={[
            styles.productCode,
            isAlreadyAdded && styles.addedProductSubtext
          ]}>
            {item.productCode}
          </Text>
          <Text style={[
            styles.productPrice,
            isAlreadyAdded && styles.addedProductSubtext
          ]}>
            ₹{item.price} / {item.unit}
          </Text>
          <Text style={[
            styles.productStock,
            isAlreadyAdded && styles.addedProductSubtext
          ]}>
            Stock: {item.stock.current} {item.unit}
          </Text>
          {isExactMatch && (
            <Text style={styles.alreadyAddedText}>✓ Exact match already in order</Text>
          )}
          {isSameProductDifferentPrice && !isExactMatch && (
            <Text style={styles.variantAddedText}>⚠ Same product with different price/unit exists</Text>
          )}
        </View>
        <Ionicons 
          name={isExactMatch ? "checkmark-circle" : isSameProductDifferentPrice ? "warning" : "add-circle-outline"} 
          size={24} 
          color={isExactMatch ? "#10B981" : isSameProductDifferentPrice ? "#F59E0B" : "#3B82F6"} 
        />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading order data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Order #{order.orderNumber}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Dealer Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer (Dealer) *</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowDealerDropdown(!showDealerDropdown)}
          >
            <Text style={[
              styles.dropdownText,
              !selectedDealer && styles.placeholderText
            ]}>
              {selectedDealer ? selectedDealer.name : 'Select Dealer'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>
          
          {showDealerDropdown && (
            <View style={styles.dropdownList}>
              <FlatList
                data={dealers}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedDealer(item);
                      setShowDealerDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{item.name}</Text>
                    <Text style={styles.dropdownItemSubtext}>{item.email}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item._id}
                style={styles.dropdownFlatList}
              />
            </View>
          )}
        </View>

        {/* Sub Dealer Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Address (Sub Dealer) (Optional)</Text>
          <TouchableOpacity
            style={[
              styles.dropdown,
              subDealers.length === 0 && styles.disabledDropdown
            ]}
            onPress={() => subDealers.length > 0 && setShowSubDealerDropdown(!showSubDealerDropdown)}
            disabled={subDealers.length === 0}
          >
            <Text style={[
              styles.dropdownText,
              !selectedSubDealer && styles.placeholderText
            ]}>
              {subDealers.length === 0 
                ? 'No Sub Dealers Available' 
                : selectedSubDealer 
                  ? selectedSubDealer.name 
                  : 'Select Sub Dealer (Optional)'
              }
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>
          
          {subDealers.length === 0 && (
            <Text style={styles.infoText}>
              No sub dealers available for the selected dealer
            </Text>
          )}
          
          {showSubDealerDropdown && subDealers.length > 0 && (
            <View style={styles.dropdownList}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedSubDealer(null);
                  setShowSubDealerDropdown(false);
                }}
              >
                <Text style={styles.dropdownItemText}>No Sub Dealer</Text>
              </TouchableOpacity>
              <FlatList
                data={subDealers}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedSubDealer(item);
                      setShowSubDealerDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{item.name}</Text>
                    <Text style={styles.dropdownItemSubtext}>{item.email}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item._id}
                style={styles.dropdownFlatList}
              />
            </View>
          )}
        </View>

        {/* Add Product */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.addProductButton}
            onPress={() => setShowProductDropdown(true)}
          >
            <Ionicons name="add-circle-outline" size={24} color="#3B82F6" />
            <Text style={styles.addProductButtonText}>Add Product</Text>
          </TouchableOpacity>
        </View>

        {/* Order Items */}
        {orderItems.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Items ({orderItems.length})</Text>
            <FlatList
              data={orderItems}
              renderItem={renderOrderItem}
              keyExtractor={(item) => item.productId}
              scrollEnabled={false}
            />
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Items</Text>
            <View style={styles.emptyStateContainer}>
              <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No products added yet</Text>
              <Text style={styles.emptyStateSubtext}>Tap "Add Product" to start building your order</Text>
            </View>
          </View>
        )}

        {/* Order Summary */}
        {orderItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Items:</Text>
              <Text style={styles.summaryValue}>{orderItems.length}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Quantity:</Text>
              <Text style={styles.summaryValue}>{calculateTotalQuantity()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Amount:</Text>
              <Text style={[styles.summaryValue, styles.totalAmount]}>₹{calculateTotalAmount()}</Text>
            </View>
          </View>
        )}

        {/* Order Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Notes</Text>
          <TextInput
            style={styles.notesInput}
            value={orderNotes}
            onChangeText={setOrderNotes}
            placeholder="Add any notes for this order..."
            multiline
            numberOfLines={3}
          />
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.updateButton,
            (!selectedDealer || orderItems.filter(item => item.quantity > 0).length === 0) && styles.disabledButton
          ]}
          onPress={handleUpdateOrder}
          disabled={!selectedDealer || orderItems.filter(item => item.quantity > 0).length === 0 || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.updateButtonText}>Update Order</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Product Selection Modal */}
      <Modal
        visible={showProductDropdown}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowProductDropdown(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowProductDropdown(false)}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Product</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search products..."
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <FlatList
            data={filteredProducts}
            renderItem={renderProductItem}
            keyExtractor={(item) => item._id}
            style={styles.productsList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  disabledDropdown: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    zIndex: 1000,
    maxHeight: 200,
    marginTop: 4,
  },
  dropdownFlatList: {
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  dropdownItemSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  addProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#EBF4FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
  },
  addProductButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3B82F6',
    marginLeft: 8,
  },
  orderItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  orderItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  orderItemCode: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  orderItemPrice: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  removeButton: {
    padding: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityInput: {
    width: 60,
    height: 32,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginHorizontal: 8,
  },
  stockText: {
    fontSize: 12,
    color: '#6B7280',
  },
  orderItemTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  updateButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    gap: 8,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 8,
  },
  productsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  productCode: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
    marginBottom: 2,
  },
  productStock: {
    fontSize: 12,
    color: '#6B7280',
  },
  // Visual indicators for already added products
  addedProductItem: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  addedProductText: {
    color: '#059669',
  },
  addedProductSubtext: {
    color: '#047857',
  },
  alreadyAddedText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
    marginTop: 2,
  },
  variantAddedText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '500',
    marginTop: 2,
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: '#F3F4F6',
  },
  disabledInput: {
    opacity: 0.5,
    backgroundColor: '#F3F4F6',
  },
});

export default AdminEditOrder;
