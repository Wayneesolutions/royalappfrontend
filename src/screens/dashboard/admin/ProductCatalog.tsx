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
import { DEFAULT_GST_RATE } from '../../../utils/gst';

interface Product {
  _id: string;
  productCode: string;
  productName: string;
  description?: string;
  category: string;
  subCategory?: string;
  brand?: string;
  price: number;
  isActive: boolean;
  gstRate?: number;
  createdBy?: {
    name: string;
    role: string;
  };
  updatedBy?: {
    name: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}


const ProductCatalog = () => {
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
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'category' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
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
    price: '',
    gstRate: DEFAULT_GST_RATE.toString(),
    isActive: true,
  });

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Admin ProductCatalog - Fetching products with params:', {
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
      
      console.log('Admin ProductCatalog - Products result:', result);
      
      if (result?.success && result.products) {
        let fetchedProducts = result.products || [];
        
        // Sort products
        fetchedProducts = sortProducts(fetchedProducts, sortBy, sortOrder);
        
        setProducts(fetchedProducts);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(result.products?.map((p: Product) => p.category).filter(Boolean) || [])] as string[];
        setCategories(['all', ...uniqueCategories]);
        
        console.log('Admin ProductCatalog - Products loaded:', fetchedProducts.length);
      } else {
        console.log('Admin ProductCatalog - No products data received');
        setProducts([]);
        setCategories(['all']);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to load products: ${errorMessage}`);
      setProducts([]);
      setCategories(['all']);
    } finally {
      setLoading(false);
    }
  };

  // Sort products
  const sortProducts = (products: Product[], sortBy: string, order: string) => {
    return [...products].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.productName.toLowerCase();
          bValue = b.productName.toLowerCase();
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          aValue = a.productName.toLowerCase();
          bValue = b.productName.toLowerCase();
      }
      
      if (order === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  };

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, selectedCategory, sortBy, sortOrder]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  // Handle product creation
  const handleCreateProduct = async () => {
    console.log('🚀 handleCreateProduct called');
    console.log('📝 Form Data:', formData);
    
    // Validate required fields
    if (!formData.productCode || !formData.productName || !formData.category || !formData.price) {
      console.log('❌ Validation failed - missing required fields');
      Alert.alert('Validation Error', 'Please fill in all required fields (Product Code, Product Name, Category, and Price)');
      return;
    }

    // Validate price is a valid number
    if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      console.log('❌ Validation failed - invalid price');
      Alert.alert('Validation Error', 'Please enter a valid price');
      return;
    }

    if (isNaN(parseFloat(formData.gstRate)) || parseFloat(formData.gstRate) < 0) {
      console.log('❌ Validation failed - invalid GST rate');
      Alert.alert('Validation Error', 'Please enter a valid GST rate (0 or higher)');
      return;
    }

    console.log('✅ Validation passed, calling API...');
    try {
      setLoading(true);
      
      const productData = {
        productCode: formData.productCode.trim(),
        productName: formData.productName.trim(),
        description: formData.description.trim(),
        category: formData.category.trim(),
        subCategory: formData.subCategory.trim(),
        brand: formData.brand.trim(),
        price: parseFloat(formData.price),
        gstRate: parseFloat(formData.gstRate),
        isActive: formData.isActive,
      };

      const result = await createProduct(productData);
      console.log('📡 API Response received:', result);
      console.log('Create Product Result:', result);
      console.log('Result Success:', result?.success);
      console.log('Result Type:', typeof result);
      
      // Handle case where result might be undefined or null
      if (!result) {
        Alert.alert('Error', 'No response received from server');
        return;
      }
      
      if (result?.success) {
        // Success: Close modal, reset form, and refresh product list immediately
        console.log('✅ Success! Closing modal and refreshing product list...');
        setShowCreateModal(false);
        resetForm();
        fetchProducts();
        
        // Show success message after modal is closed
        Alert.alert(
          'Success', 
          `Product "${result.product?.productName || formData.productName}" created successfully!`
        );
      } else {
        // Handle specific error messages from API
        const errorMessage = result?.message || 'Failed to create product';
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

  // Handle product update
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

    if (isNaN(parseFloat(formData.gstRate)) || parseFloat(formData.gstRate) < 0) {
      Alert.alert('Validation Error', 'Please enter a valid GST rate (0 or higher)');
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
        price: parseFloat(formData.price),
        gstRate: parseFloat(formData.gstRate),
        isActive: formData.isActive,
      };

      const result = await updateProduct(selectedProduct._id, updateData);
      console.log('Update Product Result:', result);
      console.log('Result Success:', result?.success);
      console.log('Result Type:', typeof result);
      
      // Handle case where result might be undefined or null
      if (!result) {
        Alert.alert('Error', 'No response received from server');
        return;
      }
      
      if (result?.success) {
        // Success: Close modal, reset form, and refresh product list immediately
        console.log('✅ Update Success! Closing modal and refreshing product list...');
        setShowEditModal(false);
        setSelectedProduct(null);
        resetForm();
        fetchProducts();
        
        // Show success message after modal is closed
        Alert.alert(
          'Success', 
          `Product "${result.product?.productName || formData.productName}" updated successfully!`
        );
      } else {
        // Handle specific error messages from API
        const errorMessage = result?.message || 'Failed to update product';
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

  // Handle product deletion
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
              setLoading(true);
              const result = await deleteProduct(product._id);
              
              if (result?.success) {
                Alert.alert('Success', 'Product deleted successfully!');
                fetchProducts();
              } else {
                Alert.alert('Error', result?.message || 'Failed to delete product');
              }
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
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
      price: '',
      gstRate: DEFAULT_GST_RATE.toString(),
      isActive: true,
    });
  };

  // Open edit modal
  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      productCode: product.productCode,
      productName: product.productName,
      description: product.description || '',
      category: product.category || '',
      subCategory: product.subCategory || '',
      brand: product.brand || '',
      price: product.price?.toString() || '',
      gstRate: (product.gstRate ?? DEFAULT_GST_RATE).toString(),
      isActive: product.isActive,
    });
    setShowEditModal(true);
  };

  // Open product details modal
  const openDetailsModal = (product: Product) => {
    setSelectedProduct(product);
    setShowDetailsModal(true);
  };

  // Render product item
  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <TouchableOpacity 
        style={styles.productCardContent}
        onPress={() => openDetailsModal(item)}
        activeOpacity={0.7}
      >
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
          </View>

          <Text style={styles.productGst}>
            GST: {(item.gstRate ?? DEFAULT_GST_RATE)}%
          </Text>
          
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
          
          {item.description && (
            <Text style={styles.productDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      
      <View style={styles.productActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openEditModal(item)}
        >
          <Ionicons name="create-outline" size={20} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteProduct(item)}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
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
          : 'No products are available at the moment'
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
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
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

        {/* Sort Options */}
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setSortBy('name')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'name' && styles.sortButtonSelected]}>
              Name
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setSortBy('price')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'price' && styles.sortButtonSelected]}>
              Price
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setSortBy('category')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'category' && styles.sortButtonSelected]}>
              Category
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setSortBy('createdAt')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'createdAt' && styles.sortButtonSelected]}>
              Date
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sortOrderButton}
            onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            <Ionicons 
              name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} 
              size={16} 
              color="#6B7280" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Products List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
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

      {/* Quick Stats */}
      {products.length > 0 && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {products.length} product{products.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      )}

      {/* Create Product Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="formSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalHeaderButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Product</Text>
            <TouchableOpacity 
              style={styles.modalHeaderButton}
              onPress={handleCreateProduct} 
              disabled={loading}
            >
              <Text style={[styles.modalSaveText, loading && styles.disabledText]}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.modalContent}
            contentContainerStyle={styles.modalContentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Product Code *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.productCode}
                onChangeText={(text) => setFormData({...formData, productCode: text})}
                placeholder="Enter product code"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Product Name *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.productName}
                onChangeText={(text) => setFormData({...formData, productName: text})}
                placeholder="Enter product name"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({...formData, description: text})}
                placeholder="Enter product description"
                multiline
                numberOfLines={3}
              />
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>Category *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.category}
                  onChangeText={(text) => setFormData({...formData, category: text})}
                  placeholder="Enter category"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>Sub Category</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.subCategory}
                  onChangeText={(text) => setFormData({...formData, subCategory: text})}
                  placeholder="Enter sub category"
                />
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Brand</Text>
              <TextInput
                style={styles.formInput}
                value={formData.brand}
                onChangeText={(text) => setFormData({...formData, brand: text})}
                placeholder="Enter brand"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Price *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.price}
                onChangeText={(text) => setFormData({...formData, price: text})}
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>GST Rate (%)</Text>
              <TextInput
                style={styles.formInput}
                value={formData.gstRate}
                onChangeText={(text) => setFormData({ ...formData, gstRate: text })}
                placeholder="18"
                keyboardType="numeric"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="formSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalHeaderButton}
              onPress={() => setShowEditModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Product</Text>
            <TouchableOpacity 
              style={styles.modalHeaderButton}
              onPress={handleUpdateProduct} 
              disabled={loading}
            >
              <Text style={[styles.modalSaveText, loading && styles.disabledText]}>Update</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.modalContent}
            contentContainerStyle={styles.modalContentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Product Code</Text>
              <TextInput
                style={[styles.formInput, styles.disabledInput]}
                value={formData.productCode}
                editable={false}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Product Name *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.productName}
                onChangeText={(text) => setFormData({...formData, productName: text})}
                placeholder="Enter product name"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({...formData, description: text})}
                placeholder="Enter product description"
                multiline
                numberOfLines={3}
              />
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>Category *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.category}
                  onChangeText={(text) => setFormData({...formData, category: text})}
                  placeholder="Enter category"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>Sub Category</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.subCategory}
                  onChangeText={(text) => setFormData({...formData, subCategory: text})}
                  placeholder="Enter sub category"
                />
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Brand</Text>
              <TextInput
                style={styles.formInput}
                value={formData.brand}
                onChangeText={(text) => setFormData({...formData, brand: text})}
                placeholder="Enter brand"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Price *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.price}
                onChangeText={(text) => setFormData({...formData, price: text})}
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>GST Rate (%)</Text>
              <TextInput
                style={styles.formInput}
                value={formData.gstRate}
                onChangeText={(text) => setFormData({ ...formData, gstRate: text })}
                placeholder="18"
                keyboardType="numeric"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Product Details Modal */}
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
                    <Text style={styles.detailsValue}>₹{selectedProduct.price}</Text>
                  </View>

                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>GST Rate</Text>
                    <Text style={styles.detailsValue}>
                      {(selectedProduct.gstRate ?? DEFAULT_GST_RATE)}%
                    </Text>
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
                  
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Updated At</Text>
                    <Text style={styles.detailsValue}>
                      {new Date(selectedProduct.updatedAt).toLocaleDateString()} {new Date(selectedProduct.updatedAt).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
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
  header: {
    backgroundColor: '#8B5CF6',
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
  createButton: {
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
    backgroundColor: '#8B5CF6',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoryButtonTextSelected: {
    color: '#fff',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  sortLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
    borderRadius: 4,
  },
  sortButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  sortButtonSelected: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  sortOrderButton: {
    padding: 4,
    marginLeft: 'auto',
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
    backgroundColor: '#8B5CF6',
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
    color: '#8B5CF6',
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
  productGst: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
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
  stockLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 6,
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
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  productDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
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
    backgroundColor: '#8B5CF6',
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
    color: '#8B5CF6',
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
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  formLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 48, // Better touch target
    color: '#1F2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  disabledInput: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
    borderColor: '#E5E7EB',
  },
  
  // Product Details Modal Styles
  productCardContent: {
    flex: 1,
    flexDirection: 'row',
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

export default ProductCatalog;
