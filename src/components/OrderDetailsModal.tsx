import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  X,
  Package,
  User,
  MapPin,
  Calendar,
  CreditCard,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  Phone,
  Mail,
  FileText,
  DollarSign,
  ShoppingCart,
} from 'lucide-react-native';

interface OrderItem {
  productId: string;
  productName: string;
  productCode?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
  tax?: number;
}

interface OrderDetails {
  _id?: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerMobile?: string;
  customerAddress?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  items: OrderItem[];
  orderDate: string;
  deliveryDate?: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  totalAmount: number;
  discountAmount?: number;
  taxAmount?: number;
  finalAmount: number;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  paymentMethod?: string;
  notes?: string;
  createdBy?: {
    name: string;
    email: string;
  };
  approvedBy?: {
    name: string;
    email: string;
  };
  approvedAt?: string;
  approvalNotes?: string;
  trackingNumber?: string;
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface OrderDetailsModalProps {
  visible: boolean;
  order: OrderDetails | null;
  onClose: () => void;
  onStatusUpdate?: (orderId: string, newStatus: string) => void;
  canUpdateStatus?: boolean;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  visible,
  order,
  onClose,
  onStatusUpdate,
  canUpdateStatus = false,
}) => {
  if (!order) return null;

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'approved':
        return <CheckCircle size={20} color="#16a34a" />;
      case 'cancelled':
      case 'returned':
        return <AlertCircle size={20} color="#dc2626" />;
      case 'pending':
      case 'pending_approval':
        return <Clock size={20} color="#f59e0b" />;
      case 'processing':
      case 'dispatched':
        return <Truck size={20} color="#3b82f6" />;
      default:
        return <Package size={20} color="#6b7280" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'approved':
        return '#16a34a';
      case 'cancelled':
      case 'returned':
        return '#dc2626';
      case 'pending':
      case 'pending_approval':
        return '#f59e0b';
      case 'processing':
      case 'dispatched':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#dc2626';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#16a34a';
      case 'partial': return '#f59e0b';
      case 'pending': return '#dc2626';
      case 'refunded': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const handleStatusUpdate = (newStatus: string) => {
    if (!order?._id) {
      Alert.alert('Error', 'Order ID not available');
      return;
    }
    
    Alert.alert(
      'Update Status',
      `Are you sure you want to change the order status to "${newStatus}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: () => {
            onStatusUpdate?.(order._id!, newStatus);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Package size={24} color="#2563eb" />
              <View>
                <Text style={styles.headerTitle}>Order Details</Text>
                <Text style={styles.headerSubtitle}>{order.orderNumber}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Order Status & Priority */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Information</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <View style={styles.infoItemHeader}>
                      {getStatusIcon(order.status)}
                      <Text style={styles.infoLabel}>Status</Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: `${getStatusColor(order.status)}20` }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: getStatusColor(order.status) }
                      ]}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.infoItem}>
                    <View style={styles.infoItemHeader}>
                      <AlertCircle size={16} color="#6b7280" />
                      <Text style={styles.infoLabel}>Priority</Text>
                    </View>
                    <View style={[
                      styles.priorityBadge,
                      { backgroundColor: `${getPriorityColor(order.priority)}20` }
                    ]}>
                      <Text style={[
                        styles.priorityText,
                        { color: getPriorityColor(order.priority) }
                      ]}>
                        {order.priority.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <View style={styles.infoItemHeader}>
                      <Calendar size={16} color="#6b7280" />
                      <Text style={styles.infoLabel}>Order Date</Text>
                    </View>
                    <Text style={styles.infoValue}>{formatDate(order.orderDate)}</Text>
                  </View>
                  {order.deliveryDate && (
                    <View style={styles.infoItem}>
                      <View style={styles.infoItemHeader}>
                        <Truck size={16} color="#6b7280" />
                        <Text style={styles.infoLabel}>Delivery Date</Text>
                      </View>
                      <Text style={styles.infoValue}>{formatDate(order.deliveryDate)}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Customer Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Customer Information</Text>
              <View style={styles.infoCard}>
                <View style={styles.customerHeader}>
                  <View style={styles.customerAvatar}>
                    <Text style={styles.customerInitial}>
                      {order.customerName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{order.customerName}</Text>
                    {order.customerEmail && (
                      <Text style={styles.customerEmail}>{order.customerEmail}</Text>
                    )}
                    {order.customerMobile && (
                      <Text style={styles.customerPhone}>{order.customerMobile}</Text>
                    )}
                  </View>
                </View>
                {order.customerAddress && (
                  <View style={styles.addressSection}>
                    <View style={styles.addressHeader}>
                      <MapPin size={16} color="#6b7280" />
                      <Text style={styles.addressTitle}>Billing Address</Text>
                    </View>
                    <Text style={styles.addressText}>
                      {order.customerAddress.street && `${order.customerAddress.street}, `}
                      {order.customerAddress.city && `${order.customerAddress.city}, `}
                      {order.customerAddress.state && `${order.customerAddress.state} `}
                      {order.customerAddress.pincode && `- ${order.customerAddress.pincode}`}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Products */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Products ({order.items.length})</Text>
              <View style={styles.productsCard}>
                {order.items.map((item, index) => (
                  <View key={index} style={styles.productItem}>
                    <View style={styles.productHeader}>
                      <View style={styles.productInfo}>
                        <Text style={styles.productName}>{item.productName}</Text>
                        {item.productCode && (
                          <Text style={styles.productCode}>Code: {item.productCode}</Text>
                        )}
                      </View>
                      <Text style={styles.productTotal}>{formatCurrency(item.totalPrice)}</Text>
                    </View>
                    <View style={styles.productDetails}>
                      <View style={styles.productDetailItem}>
                        <Text style={styles.productDetailLabel}>Quantity:</Text>
                        <Text style={styles.productDetailValue}>{item.quantity}</Text>
                      </View>
                      <View style={styles.productDetailItem}>
                        <Text style={styles.productDetailLabel}>Unit Price:</Text>
                        <Text style={styles.productDetailValue}>{formatCurrency(item.unitPrice)}</Text>
                      </View>
                      {item.discount && item.discount > 0 && (
                        <View style={styles.productDetailItem}>
                          <Text style={styles.productDetailLabel}>Discount:</Text>
                          <Text style={styles.productDetailValue}>{item.discount}%</Text>
                        </View>
                      )}
                      {item.tax && item.tax > 0 && (
                        <View style={styles.productDetailItem}>
                          <Text style={styles.productDetailLabel}>Tax:</Text>
                          <Text style={styles.productDetailValue}>{item.tax}%</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Order Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Summary</Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal:</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(order.totalAmount)}</Text>
                </View>
                {order.discountAmount && order.discountAmount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Discount:</Text>
                    <Text style={[styles.summaryValue, { color: '#16a34a' }]}>
                      -{formatCurrency(order.discountAmount)}
                    </Text>
                  </View>
                )}
                {order.taxAmount && order.taxAmount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Tax:</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(order.taxAmount)}</Text>
                  </View>
                )}
                <View style={[styles.summaryRow, styles.summaryTotal]}>
                  <Text style={styles.summaryTotalLabel}>Total Amount:</Text>
                  <Text style={styles.summaryTotalValue}>{formatCurrency(order.finalAmount)}</Text>
                </View>
              </View>
            </View>

            {/* Payment Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Information</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <View style={styles.infoItemHeader}>
                      <CreditCard size={16} color="#6b7280" />
                      <Text style={styles.infoLabel}>Payment Status</Text>
                    </View>
                    <View style={[
                      styles.paymentBadge,
                      { backgroundColor: `${getPaymentStatusColor(order.paymentStatus)}20` }
                    ]}>
                      <Text style={[
                        styles.paymentText,
                        { color: getPaymentStatusColor(order.paymentStatus) }
                      ]}>
                        {order.paymentStatus.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  {order.paymentMethod && (
                    <View style={styles.infoItem}>
                      <View style={styles.infoItemHeader}>
                        <DollarSign size={16} color="#6b7280" />
                        <Text style={styles.infoLabel}>Payment Method</Text>
                      </View>
                      <Text style={styles.infoValue}>
                        {order.paymentMethod.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Additional Information */}
            {(order.notes || order.trackingNumber || order.shippingAddress) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Additional Information</Text>
                <View style={styles.infoCard}>
                  {order.notes && (
                    <View style={styles.additionalItem}>
                      <View style={styles.additionalHeader}>
                        <FileText size={16} color="#6b7280" />
                        <Text style={styles.additionalLabel}>Notes</Text>
                      </View>
                      <Text style={styles.additionalValue}>{order.notes}</Text>
                    </View>
                  )}
                  {order.trackingNumber && (
                    <View style={styles.additionalItem}>
                      <View style={styles.additionalHeader}>
                        <Truck size={16} color="#6b7280" />
                        <Text style={styles.additionalLabel}>Tracking Number</Text>
                      </View>
                      <Text style={styles.additionalValue}>{order.trackingNumber}</Text>
                    </View>
                  )}
                  {order.shippingAddress && (
                    <View style={styles.additionalItem}>
                      <View style={styles.additionalHeader}>
                        <MapPin size={16} color="#6b7280" />
                        <Text style={styles.additionalLabel}>Shipping Address</Text>
                      </View>
                      <Text style={styles.additionalValue}>
                        {order.shippingAddress.street && `${order.shippingAddress.street}, `}
                        {order.shippingAddress.city && `${order.shippingAddress.city}, `}
                        {order.shippingAddress.state && `${order.shippingAddress.state} `}
                        {order.shippingAddress.pincode && `- ${order.shippingAddress.pincode}`}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Order Actions */}
            {canUpdateStatus && onStatusUpdate && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionsCard}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleStatusUpdate('approved')}
                  >
                    <CheckCircle size={20} color="#16a34a" />
                    <Text style={styles.actionButtonText}>Approve Order</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleStatusUpdate('dispatched')}
                  >
                    <Truck size={20} color="#3b82f6" />
                    <Text style={styles.actionButtonText}>Mark as Dispatched</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleStatusUpdate('delivered')}
                  >
                    <CheckCircle size={20} color="#16a34a" />
                    <Text style={styles.actionButtonText}>Mark as Delivered</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
    marginRight: 8,
  },
  infoItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerInitial: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  customerEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 14,
    color: '#6b7280',
  },
  addressSection: {
    marginTop: 8,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  addressText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  productsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  productItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  productCode: {
    fontSize: 12,
    color: '#6b7280',
  },
  productTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  productDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productDetailItem: {
    width: '48%',
    marginBottom: 4,
  },
  productDetailLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  productDetailValue: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    marginTop: 8,
  },
  summaryTotalLabel: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  summaryTotalValue: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '700',
  },
  paymentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  paymentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  additionalItem: {
    marginBottom: 12,
  },
  additionalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  additionalLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  additionalValue: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  actionsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
});

export default OrderDetailsModal;
