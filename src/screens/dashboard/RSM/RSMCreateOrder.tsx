import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import {
  DEFAULT_GST_RATE,
  computeGstBreakdown,
  determineGstType,
  extractState,
  GstType,
} from '../../../utils/gst';

const MODE_OPTIONS = ['Cash', 'Cheque', 'Bank Transfer', 'UPI', 'Credit Card', 'Other'];

interface Dealer {
  _id: string;
  name: string;
  email?: string;
  mobile: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
}

interface SubDealer {
  _id: string;
  name: string;
  email?: string;
  mobile: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  dealerId: string;
}

interface Product {
  _id: string;
  productCode: string;
  productName: string;
  name?: string;
  description?: string;
  partNo?: string;
  itemAlias?: string;
  parent?: string;
  category?: string;
  subCategory?: string;
  brand?: string;
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
  unit?: string;
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

interface OrderItem {
  productId: string;
  productCode: string;
  productName: string;
  partNo?: string;
  itemAlias?: string;
  category?: string;
  subCategory?: string;
  brand?: string;
  itemHsn?: string;
  itemHsnDesc?: string;
  description?: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  gstRate: number;
  taxType: GstType;
  taxableValue: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTaxAmount: number;
  totalAmount: number;
  availableStock: number;
  baseUnits?: string;
  additionalUnits?: string;
}

interface ProductSelectionState {
  quantity: string;
  validating: boolean;
  isValid: boolean;
  availableStock: number;
  error?: string;
  adding: boolean;
  lastValidatedQuantity?: number;
  productData?: Product;
}

const DEFAULT_UNIT_LABEL = 'units';

const getStockNumber = (stock: Product['stock']): number => {
  if (typeof stock === 'number') {
    return stock;
  }

  if (stock && typeof stock.current === 'number') {
    return stock.current;
  }

  return 0;
};

const getUnitLabel = (unit?: string): string => {
  if (unit && unit.trim().length > 0) {
    return unit;
  }

  return DEFAULT_UNIT_LABEL;
};

const getProductUnitLabel = (product?: Product, fallbackUnit?: string): string =>
  product?.baseUnits ||
  product?.unit ||
  product?.additionalUnits ||
  fallbackUnit ||
  DEFAULT_UNIT_LABEL;

const coerceNumber = (value: any): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

const normalizeProduct = (raw: any): Product => {
  const stockValue =
    raw?.stock ??
    raw?.availableStock ??
    raw?.currentStock ??
    (typeof raw?.stock === 'number' ? raw.stock : undefined);

  return {
    _id: raw?._id ?? raw?.id ?? '',
    productCode: raw?.productCode ?? '',
    productName: raw?.productName ?? raw?.name ?? '',
    name: raw?.name,
    description: raw?.description,
    partNo: raw?.partNo,
    itemAlias: raw?.itemAlias,
    parent: raw?.parent,
    category: raw?.category,
    subCategory: raw?.subCategory,
    brand: raw?.brand,
    baseUnits: raw?.baseUnits,
    additionalUnits: raw?.additionalUnits,
    stdPurcRate: coerceNumber(raw?.stdPurcRate),
    stdSaleRate: coerceNumber(raw?.stdSaleRate),
    price: coerceNumber(raw?.price),
    stock:
      typeof stockValue === 'object' || typeof stockValue === 'number'
        ? stockValue
        : coerceNumber(stockValue),
    itemGstPer: coerceNumber(raw?.itemGstPer),
    gstRate: coerceNumber(raw?.gstRate),
    itemHsn: raw?.itemHsn,
    itemHsnDesc: raw?.itemHsnDesc,
    openingBalance: coerceNumber(raw?.openingBalance),
    itemOpRate: coerceNumber(raw?.itemOpRate),
    companyCode: raw?.companyCode,
    unit: raw?.unit,
    isFinishItem: raw?.isFinishItem,
    isActive: raw?.isActive,
    other1: raw?.other1,
    other2: raw?.other2,
    other3: raw?.other3,
    other4: raw?.other4,
    other5: raw?.other5,
    createdAt: raw?.createdAt,
    updatedAt: raw?.updatedAt,
  };
};

const getProductPrice = (product?: Product): number => {
  const candidates = [
    product?.stdSaleRate,
    product?.price,
    product?.stdPurcRate,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate;
    }
  }
  return 0;
};

const getProductGstRate = (product?: Product): number =>
  (typeof product?.itemGstPer === 'number' ? product.itemGstPer : undefined) ??
  (typeof product?.gstRate === 'number' ? product.gstRate : undefined) ??
  DEFAULT_GST_RATE;

const getProductName = (product?: Product): string =>
  (product?.name || product?.productName || '').trim();

const getProductPartNo = (product?: Product): string =>
  product?.partNo || product?.itemAlias || '';

const getProductHsn = (product?: Product): string => product?.itemHsn || '';

const getProductCategory = (product?: Product): string =>
  product?.category || 'General';

const formatCurrency = (value: number) => `₹${value.toFixed(2)}`;

const RSMCreateOrder = () => {
  const navigation = useNavigation();
  const { user, getUsersByRole, getSubDealersByDealer, getProducts, getProductById, createOrder } = useAuth();
  
  // Helper function to format address object to string
  const formatAddress = (address?: { street?: string; city?: string; state?: string; pincode?: string; country?: string }) => {
    if (!address) return 'Address not specified';
    
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.pincode) parts.push(address.pincode);
    if (address.country) parts.push(address.country);
    
    return parts.length > 0 ? parts.join(', ') : 'Address not specified';
  };

  const normalizeAddress = (
    address?: { street?: string; city?: string; state?: string; pincode?: string; country?: string }
  ) => ({
    street: address?.street || '',
    city: address?.city || '',
    state: address?.state || '',
    pincode: address?.pincode || '',
    country: address?.country || 'India',
  });
  
  // State for dropdowns
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [subDealers, setSubDealers] = useState<SubDealer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // State for selected values
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);
  const [selectedSubDealer, setSelectedSubDealer] = useState<SubDealer | null>(null);
  
  // State for dropdown visibility
  const [showDealerDropdown, setShowDealerDropdown] = useState(false);
  const [showSubDealerDropdown, setShowSubDealerDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  
  // State for order items
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [productSelections, setProductSelections] = useState<Record<string, ProductSelectionState>>({});
  const [bulkAdding, setBulkAdding] = useState(false);
  
  // State for loading
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // State for order details
  const [orderNotes, setOrderNotes] = useState('');
  const [mode, setMode] = useState('');
  const [customMode, setCustomMode] = useState('');
  const [termsOfPayment, setTermsOfPayment] = useState('');
  const [otherReference, setOtherReference] = useState('');
  const [termsOfDelivery1, setTermsOfDelivery1] = useState('');
  const [termsOfDelivery2, setTermsOfDelivery2] = useState('');

  const deriveSellerState = useCallback(() => {
    if (!user) {
      return '';
    }

    const defaultCompany =
      (user as any)?.defaultCompany ??
      (user as any)?.userDetails?.defaultCompany;

    if (!defaultCompany || typeof defaultCompany === 'string') {
      return '';
    }

    return (
      extractState(defaultCompany.companyState) ||
      extractState(defaultCompany?.contactDetails?.address?.state)
    );
  }, [user]);

  const sellerState = useMemo(() => deriveSellerState(), [deriveSellerState]);

  const buyerState = useMemo(() => {
    if (selectedSubDealer?.address?.state) {
      return extractState(selectedSubDealer.address.state);
    }
    if (selectedDealer?.address?.state) {
      return extractState(selectedDealer.address.state);
    }
    return '';
  }, [selectedDealer, selectedSubDealer]);

  const gstType = useMemo(
    () => determineGstType(sellerState, buyerState),
    [sellerState, buyerState]
  );

  const applyGstToItems = useCallback(
    (items: OrderItem[], type: GstType): OrderItem[] =>
      items.map((item) => {
        const tax = computeGstBreakdown({
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discount ?? 0,
          gstRate: item.gstRate ?? DEFAULT_GST_RATE,
          gstType: type,
        });

        return {
          ...item,
          discount: item.discount ?? 0,
          gstRate: tax.gstRate,
          taxType: type,
          taxableValue: tax.taxableValue,
          cgstRate: tax.cgstRate,
          cgstAmount: tax.cgstAmount,
          sgstRate: tax.sgstRate,
          sgstAmount: tax.sgstAmount,
          igstRate: tax.igstRate,
          igstAmount: tax.igstAmount,
          totalTaxAmount: tax.totalTaxAmount,
          totalAmount: tax.lineTotal,
        };
      }),
    []
  );

  const calculateOrderSummary = useCallback(
    (items: OrderItem[]) =>
      items.reduce(
        (acc, item) => {
          acc.totalQuantity += item.quantity;
          acc.grossAmount += item.unitPrice * item.quantity;
          acc.taxableValue += item.taxableValue || 0;
          acc.cgstTotal += item.cgstAmount || 0;
          acc.sgstTotal += item.sgstAmount || 0;
          acc.igstTotal += item.igstAmount || 0;
          acc.taxTotal += item.totalTaxAmount || 0;
          acc.totalAmount += item.totalAmount || 0;
          return acc;
        },
        {
          totalQuantity: 0,
          grossAmount: 0,
          taxableValue: 0,
          cgstTotal: 0,
          sgstTotal: 0,
          igstTotal: 0,
          taxTotal: 0,
          totalAmount: 0,
        }
      ),
    []
  );

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    setOrderItems((prev) => applyGstToItems(prev, gstType));
  }, [gstType, applyGstToItems]);

  const orderSummary = useMemo(
    () => calculateOrderSummary(orderItems),
    [orderItems, calculateOrderSummary]
  );

  const hasCgst = orderSummary.cgstTotal > 0.0001;
  const hasSgst = orderSummary.sgstTotal > 0.0001;
  const hasIgst = orderSummary.igstTotal > 0.0001;
  const gstTypeLabel =
    gstType === 'INTRA_STATE'
      ? 'Intra-state (CGST + SGST/UTGST)'
      : gstType === 'INTER_STATE'
        ? 'Inter-state (IGST)'
        : 'GST type unavailable';

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch dealers
      console.log('🔍 Fetching dealers...');
      const dealersResponse = await getUsersByRole('dealers');
      console.log('📡 Dealers response:', dealersResponse);
      
      // Handle different response formats
      if (Array.isArray(dealersResponse)) {
        // Direct array response
        setDealers(dealersResponse);
        console.log('✅ Dealers loaded (direct array):', dealersResponse.length);
      } else if (dealersResponse?.success) {
        // Response with success field - check for nested data.users structure
        const dealersData = dealersResponse.data?.users || dealersResponse.data || dealersResponse.users || [];
        setDealers(Array.isArray(dealersData) ? dealersData : []);
        console.log('✅ Dealers loaded (wrapped with success):', Array.isArray(dealersData) ? dealersData.length : 0);
      } else if (dealersResponse?.users && Array.isArray(dealersResponse.users)) {
        // Response structure: {users: [...], role: 'dealers', count: 1}
        setDealers(dealersResponse.users);
        console.log('✅ Dealers loaded (users field):', dealersResponse.users.length);
      } else {
        console.log('❌ Failed to load dealers:', dealersResponse?.message || 'Unknown error');
        Alert.alert('Error', 'Failed to load dealers: ' + (dealersResponse?.message || 'Unknown error'));
        setDealers([]);
      }
      
      // Don't fetch all subdealers initially - fetch them when dealer is selected
      setSubDealers([]);
      
      // Fetch products
      console.log('🔍 Fetching products...');
      const productsResponse = await getProducts();
      console.log('📡 Products response:', productsResponse);

      let productList: any[] = [];
      if (Array.isArray(productsResponse)) {
        productList = productsResponse;
      } else if (Array.isArray(productsResponse?.products)) {
        productList = productsResponse.products;
      } else if (Array.isArray(productsResponse?.data?.products)) {
        productList = productsResponse.data.products;
      } else if (productsResponse?.success) {
        const nested =
          productsResponse.data?.products ||
          productsResponse.data?.docs ||
          productsResponse.data?.results ||
          productsResponse.products ||
          productsResponse.data;
        if (Array.isArray(nested)) {
          productList = nested;
        }
      }

      const normalizedProducts = productList.map(normalizeProduct);
      setProducts(normalizedProducts);
      console.log('✅ Products loaded:', normalizedProducts.length);
    } catch (error) {
      console.error('❌ Error fetching initial data:', error);
      Alert.alert('Error', 'Failed to load data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDealerSelect = async (dealer: Dealer) => {
    console.log('🎯 Dealer selected:', dealer);
    setSelectedDealer(dealer);
    setSelectedSubDealer(null); // Reset sub dealer selection
    setShowDealerDropdown(false);
    
    // Fetch subdealers for this specific dealer
    try {
      console.log('🔍 Fetching subdealers for dealer:', dealer._id);
      const response = await getSubDealersByDealer(dealer._id);
      console.log('📡 Subdealers response:', response);
      
      if (response?.success && response.data?.subdealers) {
        const subdealers = response.data.subdealers || [];
        setSubDealers(subdealers);
        console.log('✅ Subdealers loaded for dealer:', subdealers.length);
      } else {
        console.log('ℹ️ No subdealers found for this dealer');
        setSubDealers([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch subdealers:', error);
      setSubDealers([]);
    }
  };

  const handleSubDealerSelect = (subDealer: SubDealer) => {
    console.log('🎯 Sub dealer selected:', subDealer);
    setSelectedSubDealer(subDealer);
    setShowSubDealerDropdown(false);
  };

  const createSelectionState = (initialStock: number): ProductSelectionState => ({
    quantity: '0',
    validating: false,
    isValid: false,
    availableStock: initialStock,
    error: '',
    adding: false,
    lastValidatedQuantity: undefined,
    productData: undefined,
  });

  const getSelectionState = (product: Product): ProductSelectionState =>
    productSelections[product._id] ?? createSelectionState(getStockNumber(product.stock));

  const getFreshProduct = async (productId: string): Promise<Product> => {
    const response = await getProductById(productId);
    if (!response?.success || !response.product) {
      throw new Error(response?.message || 'Product not available at the moment.');
    }
  const rawProduct = response.product || response.data?.product || response.data;
  return normalizeProduct(rawProduct);
  };

  const handleProductQuantityChange = (product: Product, rawValue: string) => {
    const sanitized = rawValue.replace(/[^0-9]/g, '');
    const quantityString = sanitized === '' ? '0' : sanitized;
    const quantityNumber = parseInt(quantityString, 10) || 0;

    setProductSelections((prev) => {
      const prevState = prev[product._id] ?? createSelectionState(getStockNumber(product.stock));
      return {
        ...prev,
        [product._id]: {
          ...prevState,
          quantity: quantityString,
          validating: quantityNumber > 0,
          isValid: false,
          error: '',
        },
      };
    });

    if (quantityNumber <= 0) {
      setProductSelections((prev) => {
        const prevState = prev[product._id] ?? createSelectionState(getStockNumber(product.stock));
        return {
          ...prev,
          [product._id]: {
            ...prevState,
            quantity: quantityString,
            validating: false,
            isValid: false,
            error: '',
            lastValidatedQuantity: undefined,
            productData: undefined,
          },
        };
      });
      return;
    }

    const validate = async () => {
      try {
        const freshProduct = await getFreshProduct(product._id);
        const availableStock = getStockNumber(freshProduct.stock);
        const isValid = quantityNumber <= availableStock;

        setProductSelections((prev) => {
          const prevState = prev[product._id] ?? createSelectionState(getStockNumber(product.stock));
          if ((prevState.quantity || '0') !== quantityString) {
            return prev;
          }
          return {
            ...prev,
            [product._id]: {
              ...prevState,
              validating: false,
              isValid,
              availableStock,
              error: isValid ? '' : `Only ${availableStock} units available`,
              productData: freshProduct,
              lastValidatedQuantity: quantityNumber,
            },
          };
        });
      } catch (error) {
        setProductSelections((prev) => {
          const prevState = prev[product._id] ?? createSelectionState(getStockNumber(product.stock));
          if ((prevState.quantity || '0') !== quantityString) {
            return prev;
          }
          return {
            ...prev,
            [product._id]: {
              ...prevState,
              validating: false,
              isValid: false,
              error: error instanceof Error ? error.message : 'Unable to validate stock',
              productData: undefined,
              lastValidatedQuantity: undefined,
            },
          };
        });
      }
    };

    validate();
  };

  const adjustProductSelectionQuantity = (product: Product, delta: number) => {
    const currentSelection = getSelectionState(product);
    const currentQuantity = parseInt(currentSelection.quantity, 10) || 0;
    const nextQuantity = Math.max(0, currentQuantity + delta);
    handleProductQuantityChange(product, String(nextQuantity));
  };

  const handleAddProductSelection = async (product: Product) => {
    const selection = getSelectionState(product);
    const quantityNumber = parseInt(selection.quantity, 10) || 0;

    if (quantityNumber <= 0 || selection.adding) {
      return;
    }

    setProductSelections((prev) => {
      const prevState = prev[product._id] ?? createSelectionState(getStockNumber(product.stock));
      return {
        ...prev,
        [product._id]: {
          ...prevState,
          adding: true,
          error: '',
        },
      };
    });

    try {
      let freshProduct = selection.productData;
      let availableStock = selection.availableStock;

      if (!selection.isValid || selection.lastValidatedQuantity !== quantityNumber || !freshProduct) {
        freshProduct = await getFreshProduct(product._id);
        availableStock = getStockNumber(freshProduct.stock);

        if (quantityNumber > availableStock) {
          setProductSelections((prev) => ({
            ...prev,
            [product._id]: {
              ...(prev[product._id] ?? createSelectionState(availableStock)),
              quantity: selection.quantity,
              validating: false,
              isValid: false,
              availableStock,
              error: `Only ${availableStock} units available`,
              adding: false,
              productData: freshProduct,
              lastValidatedQuantity: quantityNumber,
            },
          }));
          return;
        }
      }

      const success = await addProductToOrder(product, quantityNumber, freshProduct);

      if (success) {
        const resetState = createSelectionState(getStockNumber((freshProduct ?? product).stock));
        setProductSelections((prev) => ({
          ...prev,
          [product._id]: resetState,
        }));
      } else {
        setProductSelections((prev) => {
          const prevState = prev[product._id] ?? createSelectionState(getStockNumber(product.stock));
          return {
            ...prev,
            [product._id]: {
              ...prevState,
              adding: false,
            },
          };
        });
      }
    } catch (error) {
      setProductSelections((prev) => {
        const prevState = prev[product._id] ?? createSelectionState(getStockNumber(product.stock));
        return {
          ...prev,
          [product._id]: {
            ...prevState,
            adding: false,
            isValid: false,
            error: error instanceof Error ? error.message : 'Failed to add product to order',
          },
        };
      });
    }
  };

  const handleAddAllProducts = async () => {
    const entries = products
      .map((product) => {
        const selection = getSelectionState(product);
        const quantity = parseInt(selection.quantity, 10) || 0;
        return { product, selection, quantity };
      })
      .filter(({ quantity }) => quantity > 0);

    if (entries.length === 0) {
      Alert.alert('No Products Selected', 'Set the quantity for at least one product to add.');
      return;
    }

    if (bulkAdding) {
      return;
    }

    setBulkAdding(true);

    let addedCount = 0;
    const errorMessages: string[] = [];

    for (const { product, selection, quantity } of entries) {
      try {
        let freshProduct = selection.productData;
        let availableStock = selection.availableStock;

        if (
          !selection.isValid ||
          selection.lastValidatedQuantity !== quantity ||
          !freshProduct
        ) {
          freshProduct = await getFreshProduct(product._id);
          availableStock = getStockNumber(freshProduct.stock);
        }

        if (quantity > availableStock) {
          const message = `${freshProduct.productName}: Only ${availableStock} available.`;
          errorMessages.push(message);
          setProductSelections((prev) => ({
            ...prev,
            [product._id]: {
              ...(prev[product._id] ?? createSelectionState(availableStock)),
              quantity: String(quantity),
              validating: false,
              isValid: false,
              availableStock,
              error: `Only ${availableStock} units available`,
              adding: false,
              lastValidatedQuantity: undefined,
              productData: freshProduct,
            },
          }));
          continue;
        }

        const success = await addProductToOrder(product, quantity, freshProduct);
        if (success) {
          addedCount += 1;
          const refreshedStock = getStockNumber(freshProduct.stock);
          setProductSelections((prev) => ({
            ...prev,
            [product._id]: createSelectionState(refreshedStock),
          }));
        } else {
          const message = `${freshProduct.productName}: Failed to add to order.`;
          errorMessages.push(message);
          setProductSelections((prev) => ({
            ...prev,
            [product._id]: {
              ...(prev[product._id] ?? createSelectionState(getStockNumber(product.stock))),
              quantity: String(quantity),
              adding: false,
            },
          }));
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to add product.';
        errorMessages.push(`${product.productName}: ${message}`);
        setProductSelections((prev) => ({
          ...prev,
          [product._id]: {
            ...(prev[product._id] ?? createSelectionState(getStockNumber(product.stock))),
            adding: false,
            isValid: false,
            error: message,
          },
        }));
      }
    }

    setBulkAdding(false);

    if (addedCount > 0) {
      setShowProductDropdown(false);
    }

    if (errorMessages.length > 0) {
      Alert.alert('Notice', errorMessages.join('\n'));
    }
  };

  const addProductToOrder = async (
    product: Product,
    quantity: number,
    freshProductOverride?: Product
  ): Promise<boolean> => {
    if (quantity <= 0) {
      return false;
    }

    try {
      const freshProduct =
        freshProductOverride ?? (await getFreshProduct(product._id));
      const unitLabel = getProductUnitLabel(freshProduct, getUnitLabel(product.unit));
      const availableStock = getStockNumber(freshProduct.stock ?? product.stock);
      const resolvedPrice = getProductPrice(freshProduct);
      const resolvedGstRate = getProductGstRate(freshProduct);
      const resolvedName = getProductName(freshProduct);
      const partNumber = getProductPartNo(freshProduct);
      const hsnCode = getProductHsn(freshProduct);
      const category = getProductCategory(freshProduct);

      if (quantity > availableStock) {
        Alert.alert(
          'Insufficient Stock',
          `Only ${availableStock} ${unitLabel} available for ${freshProduct.productName}.`
        );
        return false;
      }

      setOrderItems((prevItems) => {
        const updatedItems = [...prevItems];
        const existingIndex = updatedItems.findIndex(
          (item) => item.productId === freshProduct._id && item.unit === unitLabel
        );

        if (existingIndex >= 0) {
          const previous = updatedItems[existingIndex];
          updatedItems[existingIndex] = {
            ...previous,
            quantity,
            unitPrice: resolvedPrice,
            gstRate: previous.gstRate ?? resolvedGstRate,
            availableStock,
            partNo: previous.partNo || partNumber,
            itemHsn: previous.itemHsn || hsnCode,
            category: previous.category || category,
            itemAlias: previous.itemAlias || freshProduct.itemAlias,
            baseUnits: previous.baseUnits || freshProduct.baseUnits,
            additionalUnits: previous.additionalUnits || freshProduct.additionalUnits,
            itemHsnDesc: previous.itemHsnDesc || freshProduct.itemHsnDesc,
            brand: previous.brand || freshProduct.brand,
            description: previous.description || freshProduct.description,
          };
        } else {
          updatedItems.push({
            productId: freshProduct._id,
            productCode: freshProduct.productCode,
            productName: resolvedName,
            partNo: partNumber,
            itemAlias: freshProduct.itemAlias,
            category,
            subCategory: freshProduct.subCategory,
            brand: freshProduct.brand,
            itemHsn: hsnCode,
            itemHsnDesc: freshProduct.itemHsnDesc,
            description: freshProduct.description,
            baseUnits: freshProduct.baseUnits,
            additionalUnits: freshProduct.additionalUnits,
            unit: unitLabel,
            unitPrice: resolvedPrice,
            quantity,
            discount: 0,
            gstRate: resolvedGstRate,
            taxType: gstType,
            taxableValue: 0,
            cgstRate: 0,
            cgstAmount: 0,
            sgstRate: 0,
            sgstAmount: 0,
            igstRate: 0,
            igstAmount: 0,
            totalTaxAmount: 0,
            totalAmount: 0,
            availableStock,
          });
        }

        return applyGstToItems(updatedItems, gstType);
      });

      return true;
    } catch (error) {
      console.error('❌ Error adding product to order:', error);
      Alert.alert('Error', 'Failed to add product to order. Please try again.');
      return false;
    }
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    const item = orderItems.find(item => item.productId === productId);
    if (!item) return;
    
    if (newQuantity < 0) return; // Don't allow negative quantities
    
    try {
      // Check stock availability using backend API
      console.log(`🔍 Checking stock for product ${item.productName}, requested quantity: ${newQuantity}`);
      
      // Get fresh product data to check current stock
      const productResponse = await getProductById(productId);
      const currentStock = (productResponse?.success
        ? getStockNumber(productResponse.product?.stock)
        : undefined) ?? item.availableStock;

      if (newQuantity > currentStock) {
        Alert.alert('Insufficient Stock', `Only ${currentStock} ${item.unit} available in stock.`);
        return;
      }

      setOrderItems((prevItems) =>
        applyGstToItems(
          prevItems.map((it) =>
            it.productId === productId
              ? {
                  ...it,
                  quantity: newQuantity,
                  availableStock: currentStock,
                }
              : it
          ),
          gstType
        )
      );
      console.log(`✅ Updated quantity for ${item.productName}: ${newQuantity}`);
    } catch (error) {
      console.error('❌ Error updating quantity:', error);
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  const removeItem = (productId: string) => {
    setOrderItems(orderItems.filter(item => item.productId !== productId));
  };

  const handleCreateOrder = async () => {
    if (!selectedDealer) {
      Alert.alert('Validation Error', 'Please select a dealer');
      return;
    }
    
    // Make sub dealer optional for now due to API permission issues
    // if (!selectedSubDealer) {
    //   Alert.alert('Validation Error', 'Please select a shipping address (sub dealer)');
    //   return;
    // }
    
    if (orderItems.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one product to the order');
      return;
    }
    
    const itemsWithQuantity = orderItems.filter(item => item.quantity > 0);
    if (itemsWithQuantity.length === 0) {
      Alert.alert('Validation Error', 'Please set quantity for at least one product');
      return;
    }
    
    try {
      setSaving(true);
      if (mode === 'Other' && !customMode.trim()) {
        Alert.alert('Validation Error', 'Please specify the payment mode when selecting Other.');
        setSaving(false);
        return;
      }
      
      // Final stock validation before creating order
      console.log('🔍 Performing final stock validation...');
      for (const item of itemsWithQuantity) {
        const productResponse = await getProductById(item.productId);
        if (productResponse?.success) {
          const currentStock = getStockNumber(productResponse.product.stock);
          if (item.quantity > currentStock) {
            Alert.alert(
              'Stock Validation Failed', 
              `${item.productName}: Only ${currentStock} ${item.unit} available, but ${item.quantity} requested.`
            );
            setSaving(false);
            return;
          }
        }
      }
      
      const trimmedCustomMode = customMode.trim();
      const trimmedTermsOfPayment = termsOfPayment.trim();
      const trimmedOtherReference = otherReference.trim();
      const trimmedTermsOfDelivery1 = termsOfDelivery1.trim();
      const trimmedTermsOfDelivery2 = termsOfDelivery2.trim();
      const modePayload = mode === 'Other' ? (trimmedCustomMode || 'Other') : mode;

      const finalSummary = calculateOrderSummary(itemsWithQuantity);
      const orderData: any = {
        customerId: selectedDealer._id,
        customerName: selectedDealer.name,
        customerEmail: selectedDealer.email,
        customerMobile: selectedDealer.mobile,
        customerAddress: normalizeAddress(selectedDealer.address),
        dealerId: selectedDealer._id, // Save dealer ID separately
        dealerName: selectedDealer.name,
        subDealerId: selectedSubDealer ? selectedSubDealer._id : null, // Save subdealer ID separately
        subDealerName: selectedSubDealer ? selectedSubDealer.name : null,
        shippingAddress: selectedSubDealer
          ? normalizeAddress(selectedSubDealer.address)
          : normalizeAddress(selectedDealer.address),
        items: itemsWithQuantity.map(item => ({
          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          partNo: item.partNo,
          itemAlias: item.itemAlias,
          category: item.category,
          subCategory: item.subCategory,
          brand: item.brand,
          itemHsn: item.itemHsn,
          itemHsnDesc: item.itemHsnDesc,
          unit: item.unit,
          baseUnits: item.baseUnits,
          additionalUnits: item.additionalUnits,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount ?? 0,
          gstRate: item.gstRate ?? DEFAULT_GST_RATE,
        })),
        totalQuantity: finalSummary.totalQuantity,
        totalAmount: finalSummary.totalAmount,
        notes: orderNotes,
        paymentMethod: modePayload,
        mode: modePayload,
        modeSelection: mode,
        termsOfPayment: trimmedTermsOfPayment,
        otherReference: trimmedOtherReference,
        termsOfDelivery1: trimmedTermsOfDelivery1,
        termsOfDelivery2: trimmedTermsOfDelivery2,
        status: 'draft',
        orderType: 'rsm_created',
      };
      if (mode === 'Other') {
        orderData.customMode = trimmedCustomMode;
      }
      
      console.log('📦 Creating order with data:', orderData);
      
      const response = await createOrder(orderData);
      console.log('📡 Order creation response:', response);
      
          if (response?.success) {
            console.log('✅ Order created successfully:', response.order);
            // Reset form
            setSelectedDealer(null);
            setSelectedSubDealer(null);
            setOrderItems([]);
            setOrderNotes('');
            setSubDealers([]);
            setMode('');
            setCustomMode('');
            setTermsOfPayment('');
            setOtherReference('');
            setTermsOfDelivery1('');
            setTermsOfDelivery2('');
            
          Alert.alert(
            'Success',
            `Order created successfully!\nOrder Number: ${response.order?.orderNumber || 'N/A'}\nTotal Amount: ₹${finalSummary.totalAmount.toFixed(2)}`,
            [
                {
                  text: 'View Orders',
                  onPress: () => {
                    // Navigate to order list
                    (navigation as any).navigate('RSMOrderList');
                  }
                },
                {
                  text: 'OK',
                  onPress: () => {
                    // Just go back
                    navigation.goBack();
                  }
                }
              ]
            );
          } else {
            console.log('❌ Order creation failed:', response?.message);
            Alert.alert('Error', response?.message || 'Failed to create order');
          }
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('Error', 'Failed to create order. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderDealerItem = ({ item }: { item: Dealer }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => handleDealerSelect(item)}
    >
      <Text style={styles.dropdownItemText}>{item.name}</Text>
      <Text style={styles.dropdownItemSubtext}>{item.mobile}</Text>
      {item.email ? (
        <Text style={styles.dropdownItemMeta}>{item.email}</Text>
      ) : null}
      {item.address ? (
        <Text style={styles.dropdownItemMeta}>{formatAddress(item.address)}</Text>
      ) : null}
    </TouchableOpacity>
  );

  const renderSubDealerItem = ({ item }: { item: SubDealer }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => handleSubDealerSelect(item)}
    >
      <Text style={styles.dropdownItemText}>{item.name}</Text>
      <Text style={styles.dropdownItemSubtext}>{formatAddress(item.address)}</Text>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }: { item: Product }) => {
    const selection = getSelectionState(item);
    const quantityNumber = parseInt(selection.quantity, 10) || 0;
    const resolvedUnit = getProductUnitLabel(item, getUnitLabel(item.unit));
    const resolvedPrice = getProductPrice(item);
    const resolvedGst = getProductGstRate(item);
    const partNumber = getProductPartNo(item);
    const hsnCode = getProductHsn(item);
    const category = getProductCategory(item);
    const existingItem = orderItems.find(
      (orderItem) =>
        orderItem.productId === item._id &&
        orderItem.unitPrice === resolvedPrice &&
        orderItem.unit === resolvedUnit
    );
    const isSameProductDifferentPrice = orderItems.some(
      (orderItem) =>
        orderItem.productId === item._id &&
        (orderItem.unitPrice !== resolvedPrice || orderItem.unit !== resolvedUnit)
    );

    const availableStockLabel =
      selection.availableStock > 0
        ? selection.availableStock
        : getStockNumber(item.stock);

    const addButtonVisible = quantityNumber > 0;
    const isLoading = selection.validating || selection.adding;
    const canAdd =
      addButtonVisible && selection.isValid && !isLoading;
    const addButtonLabel = existingItem ? 'Update' : 'Add';

    return (
      <View
        style={[
          styles.dropdownItem,
          existingItem && styles.addedProductItem,
        ]}
      >
        <View style={styles.productItemContainer}>
          <View style={styles.productItemInfo}>
            <Text
              style={[
                styles.dropdownItemText,
                existingItem && styles.addedProductText,
              ]}
            >
              {getProductName(item)}
            </Text>
            <Text
              style={[
                styles.dropdownItemSubtext,
                existingItem && styles.addedProductSubtext,
              ]}
            >
              {item.productCode} • ₹{resolvedPrice.toFixed(2)}
            </Text>
            {partNumber ? (
              <Text
                style={[
                  styles.dropdownItemSubtext,
                  existingItem && styles.addedProductSubtext,
                ]}
              >
                Part No: {partNumber}
              </Text>
            ) : null}
            <Text
              style={[
                styles.dropdownItemSubtext,
                existingItem && styles.addedProductSubtext,
              ]}
            >
              Category: {category}
            </Text>
            <Text
              style={[
                styles.dropdownItemSubtext,
                existingItem && styles.addedProductSubtext,
              ]}
            >
              GST: {resolvedGst}%
            </Text>
            {hsnCode ? (
              <Text
                style={[
                  styles.dropdownItemSubtext,
                  existingItem && styles.addedProductSubtext,
                ]}
              >
                HSN: {hsnCode}
              </Text>
            ) : null}
            <Text style={styles.productAvailabilityText}>
            Available: {availableStockLabel}{' '}
            {getProductUnitLabel(item)}
            </Text>
          </View>
          {existingItem ? (
            <Ionicons name="checkmark-circle" size={22} color="#10B981" />
          ) : (
            <Ionicons name="cube-outline" size={22} color="#3B82F6" />
          )}
        </View>

        {isSameProductDifferentPrice && !existingItem && (
          <Text style={styles.variantAddedText}>
            ⚠ Same product already in order with different price/unit
          </Text>
        )}

        <View style={styles.productSelectionControls}>
          <View style={styles.selectionQuantityControls}>
            <TouchableOpacity
              style={[
                styles.selectionQuantityButton,
                (quantityNumber <= 0 || isLoading) &&
                  styles.selectionQuantityButtonDisabled,
              ]}
              onPress={() => adjustProductSelectionQuantity(item, -1)}
              disabled={quantityNumber <= 0 || isLoading}
            >
              <Ionicons
                name="remove"
                size={18}
                color="#111827"
              />
            </TouchableOpacity>
            <TextInput
              style={styles.selectionQuantityInput}
              value={selection.quantity}
              onChangeText={(value) => handleProductQuantityChange(item, value)}
              keyboardType="number-pad"
              returnKeyType="done"
              editable={!isLoading}
              maxLength={6}
              selectTextOnFocus
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[
                styles.selectionQuantityButton,
                isLoading && styles.selectionQuantityButtonDisabled,
              ]}
              onPress={() => adjustProductSelectionQuantity(item, 1)}
              disabled={isLoading}
            >
              <Ionicons
                name="add"
                size={18}
                color="#111827"
              />
            </TouchableOpacity>
          </View>

          {addButtonVisible && (
            <TouchableOpacity
              style={[
                styles.addProductActionButton,
                !canAdd && styles.addProductActionButtonDisabled,
              ]}
              onPress={() => handleAddProductSelection(item)}
              disabled={!canAdd}
            >
              {selection.adding ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.addProductActionButtonText}>
                  {addButtonLabel}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {selection.validating && (
          <Text style={styles.selectionHelperText}>Validating stock...</Text>
        )}

        {selection.error ? (
          <Text style={styles.selectionErrorText}>{selection.error}</Text>
        ) : null}

        {existingItem && !selection.error && (
          <Text style={styles.selectionInfoText}>
            In order: {existingItem.quantity} {existingItem.unit}
          </Text>
        )}
      </View>
    );
  };

  const renderOrderItem = ({ item }: { item: OrderItem }) => (
    <View style={styles.orderItemContainer}>
      <View style={styles.orderItemInfo}>
        <Text style={styles.orderItemName}>{item.productName}</Text>
        <Text style={styles.orderItemCode}>{item.productCode}</Text>
        {item.partNo ? (
          <Text style={styles.orderItemMeta}>Part No: {item.partNo}</Text>
        ) : null}
        {item.itemHsn ? (
          <Text style={styles.orderItemMeta}>HSN: {item.itemHsn}</Text>
        ) : null}
        {item.category ? (
          <Text style={styles.orderItemMeta}>Category: {item.category}</Text>
        ) : null}
        <Text style={styles.orderItemPrice}>{formatCurrency(item.unitPrice)}</Text>
        <Text style={styles.orderItemStock}>
          Available: {item.availableStock} {item.unit}
        </Text>
      </View>

      <View style={styles.orderItemSummary}>
        <Text style={styles.orderItemQuantity}>
          Quantity:{' '}
          <Text style={styles.orderItemQuantityValue}>{item.quantity}</Text>
        </Text>
        <Text style={styles.orderItemTotal}>{formatCurrency(item.totalAmount)}</Text>
      </View>

      <View style={styles.orderItemTaxDetails}>
        <Text style={styles.orderItemTaxLine}>
          Taxable Value: {formatCurrency(item.taxableValue)}
        </Text>
        <Text style={styles.orderItemTaxLine}>
          GST Rate: {item.gstRate}%
        </Text>
        {item.cgstAmount > 0 ? (
          <Text style={styles.orderItemTaxLine}>
            CGST ({item.cgstRate}%): {formatCurrency(item.cgstAmount)}
          </Text>
        ) : null}
        {item.sgstAmount > 0 ? (
          <Text style={styles.orderItemTaxLine}>
            SGST/UTGST ({item.sgstRate}%): {formatCurrency(item.sgstAmount)}
          </Text>
        ) : null}
        {item.igstAmount > 0 ? (
          <Text style={styles.orderItemTaxLine}>
            IGST ({item.igstRate}%): {formatCurrency(item.igstAmount)}
          </Text>
        ) : null}
        <Text style={styles.orderItemTaxTotal}>
          Total GST: {formatCurrency(item.totalTaxAmount)}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeItem(item.productId)}
      >
        <Ionicons name="trash-outline" size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  const productSelectionEntries = products.map((product) => {
    const selection = getSelectionState(product);
    const quantity = parseInt(selection.quantity, 10) || 0;
    return { product, selection, quantity };
  });

  const selectedEntries = productSelectionEntries.filter(({ quantity }) => quantity > 0);
  const bulkButtonVisible = selectedEntries.length > 0;
  const bulkButtonDisabled =
    bulkAdding || selectedEntries.some(({ selection }) => selection.adding);
  const totalSelectedQuantity = selectedEntries.reduce(
    (sum, { quantity }) => sum + quantity,
    0
  );
  const bulkButtonLabel =
    selectedEntries.length > 1
      ? `Add Selected Products (Qty: ${totalSelectedQuantity})`
      : `Add Selected Product (Qty: ${totalSelectedQuantity || 0})`;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Order</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Customer Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer (Dealer)</Text>
          <View style={styles.selectionRow}>
            <TouchableOpacity
              style={[styles.dropdownButton, styles.selectionButton]}
              onPress={() => {
                console.log('🔍 Opening dealer dropdown, dealers available:', dealers.length);
                setShowDealerDropdown(true);
              }}
            >
              <Text style={[styles.dropdownButtonText, !selectedDealer && styles.placeholderText]}>
                {selectedDealer ? selectedDealer.name : 'Select Dealer'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
            {selectedDealer && (
              <TouchableOpacity
                style={styles.clearSelectionButton}
                onPress={() => {
                  setSelectedDealer(null);
                  setSelectedSubDealer(null);
                }}
              >
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
          {selectedDealer && (
            <View style={styles.selectedDealerInfo}>
              <Text style={styles.addressText}>{formatAddress(selectedDealer.address)}</Text>
            </View>
          )}
        </View>

        {/* Shipping Address Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Address (Sub Dealer) - Optional</Text>
          <View style={styles.selectionRow}>
            <TouchableOpacity
              style={[styles.dropdownButton, styles.selectionButton, subDealers.length === 0 && !loading && styles.disabledButton]}
              onPress={() => {
                if (subDealers.length > 0) {
                  console.log('🔍 Opening sub dealer dropdown, sub dealers available:', subDealers.length);
                  setShowSubDealerDropdown(true);
                } else if (!loading) {
                  Alert.alert('Info', 'No sub dealers available. Order will use dealer address.');
                }
              }}
              disabled={subDealers.length === 0 && !loading}
            >
              <Text style={[styles.dropdownButtonText, !selectedSubDealer && styles.placeholderText]}>
                {loading ? 'Loading sub dealers...' : 
                selectedSubDealer ? selectedSubDealer.name : 
                subDealers.length > 0 ? 'Select Sub Dealer (Optional)' : 
                'No Sub Dealers Available'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>
            {selectedSubDealer && (
              <TouchableOpacity
                style={styles.clearSelectionButton}
                onPress={() => setSelectedSubDealer(null)}
              >
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
          {selectedSubDealer && (
            <Text style={styles.addressText}>{formatAddress(selectedSubDealer.address)}</Text>
          )}
          {subDealers.length === 0 && !loading && (
            <Text style={styles.infoText}>Order will be shipped to dealer address</Text>
          )}
        </View>

        {/* Product Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Products</Text>
          <TouchableOpacity
            style={styles.addProductButton}
            onPress={() => setShowProductDropdown(true)}
          >
            <Ionicons name="add-circle-outline" size={24} color="#3B82F6" />
            <Text style={styles.addProductButtonText}>Add Product</Text>
          </TouchableOpacity>
        </View>

        {/* Order Items */}
        {orderItems.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Items ({orderItems.length})</Text>
            <FlatList
              data={orderItems}
              renderItem={renderOrderItem}
              keyExtractor={(item) => item.productId}
              scrollEnabled={false}
            />
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Items</Text>
            <View style={styles.emptyStateContainer}>
              <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No products added yet</Text>
              <Text style={styles.emptyStateSubtext}>Tap "Add Product" to start building your order</Text>
            </View>
          </View>
        )}
        {/* Order Summary */}
        {orderItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>GST Type:</Text>
                <Text style={styles.summaryValue}>{gstTypeLabel}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Seller State:</Text>
                <Text style={styles.summaryValue}>{sellerState || 'N/A'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Buyer State:</Text>
                <Text style={styles.summaryValue}>{buyerState || 'N/A'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Quantity:</Text>
                <Text style={styles.summaryValue}>{orderSummary.totalQuantity}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Taxable Value:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(orderSummary.taxableValue)}</Text>
              </View>
              {(hasCgst || hasSgst) && (
                <>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>CGST:</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(orderSummary.cgstTotal)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>SGST/UTGST:</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(orderSummary.sgstTotal)}</Text>
                  </View>
                </>
              )}
              {hasIgst && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>IGST:</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(orderSummary.igstTotal)}</Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total GST:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(orderSummary.taxTotal)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryRowHighlight]}>
                <Text style={styles.summaryLabel}>Grand Total:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(orderSummary.totalAmount)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Payment Mode */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Payment Mode</Text>
          <View style={styles.modeOptionsContainer}>
            {MODE_OPTIONS.map((option) => {
              const isSelected = mode === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.modeOptionButton,
                    isSelected && styles.modeOptionButtonSelected,
                  ]}
                  onPress={() => {
                    setMode(option);
                    if (option !== 'Other') {
                      setCustomMode('');
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.modeOptionText,
                      isSelected && styles.modeOptionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {mode === 'Other' && (
            <TextInput
              style={styles.fieldInput}
              placeholder="Specify other payment mode"
              value={customMode}
              onChangeText={setCustomMode}
              placeholderTextColor="#9CA3AF"
            />
          )}
        </View>

        {/* Additional Order Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Order Details</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="Terms of Payment"
            value={termsOfPayment}
            onChangeText={setTermsOfPayment}
            placeholderTextColor="#9CA3AF"
          />
          <TextInput
            style={styles.fieldInput}
            placeholder="Other Reference"
            value={otherReference}
            onChangeText={setOtherReference}
            placeholderTextColor="#9CA3AF"
          />
          <TextInput
            style={styles.fieldInput}
            placeholder="Terms of Delivery 1"
            value={termsOfDelivery1}
            onChangeText={setTermsOfDelivery1}
            placeholderTextColor="#9CA3AF"
          />
          <TextInput
            style={styles.fieldInput}
            placeholder="Terms of Delivery 2"
            value={termsOfDelivery2}
            onChangeText={setTermsOfDelivery2}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Order Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add any notes for this order..."
            value={orderNotes}
            onChangeText={setOrderNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Create Order Button */}
        <TouchableOpacity
          style={[styles.createButton, (!selectedDealer || orderItems.length === 0) && styles.disabledButton]}
          onPress={handleCreateOrder}
          disabled={!selectedDealer || orderItems.length === 0 || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.createButtonText}>Create Order</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Dealer Dropdown Modal */}
      <Modal
        visible={showDealerDropdown}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowDealerDropdown(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDealerDropdown(false)}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Dealer</Text>
            <View style={styles.placeholder} />
          </View>
          
          <FlatList
            data={dealers}
            renderItem={renderDealerItem}
            keyExtractor={(item) => item._id}
            style={styles.dropdownList}
          />
        </View>
      </Modal>

      {/* Sub Dealer Dropdown Modal */}
      <Modal
        visible={showSubDealerDropdown}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowSubDealerDropdown(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowSubDealerDropdown(false)}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Shipping Address</Text>
            <View style={styles.placeholder} />
          </View>
          
          <FlatList
            data={subDealers}
            renderItem={renderSubDealerItem}
            keyExtractor={(item) => item._id}
            style={styles.dropdownList}
          />
        </View>
      </Modal>

      {/* Product Dropdown Modal */}
      <Modal
        visible={showProductDropdown}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowProductDropdown(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowProductDropdown(false)}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Product</Text>
            <View style={styles.placeholder} />
          </View>
          
          <FlatList
            data={products}
            renderItem={renderProductItem}
            keyExtractor={(item) => item._id}
            style={styles.dropdownList}
            contentContainerStyle={styles.productListContent}
            extraData={productSelections}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            ListFooterComponent={
              bulkButtonVisible ? (
                <View style={styles.productSelectionFooter}>
                  <TouchableOpacity
                    style={[
                      styles.bulkAddButton,
                      (bulkButtonDisabled || bulkAdding) && styles.bulkAddButtonDisabled,
                    ]}
                    onPress={handleAddAllProducts}
                    disabled={bulkButtonDisabled || bulkAdding}
                  >
                    {bulkAdding ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.bulkAddButtonText}>{bulkButtonLabel}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.productSelectionFooterSpacer} />
              )
            }
          />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectionButton: {
    flex: 1,
  },
  clearSelectionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  disabledButton: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  selectedDealerInfo: {
    marginTop: 8,
    gap: 4,
  },
  selectedDealerMeta: {
    fontSize: 14,
    color: '#4B5563',
  },
  addressText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  infoText: {
    fontSize: 12,
    color: '#059669',
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  addProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  addProductButtonText: {
    fontSize: 16,
    color: '#3B82F6',
    marginLeft: 8,
    fontWeight: '500',
  },
  orderItemContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  orderItemInfo: {
    marginBottom: 12,
  },
  orderItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  orderItemCode: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  orderItemMeta: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 4,
  },
  orderItemPrice: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
    marginBottom: 4,
  },
  orderItemStock: {
    fontSize: 12,
    color: '#6B7280',
  },
  orderItemSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  orderItemTaxDetails: {
    marginTop: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  orderItemTaxLine: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 4,
  },
  orderItemTaxTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginTop: 4,
  },
  orderItemQuantity: {
    fontSize: 14,
    color: '#4B5563',
  },
  orderItemQuantityValue: {
    fontWeight: '600',
    color: '#1F2937',
  },
  orderItemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  removeButton: {
    padding: 8,
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryRowHighlight: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  fieldInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 12,
  },
  modeOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  modeOptionButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  modeOptionButtonSelected: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  modeOptionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  modeOptionTextSelected: {
    color: '#FFFFFF',
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  createButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  dropdownList: {
    flex: 1,
    padding: 16,
  },
  productListContent: {
    paddingBottom: 24,
  },
  productSelectionFooter: {
    marginTop: 16,
  },
  bulkAddButton: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulkAddButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  bulkAddButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  productSelectionFooterSpacer: {
    height: 12,
  },
  dropdownItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  dropdownItemSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  dropdownItemMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  productItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productItemInfo: {
    flex: 1,
  },
  productAvailabilityText: {
    fontSize: 13,
    color: '#047857',
    marginTop: 6,
  },
  productSelectionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  selectionQuantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
  },
  selectionQuantityButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectionQuantityButtonDisabled: {
    opacity: 0.4,
  },
  selectionQuantityInput: {
    width: 56,
    textAlign: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 8,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  addProductActionButton: {
    flexGrow: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  addProductActionButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  addProductActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectionHelperText: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280',
  },
  selectionErrorText: {
    marginTop: 6,
    fontSize: 12,
    color: '#DC2626',
  },
  selectionInfoText: {
    marginTop: 6,
    fontSize: 12,
    color: '#059669',
  },
  // Visual indicators for already added products
  addedProductItem: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  addedProductText: {
    color: '#059669',
  },
  addedProductSubtext: {
    color: '#047857',
  },
  variantAddedText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '500',
    marginTop: 2,
  },
});

export default RSMCreateOrder;
