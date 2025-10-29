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
  productCode: string;
  productName: string;
  description?: string;
  category: string;
  subCategory?: string;
  brand?: string;
  unit: string;
  price: number;
  costPrice?: number;
  mrp?: number;
  discount: number;
  taxRate: number;
  stock: {
    current: number;
    minimum: number;
    maximum: number;
  };
  isActive: boolean;
  isAvailable: boolean;
  createdAt: string;
}

const ProductManagement = () => {
  const { 
    getProducts, 
    createProduct, 
    updateProduct, 
    deleteProduct,
    getProductCategories,
    updateProductStock,
    getLowStockProducts 
  } = useAuth();
  const navigation = useNavigation();

  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filter and search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showLowStock, setShowLowStock] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    productCode: '',
    productName: '',
    description: '',
    category: '',
    subCategory: '',
    brand: '',
    unit: 'piece',
    price: '',
    costPrice: '',
    mrp: '',
    discount: '',
    taxRate: '',
    stock: {
      current: '',
      minimum: '',
      maximum: ''
    }
  });

  // Stock update state
  const [stockUpdate, setStockUpdate] = useState({
    quantity: '',
    operation: 'add' as 'add' | 'subtract'
  });

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch products
      const params: any = { limit: 100 };
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const productsResponse = await getProducts(params);
      if (productsResponse?.success) {
        setProducts(productsResponse.products || []);
      }

      // Fetch categories
      const categoriesResponse = await getProductCategories();
      if (categoriesResponse?.success) {
        setCategories(categoriesResponse.categories || []);
      }

      // Fetch low stock products
      const lowStockResponse = await getLowStockProducts();
      if (lowStockResponse?.success) {
        setLowStockProducts(lowStockResponse.products || []);
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
  }, [selectedCategory, searchQuery]);

  // Reset form
  const resetForm = () => {
    setFormData({
      productCode: '',
      productName: '',
      description: '',
      category: '',
      subCategory: '',
      brand: '',
      unit: 'piece',
      price: '',
      costPrice: '',
      mrp: '',
      discount: '',
      taxRate: '',
      stock: {
        current: '',
        minimum: '',
        maximum: ''
      }
    });
  };

  // Create product
  const handleCreateProduct = async () => {
    // Validate required fields
    if (!formData.productCode || !formData.productName || !formData.category || !formData.price) {
      Alert.alert('Validation Error', 'Please fill in all required fields (Product Code, Product Name, Category, and Price)');
      return;
    }

    // Validate price is a valid number
    if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid price');
      return;
    }

    try {
      setLoading(true);
      
      const productData = {
        productCode: formData.productCode.trim(),
        productName: formData.productName.trim(),
        description: formData.description.trim(),
        category: formData.category.trim(),
        subCategory: formData.subCategory.trim(),
        brand: formData.brand.trim(),
        unit: formData.unit.trim(),
        price: parseFloat(formData.price),
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
        mrp: formData.mrp ? parseFloat(formData.mrp) : undefined,
        discount: formData.discount ? parseFloat(formData.discount) : 0,
        taxRate: formData.taxRate ? parseFloat(formData.taxRate) : 0,
        stock: {
          current: formData.stock.current ? parseInt(formData.stock.current) : 0,
          minimum: formData.stock.minimum ? parseInt(formData.stock.minimum) : 0,
          maximum: formData.stock.maximum ? parseInt(formData.stock.maximum) : 1000
        }
      };

      const response = await createProduct(productData);
      if (response?.success) {
        // Success: Close modal, reset form, and refresh product list immediately
        console.log('✅ Success! Closing modal and refreshing product list...');
        setShowCreateModal(false);
        resetForm();
        fetchData();
        
        // Show success message after modal is closed
        Alert.alert(
          'Success', 
          `Product "${response.product?.productName || formData.productName}" created successfully!`
        );
      } else {
        // Handle specific error messages from API
        const errorMessage = response?.message || 'Failed to create product';
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Error creating product:', error);
      // Handle API errors that throw exceptions (like 400 Bad Request)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Update product
  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;

    // Validate required fields
    if (!formData.productName || !formData.category || !formData.price) {
      Alert.alert('Validation Error', 'Please fill in all required fields (Product Name, Category, and Price)');
      return;
    }

    // Validate price is a valid number
    if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid price');
      return;
    }

    try {
      setLoading(true);
      
      const updateData = {
        productName: formData.productName.trim(),
        description: formData.description.trim(),
        category: formData.category.trim(),
        subCategory: formData.subCategory.trim(),
        brand: formData.brand.trim(),
        unit: formData.unit.trim(),
        price: parseFloat(formData.price),
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
        mrp: formData.mrp ? parseFloat(formData.mrp) : undefined,
        discount: formData.discount ? parseFloat(formData.discount) : 0,
        taxRate: formData.taxRate ? parseFloat(formData.taxRate) : 0,
        stock: {
          current: formData.stock.current ? parseInt(formData.stock.current) : 0,
          minimum: formData.stock.minimum ? parseInt(formData.stock.minimum) : 0,
          maximum: formData.stock.maximum ? parseInt(formData.stock.maximum) : 1000
        }
      };

      const response = await updateProduct(selectedProduct._id, updateData);
      if (response?.success) {
        // Success: Close modal, reset form, and refresh product list immediately
        console.log('✅ Update Success! Closing modal and refreshing product list...');
        setShowEditModal(false);
        setSelectedProduct(null);
        resetForm();
        fetchData();
        
        // Show success message after modal is closed
        Alert.alert(
          'Success', 
          `Product "${response.product?.productName || formData.productName}" updated successfully!`
        );
      } else {
        // Handle specific error messages from API
        const errorMessage = response?.message || 'Failed to update product';
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      // Handle API errors that throw exceptions (like 400 Bad Request)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Update stock
  const handleUpdateStock = async () => {
    if (!selectedProduct || !stockUpdate.quantity) return;

    // Validate quantity is a valid number
    if (isNaN(parseInt(stockUpdate.quantity)) || parseInt(stockUpdate.quantity) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid quantity');
      return;
    }

    try {
      setLoading(true);
      
      const response = await updateProductStock(selectedProduct._id, {
        quantity: parseInt(stockUpdate.quantity),
        operation: stockUpdate.operation
      });

      if (response?.success) {
        // Success: Close modal, reset form, and refresh product list immediately
        console.log('✅ Stock Update Success! Closing modal and refreshing product list...');
        setShowStockModal(false);
        setSelectedProduct(null);
        setStockUpdate({ quantity: '', operation: 'add' });
        fetchData();
        
        // Show success message after modal is closed
        Alert.alert(
          'Success', 
          `Stock updated successfully! ${stockUpdate.operation === 'add' ? 'Added' : 'Removed'} ${stockUpdate.quantity} units.`
        );
      } else {
        // Handle specific error messages from API
        const errorMessage = response?.message || 'Failed to update stock';
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      // Handle API errors that throw exceptions (like 400 Bad Request)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Delete product
  const handleDeleteProduct = (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.productName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deleteProduct(product._id);
              if (response?.success) {
                Alert.alert('Success', 'Product deleted successfully');
                fetchData();
              } else {
                Alert.alert('Error', 'Failed to delete product');
              }
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product');
            }
          }
        }
      ]
    );
  };

  // Open edit modal
  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      productCode: product.productCode,
      productName: product.productName,
      description: product.description || '',
      category: product.category,
      subCategory: product.subCategory || '',
      brand: product.brand || '',
      unit: product.unit,
      price: product.price.toString(),
      costPrice: product.costPrice?.toString() || '',
      mrp: product.mrp?.toString() || '',
      discount: product.discount.toString(),
      taxRate: product.taxRate.toString(),
      stock: {
        current: product.stock.current.toString(),
        minimum: product.stock.minimum.toString(),
        maximum: product.stock.maximum.toString()
      }
    });
    setShowEditModal(true);
  };

  // Open product details modal
  const openDetailsModal = (product: Product) => {
    setSelectedProduct(product);
    setShowDetailsModal(true);
  };

  // Filter products
  const filteredProducts = showLowStock ? lowStockProducts : products;

  // Render product item
  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <TouchableOpacity 
        style={styles.productCardContent}
        onPress={() => openDetailsModal(item)}
        activeOpacity={0.7}
      >
        <View style={styles.productHeader}>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.productName}</Text>
            <Text style={styles.productCode}>{item.productCode}</Text>
            <Text style={styles.productCategory}>{item.category}</Text>
          </View>
          <View style={styles.productPrice}>
            <Text style={styles.priceText}>₹{item.price}</Text>
            <Text style={styles.unitText}>/{item.unit}</Text>
          </View>
        </View>

        <View style={styles.productDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Stock:</Text>
            <Text style={[
              styles.detailValue,
              item.stock.current <= item.stock.minimum && styles.lowStockText
            ]}>
              {item.stock.current} / {item.stock.maximum}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: item.isAvailable ? '#10B981' : '#EF4444' }
            ]}>
              <Text style={styles.statusText}>
                {item.isAvailable ? 'Available' : 'Unavailable'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.productActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => openEditModal(item)}
        >
          <Ionicons name="create-outline" size={16} color="#3B82F6" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.stockButton]}
          onPress={() => {
            setSelectedProduct(item);
            setShowStockModal(true);
          }}
        >
          <Ionicons name="cube-outline" size={16} color="#F59E0B" />
          <Text style={styles.actionButtonText}>Stock</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteProduct(item)}
        >
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render create/edit modal
  const renderProductModal = (isEdit: boolean = false) => (
    <Modal
      visible={isEdit ? showEditModal : showCreateModal}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={() => {
        if (isEdit) {
          setShowEditModal(false);
          setSelectedProduct(null);
        } else {
          setShowCreateModal(false);
        }
        resetForm();
      }}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity 
            style={styles.modalHeaderButton}
            onPress={() => {
              if (isEdit) {
                setShowEditModal(false);
                setSelectedProduct(null);
              } else {
                setShowCreateModal(false);
              }
              resetForm();
            }}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {isEdit ? 'Edit Product' : 'Create Product'}
          </Text>
          <TouchableOpacity 
            style={styles.modalHeaderButton}
            onPress={isEdit ? handleUpdateProduct : handleCreateProduct}
            disabled={loading}
          >
            <Text style={[styles.modalSaveText, loading && styles.disabledText]}>
              {isEdit ? 'Update' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.modalContent}
          contentContainerStyle={styles.modalContentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Product Code *</Text>
              <TextInput
                style={styles.input}
                value={formData.productCode}
                onChangeText={(text) => setFormData({ ...formData, productCode: text })}
                placeholder="Enter product code"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Product Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.productName}
                onChangeText={(text) => setFormData({ ...formData, productName: text })}
                placeholder="Enter product name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Enter product description"
                multiline
                numberOfLines={3}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Category *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.category}
                  onChangeText={(text) => setFormData({ ...formData, category: text })}
                  placeholder="Enter category"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Sub Category</Text>
                <TextInput
                  style={styles.input}
                  value={formData.subCategory}
                  onChangeText={(text) => setFormData({ ...formData, subCategory: text })}
                  placeholder="Enter sub category"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Brand</Text>
              <TextInput
                style={styles.input}
                value={formData.brand}
                onChangeText={(text) => setFormData({ ...formData, brand: text })}
                placeholder="Enter brand"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Unit *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.unit}
                  onChangeText={(text) => setFormData({ ...formData, unit: text })}
                  placeholder="piece, kg, liter, etc."
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Price *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.price}
                  onChangeText={(text) => setFormData({ ...formData, price: text })}
                  placeholder="0.00"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Cost Price</Text>
                <TextInput
                  style={styles.input}
                  value={formData.costPrice}
                  onChangeText={(text) => setFormData({ ...formData, costPrice: text })}
                  placeholder="0.00"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>MRP</Text>
                <TextInput
                  style={styles.input}
                  value={formData.mrp}
                  onChangeText={(text) => setFormData({ ...formData, mrp: text })}
                  placeholder="0.00"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Discount (%)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.discount}
                  onChangeText={(text) => setFormData({ ...formData, discount: text })}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Tax Rate (%)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.taxRate}
                  onChangeText={(text) => setFormData({ ...formData, taxRate: text })}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <Text style={styles.sectionTitle}>Stock Information</Text>
            
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Current Stock</Text>
                <TextInput
                  style={styles.input}
                  value={formData.stock.current}
                  onChangeText={(text) => setFormData({ 
                    ...formData, 
                    stock: { ...formData.stock, current: text }
                  })}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Minimum Stock</Text>
                <TextInput
                  style={styles.input}
                  value={formData.stock.minimum}
                  onChangeText={(text) => setFormData({ 
                    ...formData, 
                    stock: { ...formData.stock, minimum: text }
                  })}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Maximum Stock</Text>
              <TextInput
                style={styles.input}
                value={formData.stock.maximum}
                onChangeText={(text) => setFormData({ 
                  ...formData, 
                  stock: { ...formData.stock, maximum: text }
                })}
                placeholder="1000"
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
        </ScrollView>
      </View>
    </Modal>
  );

  // Render stock update modal
  const renderStockModal = () => (
    <Modal
      visible={showStockModal}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={() => setShowStockModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity 
            style={styles.modalHeaderButton}
            onPress={() => setShowStockModal(false)}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Update Stock</Text>
          <TouchableOpacity 
            style={styles.modalHeaderButton}
            onPress={handleUpdateStock}
            disabled={loading || !stockUpdate.quantity}
          >
            <Text style={[styles.modalSaveText, (loading || !stockUpdate.quantity) && styles.disabledText]}>
              Update
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.modalContent}
          contentContainerStyle={styles.modalContentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {selectedProduct && (
            <>
              <View style={styles.stockProductInfo}>
                <Text style={styles.productName}>{selectedProduct.productName}</Text>
                <Text style={styles.productCode}>{selectedProduct.productCode}</Text>
                <Text style={styles.currentStock}>
                  Current Stock: {selectedProduct.stock.current}
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Operation</Text>
                <View style={styles.operationButtons}>
                  <TouchableOpacity
                    style={[
                      styles.operationButton,
                      stockUpdate.operation === 'add' && styles.activeOperationButton
                    ]}
                    onPress={() => setStockUpdate({ ...stockUpdate, operation: 'add' })}
                  >
                    <Ionicons name="add" size={20} color={stockUpdate.operation === 'add' ? '#fff' : '#10B981'} />
                    <Text style={[
                      styles.operationButtonText,
                      stockUpdate.operation === 'add' && styles.activeOperationButtonText
                    ]}>
                      Add Stock
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.operationButton,
                      stockUpdate.operation === 'subtract' && styles.activeOperationButton
                    ]}
                    onPress={() => setStockUpdate({ ...stockUpdate, operation: 'subtract' })}
                  >
                    <Ionicons name="remove" size={20} color={stockUpdate.operation === 'subtract' ? '#fff' : '#EF4444'} />
                    <Text style={[
                      styles.operationButtonText,
                      stockUpdate.operation === 'subtract' && styles.activeOperationButtonText
                    ]}>
                      Remove Stock
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  value={stockUpdate.quantity}
                  onChangeText={(text) => setStockUpdate({ ...stockUpdate, quantity: text })}
                  placeholder="Enter quantity"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  // Render product details modal
  const renderDetailsModal = () => (
    <Modal
      visible={showDetailsModal}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={() => setShowDetailsModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity 
            style={styles.modalHeaderButton}
            onPress={() => setShowDetailsModal(false)}
          >
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Product Details</Text>
          <TouchableOpacity 
            style={styles.modalHeaderButton}
            onPress={() => {
              setShowDetailsModal(false);
              openEditModal(selectedProduct!);
            }}
          >
            <Ionicons name="create-outline" size={24} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {selectedProduct && (
            <>
              {/* Product Image */}
              <View style={styles.detailsImageContainer}>
                <View style={styles.detailsImagePlaceholder}>
                  <Ionicons name="cube" size={64} color="#6B7280" />
                </View>
              </View>

              {/* Basic Information */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Basic Information</Text>
                
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Product Name</Text>
                  <Text style={styles.detailsValue}>{selectedProduct.productName}</Text>
                </View>
                
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Product Code</Text>
                  <Text style={styles.detailsValue}>{selectedProduct.productCode}</Text>
                </View>
                
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Description</Text>
                  <Text style={styles.detailsValue}>{selectedProduct.description || 'No description'}</Text>
                </View>
              </View>

              {/* Category Information */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Category Information</Text>
                
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Category</Text>
                  <Text style={styles.detailsValue}>{selectedProduct.category}</Text>
                </View>
                
                {selectedProduct.subCategory && (
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Sub Category</Text>
                    <Text style={styles.detailsValue}>{selectedProduct.subCategory}</Text>
                  </View>
                )}
                
                {selectedProduct.brand && (
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Brand</Text>
                    <Text style={styles.detailsValue}>{selectedProduct.brand}</Text>
                  </View>
                )}
              </View>

              {/* Pricing Information */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Pricing Information</Text>
                
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Price</Text>
                  <Text style={styles.detailsValue}>₹{selectedProduct.price} / {selectedProduct.unit}</Text>
                </View>
                
                {selectedProduct.costPrice && (
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Cost Price</Text>
                    <Text style={styles.detailsValue}>₹{selectedProduct.costPrice}</Text>
                  </View>
                )}
                
                {selectedProduct.mrp && (
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>MRP</Text>
                    <Text style={styles.detailsValue}>₹{selectedProduct.mrp}</Text>
                  </View>
                )}
                
                {selectedProduct.discount && (
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Discount</Text>
                    <Text style={styles.detailsValue}>₹{selectedProduct.discount}</Text>
                  </View>
                )}
                
                {selectedProduct.taxRate && (
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Tax Rate</Text>
                    <Text style={styles.detailsValue}>{selectedProduct.taxRate}%</Text>
                  </View>
                )}
              </View>

              {/* Stock Information */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Stock Information</Text>
                
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Current Stock</Text>
                  <Text style={styles.detailsValue}>{selectedProduct.stock.current} {selectedProduct.unit}</Text>
                </View>
                
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Minimum Stock</Text>
                  <Text style={styles.detailsValue}>{selectedProduct.stock.minimum} {selectedProduct.unit}</Text>
                </View>
                
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Maximum Stock</Text>
                  <Text style={styles.detailsValue}>{selectedProduct.stock.maximum} {selectedProduct.unit}</Text>
                </View>
                
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Stock Status</Text>
                  <View style={[
                    styles.detailsBadge,
                    { backgroundColor: selectedProduct.stock.current <= selectedProduct.stock.minimum ? '#FEF3C7' : '#D1FAE5' }
                  ]}>
                    <Text style={[
                      styles.detailsBadgeText,
                      { color: selectedProduct.stock.current <= selectedProduct.stock.minimum ? '#D97706' : '#059669' }
                    ]}>
                      {selectedProduct.stock.current <= selectedProduct.stock.minimum ? 'Low Stock' : 'In Stock'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Status Information */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Status Information</Text>
                
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Active Status</Text>
                  <View style={[
                    styles.detailsBadge,
                    { backgroundColor: selectedProduct.isActive ? '#D1FAE5' : '#FEE2E2' }
                  ]}>
                    <Text style={[
                      styles.detailsBadgeText,
                      { color: selectedProduct.isActive ? '#059669' : '#DC2626' }
                    ]}>
                      {selectedProduct.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Availability</Text>
                  <View style={[
                    styles.detailsBadge,
                    { backgroundColor: selectedProduct.isAvailable ? '#D1FAE5' : '#FEE2E2' }
                  ]}>
                    <Text style={[
                      styles.detailsBadgeText,
                      { color: selectedProduct.isAvailable ? '#059669' : '#DC2626' }
                    ]}>
                      {selectedProduct.isAvailable ? 'Available' : 'Unavailable'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Timestamps */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Timestamps</Text>
                
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Created At</Text>
                  <Text style={styles.detailsValue}>
                    {new Date(selectedProduct.createdAt).toLocaleDateString()} {new Date(selectedProduct.createdAt).toLocaleTimeString()}
                  </Text>
                </View>
                
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading products...</Text>
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
        <Text style={styles.headerTitle}>Product Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              !showLowStock && styles.activeFilterButton
            ]}
            onPress={() => setShowLowStock(false)}
          >
            <Text style={[
              styles.filterButtonText,
              !showLowStock && styles.activeFilterButtonText
            ]}>
              All Products
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              showLowStock && styles.activeFilterButton
            ]}
            onPress={() => setShowLowStock(true)}
          >
            <Text style={[
              styles.filterButtonText,
              showLowStock && styles.activeFilterButtonText
            ]}>
              Low Stock ({lowStockProducts.length})
            </Text>
          </TouchableOpacity>
        </View>

        {categories.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilters}>
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === 'all' && styles.activeCategoryButton
              ]}
              onPress={() => setSelectedCategory('all')}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === 'all' && styles.activeCategoryButtonText
              ]}>
                All
              </Text>
            </TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.activeCategoryButton
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === category && styles.activeCategoryButtonText
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.productsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>No Products Found</Text>
            <Text style={styles.emptyStateText}>
              {showLowStock 
                ? 'No products with low stock'
                : 'No products found matching your criteria'
              }
            </Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />

      {/* Modals */}
      {renderProductModal(false)}
      {renderProductModal(true)}
      {renderStockModal()}
      {renderDetailsModal()}
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
  addButton: {
    padding: 8,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1F2937',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  activeFilterButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  categoryFilters: {
    flexDirection: 'row',
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: 8,
  },
  activeCategoryButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  categoryButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeCategoryButtonText: {
    color: '#fff',
  },
  productsList: {
    padding: 16,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  productCode: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  productPrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  unitText: {
    fontSize: 12,
    color: '#6B7280',
  },
  productDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    color: '#1F2937',
  },
  lowStockText: {
    color: '#EF4444',
    fontWeight: 'bold',
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
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  editButton: {
    backgroundColor: '#EBF4FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  stockButton: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60, // Account for status bar
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  modalHeaderButton: {
    minHeight: 44, // iOS recommended touch target
    minWidth: 60,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    flex: 1,
  },
  modalSaveText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 40, // Extra padding for keyboard
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#fff',
    minHeight: 48, // Better touch target
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Stock modal specific styles
  stockProductInfo: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  currentStock: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  operationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  operationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    gap: 8,
    minHeight: 56, // Better touch target
  },
  activeOperationButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  operationButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeOperationButtonText: {
    color: '#fff',
  },
  
  // Product Details Modal Styles
  productCardContent: {
    flex: 1,
  },
  detailsImageContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 20,
  },
  detailsImagePlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default ProductManagement;
