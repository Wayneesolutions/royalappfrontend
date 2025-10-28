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
      maximum: '',
    },
    isAvailable: true,
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
        const uniqueCategories = [...new Set(result.products?.map((p: Product) => p.category) || [])];
        setCategories(['all', ...uniqueCategories]);
        
        console.log('Admin ProductCatalog - Products loaded:', fetchedProducts.length);
      } else {
        console.log('Admin ProductCatalog - No products data received');
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
    try {
      setLoading(true);
      
      const productData = {
        productCode: formData.productCode,
        productName: formData.productName,
        description: formData.description,
        category: formData.category,
        subCategory: formData.subCategory,
        brand: formData.brand,
        unit: formData.unit,
        price: parseFloat(formData.price),
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
        mrp: formData.mrp ? parseFloat(formData.mrp) : undefined,
        discount: formData.discount ? parseFloat(formData.discount) : undefined,
        taxRate: formData.taxRate ? parseFloat(formData.taxRate) : undefined,
        stock: {
          current: formData.stock.current ? parseInt(formData.stock.current) : 0,
          minimum: formData.stock.minimum ? parseInt(formData.stock.minimum) : 0,
          maximum: formData.stock.maximum ? parseInt(formData.stock.maximum) : 1000,
        },
        isAvailable: formData.isAvailable,
        isActive: formData.isActive,
      };

      const result = await createProduct(productData);
      
      if (result?.success) {
        Alert.alert('Success', 'Product created successfully!');
        setShowCreateModal(false);
        resetForm();
        fetchProducts();
      } else {
        Alert.alert('Error', result?.message || 'Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      Alert.alert('Error', 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  // Handle product update
  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      setLoading(true);
      
      const updateData = {
        productName: formData.productName,
        description: formData.description,
        category: formData.category,
        subCategory: formData.subCategory,
        brand: formData.brand,
        unit: formData.unit,
        price: parseFloat(formData.price),
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
        mrp: formData.mrp ? parseFloat(formData.mrp) : undefined,
        discount: formData.discount ? parseFloat(formData.discount) : undefined,
        taxRate: formData.taxRate ? parseFloat(formData.taxRate) : undefined,
        stock: {
          current: formData.stock.current ? parseInt(formData.stock.current) : 0,
          minimum: formData.stock.minimum ? parseInt(formData.stock.minimum) : 0,
          maximum: formData.stock.maximum ? parseInt(formData.stock.maximum) : 1000,
        },
        isAvailable: formData.isAvailable,
        isActive: formData.isActive,
      };

      const result = await updateProduct(selectedProduct._id, updateData);
      
      if (result?.success) {
        Alert.alert('Success', 'Product updated successfully!');
        setShowEditModal(false);
        setSelectedProduct(null);
        resetForm();
        fetchProducts();
      } else {
        Alert.alert('Error', result?.message || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Error', 'Failed to update product');
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
      unit: 'piece',
      price: '',
      costPrice: '',
      mrp: '',
      discount: '',
      taxRate: '',
      stock: {
        current: '',
        minimum: '',
        maximum: '',
      },
      isAvailable: true,
      isActive: true,
    });
  };

  // Open edit modal
  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      productCode: product.productCode,
      productName: product.productName,
      description: product.description,
      category: product.category,
      subCategory: product.subCategory,
      brand: product.brand,
      unit: product.unit,
      price: product.price.toString(),
      costPrice: product.costPrice?.toString() || '',
      mrp: product.mrp?.toString() || '',
      discount: product.discount?.toString() || '',
      taxRate: product.taxRate?.toString() || '',
      stock: {
        current: product.stock.current.toString(),
        minimum: product.stock.minimum.toString(),
        maximum: product.stock.maximum.toString(),
      },
      isAvailable: product.isAvailable,
      isActive: product.isActive,
    });
    setShowEditModal(true);
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
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.isAvailable ? '#D1FAE5' : '#FEE2E2' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: item.isAvailable ? '#059669' : '#DC2626' }
            ]}>
              {item.isAvailable ? 'Available' : 'Unavailable'}
            </Text>
          </View>
        </View>
        
        {item.description && (
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>
      
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
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Product</Text>
            <TouchableOpacity onPress={handleCreateProduct} disabled={loading}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
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
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>Brand</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.brand}
                  onChangeText={(text) => setFormData({...formData, brand: text})}
                  placeholder="Enter brand"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>Unit *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.unit}
                  onChangeText={(text) => setFormData({...formData, unit: text})}
                  placeholder="piece, kg, liter, etc."
                />
              </View>
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>Price *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.price}
                  onChangeText={(text) => setFormData({...formData, price: text})}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>Cost Price</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.costPrice}
                  onChangeText={(text) => setFormData({...formData, costPrice: text})}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>MRP</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.mrp}
                  onChangeText={(text) => setFormData({...formData, mrp: text})}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>Discount %</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.discount}
                  onChangeText={(text) => setFormData({...formData, discount: text})}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tax Rate %</Text>
              <TextInput
                style={styles.formInput}
                value={formData.taxRate}
                onChangeText={(text) => setFormData({...formData, taxRate: text})}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>Current Stock</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.stock.current}
                  onChangeText={(text) => setFormData({...formData, stock: {...formData.stock, current: text}})}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>Minimum Stock</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.stock.minimum}
                  onChangeText={(text) => setFormData({...formData, stock: {...formData.stock, minimum: text}})}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Maximum Stock</Text>
              <TextInput
                style={styles.formInput}
                value={formData.stock.maximum}
                onChangeText={(text) => setFormData({...formData, stock: {...formData.stock, maximum: text}})}
                placeholder="1000"
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
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Product</Text>
            <TouchableOpacity onPress={handleUpdateProduct} disabled={loading}>
              <Text style={styles.modalSaveText}>Update</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
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
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>Brand</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.brand}
                  onChangeText={(text) => setFormData({...formData, brand: text})}
                  placeholder="Enter brand"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>Unit *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.unit}
                  onChangeText={(text) => setFormData({...formData, unit: text})}
                  placeholder="piece, kg, liter, etc."
                />
              </View>
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>Price *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.price}
                  onChangeText={(text) => setFormData({...formData, price: text})}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>Cost Price</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.costPrice}
                  onChangeText={(text) => setFormData({...formData, costPrice: text})}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>MRP</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.mrp}
                  onChangeText={(text) => setFormData({...formData, mrp: text})}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>Discount %</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.discount}
                  onChangeText={(text) => setFormData({...formData, discount: text})}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tax Rate %</Text>
              <TextInput
                style={styles.formInput}
                value={formData.taxRate}
                onChangeText={(text) => setFormData({...formData, taxRate: text})}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.formLabel}>Current Stock</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.stock.current}
                  onChangeText={(text) => setFormData({...formData, stock: {...formData.stock, current: text}})}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.formLabel}>Minimum Stock</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.stock.minimum}
                  onChangeText={(text) => setFormData({...formData, stock: {...formData.stock, minimum: text}})}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Maximum Stock</Text>
              <TextInput
                style={styles.formInput}
                value={formData.stock.maximum}
                onChangeText={(text) => setFormData({...formData, stock: {...formData.stock, maximum: text}})}
                placeholder="1000"
                keyboardType="numeric"
              />
            </View>
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
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalSaveText: {
    fontSize: 16,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  disabledInput: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
  },
});

export default ProductCatalog;
