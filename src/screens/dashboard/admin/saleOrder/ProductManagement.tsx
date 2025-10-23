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
    if (!formData.productCode || !formData.productName || !formData.category || !formData.price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const productData = {
        ...formData,
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
        Alert.alert('Success', 'Product created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchData();
      } else {
        Alert.alert('Error', 'Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      Alert.alert('Error', 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  // Update product
  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;

    try {
      setLoading(true);
      
      const updateData = {
        ...formData,
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
        Alert.alert('Success', 'Product updated successfully');
        setShowEditModal(false);
        setSelectedProduct(null);
        resetForm();
        fetchData();
      } else {
        Alert.alert('Error', 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Error', 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  // Update stock
  const handleUpdateStock = async () => {
    if (!selectedProduct || !stockUpdate.quantity) return;

    try {
      setLoading(true);
      
      const response = await updateProductStock(selectedProduct._id, {
        quantity: parseInt(stockUpdate.quantity),
        operation: stockUpdate.operation
      });

      if (response?.success) {
        Alert.alert('Success', 'Stock updated successfully');
        setShowStockModal(false);
        setSelectedProduct(null);
        setStockUpdate({ quantity: '', operation: 'add' });
        fetchData();
      } else {
        Alert.alert('Error', 'Failed to update stock');
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      Alert.alert('Error', 'Failed to update stock');
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

  // Filter products
  const filteredProducts = showLowStock ? lowStockProducts : products;

  // Render product item
  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
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
      transparent={true}
      animationType="slide"
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
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEdit ? 'Edit Product' : 'Create Product'}
            </Text>
            <TouchableOpacity onPress={() => {
              if (isEdit) {
                setShowEditModal(false);
                setSelectedProduct(null);
              } else {
                setShowCreateModal(false);
              }
              resetForm();
            }}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
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

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
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
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={isEdit ? handleUpdateProduct : handleCreateProduct}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {isEdit ? 'Update' : 'Create'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render stock update modal
  const renderStockModal = () => (
    <Modal
      visible={showStockModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowStockModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Update Stock</Text>
            <TouchableOpacity onPress={() => setShowStockModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {selectedProduct && (
            <View style={styles.modalContent}>
              <View style={styles.productInfo}>
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
            </View>
          )}

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowStockModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleUpdateStock}
              disabled={loading || !stockUpdate.quantity}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Update Stock</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
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
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
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
  productInfo: {
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
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    gap: 8,
  },
  activeOperationButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  operationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeOperationButtonText: {
    color: '#fff',
  },
});

export default ProductManagement;
