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
  shippingName: string;
  items: OrderItem[];
  totalQuantity: number;
  totalAmount: number;
  status: 'draft' | 'approved' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  paymentMethod?: string;
}

interface UserNode {
  id: string;
  name: string;
  role: string;
  groupName: string;
  email: string;
  mobile: string;
  totalOrders: number;
  totalValue: string;
  orders: Order[];
  children: UserNode[];
}

const AdminOrderList = () => {
  const [expandedUsers, setExpandedUsers] = useState<{ [key: string]: boolean }>({});
  const [selectedUser, setSelectedUser] = useState<UserNode | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // --- Hierarchical User Structure with Orders ---
  const USER_HIERARCHY: UserNode[] = [
    {
      id: 'admin-1',
      name: 'Rajesh Kumar',
      role: 'Regional Manager',
      groupName: 'North Region',
      email: 'rajesh@example.com',
      mobile: '+91 98765 43210',
      totalOrders: 12,
      totalValue: '₹ 15,45,000',
      orders: [
        {
          _id: 'ord-001',
          orderNumber: 'ORD-2026-001',
          customerName: 'Tech Solutions',
          shippingName: 'Delhi Warehouse',
          items: [
            {
              productId: 'p1',
              productCode: 'SAM-LP-12',
              productName: 'Samsung Laptop',
              unit: 'pcs',
              unitPrice: 55000,
              quantity: 5,
              totalAmount: 275000,
            },
          ],
          totalQuantity: 5,
          totalAmount: 275000,
          status: 'approved',
          createdAt: '2026-01-05T10:30:00Z',
          paymentMethod: 'Credit',
        },
        {
          _id: 'ord-002',
          orderNumber: 'ORD-2026-002',
          customerName: 'Digital World',
          shippingName: 'Noida Store',
          items: [
            {
              productId: 'p2',
              productCode: 'LEN-TB-10',
              productName: 'Lenovo Tablet',
              unit: 'pcs',
              unitPrice: 18000,
              quantity: 10,
              totalAmount: 180000,
            },
          ],
          totalQuantity: 10,
          totalAmount: 180000,
          status: 'processing',
          createdAt: '2026-01-04T14:20:00Z',
          paymentMethod: 'Bank Transfer',
        },
      ],
      children: [
        {
          id: 'dealer-1',
          name: 'Amit Sharma',
          role: 'Sales Manager',
          groupName: 'Delhi Zone',
          email: 'amit@example.com',
          mobile: '+91 98765 11111',
          totalOrders: 8,
          totalValue: '₹ 8,50,000',
          orders: [
            {
              _id: 'ord-003',
              orderNumber: 'ORD-2026-003',
              customerName: 'Metro Computers',
              shippingName: 'Connaught Place',
              items: [
                {
                  productId: 'p3',
                  productCode: 'HP-LJ-P1',
                  productName: 'HP Printer',
                  unit: 'pcs',
                  unitPrice: 25000,
                  quantity: 8,
                  totalAmount: 200000,
                },
              ],
              totalQuantity: 8,
              totalAmount: 200000,
              status: 'shipped',
              createdAt: '2026-01-03T09:15:00Z',
              paymentMethod: 'Cash',
            },
          ],
          children: [
            {
              id: 'subdealer-1',
              name: 'Priya Singh',
              role: 'Sales Executive',
              groupName: 'Delhi East',
              email: 'priya@example.com',
              mobile: '+91 98765 22222',
              totalOrders: 3,
              totalValue: '₹ 2,80,000',
              orders: [
                {
                  _id: 'ord-004',
                  orderNumber: 'ORD-2026-004',
                  customerName: 'Local Retailer',
                  shippingName: 'Mayur Vihar',
                  items: [
                    {
                      productId: 'p4',
                      productCode: 'DELL-MON-24',
                      productName: 'Dell Monitor 24"',
                      unit: 'pcs',
                      unitPrice: 15000,
                      quantity: 6,
                      totalAmount: 90000,
                    },
                  ],
                  totalQuantity: 6,
                  totalAmount: 90000,
                  status: 'delivered',
                  createdAt: '2026-01-02T11:00:00Z',
                  paymentMethod: 'UPI',
                },
              ],
              children: [],
            },
          ],
        },
        {
          id: 'dealer-2',
          name: 'Neha Gupta',
          role: 'Sales Manager',
          groupName: 'Noida Zone',
          email: 'neha@example.com',
          mobile: '+91 98765 33333',
          totalOrders: 4,
          totalValue: '₹ 3,20,000',
          orders: [
            {
              _id: 'ord-005',
              orderNumber: 'ORD-2026-005',
              customerName: 'Tech Bazaar',
              shippingName: 'Sector 18',
              items: [
                {
                  productId: 'p5',
                  productCode: 'LOGI-WM-X2',
                  productName: 'Logitech Mouse',
                  unit: 'pcs',
                  unitPrice: 1500,
                  quantity: 50,
                  totalAmount: 75000,
                },
              ],
              totalQuantity: 50,
              totalAmount: 75000,
              status: 'approved',
              createdAt: '2026-01-01T16:45:00Z',
              paymentMethod: 'Credit',
            },
          ],
          children: [],
        },
      ],
    },
    {
      id: 'admin-2',
      name: 'Suresh Patel',
      role: 'Regional Manager',
      groupName: 'West Region',
      email: 'suresh@example.com',
      mobile: '+91 98765 44444',
      totalOrders: 6,
      totalValue: '₹ 9,75,000',
      orders: [
        {
          _id: 'ord-006',
          orderNumber: 'ORD-2026-006',
          customerName: 'Mumbai Electronics',
          shippingName: 'Andheri Store',
          items: [
            {
              productId: 'p1',
              productCode: 'SAM-LP-12',
              productName: 'Samsung Laptop',
              unit: 'pcs',
              unitPrice: 55000,
              quantity: 10,
              totalAmount: 550000,
            },
          ],
          totalQuantity: 10,
          totalAmount: 550000,
          status: 'processing',
          createdAt: '2025-12-31T10:30:00Z',
          paymentMethod: 'Bank Transfer',
        },
      ],
      children: [
        {
          id: 'dealer-3',
          name: 'Vikram Mehta',
          role: 'Sales Manager',
          groupName: 'Mumbai Zone',
          email: 'vikram@example.com',
          mobile: '+91 98765 55555',
          totalOrders: 5,
          totalValue: '₹ 6,25,000',
          orders: [
            {
              _id: 'ord-007',
              orderNumber: 'ORD-2026-007',
              customerName: 'Pune Distributors',
              shippingName: 'Pune Warehouse',
              items: [
                {
                  productId: 'p2',
                  productCode: 'LEN-TB-10',
                  productName: 'Lenovo Tablet',
                  unit: 'pcs',
                  unitPrice: 18000,
                  quantity: 15,
                  totalAmount: 270000,
                },
              ],
              totalQuantity: 15,
              totalAmount: 270000,
              status: 'shipped',
              createdAt: '2025-12-30T14:00:00Z',
              paymentMethod: 'Cheque',
            },
          ],
          children: [],
        },
      ],
    },
  ];

  const toggleUserExpansion = (userId: string) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleUserClick = (user: UserNode) => {
    setSelectedUser(selectedUser?.id === user.id ? null : user);
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
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

  const renderOrderCard = (order: Order) => (
    <TouchableOpacity
      key={order._id}
      style={styles.orderCard}
      onPress={() => handleOrderClick(order)}
    >
      <View style={styles.orderCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          <Text style={styles.orderDate}>
            {new Date(order.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={[
          styles.orderStatusBadge,
          { backgroundColor: getStatusColor(order.status) + '20' }
        ]}>
          <Ionicons
            name={getStatusIcon(order.status) as any}
            size={14}
            color={getStatusColor(order.status)}
          />
          <Text style={[styles.orderStatusText, { color: getStatusColor(order.status) }]}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.orderDivider} />

      <View style={styles.orderCardBody}>
        <View style={styles.orderInfoRow}>
          <Ionicons name="person-outline" size={14} color="#6B7280" />
          <Text style={styles.orderInfoText}>{order.customerName}</Text>
        </View>
        <View style={styles.orderInfoRow}>
          <Ionicons name="location-outline" size={14} color="#6B7280" />
          <Text style={styles.orderInfoText}>{order.shippingName}</Text>
        </View>
        <View style={styles.orderInfoRow}>
          <Ionicons name="cube-outline" size={14} color="#6B7280" />
          <Text style={styles.orderInfoText}>{order.totalQuantity} items</Text>
        </View>
      </View>

      <View style={styles.orderCardFooter}>
        <Text style={styles.orderAmountLabel}>Total Amount</Text>
        <Text style={styles.orderAmountValue}>₹ {order.totalAmount.toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderUserNode = (user: UserNode, level: number = 0): React.ReactNode => {
    const hasChildren = user.children && user.children.length > 0;
    const isExpanded = expandedUsers[user.id];
    const isSelected = selectedUser?.id === user.id;
    const hasOrders = user.orders && user.orders.length > 0;

    return (
      <View key={user.id} style={[styles.userNodeContainer, { marginLeft: level * 20 }]}>
        {/* User Card */}
        <TouchableOpacity
          style={[
            styles.userCard,
            isSelected && styles.userCardSelected,
            level === 0 && styles.userCardTopLevel
          ]}
          onPress={() => handleUserClick(user)}
        >
          <View style={styles.userCardLeft}>
            {/* Expand/Collapse Icon */}
            {hasChildren && (
              <TouchableOpacity
                onPress={() => toggleUserExpansion(user.id)}
                style={styles.expandButton}
              >
                <Ionicons
                  name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            )}

            {/* User Avatar */}
            <View style={[
              styles.userAvatar,
              { backgroundColor: level === 0 ? '#3B82F6' : level === 1 ? '#10B981' : '#F59E0B' }
            ]}>
              <Text style={styles.userAvatarText}>
                {user.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>

            {/* User Info */}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userRole}>{user.role}</Text>
              <View style={styles.groupBadge}>
                <Ionicons name="people-outline" size={10} color="#6B7280" />
                <Text style={styles.groupName}>{user.groupName}</Text>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.userCardRight}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.totalOrders}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.totalValue}</Text>
              <Text style={styles.statLabel}>Value</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Show Orders if User is Selected */}
        {isSelected && hasOrders && (
          <View style={styles.ordersContainer}>
            <View style={styles.ordersHeader}>
              <Ionicons name="document-text-outline" size={16} color="#6B7280" />
              <Text style={styles.ordersHeaderText}>
                Orders ({user.orders.length})
              </Text>
            </View>
            {user.orders.map((order) => renderOrderCard(order))}
          </View>
        )}

        {/* Render Child Users if Expanded */}
        {isExpanded && hasChildren && (
          <View style={styles.childrenContainer}>
            {user.children.map((child) => renderUserNode(child, level + 1))}
          </View>
        )}
      </View>
    );
  };

  const renderOrderDetailsModal = () => {
    if (!selectedOrder) return null;

    return (
      <Modal
        visible={showOrderDetails}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowOrderDetails(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowOrderDetails(false)}
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
            {/* Order Info Card */}
            <View style={styles.detailsCard}>
              <Text style={styles.detailsCardTitle}>Order Information</Text>
              
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
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>
                  {new Date(selectedOrder.createdAt).toLocaleDateString()} {new Date(selectedOrder.createdAt).toLocaleTimeString()}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Customer</Text>
                <Text style={styles.detailValue}>{selectedOrder.customerName}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Shipping To</Text>
                <Text style={styles.detailValue}>{selectedOrder.shippingName}</Text>
              </View>

              {selectedOrder.paymentMethod && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment Method</Text>
                  <Text style={styles.detailValue}>{selectedOrder.paymentMethod}</Text>
                </View>
              )}
            </View>

            {/* Items Card */}
            <View style={styles.detailsCard}>
              <Text style={styles.detailsCardTitle}>Order Items</Text>
              
              {selectedOrder.items.map((item, index) => (
                <View key={index} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{item.productName}</Text>
                    <Text style={styles.itemTotal}>₹ {item.totalAmount.toLocaleString()}</Text>
                  </View>
                  <Text style={styles.itemCode}>{item.productCode}</Text>
                  <View style={styles.itemFooter}>
                    <Text style={styles.itemDetail}>
                      ₹ {item.unitPrice.toLocaleString()} / {item.unit}
                    </Text>
                    <Text style={styles.itemDetail}>Qty: {item.quantity}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Summary Card */}
            <View style={styles.detailsCard}>
              <Text style={styles.detailsCardTitle}>Order Summary</Text>
              
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
                <Text style={styles.totalValue}>₹ {selectedOrder.totalAmount.toLocaleString()}</Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Order Details Modal */}
      {renderOrderDetailsModal()}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Orders Hierarchy</Text>
        <Text style={styles.subtitle}>View orders by user hierarchy</Text>
      </View>

      {/* Summary Strip */}
      <View style={styles.summaryStrip}>
        <View style={styles.summaryItem}>
          <Ionicons name="document-text" size={20} color="#fff" />
          <Text style={styles.summaryVal}>18</Text>
          <Text style={styles.summaryLab}>Total Orders</Text>
        </View>
        <View style={[styles.summaryItem, styles.summaryDivider]}>
          <Ionicons name="people" size={20} color="#fff" />
          <Text style={styles.summaryVal}>8</Text>
          <Text style={styles.summaryLab}>Active Users</Text>
        </View>
        <View style={[styles.summaryItem, styles.summaryDivider]}>
          <Ionicons name="cash" size={20} color="#fff" />
          <Text style={styles.summaryVal}>₹25.2L</Text>
          <Text style={styles.summaryLab}>Total Value</Text>
        </View>
      </View>

      {/* Hierarchical User List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {USER_HIERARCHY.map((user) => renderUserNode(user, 0))}
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
    backgroundColor: '#3B82F6',
    marginHorizontal: 15,
    borderRadius: 14,
    marginTop: 12,
    shadowColor: '#3B82F6',
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
    color: '#DBEAFE',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
    textTransform: 'uppercase'
  },

  scrollView: { flex: 1 },
  scrollContent: { padding: 15, paddingBottom: 40 },

  userNodeContainer: { marginBottom: 12 },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2
  },
  userCardSelected: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    backgroundColor: '#EFF6FF'
  },
  userCardTopLevel: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6'
  },

  userCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  expandButton: { marginRight: 8, padding: 4 },

  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  },

  userInfo: { flex: 1 },
  userName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827'
  },
  userRole: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start'
  },
  groupName: {
    fontSize: 10,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '600'
  },

  userCardRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 8
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827'
  },
  statLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    marginTop: 2,
    textTransform: 'uppercase'
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB'
  },

  childrenContainer: { marginTop: 8 },

  ordersContainer: {
    marginTop: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  ordersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  ordersHeaderText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#374151',
    marginLeft: 6
  },

  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827'
  },
  orderDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2
  },
  orderStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4
  },
  orderStatusText: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },

  orderDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 10
  },

  orderCardBody: {
    gap: 6,
    marginBottom: 10
  },
  orderInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  orderInfoText: {
    fontSize: 12,
    color: '#6B7280'
  },

  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB'
  },
  orderAmountLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600'
  },
  orderAmountValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827'
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

  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  detailsCardTitle: {
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
    alignItems: 'center',
    marginBottom: 4
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981'
  },
  itemCode: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  itemDetail: {
    fontSize: 12,
    color: '#4B5563'
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

export default AdminOrderList;