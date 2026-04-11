import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import apiService from '../../../services/api';
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

interface Dealer {
  _id: string;
  LedgerName: string;
  name?: string; // For backward compatibility
  LedgerMobile?: string;
  mobile?: string; // For backward compatibility
  Email?: string;
  email?: string; // For backward compatibility
  LedgerAddress1?: string;
  LedgerAddress2?: string;
  LedgerState?: string;
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
  SDName: string;
  name?: string; // For backward compatibility
  SDMobileNo?: string;
  mobile?: string; // For backward compatibility
  SDEmail?: string;
  email?: string; // For backward compatibility
  SDAddress1?: string;
  SDAddress2?: string;
  SDAddress3?: string;
  SDState?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
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
  customerAddress?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
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

const AdminEditOrder = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { order } = route.params as { order: Order };
  
  // Store original order data for comparison
  const [originalOrder, setOriginalOrder] = useState<Order | null>(null);
  
  const { 
    user,
    getProducts, 
    getProductById, 
    updateOrder 
  } = useAuth();
  
  // Helper function to validate MongoDB ObjectId format
  const isValidObjectId = (id: string | undefined | null): boolean => {
    if (!id || typeof id !== 'string') return false;
    if (id === 'unknown' || id.trim() === '') return false;
    // MongoDB ObjectId is 24 character hex string
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

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
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);
  const [selectedSubDealer, setSelectedSubDealer] = useState<SubDealer | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
const [orderNotes, setOrderNotes] = useState('');
const [mode, setMode] = useState('Cash');
const [customMode, setCustomMode] = useState('');
const [termsOfPayment, setTermsOfPayment] = useState('');
const [otherReference, setOtherReference] = useState('');
const [termsOfDelivery1, setTermsOfDelivery1] = useState('');
const [termsOfDelivery2, setTermsOfDelivery2] = useState('');
  
  // Data state
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [subDealers, setSubDealers] = useState<SubDealer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // UI state
  const [showDealerDropdown, setShowDealerDropdown] = useState(false);
  const [showSubDealerDropdown, setShowSubDealerDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [dealerSearchQuery, setDealerSearchQuery] = useState('');
  const [subDealerSearchQuery, setSubDealerSearchQuery] = useState('');

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
    // Store original order data
    setOriginalOrder(JSON.parse(JSON.stringify(order)));
    fetchInitialData();
    initializeForm();
  }, []);

  // Debug: Log when selected dealer/subdealer changes
  useEffect(() => {
    if (selectedDealer) {
      console.log('📌 Selected Dealer Updated:', {
        id: selectedDealer._id,
        name: selectedDealer.LedgerName || selectedDealer.name,
      });
    } else {
      console.log('📌 Selected Dealer is NULL');
    }
  }, [selectedDealer]);

  useEffect(() => {
    if (selectedSubDealer) {
      console.log('📌 Selected SubDealer Updated:', {
        id: selectedSubDealer._id,
        name: selectedSubDealer.SDName || selectedSubDealer.name,
      });
    } else {
      console.log('📌 Selected SubDealer is NULL');
    }
  }, [selectedSubDealer]);


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
      const availableStock = 0;
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
      
      // Fetch dealers from Ledger model
      const dealersResponse = await apiService.adminGetAllDealers({ includeInactive: false });
      console.log('📡 Dealers response:', dealersResponse);
      
      let dealersList: Dealer[] = [];
      if (dealersResponse?.success && dealersResponse.data?.dealers) {
        // Map Ledger fields to Dealer interface
        dealersList = dealersResponse.data.dealers.map((ledger: any) => ({
          _id: ledger._id,
          LedgerName: ledger.LedgerName,
          name: ledger.LedgerName, // For backward compatibility
          LedgerMobile: ledger.LedgerMobile,
          mobile: ledger.LedgerMobile, // For backward compatibility
          Email: ledger.Email,
          email: ledger.Email, // For backward compatibility
          LedgerAddress1: ledger.LedgerAddress1,
          LedgerAddress2: ledger.LedgerAddress2,
          LedgerState: ledger.LedgerState,
          address: {
            street: ledger.LedgerAddress1 || '',
            city: ledger.LedgerAddress2 || '',
            state: ledger.LedgerState || '',
            pincode: '',
            country: 'India',
          },
        }));
        setDealers(dealersList);
      }
      
      // Fetch sub dealers from SubDealer model
      const subDealersResponse = await apiService.adminGetAllSubDealers({ includeInactive: false });
      console.log('📡 Sub dealers response:', subDealersResponse);
      
      let subDealersList: SubDealer[] = [];
      if (subDealersResponse?.success && subDealersResponse.data?.subdealers) {
        // Map SubDealer fields to SubDealer interface
        subDealersList = subDealersResponse.data.subdealers.map((subdealer: any) => ({
          _id: subdealer._id,
          SDName: subdealer.SDName,
          name: subdealer.SDName, // For backward compatibility
          SDMobileNo: subdealer.SDMobileNo,
          mobile: subdealer.SDMobileNo, // For backward compatibility
          SDEmail: subdealer.SDEmail,
          email: subdealer.SDEmail, // For backward compatibility
          SDAddress1: subdealer.SDAddress1,
          SDAddress2: subdealer.SDAddress2,
          SDAddress3: subdealer.SDAddress3,
          SDState: subdealer.SDState,
          address: {
            street: subdealer.SDAddress1 || '',
            city: subdealer.SDAddress2 || '',
            state: subdealer.SDState || '',
            pincode: subdealer.SDPincode || '',
            country: subdealer.SDCountry || 'India',
          },
        }));
        setSubDealers(subDealersList);
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

      // Sync order items with latest product info (unit, price)
      if (normalizedProducts.length > 0) {
        setOrderItems(prevItems =>
          applyGstToItems(
            prevItems.map(item => {
            const match = normalizedProducts.find(prod => prod._id === item.productId);
            if (!match) {
              return item;
            }

              const updatedUnit = getProductUnitLabel(match, item.unit);
              const updatedPrice = getProductPrice(match) || item.unitPrice;

            return {
              ...item,
              availableStock: 0,
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
      console.log('📋 Order data:', {
        dealerId: order.dealerId,
        dealerName: order.dealerName,
        customerId: order.customerId,
        customerName: order.customerName,
        subDealerId: order.subDealerId,
        subDealerName: order.subDealerName,
      });
      
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
      
      // Always try to set dealer if we have dealerName or customerName
      if (order.dealerName || order.customerName) {
        // First, try to find dealer by ID in the fetched list
        let currentDealer: Dealer | null = null;
        if (dealerId) {
          currentDealer = dealersList.find((d: Dealer) => {
            const dealerIdStr = d._id?.toString();
            const orderIdStr = dealerId.toString();
            return dealerIdStr === orderIdStr;
          }) || null;
        }
        
        if (currentDealer) {
          setSelectedDealer(currentDealer);
          console.log('✅ Dealer set from list:', currentDealer.LedgerName || currentDealer.name);
        } else {
          // Dealer not found by ID, try to find by name
          const dealerName = order.dealerName || order.customerName;
          if (dealerName) {
            const dealerByName = dealersList.find((d: Dealer) => {
              const name1 = (d.LedgerName || d.name || '').toLowerCase().trim();
              const name2 = dealerName.toLowerCase().trim();
              return name1 === name2;
            });
            
            if (dealerByName) {
              setSelectedDealer(dealerByName);
              console.log('✅ Dealer found by name and set:', dealerByName.LedgerName || dealerByName.name);
            } else {
              // Dealer not found in list, create fallback from order data
              console.log('⚠️ Dealer not found in Ledger list. Creating fallback from order data.');
              const customerAddress = order.customerAddress || {};
              const dealerObj = typeof order.dealerId === 'object' ? order.dealerId : null;
              const customerObj = typeof order.customerId === 'object' ? order.customerId : null;
              
              // Use dealerId if available, otherwise try to extract from order
              const finalDealerId = dealerId || 
                                   (typeof order.customerId === 'string' ? order.customerId : order.customerId?._id) ||
                                   (typeof order.dealerId === 'string' ? order.dealerId : order.dealerId?._id);
              
              // Create fallback dealer even if we don't have a valid ObjectId
              // Use a temporary ID if needed, or the actual ID if valid
              const dealerIdToUse = (finalDealerId && isValidObjectId(finalDealerId)) 
                ? finalDealerId 
                : `temp-dealer-${Date.now()}`; // Temporary ID for display purposes
              
              const fallbackDealer: Dealer = {
                _id: dealerIdToUse,
                LedgerName: dealerName,
                name: dealerName,
                LedgerMobile: dealerObj?.mobile || customerObj?.mobile || order.customerMobile || '',
                mobile: dealerObj?.mobile || customerObj?.mobile || order.customerMobile || '',
                Email: dealerObj?.email || customerObj?.email || order.customerEmail || '',
                email: dealerObj?.email || customerObj?.email || order.customerEmail || '',
                LedgerAddress1: customerAddress?.street || '',
                LedgerAddress2: customerAddress?.city || '',
                LedgerState: customerAddress?.state || '',
                address: customerAddress || {
                  street: '',
                  city: '',
                  state: '',
                  pincode: '',
                  country: 'India',
                },
              };
              
              // Add fallback dealer to the dealers list so it appears in dropdown
              const updatedDealers = [...dealersList, fallbackDealer];
              setDealers(updatedDealers);
              setSelectedDealer(fallbackDealer);
              console.log('✅ Fallback dealer created and set:', fallbackDealer.LedgerName, 'ID:', fallbackDealer._id);
            }
          }
        }
      } else if (dealerId) {
        // We have dealerId but no name, try to find it
        const currentDealer = dealersList.find((d: Dealer) => {
          const dealerIdStr = d._id?.toString();
          const orderIdStr = dealerId.toString();
          return dealerIdStr === orderIdStr;
        });
        if (currentDealer) {
          setSelectedDealer(currentDealer);
          console.log('✅ Dealer set from list (by ID only):', currentDealer.LedgerName || currentDealer.name);
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
      
      // Always try to set subdealer if we have subDealerName
      if (order.subDealerName || order.shippingAddress?.name) {
        // First, try to find subdealer by ID in the fetched list
        let currentSubDealer: SubDealer | null = null;
        if (subDealerId) {
          currentSubDealer = subDealersList.find((s: SubDealer) => {
            const subDealerIdStr = s._id?.toString();
            const orderIdStr = subDealerId.toString();
            return subDealerIdStr === orderIdStr;
          }) || null;
        }
        
        if (currentSubDealer) {
          setSelectedSubDealer(currentSubDealer);
          console.log('✅ SubDealer set from list:', currentSubDealer.SDName || currentSubDealer.name);
        } else {
          // Subdealer not found by ID, try to find by name
          const subDealerName = order.subDealerName || order.shippingAddress?.name;
          if (subDealerName) {
            const subDealerByName = subDealersList.find((s: SubDealer) => {
              const name1 = (s.SDName || s.name || '').toLowerCase().trim();
              const name2 = subDealerName.toLowerCase().trim();
              return name1 === name2;
            });
            
            if (subDealerByName) {
              setSelectedSubDealer(subDealerByName);
              console.log('✅ SubDealer found by name and set:', subDealerByName.SDName || subDealerByName.name);
            } else {
              // Subdealer not found in list, create fallback from order data
              console.log('⚠️ SubDealer not found in SubDealer list. Creating fallback from order data.');
              
              // Use subDealerId if available, otherwise try to extract from order
              const finalSubDealerId = subDealerId || 
                                       (typeof order.subDealerId === 'string' ? order.subDealerId : order.subDealerId?._id) ||
                                       order.shippingAddress?.subDealerId;
              
              // Create fallback subdealer even if we don't have a valid ObjectId
              // Use a temporary ID if needed, or the actual ID if valid
              const subDealerIdToUse = (finalSubDealerId && isValidObjectId(finalSubDealerId)) 
                ? finalSubDealerId 
                : `temp-subdealer-${Date.now()}`; // Temporary ID for display purposes
              
              const fallbackSubDealer: SubDealer = {
                _id: subDealerIdToUse,
                SDName: subDealerName,
                name: subDealerName,
                SDMobileNo: order.shippingAddress?.mobile || '',
                mobile: order.shippingAddress?.mobile || '',
                SDEmail: '',
                email: '',
                SDAddress1: order.shippingAddress?.address?.street || '',
                SDAddress2: order.shippingAddress?.address?.city || '',
                SDAddress3: '',
                SDState: order.shippingAddress?.address?.state || '',
                address: order.shippingAddress?.address || {
                  street: '',
                  city: '',
                  state: '',
                  pincode: '',
                  country: 'India',
                },
              };
              
              // Add fallback subdealer to the subDealers list so it appears in dropdown
              const updatedSubDealers = [...subDealersList, fallbackSubDealer];
              setSubDealers(updatedSubDealers);
              setSelectedSubDealer(fallbackSubDealer);
              console.log('✅ Fallback subdealer created and set:', fallbackSubDealer.SDName, 'ID:', fallbackSubDealer._id);
            }
          }
        }
      } else if (subDealerId) {
        // We have subDealerId but no name, try to find it
        const currentSubDealer = subDealersList.find((s: SubDealer) => {
          const subDealerIdStr = s._id?.toString();
          const orderIdStr = subDealerId.toString();
          return subDealerIdStr === orderIdStr;
        });
        if (currentSubDealer) {
          setSelectedSubDealer(currentSubDealer);
          console.log('✅ SubDealer set from list (by ID only):', currentSubDealer.SDName || currentSubDealer.name);
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
      const resolvedName = getProductName(freshProduct);
      const partNumber = getProductPartNo(freshProduct);
      const hsnCode = getProductHsn(freshProduct);
      const category = getProductCategory(freshProduct);
      const initialQuantity = 1;

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
        availableStock: 0,
      };

      setOrderItems((prevItems) =>
        applyGstToItems([...prevItems, newItem], gstType)
      );
      setShowProductDropdown(false);
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

      let unitLabel = item.unit;
      let unitPrice = item.unitPrice;
      let metadataUpdates: Partial<OrderItem> = {};

      if (productResponse?.success) {
        const product = normalizeProduct(
          productResponse.data?.product || productResponse.product || productResponse?.data
        );
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
      }

      setOrderItems((prevItems) =>
        applyGstToItems(
          prevItems.map((it) =>
            it.productId === productId
              ? {
                  ...it,
                  quantity: newQuantity,
                  availableStock: 0,
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
    
    // Validate dealer ID - allow any non-empty ID (including User model IDs and temp IDs)
    // The backend will handle validation and lookup
    if (!selectedDealer._id || selectedDealer._id === 'unknown' || (typeof selectedDealer._id === 'string' && selectedDealer._id.trim() === '')) {
      console.log('❌ Invalid dealer ID:', selectedDealer._id);
      Alert.alert(
        'Validation Error',
        'The dealer information is invalid. Please select a valid dealer from the list.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Try to refresh dealer list and reselect
              fetchInitialData();
            }
          }
        ]
      );
      return;
    }
    
    // Validate subdealer ID if selected - allow any non-empty ID
    if (selectedSubDealer && (!selectedSubDealer._id || selectedSubDealer._id === 'unknown' || (typeof selectedSubDealer._id === 'string' && selectedSubDealer._id.trim() === ''))) {
      console.log('❌ Invalid subdealer ID:', selectedSubDealer._id);
      Alert.alert(
        'Validation Error',
        'The subdealer information is invalid. Please select a valid subdealer from the list or remove the subdealer selection.',
        [
          {
            text: 'Remove Subdealer',
            onPress: () => setSelectedSubDealer(null)
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
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
      
      if (!originalOrder) {
        console.log('⚠️ Original order not available, sending full update');
        Alert.alert('Error', 'Original order data not available. Please refresh and try again.');
        setSaving(false);
        return;
      }
      
      const trimmedCustomMode = customMode.trim();
      const trimmedTermsOfPayment = termsOfPayment.trim();
      const trimmedOtherReference = otherReference.trim();
      const trimmedTermsOfDelivery1 = termsOfDelivery1.trim();
      const trimmedTermsOfDelivery2 = termsOfDelivery2.trim();
      const modePayload = mode === 'Other' ? (trimmedCustomMode || 'Other') : mode;

      // Build current order data
      // Validate that dealer ID is a valid ObjectId or a temporary ID (for fallback dealers)
      const currentDealerId = selectedDealer._id?.toString();
      const isTempDealerId = currentDealerId?.startsWith('temp-');
      
      if (!currentDealerId) {
        console.log('❌ No dealer ID found');
        Alert.alert(
          'Validation Error',
          'The dealer information is invalid. Please select a valid dealer from the list.',
          [
            {
              text: 'OK',
              onPress: () => {
                fetchInitialData();
              }
            }
          ]
        );
        setSaving(false);
        return;
      }
      
      // If it's a temporary ID, we'll set dealerId to null and rely on dealerName
      const finalDealerId = isTempDealerId ? null : (isValidObjectId(currentDealerId) ? currentDealerId : null);
      if (!isTempDealerId && !isValidObjectId(currentDealerId)) {
        console.log('❌ Invalid dealer ID:', currentDealerId);
        Alert.alert(
          'Validation Error',
          'The dealer information is invalid. Please select a valid dealer from the list.',
          [
            {
              text: 'OK',
              onPress: () => {
                fetchInitialData();
              }
            }
          ]
        );
        setSaving(false);
        return;
      }
      
      const currentSubDealerId = selectedSubDealer?._id?.toString() || null;
      const isTempSubDealerId = currentSubDealerId?.startsWith('temp-');
      
      // If it's a temporary ID, we'll set subDealerId to null and rely on subDealerName
      const finalSubDealerId = selectedSubDealer 
        ? (isTempSubDealerId ? null : (isValidObjectId(currentSubDealerId) ? currentSubDealerId : null))
        : null;
      
      if (selectedSubDealer && !isTempSubDealerId && (!currentSubDealerId || !isValidObjectId(currentSubDealerId))) {
        console.log('❌ Invalid subdealer ID:', currentSubDealerId);
        Alert.alert(
          'Validation Error',
          'The subdealer information is invalid. Please select a valid subdealer from the list or remove the subdealer selection.',
          [
            {
              text: 'Remove Subdealer',
              onPress: () => setSelectedSubDealer(null)
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                setSaving(false);
              }
            }
          ]
        );
        return;
      }
      const currentDealerName = selectedDealer.LedgerName || selectedDealer.name || '';
      const currentSubDealerName = selectedSubDealer ? (selectedSubDealer.SDName || selectedSubDealer.name || '') : null;
      const currentCustomerEmail = selectedDealer.Email || selectedDealer.email || '';
      const currentCustomerMobile = selectedDealer.LedgerMobile || selectedDealer.mobile || '';
      const currentCustomerAddress = normalizeAddress(selectedDealer.address);
      const currentShippingAddress = selectedSubDealer
        ? normalizeAddress(selectedSubDealer.address)
        : normalizeAddress(selectedDealer.address);
      
      const currentItems = itemsWithQuantity.map(item => ({
        productId: item.productId?.toString(),
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
      }));

      const finalSummary = calculateOrderSummary(itemsWithQuantity);
      
      // Compare with original order and build update object with only changed fields
      const orderData: any = {};
      
      // Compare dealer/customer info
      const originalDealerId = originalOrder.dealerId?.toString() || originalOrder.customerId?.toString() || null;
      if (finalDealerId !== originalDealerId || isTempDealerId) {
        // Always update if IDs differ or if we have a temporary ID (need to save name)
        orderData.customerId = finalDealerId;
        orderData.dealerId = finalDealerId;
        orderData.customerName = currentDealerName;
        orderData.dealerName = currentDealerName;
        orderData.customerEmail = currentCustomerEmail;
        orderData.customerMobile = currentCustomerMobile;
        orderData.customerAddress = currentCustomerAddress;
      } else {
        // Check if other dealer fields changed
        if (currentDealerName !== (originalOrder.dealerName || originalOrder.customerName || '')) {
          orderData.customerName = currentDealerName;
          orderData.dealerName = currentDealerName;
        }
        if (currentCustomerEmail !== (originalOrder.customerEmail || '')) {
          orderData.customerEmail = currentCustomerEmail;
        }
        if (currentCustomerMobile !== (originalOrder.customerMobile || '')) {
          orderData.customerMobile = currentCustomerMobile;
        }
        const originalAddress = originalOrder.customerAddress || {};
        if (JSON.stringify(currentCustomerAddress) !== JSON.stringify(originalAddress)) {
          orderData.customerAddress = currentCustomerAddress;
        }
      }
      
      // Compare subdealer info
      const originalSubDealerId = originalOrder.subDealerId?.toString() || null;
      if (finalSubDealerId !== originalSubDealerId || isTempSubDealerId) {
        // Always update if IDs differ or if we have a temporary ID (need to save name)
        orderData.subDealerId = finalSubDealerId;
        orderData.subDealerName = currentSubDealerName;
        orderData.shippingAddress = currentShippingAddress;
      } else if (finalSubDealerId) {
        // Subdealer exists, check if name or address changed
        if (currentSubDealerName !== (originalOrder.subDealerName || '')) {
          orderData.subDealerName = currentSubDealerName;
        }
        const originalShippingAddress = originalOrder.shippingAddress || {};
        if (JSON.stringify(currentShippingAddress) !== JSON.stringify(originalShippingAddress)) {
          orderData.shippingAddress = currentShippingAddress;
        }
      } else if (originalSubDealerId && !finalSubDealerId) {
        // Subdealer was removed
        orderData.subDealerId = null;
        orderData.subDealerName = null;
        orderData.shippingAddress = currentShippingAddress;
      }
      
      // Compare items - check if items array changed
      // Normalize original items for comparison
      const originalItems = (originalOrder.items || []).map((it: any) => {
        const productId = (typeof it.productId === 'object' ? it.productId?._id : it.productId)?.toString();
        return {
          productId,
          quantity: it.quantity || 0,
          unitPrice: it.unitPrice || it.price || 0,
          discount: it.discount || 0,
          gstRate: it.gstRate || DEFAULT_GST_RATE,
          unit: it.unit || '',
        };
      }).sort((a, b) => (a.productId || '').localeCompare(b.productId || ''));
      
      // Normalize current items for comparison
      const currentItemsForCompare = currentItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        gstRate: item.gstRate,
        unit: item.unit || '',
      })).sort((a, b) => (a.productId || '').localeCompare(b.productId || ''));
      
      // Deep comparison of items arrays
      const itemsChanged = JSON.stringify(originalItems) !== JSON.stringify(currentItemsForCompare);
      
      if (itemsChanged) {
        orderData.items = currentItems;
        // Recalculate totals if items changed
        orderData.totalQuantity = finalSummary.totalQuantity;
        orderData.totalAmount = finalSummary.totalAmount;
        orderData.taxableValueTotal = finalSummary.taxableValue;
        orderData.cgstTotal = finalSummary.cgstTotal;
        orderData.sgstTotal = finalSummary.sgstTotal;
        orderData.igstTotal = finalSummary.igstTotal;
        orderData.taxAmount = finalSummary.taxTotal;
      }
      
      // Compare other fields
      if (orderNotes !== (originalOrder.notes || '')) {
        orderData.notes = orderNotes;
      }
      
      if (modePayload !== (originalOrder.paymentMethod || originalOrder.mode || '')) {
        orderData.paymentMethod = modePayload;
        orderData.modeSelection = mode;
        orderData.mode = modePayload;
        if (mode === 'Other') {
          orderData.customMode = trimmedCustomMode;
        }
      } else if (mode === 'Other' && trimmedCustomMode !== ((originalOrder as any).customMode || '')) {
        orderData.customMode = trimmedCustomMode;
      }
      
      if (trimmedTermsOfPayment !== (originalOrder.termsOfPayment || '')) {
        orderData.termsOfPayment = trimmedTermsOfPayment;
      }
      
      if (trimmedOtherReference !== (originalOrder.otherReference || '')) {
        orderData.otherReference = trimmedOtherReference;
      }
      
      if (trimmedTermsOfDelivery1 !== (originalOrder.termsOfDelivery1 || '')) {
        orderData.termsOfDelivery1 = trimmedTermsOfDelivery1;
      }
      
      if (trimmedTermsOfDelivery2 !== (originalOrder.termsOfDelivery2 || '')) {
        orderData.termsOfDelivery2 = trimmedTermsOfDelivery2;
      }
      
      // Always include GST-related fields if items changed (they're recalculated)
      if (orderData.items) {
        orderData.sellerState = sellerState;
        orderData.buyerState = buyerState;
        orderData.gstType = gstType;
      }
      
      // If no changes detected, show message and return
      if (Object.keys(orderData).length === 0) {
        console.log('ℹ️ No changes detected');
        Alert.alert('Info', 'No changes were made to the order.');
        setSaving(false);
        return;
      }
      
      console.log('📤 Sending only changed fields:', orderData);
      console.log('📊 Changed fields count:', Object.keys(orderData).length);
      console.log('📤 Order ID:', order._id);
      
      const response = await updateOrder(order._id, orderData);
      
      console.log('📥 API Response:', response);
      
      if (response?.success) {
        console.log('✅ Order updated successfully');
        const updatedOrder = response.order;
        
        // Navigate to AdminOrderList and trigger refresh
        (navigation as any).navigate('AdminOrderList', { refreshOrders: true });
        
        // Show success message after navigation
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

  // Filter dealers based on search query
  const filteredDealers = useMemo(() => {
    if (!dealerSearchQuery.trim()) {
      return dealers;
    }
    const query = dealerSearchQuery.toLowerCase().trim();
    return dealers.filter(dealer => {
      const name = (dealer.LedgerName || dealer.name || '').toLowerCase();
      const email = (dealer.Email || dealer.email || '').toLowerCase();
      const mobile = (dealer.LedgerMobile || dealer.mobile || '').toLowerCase();
      return name.includes(query) || email.includes(query) || mobile.includes(query);
    });
  }, [dealers, dealerSearchQuery]);

  // Filter subdealers based on search query
  const filteredSubDealers = useMemo(() => {
    if (!subDealerSearchQuery.trim()) {
      return subDealers;
    }
    const query = subDealerSearchQuery.toLowerCase().trim();
    return subDealers.filter(subDealer => {
      const name = (subDealer.SDName || subDealer.name || '').toLowerCase();
      const email = (subDealer.SDEmail || subDealer.email || '').toLowerCase();
      const mobile = (subDealer.SDMobileNo || subDealer.mobile || '').toLowerCase();
      return name.includes(query) || email.includes(query) || mobile.includes(query);
    });
  }, [subDealers, subDealerSearchQuery]);

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
                updatingQuantity === item.productId && styles.quantityButtonDisabled
              ]}
              onPress={() => updateQuantity(item.productId, item.quantity + 1)}
              disabled={updatingQuantity === item.productId}
            >
              {updatingQuantity === item.productId ? (
                <ActivityIndicator size="small" color="#6B7280" />
              ) : (
                <Ionicons name="add" size={18} color="#111827" />
              )}
            </TouchableOpacity>
          </View>
        </View>

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

  const renderDealerItem = ({ item }: { item: Dealer }) => {
    const isSelected = selectedDealer && selectedDealer._id?.toString() === item._id?.toString();
    return (
      <TouchableOpacity
        style={[
          styles.productItem,
          isSelected && styles.addedProductItem
        ]}
        onPress={() => {
          setSelectedDealer(item);
          setSelectedSubDealer(null);
          setShowDealerDropdown(false);
          setDealerSearchQuery('');
        }}
      >
        <View style={styles.productInfo}>
          <Text style={[
            styles.productName,
            isSelected && styles.addedProductText
          ]}>
            {item.LedgerName || item.name}
          </Text>
          {(item.Email || item.email) ? (
            <Text style={[
              styles.productCode,
              isSelected && styles.addedProductSubtext
            ]}>
              {item.Email || item.email}
            </Text>
          ) : null}
          {(item.LedgerMobile || item.mobile) ? (
            <Text style={[
              styles.productPrice,
              isSelected && styles.addedProductSubtext
            ]}>
              {item.LedgerMobile || item.mobile}
            </Text>
          ) : null}
          {formatAddress(item.address) !== 'Address not specified' ? (
            <Text style={[
              styles.dropdownItemMeta,
              isSelected && styles.addedProductSubtext
            ]}>
              {formatAddress(item.address)}
            </Text>
          ) : null}
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
        )}
      </TouchableOpacity>
    );
  };

  const renderSubDealerItem = ({ item }: { item: SubDealer }) => {
    const isSelected = selectedSubDealer && selectedSubDealer._id?.toString() === item._id?.toString();
    return (
      <TouchableOpacity
        style={[
          styles.productItem,
          isSelected && styles.addedProductItem
        ]}
        onPress={() => {
          setSelectedSubDealer(item);
          setShowSubDealerDropdown(false);
          setSubDealerSearchQuery('');
        }}
      >
        <View style={styles.productInfo}>
          <Text style={[
            styles.productName,
            isSelected && styles.addedProductText
          ]}>
            {item.SDName || item.name}
          </Text>
          {(item.SDEmail || item.email) ? (
            <Text style={[
              styles.productCode,
              isSelected && styles.addedProductSubtext
            ]}>
              {item.SDEmail || item.email}
            </Text>
          ) : null}
          {(item.SDMobileNo || item.mobile) ? (
            <Text style={[
              styles.productPrice,
              isSelected && styles.addedProductSubtext
            ]}>
              {item.SDMobileNo || item.mobile}
            </Text>
          ) : null}
          {formatAddress(item.address) !== 'Address not specified' ? (
            <Text style={[
              styles.dropdownItemMeta,
              isSelected && styles.addedProductSubtext
            ]}>
              {formatAddress(item.address)}
            </Text>
          ) : null}
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
        )}
      </TouchableOpacity>
    );
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const existingOrderItem = orderItems.find(orderItem => orderItem.productId === item._id);
    const isAlreadyAdded = Boolean(existingOrderItem);
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
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
                numberOfLines={1}
              >
                {selectedDealer ? (selectedDealer.LedgerName || selectedDealer.name) : 'Select Dealer'}
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
                numberOfLines={1}
              >
                {subDealers.length === 0
                  ? 'No Sub Dealers Available'
                  : selectedSubDealer
                    ? (selectedSubDealer.SDName || selectedSubDealer.name)
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

      {/* Dealer Selection Modal */}
      <Modal
        visible={showDealerDropdown}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => {
          setShowDealerDropdown(false);
          setDealerSearchQuery('');
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowDealerDropdown(false);
                setDealerSearchQuery('');
              }}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Dealer</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              value={dealerSearchQuery}
              onChangeText={setDealerSearchQuery}
              placeholder="Search dealers..."
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <FlatList
            data={filteredDealers}
            renderItem={renderDealerItem}
            keyExtractor={(item) => item._id}
            style={styles.productsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>No dealers found</Text>
              </View>
            }
          />
        </View>
      </Modal>

      {/* Sub Dealer Selection Modal */}
      <Modal
        visible={showSubDealerDropdown}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => {
          setShowSubDealerDropdown(false);
          setSubDealerSearchQuery('');
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowSubDealerDropdown(false);
                setSubDealerSearchQuery('');
              }}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Sub Dealer</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              value={subDealerSearchQuery}
              onChangeText={setSubDealerSearchQuery}
              placeholder="Search sub dealers..."
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <FlatList
            data={filteredSubDealers}
            renderItem={renderSubDealerItem}
            keyExtractor={(item) => item._id}
            style={styles.productsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>No sub dealers found</Text>
              </View>
            }
          />
        </View>
      </Modal>

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
    </KeyboardAvoidingView>

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
    paddingTop: 10,
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
    zIndex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  selectionContainer: {
    position: 'relative',
    zIndex: 10,
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
    maxHeight: 300,
    marginTop: 4,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  dropdownScroll: {
    maxHeight: 300,
  },
  dropdownScrollContent: {
    paddingBottom: 8,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownItemSelected: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  dropdownItemContent: {
    flex: 1,
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  dropdownItemTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
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

export default AdminEditOrder;
