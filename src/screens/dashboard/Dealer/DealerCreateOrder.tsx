import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

interface SubDealer {
  _id: string;
  name: string;
  email?: string;
  mobile: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  dealerId: string;
}

interface Product {
  _id: string;
  productCode: string;
  productName: string;
  price: number;
  unit: string;
  stock: {
    current: number;
    minimum: number;
    maximum: number;
  };
}

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

const DealerCreateOrder = () => {
  const navigation = useNavigation();
  const { user, getUsersByRole, getProducts, getProductById, createOrder } = useAuth();
  
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
  
  // State for dropdowns (no dealers needed - dealer is the logged-in user)
  const [subDealers, setSubDealers] = useState<SubDealer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // State for selected values (no selectedDealer - user is always the dealer)
  const [selectedSubDealer, setSelectedSubDealer] = useState<SubDealer | null>(null);
  
  // State for dropdown visibility (no dealer dropdown)
  const [showSubDealerDropdown, setShowSubDealerDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  
  // State for order items
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  
  // State for loading
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // State for order details
  const [orderNotes, setOrderNotes] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Don't fetch dealers - dealer is the logged-in user
      
      // Fetch sub dealers using getUsersByRole to get ALL subdealers in the company
      console.log('🔍 Fetching sub dealers using getUsersByRole...');
      const subDealersResponse = await getUsersByRole('subdealer');
      console.log('📡 Sub dealers response:', subDealersResponse);
      
      // Handle different response formats for sub dealers
      if (Array.isArray(subDealersResponse)) {
        setSubDealers(subDealersResponse);
        console.log('✅ Sub dealers loaded (direct array):', subDealersResponse.length);
      } else if (subDealersResponse?.success) {
        const subDealersData = subDealersResponse.data?.users || subDealersResponse.data || subDealersResponse.subDealers || subDealersResponse.users || [];
        setSubDealers(Array.isArray(subDealersData) ? subDealersData : []);
        console.log('✅ Sub dealers loaded (wrapped with success):', Array.isArray(subDealersData) ? subDealersData.length : 0);
      } else if (subDealersResponse?.users && Array.isArray(subDealersResponse.users)) {
        setSubDealers(subDealersResponse.users);
        console.log('✅ Sub dealers loaded (users field):', subDealersResponse.users.length);
      } else {
        console.log('❌ Failed to load sub dealers:', subDealersResponse?.message || 'Unknown error');
        setSubDealers([]);
      }
      
      // Fetch products
      console.log('🔍 Fetching products...');
      const productsResponse = await getProducts({ page: 1, limit: 1000, isActive: true });
      console.log('📡 Products response:', productsResponse);
      
      if (productsResponse?.success) {
        // Handle different response structures
        const productsData = productsResponse.products || productsResponse.data?.products || productsResponse.data || [];
        setProducts(Array.isArray(productsData) ? productsData : []);
        console.log('✅ Products loaded:', Array.isArray(productsData) ? productsData.length : 0);
        if (Array.isArray(productsData) && productsData.length === 0) {
          console.warn('⚠️ Products array is empty');
        }
      } else {
        console.log('❌ Failed to load products:', productsResponse?.message);
        Alert.alert('Error', 'Failed to load products: ' + (productsResponse?.message || 'Unknown error'));
        setProducts([]);
      }
    } catch (error) {
      console.error('❌ Error fetching initial data:', error);
      Alert.alert('Error', 'Failed to load data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubDealerSelect = (subDealer: SubDealer) => {
    console.log('🎯 Sub dealer selected:', subDealer);
    setSelectedSubDealer(subDealer);
    setShowSubDealerDropdown(false);
  };

  const addProductToOrder = async (product: Product) => {
    console.log('🔍 addProductToOrder called with:', product.productName);
    console.log('📊 Current orderItems length:', orderItems.length);
    
    // Check if the exact same product (same ID, price, and unit) already exists
    const existingItem = orderItems.find(item => 
      item.productId === product._id && 
      item.unitPrice === product.price && 
      item.unit === product.unit
    );
    
    if (existingItem) {
      console.log('⚠️ Exact product already exists in order');
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
            onPress: () => updateQuantity(product._id, existingItem.quantity + 1)
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
      console.log('⚠️ Same product with different price/unit exists');
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
              await addProductVariant(product);
            }
          }
        ]
      );
      return;
    }
    
    await addProductVariant(product);
  };

  const addProductVariant = async (product: Product) => {
    try {
      console.log(`🔍 Adding product ${product.productName} to order`);
      const productResponse = await getProductById(product._id);
      console.log('📡 Product response:', productResponse);

      const freshProduct = (productResponse?.success
        ? productResponse.product
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

      console.log('📦 New item to add:', newItem);

      setOrderItems(prevItems => {
        const updatedItems = [...prevItems, newItem];
        console.log('📊 Updated orderItems:', updatedItems);
        return updatedItems;
      });

      setShowProductDropdown(false);
      console.log(`✅ Added product ${freshProduct.productName} to order (stock: ${newItem.availableStock})`);
    } catch (error) {
      console.error('❌ Error adding product to order:', error);
      const fallbackItem: OrderItem = {
        productId: product._id,
        productCode: product.productCode,
        productName: product.productName,
        unit: product.unit,
        unitPrice: product.price,
        quantity: 0,
        totalAmount: 0,
        availableStock: product.stock.current,
      };
      
      setOrderItems(prevItems => [...prevItems, fallbackItem]);
      setShowProductDropdown(false);
      console.log(`✅ Added product ${product.productName} to order (fallback mode)`);
    }
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    const item = orderItems.find(item => item.productId === productId);
    if (!item) return;
    
    if (newQuantity < 0) return;
    
    try {
      console.log(`🔍 Checking stock for product ${item.productName}, requested quantity: ${newQuantity}`);
      
      const productResponse = await getProductById(productId);
      const currentStock = (productResponse?.success
        ? productResponse.product?.stock?.current
        : undefined) ?? item.availableStock;

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
      console.log(`✅ Updated quantity for ${item.productName}: ${newQuantity}, Total: ₹${totalAmount}`);
    } catch (error) {
      console.error('❌ Error updating quantity:', error);
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  const removeItem = (productId: string) => {
    setOrderItems(orderItems.filter(item => item.productId !== productId));
  };

  const calculateTotalAmount = () => {
    return orderItems.reduce((total, item) => total + item.totalAmount, 0);
  };

  const calculateTotalQuantity = () => {
    return orderItems.reduce((total, item) => total + item.quantity, 0);
  };

  const handleCreateOrder = async () => {
    // No need to check for selectedDealer - user is always the dealer
    if (!user) {
      Alert.alert('Validation Error', 'User information not available');
      return;
    }
    
    if (orderItems.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one product to the order');
      return;
    }
    
    const itemsWithQuantity = orderItems.filter(item => item.quantity > 0);
    if (itemsWithQuantity.length === 0) {
      Alert.alert('Validation Error', 'Please set quantity for at least one product');
      return;
    }
    
    try {
      setSaving(true);
      
      // Final stock validation before creating order
      console.log('🔍 Performing final stock validation...');
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
      
      // Use logged-in user (dealer) as customer
      const orderData = {
        customerId: user._id,
        customerName: user.name,
        customerEmail: user.email,
        customerMobile: user.mobile,
        dealerId: user._id, // Save dealer ID separately
        dealerName: user.name,
        subDealerId: selectedSubDealer ? selectedSubDealer._id : null,
        subDealerName: selectedSubDealer ? selectedSubDealer.name : null,
        shippingAddress: selectedSubDealer ? {
          subDealerId: selectedSubDealer._id,
          name: selectedSubDealer.name,
          address: formatAddress(selectedSubDealer.address),
          mobile: selectedSubDealer.mobile,
        } : {
          subDealerId: null,
          name: user.name,
          address: formatAddress(user.address),
          mobile: user.mobile,
        },
        items: itemsWithQuantity.map(item => ({
          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          unit: item.unit,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          totalPrice: item.totalAmount,
        })),
        totalQuantity: calculateTotalQuantity(),
        totalAmount: calculateTotalAmount(),
        notes: orderNotes,
        status: 'draft',
        orderType: 'dealer_created',
      };
      
      console.log('📦 Creating order with data:', orderData);
      
      const response = await createOrder(orderData);
      console.log('📡 Order creation response:', response);
      
      if (response?.success) {
        console.log('✅ Order created successfully:', response.order);
        // Reset form
        setSelectedSubDealer(null);
        setOrderItems([]);
        setOrderNotes('');
        
        Alert.alert(
          'Success', 
          `Order created successfully!\nOrder Number: ${response.order?.orderNumber || 'N/A'}\nTotal Amount: ₹${calculateTotalAmount()}`,
          [
            {
              text: 'View Orders',
              onPress: () => {
                (navigation as any).navigate('DealerOrderList');
              }
            },
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        console.log('❌ Order creation failed:', response?.message);
        Alert.alert('Error', response?.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('Error', 'Failed to create order. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderSubDealerItem = ({ item }: { item: SubDealer }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => handleSubDealerSelect(item)}
    >
      <Text style={styles.dropdownItemText}>{item.name}</Text>
      <Text style={styles.dropdownItemSubtext}>{formatAddress(item.address)}</Text>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }: { item: Product }) => {
    const isExactMatch = orderItems.some(orderItem => 
      orderItem.productId === item._id && 
      orderItem.unitPrice === item.price && 
      orderItem.unit === item.unit
    );
    
    const isSameProductDifferentPrice = orderItems.some(orderItem => 
      orderItem.productId === item._id && 
      (orderItem.unitPrice !== item.price || orderItem.unit !== item.unit)
    );
    
    const isAlreadyAdded = isExactMatch || isSameProductDifferentPrice;
    
    return (
      <TouchableOpacity
        style={[
          styles.dropdownItem,
          isAlreadyAdded && styles.addedProductItem
        ]}
        onPress={async () => {
          console.log('🎯 Product selected:', item.productName);
          await addProductToOrder(item);
        }}
      >
        <View style={styles.productItemContainer}>
          <View style={styles.productItemInfo}>
            <Text style={[
              styles.dropdownItemText,
              isAlreadyAdded && styles.addedProductText
            ]}>
              {item.productName}
            </Text>
            <Text style={[
              styles.dropdownItemSubtext,
              isAlreadyAdded && styles.addedProductSubtext
            ]}>
              {item.productCode} • ₹{item.price}/{item.unit} • Stock: {item.stock.current}
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
        </View>
      </TouchableOpacity>
    );
  };

  const renderOrderItem = ({ item }: { item: OrderItem }) => (
    <View style={styles.orderItemContainer}>
      <View style={styles.orderItemInfo}>
        <Text style={styles.orderItemName}>{item.productName}</Text>
        <Text style={styles.orderItemCode}>{item.productCode}</Text>
        <Text style={styles.orderItemPrice}>₹{item.unitPrice}/{item.unit}</Text>
        <Text style={styles.orderItemStock}>
          Available: {item.availableStock} {item.unit}
        </Text>
      </View>
      
      <View style={styles.orderItemControls}>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={[styles.quantityButton, item.quantity <= 0 && styles.disabledButton]}
            onPress={() => updateQuantity(item.productId, item.quantity - 1)}
            disabled={item.quantity <= 0}
          >
            <Ionicons name="remove" size={20} color={item.quantity <= 0 ? "#9CA3AF" : "#374151"} />
          </TouchableOpacity>
          
          <Text style={styles.quantityText}>{item.quantity}</Text>
          
          <TouchableOpacity
            style={[styles.quantityButton, item.quantity >= item.availableStock && styles.disabledButton]}
            onPress={() => updateQuantity(item.productId, item.quantity + 1)}
            disabled={item.quantity >= item.availableStock}
          >
            <Ionicons name="add" size={20} color={item.quantity >= item.availableStock ? "#9CA3AF" : "#374151"} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.orderItemTotal}>₹{item.totalAmount}</Text>
        
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeItem(item.productId)}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>User information not available</Text>
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
        <Text style={styles.headerTitle}>Create Order</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Customer Details (Auto-populated from logged-in user) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{user.name}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user.email || 'N/A'}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Mobile:</Text>
            <Text style={styles.infoValue}>{user.mobile}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Address:</Text>
            <Text style={styles.infoValue}>{formatAddress(user.address)}</Text>
          </View>
        </View>

        {/* Shipping Address Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Address (Sub Dealer) - Optional</Text>
          <TouchableOpacity
            style={[styles.dropdownButton, subDealers.length === 0 && !loading && styles.disabledButton]}
            onPress={() => {
              if (subDealers.length > 0) {
                console.log('🔍 Opening sub dealer dropdown, sub dealers available:', subDealers.length);
                setShowSubDealerDropdown(true);
              } else if (!loading) {
                Alert.alert('Info', 'No sub dealers available. Order will use your address.');
              }
            }}
            disabled={subDealers.length === 0 && !loading}
          >
            <Text style={[styles.dropdownButtonText, !selectedSubDealer && styles.placeholderText]}>
              {loading ? 'Loading sub dealers...' : 
               selectedSubDealer ? selectedSubDealer.name : 
               subDealers.length > 0 ? 'Select Sub Dealer (Optional)' : 
               'No Sub Dealers Available'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>
          {selectedSubDealer && (
            <Text style={styles.addressText}>{formatAddress(selectedSubDealer.address)}</Text>
          )}
          {subDealers.length === 0 && !loading && (
            <Text style={styles.infoText}>Order will be shipped to your address</Text>
          )}
        </View>

        {/* Product Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Products</Text>
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
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Quantity:</Text>
                <Text style={styles.summaryValue}>{calculateTotalQuantity()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Amount:</Text>
                <Text style={styles.summaryValue}>₹{calculateTotalAmount()}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Order Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add any notes for this order..."
            value={orderNotes}
            onChangeText={setOrderNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Create Order Button */}
        <TouchableOpacity
          style={[styles.createButton, orderItems.length === 0 && styles.disabledButton]}
          onPress={handleCreateOrder}
          disabled={orderItems.length === 0 || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.createButtonText}>Create Order</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Sub Dealer Dropdown Modal */}
      <Modal
        visible={showSubDealerDropdown}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowSubDealerDropdown(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowSubDealerDropdown(false)}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Shipping Address</Text>
            <View style={styles.placeholder} />
          </View>
          
          <FlatList
            data={subDealers}
            renderItem={renderSubDealerItem}
            keyExtractor={(item) => item._id}
            style={styles.dropdownList}
          />
        </View>
      </Modal>

      {/* Product Dropdown Modal */}
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
          
          <FlatList
            data={products}
            renderItem={renderProductItem}
            keyExtractor={(item) => item._id}
            style={styles.dropdownList}
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
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  disabledButton: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  addressText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  infoText: {
    fontSize: 12,
    color: '#059669',
    marginTop: 4,
    fontStyle: 'italic',
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
  addProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  addProductButtonText: {
    fontSize: 16,
    color: '#3B82F6',
    marginLeft: 8,
    fontWeight: '500',
  },
  orderItemContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  orderItemInfo: {
    marginBottom: 12,
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
    marginBottom: 4,
  },
  orderItemPrice: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
    marginBottom: 4,
  },
  orderItemStock: {
    fontSize: 12,
    color: '#6B7280',
  },
  orderItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginHorizontal: 12,
    minWidth: 24,
    textAlign: 'center',
  },
  orderItemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  removeButton: {
    padding: 8,
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  createButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  createButtonText: {
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
  dropdownList: {
    flex: 1,
    padding: 16,
  },
  dropdownItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  dropdownItemSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  productItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productItemInfo: {
    flex: 1,
  },
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
});

export default DealerCreateOrder;

