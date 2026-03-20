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
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../../context/AuthContext";
import { useNavigation } from "@react-navigation/native";

interface Product {
  _id: string;
  productCode: string;
  name: string;
  productName: string;
  description?: string;
  category: string;
  subCategory?: string;
  brand?: string;
  partNo?: string;
  itemAlias?: string;
  parent?: string;
  baseUnits?: string;
  additionalUnits?: string;
  stdPurcRate?: number;
  stdSaleRate?: number;
  price?: number;
  stock?: number | {
    current?: number;
    minimum?: number;
    maximum?: number;
  };
  itemGstPer?: number;
  gstRate?: number;
  itemHsn?: string;
  itemHsnDesc?: string;
  openingBalance?: number;
  itemOpRate?: number;
  companyCode?: string;
  isFinishItem?: boolean;
  isActive?: boolean;
  other1?: string;
  other2?: string;
  other3?: string;
  other4?: string;
  other5?: string;
  createdAt?: string;
  updatedAt?: string;
}

type ProductFormState = {
  productCode: string;
  name: string;
  productName: string;
  partNo: string;
  itemAlias: string;
  description: string;
  parent: string;
  category: string;
  subCategory: string;
  brand: string;
  baseUnits: string;
  additionalUnits: string;
  stdPurcRate: string;
  stdSaleRate: string;
  price: string;
  itemGstPer: string;
  gstRate: string;
  itemHsn: string;
  itemHsnDesc: string;
  openingBalance: string;
  itemOpRate: string;
  companyCode: string;
  isFinishItem: boolean;
  isActive: boolean;
  other1: string;
  other2: string;
  other3: string;
  other4: string;
  other5: string;
};

const emptyFormState = (): ProductFormState => ({
  productCode: "",
  name: "",
  productName: "",
  partNo: "",
  itemAlias: "",
  description: "",
  parent: "",
  category: "",
  subCategory: "",
  brand: "",
  baseUnits: "",
  additionalUnits: "",
  stdPurcRate: "",
  stdSaleRate: "",
  price: "",
  itemGstPer: "",
  gstRate: "",
  itemHsn: "",
  itemHsnDesc: "",
  openingBalance: "",
  itemOpRate: "",
  companyCode: "",
  isFinishItem: false,
  isActive: true,
  other1: "",
  other2: "",
  other3: "",
  other4: "",
  other5: "",
});

const ProductManagement = () => {
  const { 
    user,
    getProducts, 
    createProduct, 
    updateProduct, 
    deleteProduct,
    getProductCategories
  } = useAuth();
  const navigation = useNavigation();
  
  // Check if user can create products (admin can, zonal, rsm and asm cannot)
  const canCreateProduct = user?.role !== 'zonal' && user?.role !== 'rsm' && user?.role !== 'asm';

  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filter and search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form states
  const [formData, setFormData] = useState<ProductFormState>(emptyFormState());

  const derivedSelectedProduct = selectedProduct
    ? {
        priceValue:
          selectedProduct.price ??
          selectedProduct.stdSaleRate ??
          selectedProduct.stdPurcRate ??
          0,
        createdAtLabel: selectedProduct.createdAt
          ? new Date(selectedProduct.createdAt).toLocaleString()
          : undefined,
        updatedAtLabel: selectedProduct.updatedAt
          ? new Date(selectedProduct.updatedAt).toLocaleString()
          : undefined,
      }
    : null;

  const updateFormValue = (
    field: keyof ProductFormState,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatCurrency = (value?: number | null) => {
    if (value === undefined || value === null || Number.isNaN(Number(value))) {
      return '0.00';
    }
    return Number(value).toFixed(2);
  };

  const DetailRow = ({
    label,
    value,
  }: {
    label: string;
    value?: string | number | boolean | null;
  }) => {
    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {
      return null;
    }
    const displayValue =
      typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value;
    return (
      <View style={styles.detailsRow}>
        <Text style={styles.detailsLabel}>{label}</Text>
        <Text style={styles.detailsValue}>{displayValue}</Text>
      </View>
    );
  };

  const toNumber = (value: string) => {
    if (value === undefined || value === null || value.trim() === '') {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const toInteger = (value: string) => {
    if (value === undefined || value === null || value.trim() === '') {
      return undefined;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

const toTrimmed = (value: string) => {
  if (value === undefined || value === null) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};


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
    setFormData(emptyFormState());
  };

  // Create product
  const handleCreateProduct = async () => {
    const productCode = toTrimmed(formData.productCode);
    const resolvedName = toTrimmed(formData.name) || toTrimmed(formData.productName);
    const resolvedCategory = toTrimmed(formData.category);
    const resolvedPrice = toNumber(formData.price);

    if (!resolvedName || !resolvedCategory) {
      Alert.alert(
        'Validation Error',
        'Product Name, and Category are required.',
      );
      return;
    }

    if (resolvedPrice === undefined || resolvedPrice <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid price greater than 0.');
      return;
    }

    try {
      setLoading(true);
      
      const productData: Record<string, any> = {
        productCode: productCode || undefined,
        name: resolvedName,
        productName: toTrimmed(formData.productName) || resolvedName,
        partNo: toTrimmed(formData.partNo),
        itemAlias: toTrimmed(formData.itemAlias),
        description: toTrimmed(formData.description),
        parent: toTrimmed(formData.parent),
        category: resolvedCategory,
        subCategory: toTrimmed(formData.subCategory),
        brand: toTrimmed(formData.brand),
        baseUnits: toTrimmed(formData.baseUnits),
        additionalUnits: toTrimmed(formData.additionalUnits),
        stdPurcRate: toNumber(formData.stdPurcRate),
        stdSaleRate: toNumber(formData.stdSaleRate),
        price: resolvedPrice,
        itemGstPer: toNumber(formData.itemGstPer),
        gstRate: toNumber(formData.gstRate),
        itemHsn: toTrimmed(formData.itemHsn),
        itemHsnDesc: toTrimmed(formData.itemHsnDesc),
        openingBalance: toNumber(formData.openingBalance),
        itemOpRate: toNumber(formData.itemOpRate),
        companyCode: toTrimmed(formData.companyCode),
        isFinishItem: formData.isFinishItem,
        isActive: formData.isActive,
        other1: toTrimmed(formData.other1),
        other2: toTrimmed(formData.other2),
        other3: toTrimmed(formData.other3),
        other4: toTrimmed(formData.other4),
        other5: toTrimmed(formData.other5),
      };

      Object.keys(productData).forEach((key) => {
        if (productData[key] === undefined) {
          delete productData[key];
        }
      });

      const response = await createProduct(productData);
      if (response?.success) {
        const productLabel =
          response.product?.name ||
          response.product?.productName ||
          resolvedName;
        // Success: Close modal, reset form, and refresh product list immediately
        console.log('✅ Success! Closing modal and refreshing product list...');
        setShowCreateModal(false);
        resetForm();
        fetchData();
        
        // Show success message after modal is closed
        Alert.alert(
          'Success', 
          `Product "${productLabel}" created successfully!`,
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

    const productCode = toTrimmed(formData.productCode);
    const resolvedName = toTrimmed(formData.name) || toTrimmed(formData.productName);
    const resolvedCategory = toTrimmed(formData.category);
    const resolvedPrice = toNumber(formData.price);

    if (!resolvedName || !resolvedCategory) {
      Alert.alert(
        'Validation Error',
        'Product Name, and Category are required.',
      );
      return;
    }

    if (resolvedPrice === undefined || resolvedPrice <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid price greater than 0.');
      return;
    }

    try {
      setLoading(true);
      
      const updateData: Record<string, any> = {
        productCode: productCode || undefined,
        name: resolvedName,
        productName: toTrimmed(formData.productName) || resolvedName,
        partNo: toTrimmed(formData.partNo),
        itemAlias: toTrimmed(formData.itemAlias),
        description: toTrimmed(formData.description),
        parent: toTrimmed(formData.parent),
        category: resolvedCategory,
        subCategory: toTrimmed(formData.subCategory),
        brand: toTrimmed(formData.brand),
        baseUnits: toTrimmed(formData.baseUnits),
        additionalUnits: toTrimmed(formData.additionalUnits),
        stdPurcRate: toNumber(formData.stdPurcRate),
        stdSaleRate: toNumber(formData.stdSaleRate),
        price: resolvedPrice,
        itemGstPer: toNumber(formData.itemGstPer),
        gstRate: toNumber(formData.gstRate),
        itemHsn: toTrimmed(formData.itemHsn),
        itemHsnDesc: toTrimmed(formData.itemHsnDesc),
        openingBalance: toNumber(formData.openingBalance),
        itemOpRate: toNumber(formData.itemOpRate),
        companyCode: toTrimmed(formData.companyCode),
        isFinishItem: formData.isFinishItem,
        isActive: formData.isActive,
        other1: toTrimmed(formData.other1),
        other2: toTrimmed(formData.other2),
        other3: toTrimmed(formData.other3),
        other4: toTrimmed(formData.other4),
        other5: toTrimmed(formData.other5),
      };

      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const response = await updateProduct(selectedProduct._id, updateData);
      if (response?.success) {
        const productLabel =
          response.product?.name ||
          response.product?.productName ||
          resolvedName;
        // Success: Close modal, reset form, and refresh product list immediately
        console.log('✅ Update Success! Closing modal and refreshing product list...');
        setShowEditModal(false);
        setSelectedProduct(null);
        resetForm();
        fetchData();
        
        // Show success message after modal is closed
        Alert.alert(
          'Success', 
          `Product "${productLabel}" updated successfully!`,
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
      productCode: product.productCode || '',
      name: product.name || product.productName || '',
      productName: product.productName || '',
      partNo: product.partNo || '',
      itemAlias: product.itemAlias || '',
      description: product.description || '',
      parent: product.parent || '',
      category: product.category || '',
      subCategory: product.subCategory || '',
      brand: product.brand || '',
      baseUnits: product.baseUnits || '',
      additionalUnits: product.additionalUnits || '',
      stdPurcRate: product.stdPurcRate?.toString() || '',
      stdSaleRate: product.stdSaleRate?.toString() || '',
      price: (product.price ?? product.stdSaleRate ?? 0).toString(),
      itemGstPer: product.itemGstPer?.toString() || '',
      gstRate: product.gstRate?.toString() || '',
      itemHsn: product.itemHsn || '',
      itemHsnDesc: product.itemHsnDesc || '',
      openingBalance: product.openingBalance?.toString() || '',
      itemOpRate: product.itemOpRate?.toString() || '',
      companyCode: product.companyCode || '',
      isFinishItem: Boolean(product.isFinishItem),
      isActive: product.isActive !== undefined ? product.isActive : true,
      other1: product.other1 || '',
      other2: product.other2 || '',
      other3: product.other3 || '',
      other4: product.other4 || '',
      other5: product.other5 || '',
    });
    setShowEditModal(true);
  };

  // Open product details modal
  const openDetailsModal = (product: Product) => {
    setSelectedProduct(product);
    setShowDetailsModal(true);
  };

  // Render product item
  const renderProductItem = ({ item }: { item: Product }) => {
    const priceValue = item.price ?? item.stdSaleRate ?? item.stdPurcRate ?? 0;
    const unitLabel = item.baseUnits || item.additionalUnits || 'units';

    return (
    <View style={styles.productCard}>
      <TouchableOpacity 
        style={styles.productCardContent}
        onPress={() => openDetailsModal(item)}
        activeOpacity={0.7}
      >
        <View style={styles.productHeader}>
          <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.productName || item.name}</Text>
            <Text style={styles.productCode}>{item.productCode}</Text>
            <Text style={styles.productCategory}>{item.category}</Text>
          </View>
          <View style={styles.productPrice}>
              <Text style={styles.priceText}>₹{formatCurrency(priceValue)}</Text>
              <Text style={styles.unitText}>/{unitLabel}</Text>
          </View>
        </View>

        <View style={styles.productDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Finish Item:</Text>
            <Text style={styles.detailValue}>
              {item.isFinishItem ? 'Yes' : 'No'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
              <View
                style={[
              styles.statusBadge,
                  { backgroundColor: item.isActive ? '#10B981' : '#EF4444' },
                ]}
              >
              <Text style={styles.statusText}>
                  {item.isActive ? 'Active' : 'Inactive'}
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
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteProduct(item)}
        >
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  };

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
          <Text style={styles.sectionTitle}>Basic Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Product Code</Text>
              <TextInput
                style={styles.input}
                value={formData.productCode}
              onChangeText={(text) => updateFormValue('productCode', text)}
                placeholder="Enter product code"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Product Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.productName}
              onChangeText={(text) => {
                updateFormValue('productName', text);
                if (!formData.name) {
                  updateFormValue('name', text);
                }
              }}
                placeholder="Enter product name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Internal Name</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => updateFormValue('name', text)}
              placeholder="Optional internal reference name"
              placeholderTextColor="#9CA3AF"
            />
          </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
              onChangeText={(text) => updateFormValue('description', text)}
                placeholder="Enter product description"
                multiline
                numberOfLines={3}
                placeholderTextColor="#9CA3AF"
              />
            </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Part Number</Text>
              <TextInput
                style={styles.input}
                value={formData.partNo}
                onChangeText={(text) => updateFormValue('partNo', text)}
                placeholder="Enter part number"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Item Alias</Text>
              <TextInput
                style={styles.input}
                value={formData.itemAlias}
                onChangeText={(text) => updateFormValue('itemAlias', text)}
                placeholder="Enter alias"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Classification</Text>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Category *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.category}
                onChangeText={(text) => updateFormValue('category', text)}
                  placeholder="Enter category"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Sub Category</Text>
                <TextInput
                  style={styles.input}
                  value={formData.subCategory}
                onChangeText={(text) => updateFormValue('subCategory', text)}
                  placeholder="Enter sub category"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Brand</Text>
              <TextInput
                style={styles.input}
                value={formData.brand}
                onChangeText={(text) => updateFormValue('brand', text)}
                placeholder="Enter brand"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Parent Category</Text>
              <TextInput
                style={styles.input}
                value={formData.parent}
                onChangeText={(text) => updateFormValue('parent', text)}
                placeholder="Enter parent"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            </View>

          <Text style={styles.sectionTitle}>Units & Pricing</Text>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Base Units</Text>
                <TextInput
                  style={styles.input}
                value={formData.baseUnits}
                onChangeText={(text) => updateFormValue('baseUnits', text)}
                placeholder="e.g. pcs, ltr"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Additional Units</Text>
                <TextInput
                  style={styles.input}
                value={formData.additionalUnits}
                onChangeText={(text) => updateFormValue('additionalUnits', text)}
                placeholder="Optional"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Std Purchase Rate</Text>
                <TextInput
                  style={styles.input}
                value={formData.stdPurcRate}
                onChangeText={(text) => updateFormValue('stdPurcRate', text)}
                  placeholder="0.00"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Std Sale Rate</Text>
                <TextInput
                  style={styles.input}
                value={formData.stdSaleRate}
                onChangeText={(text) => updateFormValue('stdSaleRate', text)}
                  placeholder="0.00"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Price *</Text>
              <TextInput
                style={styles.input}
                value={formData.price}
                onChangeText={(text) => updateFormValue('price', text)}
                placeholder="0.00"
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>

          <Text style={styles.sectionTitle}>Tax & Compliance</Text>
            
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>GST Rate (%)</Text>
                <TextInput
                  style={styles.input}
                value={formData.gstRate}
                onChangeText={(text) => updateFormValue('gstRate', text)}
                placeholder="18"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Item GST (%)</Text>
                <TextInput
                  style={styles.input}
                value={formData.itemGstPer}
                onChangeText={(text) => updateFormValue('itemGstPer', text)}
                placeholder="18"
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>HSN Code</Text>
              <TextInput
                style={styles.input}
                value={formData.itemHsn}
                onChangeText={(text) => updateFormValue('itemHsn', text)}
                placeholder="Enter HSN"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>HSN Description</Text>
              <TextInput
                style={styles.input}
                value={formData.itemHsnDesc}
                onChangeText={(text) => updateFormValue('itemHsnDesc', text)}
                placeholder="Enter description"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Inventory Details</Text>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Opening Balance</Text>
              <TextInput
                style={styles.input}
                value={formData.openingBalance}
                onChangeText={(text) => updateFormValue('openingBalance', text)}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Opening Rate</Text>
              <TextInput
                style={styles.input}
                value={formData.itemOpRate}
                onChangeText={(text) => updateFormValue('itemOpRate', text)}
                placeholder="0.00"
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            </View>

          <Text style={styles.sectionTitle}>Status & Metadata</Text>

            <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Company Code Override</Text>
              <TextInput
                style={styles.input}
              value={formData.companyCode}
              onChangeText={(text) => updateFormValue('companyCode', text)}
              placeholder="Optional company code"
                placeholderTextColor="#9CA3AF"
              />
            </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Finish Item</Text>
            <Switch
              value={formData.isFinishItem}
              onValueChange={(value) => updateFormValue('isFinishItem', value)}
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Active</Text>
            <Switch
              value={formData.isActive}
              onValueChange={(value) => updateFormValue('isActive', value)}
            />
          </View>

          <Text style={styles.sectionTitle}>Custom Attributes</Text>

          {(['other1', 'other2', 'other3', 'other4', 'other5'] as Array<
            keyof Pick<ProductFormState, 'other1' | 'other2' | 'other3' | 'other4' | 'other5'>
          >).map((field) => (
            <View style={styles.inputGroup} key={field}>
              <Text style={styles.inputLabel}>{field.toUpperCase()}</Text>
              <TextInput
                style={styles.input}
                value={formData[field]}
                onChangeText={(text) => updateFormValue(field, text)}
                placeholder="Enter value"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          ))}
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
          {selectedProduct && derivedSelectedProduct && (
            <>
              <View style={styles.detailsImageContainer}>
                <View style={styles.detailsImagePlaceholder}>
                  <Ionicons name="cube" size={64} color="#6B7280" />
                </View>
              </View>

              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Basic Information</Text>
                <DetailRow
                  label="Product Name"
                  value={selectedProduct.productName || selectedProduct.name}
                />
                <DetailRow
                  label="Internal Name"
                  value={selectedProduct.name}
                />
                <DetailRow
                  label="Product Code"
                  value={selectedProduct.productCode}
                />
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Description</Text>
                  <Text style={styles.detailsValue}>
                    {selectedProduct.description || 'No description'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Classification</Text>
                <DetailRow label="Category" value={selectedProduct.category} />
                <DetailRow
                  label="Sub Category"
                  value={selectedProduct.subCategory}
                />
                <DetailRow label="Brand" value={selectedProduct.brand} />
                <DetailRow label="Parent" value={selectedProduct.parent} />
                </View>
                
              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Units & Pricing</Text>
                <DetailRow
                  label="Base Units"
                  value={selectedProduct.baseUnits}
                />
                <DetailRow
                  label="Additional Units"
                  value={selectedProduct.additionalUnits}
                />
                <DetailRow
                  label="Std Purchase Rate"
                  value={
                    selectedProduct.stdPurcRate !== undefined
                      ? `₹${formatCurrency(selectedProduct.stdPurcRate)}`
                      : undefined
                  }
                />
                <DetailRow
                  label="Std Sale Rate"
                  value={
                    selectedProduct.stdSaleRate !== undefined
                      ? `₹${formatCurrency(selectedProduct.stdSaleRate)}`
                      : undefined
                  }
                />
                <DetailRow
                  label="Price"
                  value={`₹${formatCurrency(derivedSelectedProduct.priceValue)} / ${selectedProduct.baseUnits || 'units'}`}
                />
                </View>
                
              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Tax & Compliance</Text>
                <DetailRow
                  label="GST Rate (%)"
                  value={selectedProduct.gstRate}
                />
                <DetailRow
                  label="Item GST (%)"
                  value={selectedProduct.itemGstPer}
                />
                <DetailRow label="HSN Code" value={selectedProduct.itemHsn} />
                <DetailRow
                  label="HSN Description"
                  value={selectedProduct.itemHsnDesc}
                />
                </View>
                
              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Inventory</Text>
                <DetailRow
                  label="Opening Balance"
                  value={selectedProduct.openingBalance}
                />
                <DetailRow
                  label="Opening Rate"
                  value={
                    selectedProduct.itemOpRate !== undefined
                      ? `₹${formatCurrency(selectedProduct.itemOpRate)}`
                      : undefined
                  }
                />
                <DetailRow
                  label="Finish Item"
                  value={selectedProduct.isFinishItem}
                />
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Active Status</Text>
                  <View
                    style={[
                    styles.detailsBadge,
                      {
                        backgroundColor: selectedProduct.isActive
                          ? '#D1FAE5'
                          : '#FEE2E2',
                      },
                    ]}
                  >
                    <Text
                      style={[
                      styles.detailsBadgeText,
                        {
                          color: selectedProduct.isActive
                            ? '#059669'
                            : '#DC2626',
                        },
                      ]}
                    >
                      {selectedProduct.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Metadata</Text>
                <DetailRow
                  label="Company Code"
                  value={selectedProduct.companyCode}
                />
                {(['other1', 'other2', 'other3', 'other4', 'other5'] as Array<
                  keyof Pick<Product, 'other1' | 'other2' | 'other3' | 'other4' | 'other5'>
                >).map((field) => (
                  <DetailRow
                    key={field}
                    label={field.toUpperCase()}
                    value={selectedProduct[field]}
                  />
                ))}
                <DetailRow
                  label="Created At"
                  value={derivedSelectedProduct.createdAtLabel}
                />
                <DetailRow
                  label="Updated At"
                  value={derivedSelectedProduct.updatedAtLabel}
                />
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
        {canCreateProduct && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        )}
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
        data={products}
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
              No products found matching your criteria
            </Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />

      {/* Modals */}
      {renderProductModal(false)}
      {renderProductModal(true)}
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
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
