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

const ProductCatalog = () => {
  const navigation = useNavigation();
  const { user, getProducts } = useAuth();
  
  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'category'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getProducts({
        page: 1,
        limit: 100,
        search: searchQuery,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
      });
      
      if (result?.success && result.products) {
        let fetchedProducts = result.products || [];
        
        // Sort products
        fetchedProducts = sortProducts(fetchedProducts, sortBy, sortOrder);
        
        setProducts(fetchedProducts);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(result.products?.map((p: Product) => p.category) || [])];
        setCategories(['all', ...uniqueCategories]);
      } else {
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

  // Handle product selection
  const handleProductSelect = (product: Product) => {
    Alert.alert(
      'Product Selected',
      `You selected: ${product.productName}\nPrice: ₹${product.price}\nStock: ${product.stock.current} ${product.unit}`,
      [
        { text: 'OK', style: 'default' },
        { 
          text: 'Create Order', 
          style: 'default',
          onPress: () => {
            navigation.navigate('CreateOrder', { selectedProduct: product });
          }
        }
      ]
    );
  };

  // Render product item
  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleProductSelect(item)}
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
        
        {item.description && (
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>
      
      <View style={styles.productActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleProductSelect(item)}
        >
          <Ionicons name="eye" size={20} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            navigation.navigate('CreateOrder', { selectedProduct: item });
          }}
        >
          <Ionicons name="add-circle" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Product Catalog</Text>
        <TouchableOpacity
          style={styles.createOrderButton}
          onPress={() => navigation.navigate('ProductManagement')}
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
  createOrderButton: {
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
    color: '#EF4444',
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
});

export default ProductCatalog;
