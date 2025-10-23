import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../../context/AuthContext";
import { useNavigation } from "@react-navigation/native";

interface Product {
  _id: string;
  productName: string;
  productCode: string;
  price: number;
  stock: {
    current: number;
  };
  unit: string;
}

interface Customer {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
}

interface OrderItem {
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
  tax?: number;
}

const OrderManagement = () => {
  const { 
    createOrder, 
    getOrders, 
    getProducts, 
    getUsersByCompany,
    updateOrder,
    deleteOrder 
  } = useAuth();
  const navigation = useNavigation();

  // State management
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Order creation state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'cheque' | 'bank_transfer' | 'upi' | 'card' | 'credit'>('cash');
  const [notes, setNotes] = useState('');

  // Modal states
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Data states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch customers (users with roles that can place orders)
      const customerRoles = ['dealers', 'distibutors', 'subdealer'];
      const customersData = await getUsersByCompany({ 
        role: customerRoles.join(','), 
        limit: 100 
      });
      if (customersData?.success) {
        setCustomers(customersData.users || []);
      }

      // Fetch products
      const productsData = await getProducts({ limit: 100 });
      if (productsData?.success) {
        setProducts(productsData.products || []);
      }

      // Fetch orders
      const ordersData = await getOrders({ limit: 50 });
      if (ordersData?.success) {
        setOrders(ordersData.orders || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Add product to order
  const addProductToOrder = (product: Product) => {
    const existingItem = orderItems.find(item => item.productId === product._id);
    
    if (existingItem) {
      // Update quantity
      const updatedItems = orderItems.map(item =>
        item.productId === product._id
          ? {
              ...item,
              quantity: item.quantity + 1,
              totalPrice: (item.quantity + 1) * item.unitPrice
            }
          : item
      );
      setOrderItems(updatedItems);
    } else {
      // Add new item
      const newItem: OrderItem = {
        productId: product._id,
        productName: product.productName,
        productCode: product.productCode,
        quantity: 1,
        unitPrice: product.price,
        totalPrice: product.price,
        discount: 0,
        tax: 0
      };
      setOrderItems([...orderItems, newItem]);
    }
    setShowProductModal(false);
  };

  // Update item quantity
  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setOrderItems(orderItems.filter(item => item.productId !== productId));
      return;
    }

    const updatedItems = orderItems.map(item =>
      item.productId === productId
        ? {
            ...item,
            quantity,
            totalPrice: quantity * item.unitPrice
          }
        : item
    );
    setOrderItems(updatedItems);
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalDiscount = orderItems.reduce((sum, item) => sum + (item.discount || 0), 0);
    const totalTax = orderItems.reduce((sum, item) => sum + (item.tax || 0), 0);
    const finalAmount = subtotal - totalDiscount + totalTax;

    return { subtotal, totalDiscount, totalTax, finalAmount };
  };

  // Create order
  const handleCreateOrder = async () => {
    if (!selectedCustomer) {
      Alert.alert('Error', 'Please select a customer');
      return;
    }

    if (orderItems.length === 0) {
      Alert.alert('Error', 'Please add at least one product');
      return;
    }

    try {
      setLoading(true);
      
      const orderData = {
        customerId: selectedCustomer._id,
        customerName: selectedCustomer.name,
        customerEmail: selectedCustomer.email,
        customerMobile: selectedCustomer.mobile,
        items: orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          discount: item.discount || 0,
          tax: item.tax || 0
        })),
        deliveryDate,
        priority,
        paymentMethod,
        notes
      };

      const response = await createOrder(orderData);
      if (response?.success) {
        Alert.alert('Success', 'Order created successfully', [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setSelectedCustomer(null);
              setOrderItems([]);
              setDeliveryDate('');
              setPriority('medium');
              setPaymentMethod('cash');
              setNotes('');
              setActiveTab('list');
              fetchData();
            }
          }
        ]);
      } else {
        Alert.alert('Error', 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('Error', 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  // Render customer selection modal
  const renderCustomerModal = () => (
    <Modal
      visible={showCustomerModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCustomerModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Customer</Text>
            <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Search customers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />

          <FlatList
            data={customers.filter(customer =>
              customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              customer.email.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.customerItem}
                onPress={() => {
                  setSelectedCustomer(item);
                  setShowCustomerModal(false);
                }}
              >
                <View style={styles.modalCustomerInfo}>
                  <Text style={styles.modalCustomerName}>{item.name}</Text>
                  <Text style={styles.modalCustomerEmail}>{item.email}</Text>
                  <Text style={styles.modalCustomerRole}>{item.role.toUpperCase()}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
            style={styles.customerList}
          />
        </View>
      </View>
    </Modal>
  );

  // Render product selection modal
  const renderProductModal = () => (
    <Modal
      visible={showProductModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowProductModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Product</Text>
            <TouchableOpacity onPress={() => setShowProductModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={products.filter(product => product.stock.current > 0)}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.productItem}
                onPress={() => addProductToOrder(item)}
              >
                <View style={styles.modalProductInfo}>
                  <Text style={styles.productName}>{item.productName}</Text>
                  <Text style={styles.productCode}>{item.productCode}</Text>
                  <Text style={styles.productPrice}>₹{item.price} / {item.unit}</Text>
                  <Text style={styles.productStock}>Stock: {item.stock.current}</Text>
                </View>
                <Ionicons name="add-circle" size={24} color="#3B82F6" />
              </TouchableOpacity>
            )}
            style={styles.productList}
          />
        </View>
      </View>
    </Modal>
  );

  // Render create order tab
  const renderCreateOrder = () => {
    const { subtotal, totalDiscount, totalTax, finalAmount } = calculateTotals();

    return (
      <ScrollView style={styles.tabContent}>
        {/* Customer Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <TouchableOpacity
            style={styles.customerSelector}
            onPress={() => setShowCustomerModal(true)}
          >
            {selectedCustomer ? (
              <View style={styles.selectedCustomer}>
                <Text style={styles.selectedCustomerName}>{selectedCustomer.name}</Text>
                <Text style={styles.selectedCustomerEmail}>{selectedCustomer.email}</Text>
              </View>
            ) : (
              <Text style={styles.placeholderText}>Select Customer</Text>
            )}
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Order Items</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowProductModal(true)}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add Product</Text>
            </TouchableOpacity>
          </View>

          {orderItems.length > 0 ? (
            <View style={styles.itemsList}>
              {orderItems.map((item, index) => (
                <View key={item.productId} style={styles.orderItem}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.productName}</Text>
                    <Text style={styles.itemCode}>{item.productCode}</Text>
                    <Text style={styles.itemPrice}>₹{item.unitPrice} / unit</Text>
                  </View>
                  <View style={styles.itemControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateItemQuantity(item.productId, item.quantity - 1)}
                    >
                      <Ionicons name="remove" size={16} color="#EF4444" />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateItemQuantity(item.productId, item.quantity + 1)}
                    >
                      <Ionicons name="add" size={16} color="#10B981" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.itemTotal}>₹{item.totalPrice.toLocaleString()}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyItems}>
              <Ionicons name="basket-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyItemsText}>No items added yet</Text>
            </View>
          )}
        </View>

        {/* Order Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Delivery Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={deliveryDate}
              onChangeText={setDeliveryDate}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Priority</Text>
            <View style={styles.priorityButtons}>
              {['low', 'medium', 'high', 'urgent'].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityButton,
                    priority === p && styles.activePriorityButton
                  ]}
                  onPress={() => setPriority(p as any)}
                >
                  <Text style={[
                    styles.priorityButtonText,
                    priority === p && styles.activePriorityButtonText
                  ]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Payment Method</Text>
            <View style={styles.paymentButtons}>
              {['cash', 'cheque', 'bank_transfer', 'upi', 'card', 'credit'].map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.paymentButton,
                    paymentMethod === method && styles.activePaymentButton
                  ]}
                  onPress={() => setPaymentMethod(method as any)}
                >
                  <Text style={[
                    styles.paymentButtonText,
                    paymentMethod === method && styles.activePaymentButtonText
                  ]}>
                    {method.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add any additional notes..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Order Summary */}
        {orderItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal:</Text>
                <Text style={styles.summaryValue}>₹{subtotal.toLocaleString()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount:</Text>
                <Text style={styles.summaryValue}>-₹{totalDiscount.toLocaleString()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax:</Text>
                <Text style={styles.summaryValue}>+₹{totalTax.toLocaleString()}</Text>
              </View>
              <View style={[styles.summaryRow, styles.finalRow]}>
                <Text style={styles.finalLabel}>Total Amount:</Text>
                <Text style={styles.finalValue}>₹{finalAmount.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Create Order Button */}
        <TouchableOpacity
          style={[styles.createButton, (!selectedCustomer || orderItems.length === 0) && styles.disabledButton]}
          onPress={handleCreateOrder}
          disabled={!selectedCustomer || orderItems.length === 0 || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create Order</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // Render orders list tab
  const renderOrdersList = () => (
    <View style={styles.tabContent}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderNumber}>{item.orderNumber}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.customerName}>{item.customerName}</Text>
            <Text style={styles.orderAmount}>₹{item.finalAmount.toLocaleString()}</Text>
            <Text style={styles.orderDate}>
              {new Date(item.orderDate).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.ordersList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No orders found</Text>
          </View>
        )}
      />
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'confirmed': return '#10B981';
      case 'processing': return '#3B82F6';
      case 'shipped': return '#8B5CF6';
      case 'delivered': return '#059669';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Management</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'create' && styles.activeTab]}
          onPress={() => setActiveTab('create')}
        >
          <Ionicons name="add-circle" size={20} color={activeTab === 'create' ? '#3B82F6' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'create' && styles.activeTabText]}>
            Create Order
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'list' && styles.activeTab]}
          onPress={() => setActiveTab('list')}
        >
          <Ionicons name="list" size={20} color={activeTab === 'list' ? '#3B82F6' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'list' && styles.activeTabText]}>
            Orders List
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'create' ? renderCreateOrder() : renderOrdersList()}

      {/* Modals */}
      {renderCustomerModal()}
      {renderProductModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#3B82F6',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  customerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  selectedCustomer: {
    flex: 1,
  },
  selectedCustomerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  selectedCustomerEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  placeholderText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  itemsList: {
    gap: 12,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemCode: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    color: '#059669',
    marginTop: 2,
  },
  itemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    minWidth: 24,
    textAlign: 'center',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  emptyItems: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyItemsText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  activePriorityButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  priorityButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  activePriorityButtonText: {
    color: '#fff',
  },
  paymentButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  activePaymentButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  paymentButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  activePaymentButtonText: {
    color: '#fff',
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  finalRow: {
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
    paddingTop: 8,
    marginTop: 8,
  },
  finalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  finalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    margin: 16,
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  ordersList: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  customerName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  searchInput: {
    margin: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    fontSize: 16,
    color: '#1F2937',
  },
  customerList: {
    maxHeight: 400,
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalCustomerInfo: {
    flex: 1,
  },
  modalCustomerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalCustomerEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  modalCustomerRole: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 2,
  },
  productList: {
    maxHeight: 400,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalProductInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  productCode: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  productPrice: {
    fontSize: 14,
    color: '#059669',
    marginTop: 2,
  },
  productStock: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 2,
  },
});

export default OrderManagement;
