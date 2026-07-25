import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import apiService from '../../../services/api';

interface Product {
  _id: string;
  productCode: string;
  productName: string;
  description: string;
  category: string;
  unit: string;
  price: number;
  stock: {
    current: number;
    minimum: number;
  };
  images: Array<{
    url: string;
    isPrimary: boolean;
  }>;
}

interface PriceListEntry {
  _id: string;
  itemguid: string;
  itemname: string;
  plname: string;
  plrate: number;
  other1?: string;
  other2?: string;
}

interface OrderItem {
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  totalPrice: number;
  priceListRate: number;
  difference: number;
  finalRate: number;
}

interface Customer {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
}

const CreateOrder = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CreateOrder'>>();
  const { user, getProducts, createOrder, submitOrderForApproval } = useAuth();

  const selectedProductFromCatalog = route.params?.selectedProduct;

  // Core state
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Order details
  const [deliveryDate, setDeliveryDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'cheque' | 'bank_transfer' | 'upi' | 'card' | 'credit'>('cash');
  const [notes, setNotes] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');

  // Price list state
  const [priceListName, setPriceListName] = useState('');
  const [priceListNames, setPriceListNames] = useState<string[]>([]);
  const [priceListEntries, setPriceListEntries] = useState<PriceListEntry[]>([]);
  const [showPriceListModal, setShowPriceListModal] = useState(false);
  const [loadingPriceLists, setLoadingPriceLists] = useState(false);

  // Search and filter
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const result = await getProducts({
        page: 1,
        limit: 100,
        search: productSearchQuery,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
      });
      if (result?.success && result.products) {
        const activeProducts = (result.products || []).filter((p: Product) => p.isActive !== false);
        setProducts(activeProducts);
        const cats = activeProducts.map((p: Product) => p.category).filter(Boolean) || [];
        setCategories(['all', ...([...new Set(cats)] as string[])]);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Fetch price list names for dropdown
  const fetchPriceListNames = async () => {
    try {
      const result = await apiService.getPriceListNames();
      if (result?.success) {
        setPriceListNames(result.plnames || []);
      }
    } catch (error) {
      console.error('Failed to fetch price list names:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchPriceListNames();
  }, [productSearchQuery, selectedCategory]);

  useEffect(() => {
    if (selectedProductFromCatalog && orderItems.length === 0) {
      addProductToOrder(selectedProductFromCatalog);
    }
  }, [selectedProductFromCatalog]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  // Look up price list entry by product name
  const findPriceListEntry = (productName: string, entries: PriceListEntry[]): PriceListEntry | undefined =>
    entries.find(e => e.itemname.toLowerCase() === productName.toLowerCase());

  // Apply a price list entry to an order item
  const applyPriceListToItem = (item: OrderItem, entries: PriceListEntry[]): OrderItem => {
    const entry = findPriceListEntry(item.productName, entries);
    if (!entry) return item;
    const priceListRate = entry.plrate;
    const difference = parseFloat(entry.other1 || '0') || 0;
    const finalRate = priceListRate + difference;
    const subtotal = item.quantity * finalRate;
    const taxAmount = subtotal * (item.taxRate / 100);
    return {
      ...item,
      priceListRate,
      difference,
      finalRate,
      unitPrice: finalRate,
      totalPrice: subtotal - item.discount + taxAmount,
    };
  };

  // Select a price list — loads entries and re-prices all current items
  const selectPriceList = async (name: string) => {
    setPriceListName(name);
    setShowPriceListModal(false);
    if (!name) {
      setPriceListEntries([]);
      return;
    }
    try {
      setLoadingPriceLists(true);
      const result = await apiService.getPriceLists({ plname: name });
      if (result?.success) {
        const entries: PriceListEntry[] = result.data || [];
        setPriceListEntries(entries);
        setOrderItems(prev => prev.map(item => applyPriceListToItem(item, entries)));
      }
    } catch (error) {
      console.error('Failed to fetch price list entries:', error);
      Alert.alert('Error', 'Failed to load price list rates');
    } finally {
      setLoadingPriceLists(false);
    }
  };

  // Add product to order
  const addProductToOrder = (product: Product) => {
    const existingItem = orderItems.find(item => item.productId === product._id);
    if (existingItem) {
      setOrderItems(orderItems.map(item =>
        item.productId === product._id
          ? {
              ...item,
              quantity: item.quantity + 1,
              totalPrice: (item.quantity + 1) * item.unitPrice - item.discount + (item.quantity + 1) * item.unitPrice * (item.taxRate / 100),
            }
          : item
      ));
    } else {
      const entry = findPriceListEntry(product.productName, priceListEntries);
      const priceListRate = entry ? entry.plrate : 0;
      const difference = entry ? (parseFloat(entry.other1 || '0') || 0) : 0;
      const finalRate = entry ? priceListRate + difference : 0;
      const unitPrice = entry ? finalRate : (product.price || 0);

      const newItem: OrderItem = {
        productId: product._id,
        productName: product.productName,
        productCode: product.productCode,
        quantity: 1,
        unitPrice,
        discount: 0,
        taxRate: 0,
        totalPrice: unitPrice,
        priceListRate,
        difference,
        finalRate,
      };
      setOrderItems([...orderItems, newItem]);
    }
    setShowProductModal(false);
  };

  // Update order item — handles price list recalculation
  const updateOrderItem = (productId: string, field: keyof OrderItem, value: any) => {
    setOrderItems(orderItems.map(item => {
      if (item.productId !== productId) return item;
      const updated = { ...item, [field]: value };

      // Recalculate finalRate and unitPrice when price list fields change
      if (field === 'difference' || field === 'priceListRate') {
        updated.finalRate = updated.priceListRate + updated.difference;
        updated.unitPrice = updated.finalRate;
      }

      // Recalculate line total
      if (['quantity', 'unitPrice', 'discount', 'taxRate', 'difference', 'priceListRate'].includes(field)) {
        const subtotal = updated.quantity * updated.unitPrice;
        const taxAmount = subtotal * (updated.taxRate / 100);
        updated.totalPrice = subtotal - updated.discount + taxAmount;
      }

      return updated;
    }));
  };

  const removeOrderItem = (productId: string) => {
    setOrderItems(orderItems.filter(item => item.productId !== productId));
  };

  // Totals
  const subtotal = orderItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalDiscount = orderItems.reduce((sum, item) => sum + item.discount, 0);
  const totalTax = orderItems.reduce((sum, item) => sum + item.quantity * item.unitPrice * (item.taxRate / 100), 0);
  const finalTotal = subtotal - totalDiscount + totalTax;

  const buildItemPayload = (item: OrderItem) => ({
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discount: item.discount,
    taxRate: item.taxRate,
    totalPrice: item.totalPrice,
    priceListRate: item.priceListRate,
    difference: item.difference,
    finalRate: item.finalRate,
  });

  const handleCreateOrder = async () => {
    if (!selectedCustomer) { Alert.alert('Error', 'Please select a customer'); return; }
    if (orderItems.length === 0) { Alert.alert('Error', 'Please add at least one product to the order'); return; }

    try {
      setLoading(true);
      const orderData = {
        customerId: selectedCustomer._id,
        customerName: selectedCustomer.name,
        customerEmail: selectedCustomer.email,
        customerMobile: selectedCustomer.mobile,
        customerAddress: selectedCustomer.address,
        priceListName,
        items: orderItems.map(buildItemPayload),
        totalAmount: finalTotal,
        totalDiscount,
        totalTax,
        deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
        priority,
        paymentMethod,
        notes,
        shippingAddress: shippingAddress || selectedCustomer.address,
      };

      const result = await createOrder(orderData);
      if (result?.success) {
        Alert.alert('Success', 'Order created successfully!', [{
          text: 'OK',
          onPress: () => {
            setShowCustomerModal(false);
            setShowProductModal(false);
            setOrderItems([]);
            setSelectedCustomer(null);
            setDeliveryDate('');
            setPriority('medium');
            setPaymentMethod('cash');
            setNotes('');
            setShippingAddress('');
            setPriceListName('');
            setPriceListEntries([]);
            try { navigation.navigate('OrderList'); } catch { navigation.goBack(); }
          },
        }]);
      } else {
        Alert.alert('Error', result?.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('Error', 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!selectedCustomer) { Alert.alert('Error', 'Please select a customer'); return; }
    if (orderItems.length === 0) { Alert.alert('Error', 'Please add at least one product to the order'); return; }

    try {
      setLoading(true);
      const orderData = {
        customerId: selectedCustomer._id,
        customerName: selectedCustomer.name,
        customerEmail: selectedCustomer.email,
        customerMobile: selectedCustomer.mobile,
        customerAddress: selectedCustomer.address,
        priceListName,
        items: orderItems.map(buildItemPayload),
        totalAmount: finalTotal,
        totalDiscount,
        totalTax,
        deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
        priority,
        paymentMethod,
        notes,
        shippingAddress: shippingAddress || selectedCustomer.address,
      };

      const createResult = await createOrder(orderData);
      if (createResult?.success && createResult?.order?._id) {
        const approvalResult = await submitOrderForApproval(createResult.order._id);
        if (approvalResult?.success) {
          Alert.alert(
            'Success',
            approvalResult.isSelfApproved
              ? 'Order has been approved automatically!'
              : `Order submitted for approval to ${approvalResult.nextApprover?.name || 'next approver'}`,
            [{
              text: 'OK',
              onPress: () => {
                setShowCustomerModal(false);
                setShowProductModal(false);
                setOrderItems([]);
                setSelectedCustomer(null);
                setDeliveryDate('');
                setPriority('medium');
                setPaymentMethod('cash');
                setNotes('');
                setShippingAddress('');
                setPriceListName('');
                setPriceListEntries([]);
                try { navigation.navigate('OrderList'); } catch { navigation.goBack(); }
              },
            }]
          );
        } else {
          Alert.alert('Error', approvalResult?.message || 'Failed to submit order for approval');
        }
      } else {
        Alert.alert('Error', createResult?.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error submitting order for approval:', error);
      Alert.alert('Error', (error as Error).message || 'Failed to submit order for approval');
    } finally {
      setLoading(false);
    }
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity style={styles.productItem} onPress={() => addProductToOrder(item)}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.productName}</Text>
        <Text style={styles.productCode}>Code: {item.productCode}</Text>
        <Text style={styles.productPrice}>₹{item.price} / {item.unit}</Text>
        <Text style={styles.productStock}>
          Stock: {item.stock.current} {item.stock.current <= item.stock.minimum ? '(Low Stock)' : ''}
        </Text>
      </View>
      <Ionicons name="add-circle" size={24} color="#EF4444" />
    </TouchableOpacity>
  );

  const renderOrderItem = (item: OrderItem, index: number) => (
    <View key={item.productId} style={styles.orderItem}>
      <View style={styles.orderItemHeader}>
        <Text style={styles.orderItemName}>{item.productName}</Text>
        <TouchableOpacity onPress={() => removeOrderItem(item.productId)}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.orderItemDetails}>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Quantity:</Text>
          <TextInput
            style={styles.quantityInput}
            value={item.quantity.toString()}
            onChangeText={(text) => updateOrderItem(item.productId, 'quantity', parseInt(text) || 0)}
            keyboardType="numeric"
          />
        </View>

        {/* Price List Rate — read-only, shown when a price list is active */}
        {item.priceListRate > 0 && (
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>List Rate:</Text>
            <Text style={styles.readOnlyValue}>₹{item.priceListRate.toFixed(2)}</Text>
          </View>
        )}

        {/* Difference — editable +/- adjustment, default from other1 */}
        {item.priceListRate > 0 && (
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Difference:</Text>
            <TextInput
              style={[styles.priceInput, item.difference < 0 && styles.negativeInput]}
              value={item.difference.toString()}
              onChangeText={(text) => {
                const val = parseFloat(text);
                updateOrderItem(item.productId, 'difference', isNaN(val) ? 0 : val);
              }}
              keyboardType="numeric"
            />
          </View>
        )}

        {/* Final Rate = List Rate + Difference — read-only */}
        {item.priceListRate > 0 && (
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Final Rate:</Text>
            <Text style={styles.finalRateValue}>₹{item.finalRate.toFixed(2)}</Text>
          </View>
        )}

        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Unit Price:</Text>
          <TextInput
            style={styles.priceInput}
            value={item.unitPrice.toString()}
            onChangeText={(text) => updateOrderItem(item.productId, 'unitPrice', parseFloat(text) || 0)}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Discount:</Text>
          <TextInput
            style={styles.discountInput}
            value={item.discount.toString()}
            onChangeText={(text) => updateOrderItem(item.productId, 'discount', parseFloat(text) || 0)}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Tax Rate (%):</Text>
          <TextInput
            style={styles.taxInput}
            value={item.taxRate.toString()}
            onChangeText={(text) => updateOrderItem(item.productId, 'taxRate', parseFloat(text) || 0)}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>₹{item.totalPrice.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Order</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Customer Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <TouchableOpacity style={styles.customerSelector} onPress={() => setShowCustomerModal(true)}>
            {selectedCustomer ? (
              <View>
                <Text style={styles.customerName}>{selectedCustomer.name}</Text>
                <Text style={styles.customerDetails}>{selectedCustomer.mobile} • {selectedCustomer.email}</Text>
              </View>
            ) : (
              <Text style={styles.placeholderText}>Select Customer</Text>
            )}
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Price List Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price List</Text>
          <TouchableOpacity
            style={styles.customerSelector}
            onPress={() => setShowPriceListModal(true)}
          >
            {loadingPriceLists ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Text style={priceListName ? styles.customerName : styles.placeholderText}>
                {priceListName || 'Select Price List (optional)'}
              </Text>
            )}
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
          {priceListName ? (
            <TouchableOpacity onPress={() => selectPriceList('')} style={styles.clearPriceList}>
              <Text style={styles.clearPriceListText}>Clear price list</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Order Items</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowProductModal(true)}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add Product</Text>
            </TouchableOpacity>
          </View>

          {orderItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No products added</Text>
              <Text style={styles.emptySubtext}>Tap "Add Product" to start building your order</Text>
            </View>
          ) : (
            orderItems.map((item, index) => renderOrderItem(item, index))
          )}
        </View>

        {/* Order Summary */}
        {orderItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal:</Text>
                <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount:</Text>
                <Text style={styles.summaryValue}>-₹{totalDiscount.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax:</Text>
                <Text style={styles.summaryValue}>₹{totalTax.toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.finalTotalRow]}>
                <Text style={styles.finalTotalLabel}>Total:</Text>
                <Text style={styles.finalTotalValue}>₹{finalTotal.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Order Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Delivery Date</Text>
            <TextInput style={styles.textInput} value={deliveryDate} onChangeText={setDeliveryDate} placeholder="YYYY-MM-DD" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Priority</Text>
            <View style={styles.priorityButtons}>
              {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                <TouchableOpacity key={p} style={[styles.priorityButton, priority === p && styles.priorityButtonSelected]} onPress={() => setPriority(p)}>
                  <Text style={[styles.priorityButtonText, priority === p && styles.priorityButtonTextSelected]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Payment Method</Text>
            <View style={styles.paymentButtons}>
              {(['cash', 'cheque', 'bank_transfer', 'upi', 'card', 'credit'] as const).map((method) => (
                <TouchableOpacity key={method} style={[styles.paymentButton, paymentMethod === method && styles.paymentButtonSelected]} onPress={() => setPaymentMethod(method)}>
                  <Text style={[styles.paymentButtonText, paymentMethod === method && styles.paymentButtonTextSelected]}>
                    {method.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput style={[styles.textInput, styles.textArea]} value={notes} onChangeText={setNotes} placeholder="Additional notes..." multiline numberOfLines={3} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Shipping Address</Text>
            <TextInput style={[styles.textInput, styles.textArea]} value={shippingAddress} onChangeText={setShippingAddress} placeholder="Shipping address (optional)" multiline numberOfLines={2} />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.draftButton, (!selectedCustomer || orderItems.length === 0) && styles.createButtonDisabled]}
            onPress={handleCreateOrder}
            disabled={!selectedCustomer || orderItems.length === 0 || loading}
          >
            {loading ? <ActivityIndicator color="#6B7280" /> : (
              <>
                <Ionicons name="document-outline" size={20} color="#6B7280" />
                <Text style={styles.draftButtonText}>Save as Draft</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, (!selectedCustomer || orderItems.length === 0) && styles.createButtonDisabled]}
            onPress={handleSubmitForApproval}
            disabled={!selectedCustomer || orderItems.length === 0 || loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Submit for Approval</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Customer Selection Modal */}
      <Modal visible={showCustomerModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Customer</Text>
            <View style={styles.modalSpacer} />
          </View>
          <View style={styles.modalContent}>
            <Text style={styles.modalSubtext}>Select a customer for this order.</Text>
            <TouchableOpacity
              style={styles.customerOption}
              onPress={() => {
                setSelectedCustomer({ _id: 'temp-customer', name: 'Sample Customer', email: 'customer@example.com', mobile: '+91 98765 43210', address: { street: '123 Main Street', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' } });
                setShowCustomerModal(false);
              }}
            >
              <View style={styles.customerOptionInfo}>
                <Text style={styles.customerOptionName}>Sample Customer</Text>
                <Text style={styles.customerOptionDetails}>+91 98765 43210 • customer@example.com</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Price List Modal */}
      <Modal visible={showPriceListModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPriceListModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Price List</Text>
            <View style={styles.modalSpacer} />
          </View>
          <View style={styles.modalContent}>
            {priceListNames.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="pricetag-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>No price lists available</Text>
                <Text style={styles.emptySubtext}>Price lists are synced from Tally</Text>
              </View>
            ) : (
              priceListNames.map((name) => (
                <TouchableOpacity
                  key={name}
                  style={[styles.customerOption, priceListName === name && styles.selectedPriceListOption]}
                  onPress={() => selectPriceList(name)}
                >
                  <View style={styles.customerOptionInfo}>
                    <Text style={[styles.customerOptionName, priceListName === name && styles.selectedPriceListText]}>{name}</Text>
                  </View>
                  {priceListName === name && <Ionicons name="checkmark" size={20} color="#EF4444" />}
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </Modal>

      {/* Product Selection Modal */}
      <Modal visible={showProductModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowProductModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Products</Text>
            <View style={styles.modalSpacer} />
          </View>
          <View style={styles.modalContent}>
            <View style={styles.searchContainer}>
              <TextInput style={styles.searchInput} value={productSearchQuery} onChangeText={setProductSearchQuery} placeholder="Search products..." />
              <Ionicons name="search" size={20} color="#6B7280" />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {categories.map((category) => (
                <TouchableOpacity key={category} style={[styles.categoryButton, selectedCategory === category && styles.categoryButtonSelected]} onPress={() => setSelectedCategory(category)}>
                  <Text style={[styles.categoryButtonText, selectedCategory === category && styles.categoryButtonTextSelected]}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <FlatList
              data={products}
              renderItem={renderProductItem}
              keyExtractor={(item) => item._id}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              ListEmptyComponent={
                <View style={styles.emptyProducts}>
                  <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.emptyProductsText}>No products found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#EF4444', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSpacer: { width: 40 },
  content: { flex: 1, padding: 16 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  customerSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#F3F4F6', borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB' },
  customerName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  customerDetails: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  placeholderText: { fontSize: 16, color: '#9CA3AF' },
  clearPriceList: { marginTop: 8, alignSelf: 'flex-start' },
  clearPriceListText: { fontSize: 13, color: '#EF4444' },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  addButtonText: { color: '#fff', fontWeight: '600', marginLeft: 4 },
  emptyState: { alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#6B7280', marginTop: 8 },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', marginTop: 4, textAlign: 'center' },
  orderItem: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  orderItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderItemName: { fontSize: 16, fontWeight: '600', color: '#1F2937', flex: 1 },
  orderItemDetails: { gap: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inputLabel: { fontSize: 14, color: '#6B7280', minWidth: 80 },
  readOnlyValue: { fontSize: 14, color: '#374151', fontWeight: '500' },
  finalRateValue: { fontSize: 14, color: '#059669', fontWeight: '600' },
  quantityInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 4, padding: 8, width: 80, textAlign: 'center' },
  priceInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 4, padding: 8, width: 100, textAlign: 'center' },
  negativeInput: { borderColor: '#F59E0B', color: '#B45309' },
  discountInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 4, padding: 8, width: 80, textAlign: 'center' },
  taxInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 4, padding: 8, width: 80, textAlign: 'center' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: '#059669' },
  summaryContainer: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: '#6B7280' },
  summaryValue: { fontSize: 14, fontWeight: '500', color: '#1F2937' },
  finalTotalRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  finalTotalLabel: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  finalTotalValue: { fontSize: 18, fontWeight: 'bold', color: '#059669' },
  inputGroup: { marginBottom: 16 },
  textInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#fff' },
  textArea: { height: 80, textAlignVertical: 'top' },
  priorityButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  priorityButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#fff' },
  priorityButtonSelected: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  priorityButtonText: { fontSize: 14, color: '#6B7280' },
  priorityButtonTextSelected: { color: '#fff' },
  paymentButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  paymentButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#fff' },
  paymentButtonSelected: { backgroundColor: '#10B981', borderColor: '#10B981' },
  paymentButtonText: { fontSize: 14, color: '#6B7280' },
  paymentButtonTextSelected: { color: '#fff' },
  buttonContainer: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  draftButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#D1D5DB', gap: 8 },
  draftButtonText: { color: '#6B7280', fontSize: 16, fontWeight: '600' },
  submitButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#059669', padding: 16, borderRadius: 12, gap: 8 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  createButtonDisabled: { backgroundColor: '#9CA3AF', borderColor: '#9CA3AF' },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalCancelText: { fontSize: 16, color: '#EF4444' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  modalSpacer: { width: 60 },
  modalContent: { flex: 1, padding: 16 },
  modalSubtext: { fontSize: 14, color: '#6B7280', marginBottom: 16, textAlign: 'center' },
  customerOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#F9FAFB', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 8 },
  selectedPriceListOption: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  selectedPriceListText: { color: '#EF4444' },
  customerOptionInfo: { flex: 1 },
  customerOptionName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  customerOptionDetails: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 12, marginBottom: 16 },
  searchInput: { flex: 1, padding: 12, fontSize: 16 },
  categoryScroll: { marginBottom: 16 },
  categoryButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 8 },
  categoryButtonSelected: { backgroundColor: '#EF4444' },
  categoryButtonText: { fontSize: 14, color: '#6B7280' },
  categoryButtonTextSelected: { color: '#fff' },
  productItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#F9FAFB', borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  productCode: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  productPrice: { fontSize: 14, fontWeight: '500', color: '#059669', marginTop: 2 },
  productStock: { fontSize: 12, color: '#F59E0B', marginTop: 2 },
  emptyProducts: { alignItems: 'center', padding: 32 },
  emptyProductsText: { fontSize: 16, color: '#6B7280', marginTop: 8 },
});

export default CreateOrder;
