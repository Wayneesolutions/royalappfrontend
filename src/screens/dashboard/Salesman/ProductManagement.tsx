import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

interface Product {
  _id: string;
  productCode: string;
  productName: string;
  description: string;
  category: string;
  subCategory: string;
  brand: string;
  unit: string;
  price: number;
  costPrice: number;
  mrp: number;
  discount: number;
  taxRate: number;
  stock: {
    current: number;
    minimum: number;
    maximum: number;
  };
  images: Array<{
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
  specifications: any;
  isActive: boolean;
  isAvailable: boolean;
}

const ProductManagement = () => {
  const navigation = useNavigation();
  const { user, getProducts, createProduct, updateProduct, deleteProduct } = useAuth();
  
  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  
  // Product form modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
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
    stockCurrent: '',
    stockMinimum: '',
    stockMaximum: '',
    isActive: true,
    isAvailable: true,
  });

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching products with params:', {
        page: 1,
        limit: 100,
        search: searchQuery,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
      });
      
      const result = await getProducts({
        page: 1,
        limit: 100,
        search: searchQuery,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
      });
      
      console.log('fetchProducts result:', result);
      console.log('result.success:', result?.success);
      console.log('result.products:', result?.products);
      
      if (result?.success && result.products) {
        setProducts(result.products || []);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(result.products?.map((p: Product) => p.category) || [])];
        setCategories(['all', ...uniqueCategories]);
        console.log('Products loaded successfully:', result.products.length);
      } else {
        console.log('No products data received or success is false');
        setProducts([]);
        setCategories(['all']);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setError(`Failed to load products: ${error.message || 'Unknown error'}`);
      setProducts([]);
      setCategories(['all']);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, selectedCategory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  // Handle create/edit product
  const handleCreateProduct = async () => {
    try {
      if (!formData.productName || !formData.category || !formData.price) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const trimmedProductCode = formData.productCode?.trim();
      const productData: Record<string, any> = {
        ...(trimmedProductCode ? { productCode: trimmedProductCode } : {}),
        productName: formData.productName,
        description: formData.description,
        category: formData.category,
        subCategory: formData.subCategory,
        brand: formData.brand,
        unit: formData.unit,
        price: parseFloat(formData.price),
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : 0,
        mrp: formData.mrp ? parseFloat(formData.mrp) : 0,
        discount: formData.discount ? parseFloat(formData.discount) : 0,
        taxRate: formData.taxRate ? parseFloat(formData.taxRate) : 0,
        stock: {
          current: formData.stockCurrent ? parseInt(formData.stockCurrent) : 0,
          minimum: formData.stockMinimum ? parseInt(formData.stockMinimum) : 0,
          maximum: formData.stockMaximum ? parseInt(formData.stockMaximum) : 0,
        },
        isActive: formData.isActive,
        isAvailable: formData.isAvailable,
      };

      console.log('Creating product with data:', productData);
      console.log('User role:', user?.role);
      console.log('User details:', user);

      if (isEditMode && currentProduct) {
        await updateProduct(currentProduct._id, productData);
        Alert.alert('Success', 'Product updated successfully');
      } else {
        await createProduct(productData);
        Alert.alert('Success', 'Product created successfully');
      }

      setShowProductModal(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Failed to save product:', error);
      Alert.alert('Error', `Failed to save product: ${error.message || 'Unknown error'}`);
    }
  };

  // Handle delete product
  const handleDeleteProduct = async (product: Product) => {
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
              await deleteProduct(product._id);
              Alert.alert('Success', 'Product deleted successfully');
              fetchProducts();
            } catch (error) {
              console.error('Failed to delete product:', error);
              Alert.alert('Error', `Failed to delete product: ${error.message || 'Unknown error'}`);
            }
          },
        },
      ]
    );
  };

  // Handle edit product
  const handleEditProduct = (product: Product) => {
    setCurrentProduct(product);
    setIsEditMode(true);
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
      discount: product.discount?.toString() || '',
      taxRate: product.taxRate?.toString() || '',
      stockCurrent: product.stock.current.toString(),
      stockMinimum: product.stock.minimum.toString(),
      stockMaximum: product.stock.maximum.toString(),
      isActive: product.isActive,
      isAvailable: product.isAvailable,
    });
    setShowProductModal(true);
  };

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
      stockCurrent: '',
      stockMinimum: '',
      stockMaximum: '',
      isActive: true,
      isAvailable: true,
    });
    setCurrentProduct(null);
    setIsEditMode(false);
  };

  // Open create product modal
  const openCreateModal = () => {
    resetForm();
    setShowProductModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowProductModal(false);
    resetForm();
  };

  // Render product item
  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <View style={styles.productImageContainer}>
        <View style={styles.productImagePlaceholder}>
          <Ionicons name="cube" size={32} color="#6B7280" />
        </View>
      </View>
      
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.productName}</Text>
        <Text style={styles.productCode}>Code: {item.productCode}</Text>
        <Text style={styles.productCategory}>{item.category}</Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.productPrice}>₹{item.price}</Text>
          <Text style={styles.productUnit}>/ {item.unit}</Text>
        </View>
        
        <View style={styles.stockContainer}>
          <View style={[
            styles.stockBadge,
            { backgroundColor: item.stock.current <= item.stock.minimum ? '#FEF3C7' : '#D1FAE5' }
          ]}>
            <Text style={[
              styles.stockText,
              { color: item.stock.current <= item.stock.minimum ? '#D97706' : '#059669' }
            ]}>
              {item.stock.current <= item.stock.minimum ? 'Low Stock' : 'In Stock'}
            </Text>
          </View>
          <Text style={styles.stockQuantity}>{item.stock.current} {item.unit}</Text>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.isActive ? '#D1FAE5' : '#FEE2E2' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: item.isActive ? '#059669' : '#DC2626' }
            ]}>
              {item.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.productActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditProduct(item)}
        >
          <Ionicons name="create" size={20} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteProduct(item)}
        >
          <Ionicons name="trash" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>No Products Found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery || selectedCategory !== 'all' 
          ? 'Try adjusting your search or filter criteria'
          : 'No products are available. Create your first product!'
        }
      </Text>
      {(searchQuery || selectedCategory !== 'all') && (
        <TouchableOpacity
          style={styles.clearFiltersButton}
          onPress={() => {
            setSearchQuery('');
            setSelectedCategory('all');
          }}
        >
          <Text style={styles.clearFiltersText}>Clear Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );

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
          onPress={openCreateModal}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search products..."
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.categoryButtonSelected
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === category && styles.categoryButtonTextSelected
              ]}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Products List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProducts}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={products.length === 0 ? styles.emptyListContainer : styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Product Form Modal */}
      <Modal
        visible={showProductModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {isEditMode ? 'Edit Product' : 'Create Product'}
            </Text>
            <TouchableOpacity onPress={handleCreateProduct}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Basic Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Product Code</Text>
                <TextInput
                  style={styles.input}
                  value={formData.productCode}
                  onChangeText={(text) => setFormData({...formData, productCode: text})}
                  placeholder="Enter product code"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Product Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.productName}
                  onChangeText={(text) => setFormData({...formData, productName: text})}
                  placeholder="Enter product name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({...formData, description: text})}
                  placeholder="Enter product description"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Category *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.category}
                    onChangeText={(text) => setFormData({...formData, category: text})}
                    placeholder="e.g., Paint, Tools"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Sub Category</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.subCategory}
                    onChangeText={(text) => setFormData({...formData, subCategory: text})}
                    placeholder="e.g., Interior, Exterior"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Brand</Text>
                <TextInput
                  style={styles.input}
                  value={formData.brand}
                  onChangeText={(text) => setFormData({...formData, brand: text})}
                  placeholder="Enter brand name"
                />
              </View>
            </View>

            {/* Pricing Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pricing Information</Text>
              
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Selling Price *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.price}
                    onChangeText={(text) => setFormData({...formData, price: text})}
                    placeholder="0.00"
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Unit</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.unit}
                    onChangeText={(text) => setFormData({...formData, unit: text})}
                    placeholder="e.g., liter, piece"
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Cost Price</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.costPrice}
                    onChangeText={(text) => setFormData({...formData, costPrice: text})}
                    placeholder="0.00"
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>MRP</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.mrp}
                    onChangeText={(text) => setFormData({...formData, mrp: text})}
                    placeholder="0.00"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Discount (%)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.discount}
                    onChangeText={(text) => setFormData({...formData, discount: text})}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Tax Rate (%)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.taxRate}
                    onChangeText={(text) => setFormData({...formData, taxRate: text})}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Stock Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Stock Information</Text>
              
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Current Stock</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.stockCurrent}
                    onChangeText={(text) => setFormData({...formData, stockCurrent: text})}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Minimum Stock</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.stockMinimum}
                    onChangeText={(text) => setFormData({...formData, stockMinimum: text})}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Maximum Stock</Text>
                <TextInput
                  style={styles.input}
                  value={formData.stockMaximum}
                  onChangeText={(text) => setFormData({...formData, stockMaximum: text})}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Status */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Status</Text>
              
              <View style={styles.checkboxRow}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setFormData({...formData, isActive: !formData.isActive})}
                >
                  <Ionicons 
                    name={formData.isActive ? "checkbox" : "square-outline"} 
                    size={20} 
                    color={formData.isActive ? "#EF4444" : "#6B7280"} 
                  />
                  <Text style={styles.checkboxLabel}>Active</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setFormData({...formData, isAvailable: !formData.isAvailable})}
                >
                  <Ionicons 
                    name={formData.isAvailable ? "checkbox" : "square-outline"} 
                    size={20} 
                    color={formData.isAvailable ? "#EF4444" : "#6B7280"} 
                  />
                  <Text style={styles.checkboxLabel}>Available</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Quick Stats */}
      {products.length > 0 && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {products.length} product{products.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#EF4444',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
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
  categoryScroll: {
    marginBottom: 12,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  categoryButtonSelected: {
    backgroundColor: '#EF4444',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoryButtonTextSelected: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: '#EF4444',
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImageContainer: {
    marginRight: 12,
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 12,
    color: '#EF4444',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  productUnit: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '500',
  },
  stockQuantity: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  productActions: {
    justifyContent: 'space-between',
    paddingLeft: 8,
  },
  actionButton: {
    padding: 8,
    marginBottom: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  clearFiltersButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EF4444',
    borderRadius: 6,
  },
  clearFiltersText: {
    color: '#fff',
    fontWeight: '600',
  },
  statsContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalSaveText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 8,
  },
});

export default ProductManagement;
