import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  DEFAULT_GST_RATE,
  computeGstBreakdown,
  determineGstType,
  extractState,
  GstType,
} from '../../../utils/gst';

const MODE_OPTIONS = ['Cash', 'Cheque', 'Bank Transfer', 'UPI', 'Credit Card', 'Credit', 'Other'];
const DEFAULT_UNIT_LABEL = 'units';

const getStockNumber = (stock: number | { current?: number; minimum?: number; maximum?: number } | undefined): number => {
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
    unit: raw?.unit,
    stock:
      typeof stockValue === 'object' || typeof stockValue === 'number'
        ? stockValue
        : coerceNumber(stockValue),
    isActive: raw?.isActive,
    isFinishItem: raw?.isFinishItem,
    gstRate: coerceNumber(raw?.gstRate),
    itemGstPer: coerceNumber(raw?.itemGstPer),
    itemHsn: raw?.itemHsn,
    itemHsnDesc: raw?.itemHsnDesc,
    openingBalance: coerceNumber(raw?.openingBalance),
    itemOpRate: coerceNumber(raw?.itemOpRate),
    companyCode: raw?.companyCode,
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

const normalizeAddress = (
  address?: { street?: string; city?: string; state?: string; pincode?: string; country?: string }
) => ({
  street: address?.street || '',
  city: address?.city || '',
  state: address?.state || '',
  pincode: address?.pincode || '',
  country: address?.country || 'India',
});

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

interface User {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  role: string;
}

interface Product {
  _id: string;
  productName: string;
  productCode: string;
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
  unit?: string;
  stock?: number | {
    current?: number;
    minimum?: number;
    maximum?: number;
  };
  isActive?: boolean;
  isFinishItem?: boolean;
  gstRate?: number;
  itemGstPer?: number;
  itemHsn?: string;
  itemHsnDesc?: string;
  openingBalance?: number;
  itemOpRate?: number;
  companyCode?: string;
  other1?: string;
  other2?: string;
  other3?: string;
  other4?: string;
  other5?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerId: string | {
    _id: string;
    email: string;
    name: string;
    mobile: string;
    role: string;
  };
  customerName: string;
  customerEmail?: string;
  customerMobile?: string;
  dealerId?: string | {
    _id: string;
    email: string;
    name: string;
    mobile: string;
    role: string;
  };
  dealerName?: string;
  subDealerId?: string | {
    _id: string;
    email: string;
    name: string;
    mobile: string;
    role: string;
  };
  subDealerName?: string;
  shippingAddress: {
    subDealerId?: string;
    name: string;
    address: any;
    mobile: string;
  };
  items: OrderItem[];
  totalQuantity: number;
  totalAmount: number;
  taxableValueTotal?: number;
  cgstTotal?: number;
  sgstTotal?: number;
  igstTotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  finalAmount?: number;
  sellerState?: string;
  buyerState?: string;
  gstType?: GstType;
  notes?: string;
  status: string;
  orderType: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  paymentMethod?: string;
  modeSelection?: string;
  mode?: string;
  termsOfPayment?: string;
  otherReference?: string;
  termsOfDelivery1?: string;
  termsOfDelivery2?: string;
}

const ASMEditOrder = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { order } = route.params as { order: Order };
  
  const { 
    user,
    getUsersByRole, 
    getProducts, 
    getProductById, 
    updateOrder 
  } = useAuth();
  
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
  
const mapPaymentMethodToLabel = (value?: string) => {
  if (!value) return '';
  const normalized = value.toString().toLowerCase();
  switch (normalized) {
    case 'cash':
      return 'Cash';
    case 'cheque':
    case 'check':
      return 'Cheque';
    case 'bank_transfer':
    case 'bank transfer':
    case 'bank-transfer':
    case 'neft':
    case 'rtgs':
      return 'Bank Transfer';
    case 'upi':
      return 'UPI';
    case 'card':
    case 'credit card':
    case 'debit card':
      return 'Credit Card';
    case 'credit':
      return 'Credit';
    default:
      return value;
  }
};

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingQuantity, setUpdatingQuantity] = useState<string | null>(null);
  
  // Form state
  const [selectedDealer, setSelectedDealer] = useState<User | null>(null);
  const [selectedSubDealer, setSelectedSubDealer] = useState<User | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
const [orderNotes, setOrderNotes] = useState('');
const [mode, setMode] = useState('Cash');
const [customMode, setCustomMode] = useState('');
const [termsOfPayment, setTermsOfPayment] = useState('');
const [otherReference, setOtherReference] = useState('');
const [termsOfDelivery1, setTermsOfDelivery1] = useState('');
const [termsOfDelivery2, setTermsOfDelivery2] = useState('');
  
  // Data state
  const [dealers, setDealers] = useState<User[]>([]);
  const [subDealers, setSubDealers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // UI state
  const [showDealerDropdown, setShowDealerDropdown] = useState(false);
  const [showSubDealerDropdown, setShowSubDealerDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const deriveSellerState = useCallback(() => {
    if ((order as any)?.sellerState) {
      return extractState((order as any).sellerState);
    }

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
  }, [order, user]);

  const sellerState = useMemo(() => deriveSellerState(), [deriveSellerState]);

  const buyerStateFromOrder = useMemo(() => {
    const explicit = extractState((order as any)?.buyerState);
    if (explicit) {
      return explicit;
    }

    const shippingAddress = (order as any)?.shippingAddress;
    const shippingState =
      extractState(shippingAddress?.state) ||
      extractState(shippingAddress?.address?.state);

    const customerAddressState = extractState((order as any)?.customerAddress?.state);

    return shippingState || customerAddressState || '';
  }, [order]);

  const buyerState = useMemo(() => {
    if (selectedSubDealer?.address?.state) {
      return extractState(selectedSubDealer.address.state);
    }
    if (selectedDealer?.address?.state) {
      return extractState(selectedDealer.address.state);
    }
    return buyerStateFromOrder;
  }, [selectedDealer, selectedSubDealer, buyerStateFromOrder]);

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

  useEffect(() => {
    fetchInitialData();
    initializeForm();
  }, []);

  const initializeForm = () => {
    // Initialize form with existing order data and normalize items
    const normalizedItems: OrderItem[] = (order.items || []).map((it: any) => {
      const productIdObj = typeof it.productId === 'object' ? it.productId : undefined;
      const productIdStr = productIdObj?._id || it.productId;
      const productCode = it.productCode || productIdObj?.productCode || '';
      const productName = it.productName || productIdObj?.productName || productIdObj?.name || '';
      const unit = getProductUnitLabel(productIdObj as Product, getUnitLabel(it.unit));
      const unitPrice =
        typeof it.unitPrice === 'number'
          ? it.unitPrice
          : typeof it.price === 'number'
            ? it.price
            : getProductPrice(productIdObj as Product);
      const quantity = it.quantity ?? 0;
      const discount = typeof it.discount === 'number' ? it.discount : 0;
      const gstRate =
        typeof it.gstRate === 'number'
          ? it.gstRate
          : typeof it.tax === 'number'
            ? it.tax
            : DEFAULT_GST_RATE;
      const totalAmount = (it.totalAmount ?? it.totalPrice ?? (unitPrice * quantity)) ?? 0;
      const availableStock =
        typeof it.availableStock === 'number'
          ? it.availableStock
          : getStockNumber(productIdObj?.stock) ||
            getStockNumber((it as any)?.stock);
      const partNo = it.partNo || productIdObj?.partNo || productIdObj?.itemAlias;
      const itemHsn = it.itemHsn || productIdObj?.itemHsn;
      const category = it.category || productIdObj?.category;
      const brand = it.brand || productIdObj?.brand;
      const description = it.description || productIdObj?.description;

      return {
        productId: productIdStr,
        productCode,
        productName,
        partNo,
        itemAlias: it.itemAlias || productIdObj?.itemAlias,
        category,
        subCategory: it.subCategory || productIdObj?.subCategory,
        brand,
        itemHsn,
        itemHsnDesc: it.itemHsnDesc || productIdObj?.itemHsnDesc,
        description,
        baseUnits: productIdObj?.baseUnits,
        additionalUnits: productIdObj?.additionalUnits,
        unit,
        unitPrice,
        quantity,
        discount,
        gstRate,
        taxType: (it.taxType as GstType) ?? (order.gstType as GstType) ?? 'UNKNOWN',
        taxableValue: 0,
        cgstRate: 0,
        cgstAmount: 0,
        sgstRate: 0,
        sgstAmount: 0,
        igstRate: 0,
        igstAmount: 0,
        totalTaxAmount: 0,
        totalAmount,
        availableStock,
      };
    });

    const initialSeller = extractState((order as any)?.sellerState) || deriveSellerState();
    const initialBuyer = buyerStateFromOrder;
    setOrderItems(
      applyGstToItems(normalizedItems, determineGstType(initialSeller, initialBuyer))
    );

    setOrderNotes(order.notes || '');
    const backendModeSelection = (order.modeSelection || '').toString();
    const backendMode = (order.mode || '').toString();
    const backendPaymentMethod = mapPaymentMethodToLabel(order.paymentMethod);

    let derivedMode = backendModeSelection || backendMode || backendPaymentMethod;
    let derivedCustomMode = '';

    if (derivedMode) {
      const matchesOption = MODE_OPTIONS.includes(derivedMode);
      if (!matchesOption) {
        derivedCustomMode = derivedMode;
        derivedMode = 'Other';
      } else if (derivedMode === 'Other') {
        const candidate =
          backendMode && backendMode.toLowerCase() !== 'other'
            ? backendMode
            : (backendModeSelection && backendModeSelection.toLowerCase() !== 'other'
                ? backendModeSelection
                : '');
        derivedCustomMode = candidate || '';
      }
    }

    if (!derivedMode) {
      derivedMode = 'Cash';
    }

    setMode(derivedMode);
    setCustomMode(derivedCustomMode);
    setTermsOfPayment(order.termsOfPayment || '');
    setOtherReference(order.otherReference || '');
    setTermsOfDelivery1(order.termsOfDelivery1 || '');
    setTermsOfDelivery2(order.termsOfDelivery2 || '');
    
    console.log('🔍 Initializing form with order data:', {
      customerId: order.customerId,
      dealerId: order.dealerId,
      subDealerId: order.subDealerId,
      shippingAddress: order.shippingAddress
    });
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch dealers
      const dealersResponse = await getUsersByRole('dealers');
      let dealersList = [];
      if (Array.isArray(dealersResponse)) {
        dealersList = dealersResponse;
        setDealers(dealersResponse);
      } else if (dealersResponse?.success) {
        // Response with success field - handle nested data.users structure
        dealersList = dealersResponse.data?.users || dealersResponse.data || dealersResponse.users || [];
        setDealers(Array.isArray(dealersList) ? dealersList : []);
      } else if (dealersResponse?.users && Array.isArray(dealersResponse.users)) {
        // Response structure: {users: [...], role: 'dealers', count: 1}
        dealersList = dealersResponse.users;
        setDealers(dealersResponse.users);
      }
      
      // Fetch sub dealers
      const subDealersResponse = await getUsersByRole('subdealer');
      let subDealersList = [];
      if (Array.isArray(subDealersResponse)) {
        subDealersList = subDealersResponse;
        setSubDealers(subDealersResponse);
      } else if (subDealersResponse?.success) {
        // Response with success field - handle nested data.users structure
        subDealersList = subDealersResponse.data?.users || subDealersResponse.data || subDealersResponse.subDealers || subDealersResponse.users || [];
        setSubDealers(Array.isArray(subDealersList) ? subDealersList : []);
      } else if (subDealersResponse?.users && Array.isArray(subDealersResponse.users)) {
        // Response structure: {users: [...], role: 'subdealer', count: 3}
        subDealersList = subDealersResponse.users;
        setSubDealers(subDealersResponse.users);
      }
      
      // Fetch products
      const productsResponse = await getProducts();
      let productList: any[] = [];

      if (Array.isArray(productsResponse)) {
        productList = productsResponse;
      } else if (Array.isArray(productsResponse?.products)) {
        productList = productsResponse.products;
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
      } else if (Array.isArray(productsResponse?.data?.products)) {
        productList = productsResponse.data.products;
      }

      const normalizedProducts = productList.map(normalizeProduct);
      setProducts(normalizedProducts);
      setShowDealerDropdown(false);
      setShowSubDealerDropdown(false);

      // Sync order items with latest product info (stock, unit, price)
      if (normalizedProducts.length > 0) {
        setOrderItems(prevItems =>
          applyGstToItems(
            prevItems.map(item => {
              const match = normalizedProducts.find(prod => prod._id === item.productId);
              if (!match) {
                return item;
              }

              const updatedStock = getStockNumber(match.stock);
              const updatedUnit = getProductUnitLabel(match, item.unit);
              const updatedPrice = getProductPrice(match) || item.unitPrice;

              return {
                ...item,
                availableStock: updatedStock > 0 ? updatedStock : item.availableStock,
                unit: updatedUnit,
                unitPrice: updatedPrice,
                partNo: item.partNo || getProductPartNo(match),
                itemHsn: item.itemHsn || getProductHsn(match),
                category: item.category || getProductCategory(match),
                itemAlias: item.itemAlias || match.itemAlias,
                brand: item.brand || match.brand,
                description: item.description || match.description,
                baseUnits: item.baseUnits || match.baseUnits,
                additionalUnits: item.additionalUnits || match.additionalUnits,
              };
            }),
            gstType
          )
        );
      }
      
      // Find and set current dealer and subdealer from order data
      console.log('🔍 Setting dealer and subdealer from order data...');
      
      // Set dealer - try dealerId first, then customerId as fallback
      let dealerId: string | undefined = undefined;
      if (typeof order.dealerId === 'string') {
        dealerId = order.dealerId;
      } else if (typeof order.dealerId === 'object' && order.dealerId?._id) {
        dealerId = order.dealerId._id;
      }
      
      if (!dealerId) {
        if (typeof order.customerId === 'string') {
          dealerId = order.customerId;
        } else if (typeof order.customerId === 'object' && order.customerId?._id) {
          dealerId = order.customerId._id;
        }
      }
      
      if (dealerId) {
        const currentDealer = dealersList.find((d: any) => d._id === dealerId);
        if (currentDealer) {
          setSelectedDealer(currentDealer);
          console.log('✅ Dealer set:', currentDealer.name);
        } else {
          console.log('❌ Dealer not found in list:', dealerId);
        }
      }
      
      // Set subdealer - try subDealerId first, then shippingAddress.subDealerId as fallback
      let subDealerId: string | undefined = undefined;
      if (typeof order.subDealerId === 'string') {
        subDealerId = order.subDealerId;
      } else if (typeof order.subDealerId === 'object' && order.subDealerId?._id) {
        subDealerId = order.subDealerId._id;
      }
      
      if (!subDealerId) {
        subDealerId = order.shippingAddress?.subDealerId;
      }
      
      if (subDealerId) {
        const currentSubDealer = subDealersList.find((s: any) => s._id === subDealerId);
        if (currentSubDealer) {
          setSelectedSubDealer(currentSubDealer);
          console.log('✅ SubDealer set:', currentSubDealer.name);
        } else {
          console.log('❌ SubDealer not found in list:', subDealerId);
        }
      } else {
        console.log('ℹ️ No subdealer in order data');
      }
      
    } catch (error) {
      console.error('Error fetching initial data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const addProductToOrder = async (product: Product) => {
    try {
      const existingItem = orderItems.find(item => item.productId === product._id);

      if (existingItem) {
        await updateQuantity(product._id, existingItem.quantity + 1);
        setShowProductDropdown(false);
        return;
      }

      const productResponse = await getProductById(product._id);
      const freshProduct = (productResponse?.success
        ? normalizeProduct(productResponse.data?.product || productResponse.product || productResponse.data)
        : normalizeProduct(product));

      const resolvedUnit = getProductUnitLabel(freshProduct, getUnitLabel(product.unit));
      const resolvedPrice = getProductPrice(freshProduct) || getProductPrice(product);
      const resolvedGstRate = getProductGstRate(freshProduct);
      const resolvedStock = getStockNumber(
        (freshProduct.stock as Product['stock']) ?? product.stock
      );
      const resolvedName = getProductName(freshProduct);
      const partNumber = getProductPartNo(freshProduct);
      const hsnCode = getProductHsn(freshProduct);
      const category = getProductCategory(freshProduct);
      const initialQuantity = resolvedStock > 0 ? 1 : 0;

      const newItem: OrderItem = {
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
        unit: resolvedUnit,
        unitPrice: resolvedPrice,
        quantity: initialQuantity,
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
        availableStock: resolvedStock,
      };

      setOrderItems((prevItems) =>
        applyGstToItems([...prevItems, newItem], gstType)
      );
      setShowProductDropdown(false);

      if (initialQuantity === 0) {
        Alert.alert(
          'Info',
          'Selected product currently has no available stock. Quantity is set to 0.'
        );
      }
    } catch (error) {
      console.error('Error adding product to order:', error);
      Alert.alert('Error', 'Failed to add product to order');
    }
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    const item = orderItems.find((orderItem) => orderItem.productId === productId);
    if (!item) {
      return;
    }

    if (newQuantity < 0) {
      return;
    }
    if (newQuantity === item.quantity) {
      return;
    }

    setUpdatingQuantity(productId);

    try {
      console.log(`🔄 Updating quantity for product ${productId} to ${newQuantity}`);

      const productResponse = await getProductById(productId);
      console.log('📦 Product response:', productResponse);

      let currentStock = item.availableStock;
      let unitLabel = item.unit;
      let unitPrice = item.unitPrice;
      let metadataUpdates: Partial<OrderItem> = {};

      if (productResponse?.success) {
        const product = normalizeProduct(
          productResponse.data?.product || productResponse.product || productResponse?.data
        );
        currentStock = getStockNumber(product.stock ?? item.availableStock);
        unitLabel = getProductUnitLabel(product, unitLabel);
        const resolvedPrice = getProductPrice(product);
        if (resolvedPrice) {
          unitPrice = resolvedPrice;
        }
        metadataUpdates = {
          partNo: item.partNo || getProductPartNo(product),
          itemHsn: item.itemHsn || getProductHsn(product),
          category: item.category || getProductCategory(product),
          itemAlias: item.itemAlias || product.itemAlias,
          brand: item.brand || product.brand,
          description: item.description || product.description,
          baseUnits: item.baseUnits || product.baseUnits,
          additionalUnits: item.additionalUnits || product.additionalUnits,
        };
        console.log(`📊 Current stock from API: ${currentStock}`);
      } else {
        console.log('⚠️ Failed to get fresh stock data, using existing:', item.availableStock);
        console.log('📦 Full response:', productResponse);
      }

      if (newQuantity > currentStock) {
        Alert.alert('Insufficient Stock', `Only ${currentStock} ${unitLabel} available in stock.`);
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
                  unit: unitLabel,
                  unitPrice,
                  ...metadataUpdates,
                }
              : it
          ),
          gstType
        )
      );

      console.log(`✅ Quantity updated to ${newQuantity}`);
    } catch (error) {
      console.error('💥 Error updating quantity:', error);
      Alert.alert('Error', 'Failed to update quantity. Please try again.');
    } finally {
      setUpdatingQuantity(null);
    }
  };

  const removeProduct = (productId: string) => {
    setOrderItems(prevItems => prevItems.filter(item => item.productId !== productId));
  };

  const handleUpdateOrder = async () => {
    console.log('🚀 handleUpdateOrder called');
    
    if (!selectedDealer) {
      console.log('❌ No dealer selected');
      Alert.alert('Validation Error', 'Please select a dealer');
      return;
    }
    
    const itemsWithQuantity = orderItems.filter(item => item.quantity > 0);
    if (itemsWithQuantity.length === 0) {
      console.log('❌ No items with quantity > 0');
      Alert.alert('Validation Error', 'Please set quantity for at least one product');
      return;
    }

  if (mode === 'Other' && !customMode.trim()) {
    Alert.alert('Validation Error', 'Please specify the payment mode when selecting Other.');
    return;
  }
    
    console.log('✅ Validation passed, proceeding with update...');
    
    try {
      setSaving(true);
      console.log('🔄 Starting order update...');
      
      // Final stock validation
      for (const item of itemsWithQuantity) {
        const productResponse = await getProductById(item.productId);
        if (productResponse?.success) {
          const currentStock = getStockNumber(productResponse.product?.stock);
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
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          discount: item.discount ?? 0,
          gstRate: item.gstRate ?? DEFAULT_GST_RATE,
        })),
        totalQuantity: finalSummary.totalQuantity,
        totalAmount: finalSummary.totalAmount,
        taxableValueTotal: finalSummary.taxableValue,
        cgstTotal: finalSummary.cgstTotal,
        sgstTotal: finalSummary.sgstTotal,
        igstTotal: finalSummary.igstTotal,
        taxAmount: finalSummary.taxTotal,
        notes: orderNotes,
        status: order.status, // Keep current status
        orderType: order.orderType,
        paymentMethod: modePayload,
        modeSelection: mode,
        mode: modePayload,
        termsOfPayment: trimmedTermsOfPayment,
        otherReference: trimmedOtherReference,
        termsOfDelivery1: trimmedTermsOfDelivery1,
        termsOfDelivery2: trimmedTermsOfDelivery2,
        sellerState,
        buyerState,
        gstType,
      };

      if (mode === 'Other') {
        orderData.customMode = trimmedCustomMode;
      }
      
      console.log('📤 Sending order data:', orderData);
      console.log('📤 Order ID:', order._id);
      
      const response = await updateOrder(order._id, orderData);
      
      console.log('📥 API Response:', response);
      
      if (response?.success) {
        console.log('✅ Order updated successfully');
        const updatedOrder = response.order;
        
        // Navigate back to previous screen (ASMOrderList) immediately
        // The useFocusEffect in ASMOrderList will automatically refresh the orders
        navigation.goBack();
        
        // Show success message after a brief delay
        setTimeout(() => {
          Alert.alert('Success', 'Order updated successfully!');
        }, 300);
      } else {
        console.log('❌ Order update failed:', response?.message);
        Alert.alert('Error', response?.message || 'Failed to update order');
      }
    } catch (error) {
      console.error('💥 Error updating order:', error);
      Alert.alert('Error', 'Failed to update order. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredProducts = products.filter(product => {
    const name = (product?.productName ?? '').toLowerCase();
    const code = (product?.productCode ?? '').toLowerCase();
    if (!normalizedQuery) {
      return true;
    }
    return name.includes(normalizedQuery) || code.includes(normalizedQuery);
  });

  const renderOrderItem = ({ item }: { item: OrderItem }) => (
    <View style={styles.orderItemCard}>
      <View style={styles.orderItemHeader}>
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
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeProduct(item.productId)}
        >
          <Ionicons name="close-circle" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.quantityContainer}>
        <View style={styles.quantityRow}>
          <Text style={styles.quantityLabel}>Quantity</Text>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={[
                styles.quantityButton,
                (item.quantity <= 0 || updatingQuantity === item.productId) && styles.quantityButtonDisabled
              ]}
              onPress={() => updateQuantity(item.productId, item.quantity - 1)}
              disabled={item.quantity <= 0 || updatingQuantity === item.productId}
            >
              {updatingQuantity === item.productId ? (
                <ActivityIndicator size="small" color="#6B7280" />
              ) : (
                <Ionicons name="remove" size={18} color="#111827" />
              )}
            </TouchableOpacity>

            <TextInput
              style={[
                styles.quantityInput,
                updatingQuantity === item.productId && styles.quantityInputDisabled
              ]}
              value={String(item.quantity)}
              onChangeText={(text) => {
                const parsed = parseInt(text, 10);
                const newQuantity = Number.isNaN(parsed) ? 0 : parsed;
                updateQuantity(item.productId, newQuantity);
              }}
              keyboardType="numeric"
              editable={updatingQuantity !== item.productId}
            />

            <TouchableOpacity
              style={[
                styles.quantityButton,
                (item.quantity >= item.availableStock || updatingQuantity === item.productId) && styles.quantityButtonDisabled
              ]}
              onPress={() => updateQuantity(item.productId, item.quantity + 1)}
              disabled={item.quantity >= item.availableStock || updatingQuantity === item.productId}
            >
              {updatingQuantity === item.productId ? (
                <ActivityIndicator size="small" color="#6B7280" />
              ) : (
                <Ionicons name="add" size={18} color="#111827" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.stockText}>
          Available: {item.availableStock} {item.unit}
        </Text>
      </View>

      <View style={styles.orderItemTotal}>
        <Text style={styles.totalLabel}>Total:</Text>
        <Text style={styles.totalAmount}>{formatCurrency(item.totalAmount)}</Text>
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
    </View>
  );

  const renderProductItem = ({ item }: { item: Product }) => {
    const existingOrderItem = orderItems.find(orderItem => orderItem.productId === item._id);
    const isAlreadyAdded = Boolean(existingOrderItem);
    const stockNumber = getStockNumber(item.stock);
    const unitLabel = getProductUnitLabel(item, getUnitLabel(item.unit));
    const resolvedPrice = getProductPrice(item);
    const resolvedGst = getProductGstRate(item);
    const partNumber = getProductPartNo(item);
    const hsnCode = getProductHsn(item);
    const category = getProductCategory(item);

    return (
      <TouchableOpacity
        style={[
          styles.productItem,
          isAlreadyAdded && styles.addedProductItem
        ]}
        onPress={() => addProductToOrder(item)}
      >
        <View style={styles.productInfo}>
          <Text style={[
            styles.productName,
            isAlreadyAdded && styles.addedProductText
          ]}>
            {getProductName(item)}
          </Text>
          <Text style={[
            styles.productCode,
            isAlreadyAdded && styles.addedProductSubtext
          ]}>
            {item.productCode}
          </Text>
          <Text
            style={[
              styles.productPrice,
              isAlreadyAdded && styles.addedProductSubtext
            ]}
          >
            ₹{resolvedPrice.toFixed(2)}
          </Text>
          {partNumber ? (
            <Text
              style={[
                styles.dropdownItemMeta,
                isAlreadyAdded && styles.addedProductSubtext
              ]}
            >
              Part No: {partNumber}
            </Text>
          ) : null}
          <Text
            style={[
              styles.dropdownItemMeta,
              isAlreadyAdded && styles.addedProductSubtext
            ]}
          >
            Category: {category}
          </Text>
          <Text style={[
            styles.dropdownItemMeta,
            isAlreadyAdded && styles.addedProductSubtext
          ]}>
            GST: {resolvedGst}%
          </Text>
          {hsnCode ? (
            <Text
              style={[
                styles.dropdownItemMeta,
                isAlreadyAdded && styles.addedProductSubtext
              ]}
            >
              HSN: {hsnCode}
            </Text>
          ) : null}
          <Text
            style={[
              styles.productStock,
              isAlreadyAdded && styles.addedProductSubtext
            ]}
          >
            Stock: {stockNumber} {unitLabel}
          </Text>
          {isAlreadyAdded && (
            <Text style={styles.addedProductBadge}>
              In order · Qty {existingOrderItem?.quantity ?? 0}
            </Text>
          )}
        </View>
        <Ionicons 
          name={isAlreadyAdded ? 'refresh-circle' : 'add-circle-outline'} 
          size={24} 
          color={isAlreadyAdded ? '#10B981' : '#3B82F6'} 
        />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading order data...</Text>
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
        <Text style={styles.headerTitle}>Edit Order #{order.orderNumber}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Dealer Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer (Dealer) *</Text>
          <View style={styles.selectionRow}>
            <TouchableOpacity
              style={[styles.dropdown, styles.selectionButton]}
              onPress={() => setShowDealerDropdown(true)}
            >
              <Text
                style={[
                  styles.dropdownText,
                  !selectedDealer && styles.placeholderText
                ]}
              >
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
            <View style={styles.selectedInfoCard}>
              <Text style={styles.addressText}>
                {formatAddress(selectedDealer.address)}
              </Text>
            </View>
          )}

          {showDealerDropdown && (
            <View style={styles.dropdownList}>
              <ScrollView
                style={styles.dropdownScroll}
                contentContainerStyle={styles.dropdownScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {dealers.map((item) => (
                  <TouchableOpacity
                    key={item._id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedDealer(item);
                      setSelectedSubDealer(null);
                      setShowDealerDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{item.name}</Text>
                    {item.email ? (
                      <Text style={styles.dropdownItemSubtext}>{item.email}</Text>
                    ) : null}
                    {formatAddress(item.address) !== 'Address not specified' ? (
                      <Text style={styles.dropdownItemMeta}>
                        {formatAddress(item.address)}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Sub Dealer Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Address (Sub Dealer) (Optional)</Text>
          <View style={styles.selectionRow}>
            <TouchableOpacity
              style={[
                styles.dropdown,
                styles.selectionButton,
                subDealers.length === 0 && styles.disabledDropdown
              ]}
              onPress={() => subDealers.length > 0 && setShowSubDealerDropdown(true)}
              disabled={subDealers.length === 0}
            >
              <Text
                style={[
                  styles.dropdownText,
                  !selectedSubDealer && styles.placeholderText
                ]}
              >
                {subDealers.length === 0
                  ? 'No Sub Dealers Available'
                  : selectedSubDealer
                    ? selectedSubDealer.name
                    : 'Select Sub Dealer (Optional)'}
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
            <View style={styles.selectedInfoCard}>
              <Text style={styles.addressText}>
                {formatAddress(selectedSubDealer.address)}
              </Text>
            </View>
          )}

          {subDealers.length === 0 && (
            <Text style={styles.infoText}>
              No sub dealers available for the selected dealer
            </Text>
          )}

          {showSubDealerDropdown && subDealers.length > 0 && (
            <View style={styles.dropdownList}>
              <ScrollView
                style={styles.dropdownScroll}
                contentContainerStyle={styles.dropdownScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {subDealers.map((item) => (
                  <TouchableOpacity
                    key={item._id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedSubDealer(item);
                      setShowSubDealerDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{item.name}</Text>
                    {item.email ? (
                      <Text style={styles.dropdownItemSubtext}>{item.email}</Text>
                    ) : null}
                    {formatAddress(item.address) !== 'Address not specified' ? (
                      <Text style={styles.dropdownItemMeta}>
                        {formatAddress(item.address)}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Add Product */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.addProductButton}
            onPress={() => setShowProductDropdown(true)}
          >
            <Ionicons name="add-circle-outline" size={24} color="#3B82F6" />
            <Text style={styles.addProductButtonText}>Add Product</Text>
          </TouchableOpacity>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Order Items{orderItems.length > 0 ? ` (${orderItems.length})` : ''}
          </Text>
          {orderItems.length > 0 ? (
            orderItems.map((orderItem) => (
              <React.Fragment key={orderItem.productId}>
                {renderOrderItem({ item: orderItem })}
              </React.Fragment>
            ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No products added yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Tap "Add Product" to start building your order
              </Text>
            </View>
          )}
        </View>

        {/* Order Summary */}
        {orderItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
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
              <Text style={styles.summaryLabel}>Total Items:</Text>
              <Text style={styles.summaryValue}>{orderItems.length}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Quantity:</Text>
              <Text style={styles.summaryValue}>{orderSummary.totalQuantity}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Taxable Value:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(orderSummary.taxableValue)}</Text>
            </View>
            {hasCgst || hasSgst ? (
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
            ) : null}
            {hasIgst ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>IGST:</Text>
                <Text style={styles.summaryValue}>{formatCurrency(orderSummary.igstTotal)}</Text>
              </View>
            ) : null}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total GST:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(orderSummary.taxTotal)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryRowHighlight]}>
              <Text style={styles.summaryLabel}>Grand Total:</Text>
              <Text style={[styles.summaryValue, styles.totalAmount]}>
                {formatCurrency(orderSummary.totalAmount)}
              </Text>
            </View>
          </View>
        )}

        {/* Payment Mode */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Mode</Text>
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
          <Text style={styles.sectionTitle}>Order Notes</Text>
          <TextInput
            style={styles.notesInput}
            value={orderNotes}
            onChangeText={setOrderNotes}
            placeholder="Add any notes for this order..."
            multiline
            numberOfLines={3}
          />
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.updateButton,
            (!selectedDealer || orderItems.filter(item => item.quantity > 0).length === 0) && styles.disabledButton
          ]}
          onPress={handleUpdateOrder}
          disabled={!selectedDealer || orderItems.filter(item => item.quantity > 0).length === 0 || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.updateButtonText}>Update Order</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Product Selection Modal */}
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

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search products..."
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <FlatList
            data={filteredProducts}
            renderItem={renderProductItem}
            keyExtractor={(item) => item._id}
            style={styles.productsList}
            showsVerticalScrollIndicator={false}
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
    flex: 1,
    textAlign: 'center',
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
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectionButton: {
    flex: 1,
  },
  clearSelectionButton: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEE2E2',
    marginLeft: 8,
  },
  disabledDropdown: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    zIndex: 1000,
    maxHeight: 200,
    marginTop: 4,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownScrollContent: {
    paddingBottom: 8,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  dropdownItemSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  dropdownItemMeta: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  selectedInfoCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  addressText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  addProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#EBF4FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
  },
  addProductButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3B82F6',
    marginLeft: 8,
  },
  orderItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  orderItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderItemInfo: {
    flex: 1,
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
    marginBottom: 2,
  },
  orderItemMeta: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 2,
  },
  orderItemPrice: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  removeButton: {
    padding: 4,
  },
  quantityContainer: {
    marginBottom: 12,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityInput: {
    width: 64,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginHorizontal: 8,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    backgroundColor: '#FFFFFF',
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  quantityInputDisabled: {
    backgroundColor: '#E5E7EB',
    color: '#6B7280',
  },
  stockText: {
    fontSize: 12,
    color: '#6B7280',
  },
  orderItemTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
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
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryRowHighlight: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    textAlignVertical: 'top',
  },
  fieldInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    padding: 16,
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
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  updateButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    gap: 8,
  },
  updateButtonText: {
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 8,
  },
  productsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
    marginBottom: 2,
  },
  productStock: {
    fontSize: 12,
    color: '#6B7280',
  },
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
  addedProductBadge: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '500',
    marginTop: 2,
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: '#F3F4F6',
  },
  disabledInput: {
    opacity: 0.5,
    backgroundColor: '#F3F4F6',
  },
});

export default ASMEditOrder;
