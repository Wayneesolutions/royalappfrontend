import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { DEFAULT_GST_RATE, GstType } from '../../../utils/gst';

interface OrderItem {
  productId: string;
  productCode: string;
  productName: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  discount?: number;
  gstRate?: number;
  taxType?: GstType;
  taxableValue?: number;
  cgstRate?: number;
  cgstAmount?: number;
  sgstRate?: number;
  sgstAmount?: number;
  igstRate?: number;
  igstAmount?: number;
  totalTaxAmount?: number;
  totalAmount: number;
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
    address?: {
      street?: string;
      city?: string;
      state?: string;
      pincode?: string;
      country?: string;
    };
  };
  subDealerName?: string;
  shippingAddress: {
    subDealerId?: string;
    name: string;
    address: any;
    mobile: string;
  };
  customerAddress?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  items: OrderItem[];
  totalQuantity: number;
  totalAmount: number;
  taxableValueTotal?: number;
  cgstTotal?: number;
  sgstTotal?: number;
  igstTotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  finalAmount?: number;
  sellerState?: string;
  buyerState?: string;
  gstType?: GstType;
  notes?: string;
  status: 'draft' | 'approved' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderType: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string | {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  paymentMethod?: string;
  modeSelection?: string;
  mode?: string;
  termsOfPayment?: string;
  otherReference?: string;
  termsOfDelivery1?: string;
  termsOfDelivery2?: string;
}

const AdminOrderList = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, getOrders, updateOrderStatus } = useAuth();
  
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

const formatCurrency = (value?: number | string | null) => {
  const numericValue =
    typeof value === 'number' && isFinite(value)
      ? value
      : typeof value === 'string' && value.trim() !== ''
        ? Number(value)
        : 0;

  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
  return `₹${safeValue.toFixed(2)}`;
};

  // Helper function to get dealer name (customer)
  const getDealerName = (order: Order) => {
    if (typeof order.dealerId === 'object' && order.dealerId?.name) {
      return order.dealerId.name;
    }
    return order.dealerName || order.customerName || 'Unknown Dealer';
  };

  // Helper function to get subdealer name (shipping address)
  const getSubDealerName = (order: Order) => {
    if (typeof order.subDealerId === 'object' && order.subDealerId?.name) {
      return order.subDealerId.name;
    }
    return order.subDealerName || order.shippingAddress?.name || 'No Sub Dealer';
  };

  // Helper function to get subdealer address
  const getSubDealerAddress = (order: Order) => {
    // If subDealerId is populated as an object with address, use it
    if (typeof order.subDealerId === 'object' && order.subDealerId?.address) {
      return formatAddress(order.subDealerId.address);
    }
    // Otherwise, use the shippingAddress field
  const shippingAddress = order.shippingAddress?.address;
  if (!shippingAddress) {
    return 'Address not specified';
  }
  if (typeof shippingAddress === 'string') {
    return shippingAddress;
  }
  return formatAddress(shippingAddress);
  };

  const mapPaymentMethodToLabel = (value?: string) => {
    if (!value) return 'Not specified';
    const normalized = value.toString().toLowerCase();
    switch (normalized) {
      case 'cash':
        return 'Cash';
      case 'cheque':
      case 'check':
        return 'Cheque';
      case 'bank_transfer':
      case 'bank transfer':
      case 'bank-transfer':
      case 'neft':
      case 'rtgs':
        return 'Bank Transfer';
      case 'upi':
        return 'UPI';
      case 'card':
    case 'credit card':
    case 'debit card':
      return 'Credit Card';
      case 'credit':
        return 'Credit';
      default:
        return value;
    }
  };

  const formatPaymentMode = (order: Order) => {
    if (order.mode) {
      return order.mode;
    }
    if (order.modeSelection) {
      return order.modeSelection;
    }
    if (order.paymentMethod) {
      return mapPaymentMethodToLabel(order.paymentMethod);
    }
    return 'Not specified';
  };
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'draft' | 'approved' | 'processing' | 'shipped' | 'delivered'>('all');
  const isInitialMount = useRef(true);

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  // Listen for navigation params to refresh orders
  useEffect(() => {
    const params = route.params as any;
    if (params?.refreshOrders) {
      console.log('🔄 Refreshing orders from navigation...');
      fetchOrders();
    }
  }, [route.params]);

  // Refresh orders when screen comes into focus (e.g., when navigating back from edit)
  // Skip on initial mount to avoid double loading
  useFocusEffect(
    useCallback(() => {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
      console.log('🔄 Screen focused, refreshing orders...');
      fetchOrders();
    }, [])
  );

  const fetchOrders = async () => {
    try {
      if (!user?._id) {
        console.log('⏳ User not loaded yet, skipping fetch');
        return;
      }

      setLoading(true);
      
      // Filter orders created by this admin (createdBy = admin._id)
      const params: any = { 
        page: 1, 
        limit: 50,
        createdBy: user._id
      };
      
      if (filter !== 'all') {
        params.status = filter;
      }
      
      console.log('🔍 Fetching admin orders with params:', params);
      const response = await getOrders(params);
      console.log('📡 Orders response:', response);
      
      if (response?.success) {
        // Double-check: filter to ensure createdBy matches
        let filteredOrders = response.orders || [];
        filteredOrders = filteredOrders.filter((order: Order) => {
          const createdBy = typeof order.createdBy === 'object' ? order.createdBy._id : order.createdBy;
          return createdBy === user._id;
        });
        setOrders(filteredOrders);
        console.log('✅ Loaded orders created by admin:', filteredOrders.length);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleOrderPress = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleApproveOrder = async (orderId: string) => {
    try {
      const response = await updateOrderStatus(orderId, { 
        status: 'approved',
        notes: 'Order approved by admin'
      });
      
      if (response?.success) {
        Alert.alert('Success', 'Order approved successfully!');
        fetchOrders(); // Refresh the list
        setShowDetailsModal(false);
      } else {
        Alert.alert('Error', response?.message || 'Failed to approve order');
      }
    } catch (error) {
      console.error('Error approving order:', error);
      Alert.alert('Error', 'Failed to approve order');
    }
  };

  const handleEditOrder = (order: Order) => {
    setShowDetailsModal(false);
    (navigation as any).navigate('AdminEditOrder', { order });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#F59E0B';
      case 'approved': return '#10B981';
      case 'processing': return '#3B82F6';
      case 'shipped': return '#8B5CF6';
      case 'delivered': return '#059669';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return 'document-outline';
      case 'approved': return 'checkmark-circle-outline';
      case 'processing': return 'time-outline';
      case 'shipped': return 'car-outline';
      case 'delivered': return 'checkmark-done-circle-outline';
      case 'cancelled': return 'close-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => handleOrderPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
          <Text style={styles.customerName}>Customer: {getDealerName(item)}</Text>
          <Text style={styles.shippingAddress}>Shipping: {getSubDealerName(item)}</Text>
        </View>
        
        <View style={styles.orderStatus}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Ionicons 
              name={getStatusIcon(item.status) as any} 
              size={16} 
              color={getStatusColor(item.status)} 
            />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.orderDetails}>
        <View style={styles.orderDetailRow}>
          <Text style={styles.orderDetailLabel}>Items:</Text>
          <Text style={styles.orderDetailValue}>{item.items.length} products</Text>
        </View>
        <View style={styles.orderDetailRow}>
          <Text style={styles.orderDetailLabel}>Quantity:</Text>
          <Text style={styles.orderDetailValue}>{item.totalQuantity}</Text>
        </View>
        <View style={styles.orderDetailRow}>
          <Text style={styles.orderDetailLabel}>Total:</Text>
          <Text style={styles.orderDetailValue}>₹{item.totalAmount}</Text>
        </View>
        <View style={styles.orderDetailRow}>
          <Text style={styles.orderDetailLabel}>Payment:</Text>
          <Text style={styles.orderDetailValue}>{formatPaymentMode(item)}</Text>
        </View>
        <View style={styles.orderDetailRow}>
          <Text style={styles.orderDetailLabel}>Date:</Text>
          <Text style={styles.orderDetailValue}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderOrderDetails = () => {
    if (!selectedOrder) return null;

    return (
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDetailsModal(false)}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Order Details</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Order Header */}
            <View style={styles.detailsSection}>
              <Text style={styles.detailsSectionTitle}>Order Information</Text>
              
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Order Number</Text>
                <Text style={styles.detailsValue}>#{selectedOrder.orderNumber}</Text>
              </View>
              
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Status</Text>
                <View style={[styles.detailsBadge, { backgroundColor: getStatusColor(selectedOrder.status) + '20' }]}>
                  <Text style={[styles.detailsBadgeText, { color: getStatusColor(selectedOrder.status) }]}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Created Date</Text>
                <Text style={styles.detailsValue}>
                  {new Date(selectedOrder.createdAt).toLocaleDateString()} {new Date(selectedOrder.createdAt).toLocaleTimeString()}
                </Text>
              </View>
            </View>

            {/* Customer Information */}
            <View style={styles.detailsSection}>
              <Text style={styles.detailsSectionTitle}>Customer Information (Dealer)</Text>
              
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Dealer Name</Text>
                <Text style={styles.detailsValue}>{getDealerName(selectedOrder)}</Text>
              </View>
              
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Dealer Email</Text>
                <Text style={styles.detailsValue}>
                  {typeof selectedOrder.dealerId === 'object' ? selectedOrder.dealerId.email : selectedOrder.customerEmail || 'N/A'}
                </Text>
              </View>
              
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Dealer Mobile</Text>
                <Text style={styles.detailsValue}>
                  {typeof selectedOrder.dealerId === 'object' ? selectedOrder.dealerId.mobile : selectedOrder.customerMobile || 'N/A'}
                </Text>
              </View>
              
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Dealer Address</Text>
                <Text style={styles.detailsValue}>
                  {formatAddress(selectedOrder.customerAddress)}
                </Text>
              </View>
            </View>

            {/* Shipping Information */}
            <View style={styles.detailsSection}>
              <Text style={styles.detailsSectionTitle}>Shipping Information (Sub Dealer)</Text>
              
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Sub Dealer Name</Text>
                <Text style={styles.detailsValue}>{getSubDealerName(selectedOrder)}</Text>
              </View>
              
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Sub Dealer Email</Text>
                <Text style={styles.detailsValue}>
                  {typeof selectedOrder.subDealerId === 'object' ? selectedOrder.subDealerId.email : 'N/A'}
                </Text>
              </View>
              
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Sub Dealer Mobile</Text>
                <Text style={styles.detailsValue}>
                  {typeof selectedOrder.subDealerId === 'object' ? selectedOrder.subDealerId.mobile : selectedOrder.shippingAddress?.mobile || 'N/A'}
                </Text>
              </View>
              
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Shipping Address</Text>
                <Text style={styles.detailsValue}>{getSubDealerAddress(selectedOrder)}</Text>
              </View>
            </View>

            {/* Payment & Delivery */}
            <View style={styles.detailsSection}>
              <Text style={styles.detailsSectionTitle}>Payment & Delivery</Text>

              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Payment Mode</Text>
                <Text style={styles.detailsValue}>{formatPaymentMode(selectedOrder)}</Text>
              </View>

              {selectedOrder.termsOfPayment ? (
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Terms of Payment</Text>
                  <Text style={styles.detailsValue}>{selectedOrder.termsOfPayment}</Text>
                </View>
              ) : null}

              {selectedOrder.otherReference ? (
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Other Reference</Text>
                  <Text style={styles.detailsValue}>{selectedOrder.otherReference}</Text>
                </View>
              ) : null}

              {selectedOrder.termsOfDelivery1 ? (
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Terms of Delivery 1</Text>
                  <Text style={styles.detailsValue}>{selectedOrder.termsOfDelivery1}</Text>
                </View>
              ) : null}

              {selectedOrder.termsOfDelivery2 ? (
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Terms of Delivery 2</Text>
                  <Text style={styles.detailsValue}>{selectedOrder.termsOfDelivery2}</Text>
                </View>
              ) : null}
            </View>

            {/* Order Items */}
            <View style={styles.detailsSection}>
              <Text style={styles.detailsSectionTitle}>Order Items</Text>
              
              {selectedOrder.items.map((item, index) => {
                const taxableValue =
                  typeof item.taxableValue === 'number'
                    ? item.taxableValue
                    : item.unitPrice * item.quantity;
                const totalTaxAmount =
                  typeof item.totalTaxAmount === 'number'
                    ? item.totalTaxAmount
                    : (item.cgstAmount || 0) + (item.sgstAmount || 0) + (item.igstAmount || 0);

                return (
                  <View key={index} style={styles.itemContainer}>
                    <View style={styles.itemRow}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.productName}</Text>
                        <Text style={styles.itemCode}>{item.productCode}</Text>
                        <Text style={styles.itemPrice}>
                          {formatCurrency(item.unitPrice)} / {item.unit}
                        </Text>
                      </View>
                      <View style={styles.itemQuantity}>
                        <Text style={styles.itemQuantityText}>Qty: {item.quantity}</Text>
                        <Text style={styles.itemTotal}>{formatCurrency(item.totalAmount)}</Text>
                      </View>
                    </View>

                    <View style={styles.itemTaxContainer}>
                      <Text style={styles.itemTaxLine}>
                        Taxable Value: {formatCurrency(taxableValue)}
                      </Text>
                      <Text style={styles.itemTaxLine}>
                        GST Rate: {(item.gstRate ?? DEFAULT_GST_RATE)}%
                      </Text>
                      {item.cgstAmount ? (
                        <Text style={styles.itemTaxLine}>
                          CGST ({item.cgstRate ?? (item.gstRate ?? DEFAULT_GST_RATE) / 2}%):{' '}
                          {formatCurrency(item.cgstAmount)}
                        </Text>
                      ) : null}
                      {item.sgstAmount ? (
                        <Text style={styles.itemTaxLine}>
                          SGST/UTGST ({item.sgstRate ?? (item.gstRate ?? DEFAULT_GST_RATE) / 2}%):{' '}
                          {formatCurrency(item.sgstAmount)}
                        </Text>
                      ) : null}
                      {item.igstAmount ? (
                        <Text style={styles.itemTaxLine}>
                          IGST ({item.igstRate ?? item.gstRate ?? DEFAULT_GST_RATE}%):{' '}
                          {formatCurrency(item.igstAmount)}
                        </Text>
                      ) : null}
                      <Text style={styles.itemTaxTotal}>
                        Total GST: {formatCurrency(totalTaxAmount)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Order Summary */}
            <View style={styles.detailsSection}>
              <Text style={styles.detailsSectionTitle}>Order Summary</Text>
              
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Total Items</Text>
                <Text style={styles.detailsValue}>{selectedOrder.items.length}</Text>
              </View>
              
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Total Quantity</Text>
                <Text style={styles.detailsValue}>{selectedOrder.totalQuantity}</Text>
              </View>
              
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Total Amount</Text>
                <Text style={[styles.detailsValue, styles.totalAmount]}>
                  {formatCurrency(selectedOrder.totalAmount)}
                </Text>
              </View>
              
              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>GST Type</Text>
                <Text style={styles.detailsValue}>
                  {selectedOrder.gstType === 'INTRA_STATE'
                    ? 'Intra-state (CGST + SGST/UTGST)'
                    : selectedOrder.gstType === 'INTER_STATE'
                      ? 'Inter-state (IGST)'
                      : 'Not specified'}
                </Text>
              </View>

              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Seller State</Text>
                <Text style={styles.detailsValue}>{selectedOrder.sellerState || 'N/A'}</Text>
              </View>

              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Buyer State</Text>
                <Text style={styles.detailsValue}>{selectedOrder.buyerState || 'N/A'}</Text>
              </View>

              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Taxable Value</Text>
                <Text style={styles.detailsValue}>
                  {formatCurrency(selectedOrder.taxableValueTotal ?? 0)}
                </Text>
              </View>

              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>CGST</Text>
                <Text style={styles.detailsValue}>
                  {formatCurrency(selectedOrder.cgstTotal ?? 0)}
                </Text>
              </View>

              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>SGST/UTGST</Text>
                <Text style={styles.detailsValue}>
                  {formatCurrency(selectedOrder.sgstTotal ?? 0)}
                </Text>
              </View>

              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>IGST</Text>
                <Text style={styles.detailsValue}>
                  {formatCurrency(selectedOrder.igstTotal ?? 0)}
                </Text>
              </View>

              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Total GST</Text>
                <Text style={styles.detailsValue}>
                  {formatCurrency(selectedOrder.taxAmount ?? 0)}
                </Text>
              </View>

              <View style={styles.detailsRow}>
                <Text style={styles.detailsLabel}>Grand Total</Text>
                <Text style={[styles.detailsValue, styles.totalAmount]}>
                  {formatCurrency(selectedOrder.finalAmount ?? selectedOrder.totalAmount)}
                </Text>
              </View>

              {selectedOrder.notes && (
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Notes</Text>
                  <Text style={styles.detailsValue}>{selectedOrder.notes}</Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            {selectedOrder.status === 'draft' && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleEditOrder(selectedOrder)}
                >
                  <Ionicons name="create-outline" size={20} color="#3B82F6" />
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleApproveOrder(selectedOrder._id)}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
                  <Text style={styles.actionButtonText}>Approve</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading orders...</Text>
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
        <Text style={styles.headerTitle}>My Orders</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('AdminCreateOrder' as never)}
        >
          <Ionicons name="add" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'all', label: 'All' },
            { key: 'draft', label: 'Draft' },
            { key: 'approved', label: 'Approved' },
            { key: 'processing', label: 'Processing' },
            { key: 'shipped', label: 'Shipped' },
            { key: 'delivered', label: 'Delivered' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterTab, filter === tab.key && styles.activeFilterTab]}
              onPress={() => setFilter(tab.key as any)}
            >
              <Text style={[styles.filterTabText, filter === tab.key && styles.activeFilterTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id}
        style={styles.ordersList}
        contentContainerStyle={styles.ordersListContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>No Orders Found</Text>
            <Text style={styles.emptyStateSubtitle}>
              {filter === 'all' 
                ? 'You haven\'t created any orders yet'
                : `No ${filter} orders found`
              }
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => navigation.navigate('AdminCreateOrder' as never)}
            >
              <Text style={styles.emptyStateButtonText}>Create Your First Order</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {renderOrderDetails()}
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
  createButton: {
    padding: 8,
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  activeFilterTab: {
    backgroundColor: '#3B82F6',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeFilterTabText: {
    color: '#FFFFFF',
  },
  ordersList: {
    flex: 1,
  },
  ordersListContent: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  shippingAddress: {
    fontSize: 12,
    color: '#6B7280',
  },
  orderStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  orderDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  orderDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    fontSize: 14,
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
  placeholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    flex: 1,
  },
  detailsValue: {
    fontSize: 14,
    fontWeight: '400',
    color: '#1F2937',
    flex: 2,
    textAlign: 'right',
  },
  detailsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-end',
  },
  detailsBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  itemContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  itemCode: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 12,
    color: '#059669',
  },
  itemQuantity: {
    alignItems: 'flex-end',
  },
  itemQuantityText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemTaxContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  itemTaxLine: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 2,
  },
  itemTaxTotal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  editButton: {
    backgroundColor: '#EBF4FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  approveButton: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AdminOrderList;
