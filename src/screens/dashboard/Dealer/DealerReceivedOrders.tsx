import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OrderItem {
  productId: string;
  productCode: string;
  productName: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  totalAmount: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  customerAddress: string;
  shippingName: string;
  shippingEmail: string;
  shippingMobile: string;
  shippingAddress: string;
  items: OrderItem[];
  totalQuantity: number;
  totalAmount: number;
  status: 'draft' | 'approved' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  createdBy: string;
  createdByRole: string;
  notes?: string;
}

const DealerReceivedOrders = () => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // --- Static Received Orders Data ---
  const RECEIVED_ORDERS: Order[] = [
    {
      _id: '1',
      orderNumber: 'ORD-2026-001',
      customerName: 'Tech Solutions Pvt Ltd',
      customerEmail: 'contact@techsolutions.com',
      customerMobile: '+91 98765 43210',
      customerAddress: '123 MG Road, Bangalore, Karnataka, 560001',
      shippingName: 'Delhi Warehouse',
      shippingEmail: 'delhi@techsolutions.com',
      shippingMobile: '+91 98765 11111',
      shippingAddress: '456 Connaught Place, New Delhi, Delhi, 110001',
      items: [
        {
          productId: 'p1',
          productCode: 'SAM-LP-12',
          productName: 'Samsung 12" Laptop',
          unit: 'pcs',
          unitPrice: 55000,
          quantity: 5,
          totalAmount: 275000,
        },
        {
          productId: 'p2',
          productCode: 'LEN-TB-10',
          productName: 'Lenovo Tablet M10',
          unit: 'pcs',
          unitPrice: 18000,
          quantity: 3,
          totalAmount: 54000,
        },
      ],
      totalQuantity: 8,
      totalAmount: 329000,
      status: 'approved',
      createdAt: '2026-01-05T10:30:00Z',
      createdBy: 'Rajesh Kumar',
      createdByRole: 'Regional Manager',
      notes: 'Urgent delivery required',
    },
    {
      _id: '2',
      orderNumber: 'ORD-2026-002',
      customerName: 'Digital World Electronics',
      customerEmail: 'info@digitalworld.com',
      customerMobile: '+91 98765 22222',
      customerAddress: '789 Park Street, Kolkata, West Bengal, 700016',
      shippingName: 'Noida Store',
      shippingEmail: 'noida@digitalworld.com',
      shippingMobile: '+91 98765 33333',
      shippingAddress: '321 Sector 18, Noida, Uttar Pradesh, 201301',
      items: [
        {
          productId: 'p3',
          productCode: 'HP-LJ-P1',
          productName: 'HP LaserJet Pro',
          unit: 'pcs',
          unitPrice: 25000,
          quantity: 8,
          totalAmount: 200000,
        },
      ],
      totalQuantity: 8,
      totalAmount: 200000,
      status: 'processing',
      createdAt: '2026-01-04T14:20:00Z',
      createdBy: 'Amit Sharma',
      createdByRole: 'Sales Manager',
    },
    {
      _id: '3',
      orderNumber: 'ORD-2026-003',
      customerName: 'Metro Computers',
      customerEmail: 'sales@metrocomputers.com',
      customerMobile: '+91 98765 44444',
      customerAddress: '555 Brigade Road, Bangalore, Karnataka, 560025',
      shippingName: 'Mumbai Branch',
      shippingEmail: 'mumbai@metrocomputers.com',
      shippingMobile: '+91 98765 55555',
      shippingAddress: '777 Andheri East, Mumbai, Maharashtra, 400069',
      items: [
        {
          productId: 'p4',
          productCode: 'DELL-MON-24',
          productName: 'Dell 24" Monitor',
          unit: 'pcs',
          unitPrice: 15000,
          quantity: 12,
          totalAmount: 180000,
        },
        {
          productId: 'p5',
          productCode: 'LOGI-WM-X2',
          productName: 'Logitech Wireless Mouse',
          unit: 'pcs',
          unitPrice: 1500,
          quantity: 50,
          totalAmount: 75000,
        },
      ],
      totalQuantity: 62,
      totalAmount: 255000,
      status: 'shipped',
      createdAt: '2026-01-03T09:15:00Z',
      createdBy: 'Suresh Patel',
      createdByRole: 'Regional Manager',
    },
    {
      _id: '4',
      orderNumber: 'ORD-2026-004',
      customerName: 'Tech Bazaar',
      customerEmail: 'admin@techbazaar.com',
      customerMobile: '+91 98765 66666',
      customerAddress: '888 MG Road, Pune, Maharashtra, 411001',
      shippingName: 'Pune Warehouse',
      shippingEmail: 'pune@techbazaar.com',
      shippingMobile: '+91 98765 77777',
      shippingAddress: '999 Koregaon Park, Pune, Maharashtra, 411001',
      items: [
        {
          productId: 'p1',
          productCode: 'SAM-LP-12',
          productName: 'Samsung 12" Laptop',
          unit: 'pcs',
          unitPrice: 55000,
          quantity: 10,
          totalAmount: 550000,
        },
      ],
      totalQuantity: 10,
      totalAmount: 550000,
      status: 'delivered',
      createdAt: '2026-01-02T11:00:00Z',
      createdBy: 'Neha Gupta',
      createdByRole: 'Sales Manager',
    },
    {
      _id: '5',
      orderNumber: 'ORD-2026-005',
      customerName: 'Office Solutions',
      customerEmail: 'contact@officesolutions.com',
      customerMobile: '+91 98765 88888',
      customerAddress: '111 Richmond Road, Bangalore, Karnataka, 560025',
      shippingName: 'Chennai Office',
      shippingEmail: 'chennai@officesolutions.com',
      shippingMobile: '+91 98765 99999',
      shippingAddress: '222 Anna Salai, Chennai, Tamil Nadu, 600002',
      items: [
        {
          productId: 'p2',
          productCode: 'LEN-TB-10',
          productName: 'Lenovo Tablet M10',
          unit: 'pcs',
          unitPrice: 18000,
          quantity: 15,
          totalAmount: 270000,
        },
        {
          productId: 'p3',
          productCode: 'HP-LJ-P1',
          productName: 'HP LaserJet Pro',
          unit: 'pcs',
          unitPrice: 25000,
          quantity: 4,
          totalAmount: 100000,
        },
      ],
      totalQuantity: 19,
      totalAmount: 370000,
      status: 'draft',
      createdAt: '2026-01-01T16:45:00Z',
      createdBy: 'Vikram Mehta',
      createdByRole: 'Sales Manager',
      notes: 'Check stock availability before processing',
    },
  ];

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

  const handleOrderPress = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const renderOrderCard = (order: Order) => (
    <TouchableOpacity
      key={order._id}
      style={styles.orderCard}
      onPress={() => handleOrderPress(order)}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={12} color="#6B7280" />
            <Text style={styles.infoText}>{order.customerName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={12} color="#6B7280" />
            <Text style={styles.infoText}>{order.shippingName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="create-outline" size={12} color="#6B7280" />
            <Text style={styles.infoText}>
              {order.createdBy} ({order.createdByRole})
            </Text>
          </View>
        </View>
        
        <View style={styles.orderStatus}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(order.status) + '20' }
          ]}>
            <Ionicons 
              name={getStatusIcon(order.status) as any} 
              size={16} 
              color={getStatusColor(order.status)} 
            />
            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.orderDetails}>
        <View style={styles.orderDetailRow}>
          <Text style={styles.orderDetailLabel}>Items</Text>
          <Text style={styles.orderDetailValue}>{order.items.length}</Text>
        </View>
        <View style={styles.orderDetailRow}>
          <Text style={styles.orderDetailLabel}>Quantity</Text>
          <Text style={styles.orderDetailValue}>{order.totalQuantity}</Text>
        </View>
        <View style={styles.orderDetailRow}>
          <Text style={styles.orderDetailLabel}>Total</Text>
          <Text style={styles.orderDetailValue}>₹{order.totalAmount.toLocaleString()}</Text>
        </View>
        <View style={styles.orderDetailRow}>
          <Text style={styles.orderDetailLabel}>Date</Text>
          <Text style={styles.orderDetailValue}>
            {new Date(order.createdAt).toLocaleDateString()}
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
        presentationStyle="fullScreen"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowDetailsModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={26} color="#111827" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <Text style={styles.modalSubtitle}>#{selectedOrder.orderNumber}</Text>
            </View>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Order Information */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Order Information</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Order Number</Text>
                <Text style={styles.detailValue}>#{selectedOrder.orderNumber}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <View style={[
                  styles.detailStatusBadge,
                  { backgroundColor: getStatusColor(selectedOrder.status) + '20' }
                ]}>
                  <Text style={[
                    styles.detailStatusText,
                    { color: getStatusColor(selectedOrder.status) }
                  ]}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Created Date</Text>
                <Text style={styles.detailValue}>
                  {new Date(selectedOrder.createdAt).toLocaleDateString()} {' '}
                  {new Date(selectedOrder.createdAt).toLocaleTimeString()}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Created By</Text>
                <Text style={styles.detailValue}>
                  {selectedOrder.createdBy} ({selectedOrder.createdByRole})
                </Text>
              </View>
            </View>

            {/* Customer Information */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Customer (Dealer)</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name</Text>
                <Text style={styles.detailValue}>{selectedOrder.customerName}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{selectedOrder.customerEmail}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mobile</Text>
                <Text style={styles.detailValue}>{selectedOrder.customerMobile}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address</Text>
                <Text style={styles.detailValue}>{selectedOrder.customerAddress}</Text>
              </View>
            </View>

            {/* Shipping Information */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Shipping (Sub Dealer)</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name</Text>
                <Text style={styles.detailValue}>{selectedOrder.shippingName}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{selectedOrder.shippingEmail}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mobile</Text>
                <Text style={styles.detailValue}>{selectedOrder.shippingMobile}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address</Text>
                <Text style={styles.detailValue}>{selectedOrder.shippingAddress}</Text>
              </View>
            </View>

            {/* Order Items */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Order Items</Text>
              
              {selectedOrder.items.map((item, index) => (
                <View key={index} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{item.productName}</Text>
                      <Text style={styles.itemCode}>{item.productCode}</Text>
                      <Text style={styles.itemPrice}>
                        ₹{item.unitPrice.toLocaleString()}/{item.unit}
                      </Text>
                    </View>
                    <View style={styles.itemQuantity}>
                      <Text style={styles.itemQuantityText}>Qty: {item.quantity}</Text>
                      <Text style={styles.itemTotal}>₹{item.totalAmount.toLocaleString()}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Order Summary */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Order Summary</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Items</Text>
                <Text style={styles.detailValue}>{selectedOrder.items.length}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Quantity</Text>
                <Text style={styles.detailValue}>{selectedOrder.totalQuantity}</Text>
              </View>
              
              <View style={[styles.detailRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>
                  ₹{selectedOrder.totalAmount.toLocaleString()}
                </Text>
              </View>
              
              {selectedOrder.notes && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Notes</Text>
                  <Text style={styles.detailValue}>{selectedOrder.notes}</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Order Details Modal */}
      {renderOrderDetails()}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Received Orders</Text>
        <Text style={styles.subtitle}>Orders assigned to you by your manager</Text>
      </View>

      {/* Summary Strip */}
      <View style={styles.summaryStrip}>
        <View style={styles.summaryItem}>
          <Ionicons name="document-text" size={20} color="#fff" />
          <Text style={styles.summaryVal}>{RECEIVED_ORDERS.length}</Text>
          <Text style={styles.summaryLab}>Total Orders</Text>
        </View>
        <View style={[styles.summaryItem, styles.summaryDivider]}>
          <Ionicons name="cube" size={20} color="#fff" />
          <Text style={styles.summaryVal}>
            {RECEIVED_ORDERS.reduce((sum, o) => sum + o.totalQuantity, 0)}
          </Text>
          <Text style={styles.summaryLab}>Total Items</Text>
        </View>
        <View style={[styles.summaryItem, styles.summaryDivider]}>
          <Ionicons name="cash" size={20} color="#fff" />
          <Text style={styles.summaryVal}>
            ₹{(RECEIVED_ORDERS.reduce((sum, o) => sum + o.totalAmount, 0) / 100000).toFixed(1)}L
          </Text>
          <Text style={styles.summaryLab}>Total Value</Text>
        </View>
      </View>

      {/* Orders List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {RECEIVED_ORDERS.map((order) => renderOrderCard(order))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 4 },

  summaryStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 18,
    backgroundColor: '#10B981',
    marginHorizontal: 15,
    borderRadius: 14,
    marginTop: 12,
    marginBottom: 12,
    shadowColor: '#10B981',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryDivider: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.3)'
  },
  summaryVal: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4
  },
  summaryLab: {
    color: '#D1FAE5',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
    textTransform: 'uppercase'
  },

  scrollView: { flex: 1 },
  scrollContent: { padding: 15, paddingBottom: 40 },

  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  orderInfo: { flex: 1 },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1
  },
  orderStatus: { alignItems: 'flex-end' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600'
  },

  orderDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    gap: 6
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  orderDetailLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500'
  },
  orderDetailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937'
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  closeButton: { padding: 4 },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827'
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2
  },
  modalContent: {
    flex: 1,
    padding: 15
  },

  detailsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    flex: 1
  },
  detailValue: {
    fontSize: 13,
    color: '#1F2937',
    flex: 2,
    textAlign: 'right'
  },
  detailStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6
  },
  detailStatusText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },

  itemCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2
  },
  itemCode: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4
  },
  itemPrice: {
    fontSize: 12,
    color: '#059669'
  },
  itemQuantity: {
    alignItems: 'flex-end'
  },
  itemQuantityText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981'
  },

  totalRow: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB'
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827'
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981'
  },
});

export default DealerReceivedOrders;