import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import apiService from '../../../services/api';
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
  LedgerName: string;
  name?: string; // For backward compatibility
  LedgerMobile?: string;
  mobile?: string; // For backward compatibility
  Email?: string;
  email?: string; // For backward compatibility
  LedgerAddress1?: string;
  LedgerAddress2?: string;
  LedgerState?: string;
  Other1?: string; // Price list name for dealer
  Other2?: string; // Dealer discount
  Other3?: string; // Price list name for sub-dealer
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

interface PriceListEntry {
  _id: string;
  itemguid: string;
  itemname: string;
  plname: string;
  plrate: number;
  other1?: string;
  other2?: string;
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
  priceListRate: number;
  difference: number;
  finalRate: number;
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

const AdminCreateOrder = () => {
  const navigation = useNavigation();
  const { user, getProducts, getProductById, createOrder } = useAuth();
  
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
  

  const [subDealerInput, setSubDealerInput] = useState('');
  const [filteredSubDealers, setFilteredSubDealers] = useState<SubDealer[]>([]);
  const [customSubDealerEntries, setCustomSubDealerEntries] = useState<SubDealer[]>([]);
  const subDealerInputRef = useRef<TextInput>(null);
  // State for dropdowns
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [subDealers, setSubDealers] = useState<SubDealer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [dealerSearchQuery, setDealerSearchQuery] = useState('');

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

  // Success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<{ orderNumber: string; totalAmount: number } | null>(null);

  // Add Sub Dealer modal
  const [showAddSubDealerModal, setShowAddSubDealerModal] = useState(false);
  const [addSubDealerForm, setAddSubDealerForm] = useState({ SDName: '', SDMobileNo: '', SDEmail: '', SDAddress1: '', SDAddress2: '', SDState: '' });
  const [addingSubDealer, setAddingSubDealer] = useState(false);
  
  // State for order details
  const [orderNotes, setOrderNotes] = useState('');
  const [mode, setMode] = useState('');
  const [customMode, setCustomMode] = useState('');
  const [termsOfPayment, setTermsOfPayment] = useState('');
  const [otherReference, setOtherReference] = useState('');
  const [termsOfDelivery1, setTermsOfDelivery1] = useState('');
  const [termsOfDelivery2, setTermsOfDelivery2] = useState('');

  // Price list state
  const [selectedPriceListName, setSelectedPriceListName] = useState<string | null>(null);
  const [priceListEntries, setPriceListEntries] = useState<PriceListEntry[]>([]);
  const [priceListDifference, setPriceListDifference] = useState(0);
  const [dealerDiscount, setDealerDiscount] = useState(0);
  const [loadingPriceLists, setLoadingPriceLists] = useState(false);

  // Manual rate mode: true when no price list is selected (dealer/sub-dealer has none assigned)
  const isManualRate = !selectedPriceListName;

  // Date of Order Entry - set to current date
  const [orderEntryDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

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
    if (selectedSubDealer?.SDState) {
      return extractState(selectedSubDealer.SDState);
    }
    if (selectedSubDealer?.address?.state) {
      return extractState(selectedSubDealer.address.state);
    }
    if (selectedDealer?.LedgerState) {
      return extractState(selectedDealer.LedgerState);
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
    const allEntries = [...subDealers, ...customSubDealerEntries];
    if (!subDealerInput.trim()) {
      setFilteredSubDealers(allEntries);
    } else {
      const query = subDealerInput.toLowerCase();
      const filtered = allEntries.filter((sd) =>
        (sd.SDName || sd.name || '').toLowerCase().includes(query)
      );
      setFilteredSubDealers(filtered);
    }
  }, [subDealerInput, subDealers, customSubDealerEntries]);

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
      
      // Fetch dealers from Ledger table
      console.log('🔍 Fetching dealers from Ledger...');
      const dealersResponse = await apiService.adminGetAllDealers({ includeInactive: false });
      console.log('📡 Dealers response:', dealersResponse);
      
      if (dealersResponse?.success && dealersResponse.data?.dealers) {
        // Map Ledger fields to Dealer interface
        const mappedDealers = dealersResponse.data.dealers.map((ledger: any) => ({
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
          Other1: ledger.Other1,
          Other2: ledger.Other2,
          Other3: ledger.Other3,
          address: {
            street: ledger.LedgerAddress1 || '',
            city: ledger.LedgerAddress2 || '',
            state: ledger.LedgerState || '',
            pincode: '',
            country: 'India',
          },
        }));
        setDealers(mappedDealers);
        console.log('✅ Dealers loaded from Ledger:', mappedDealers.length);
      } else {
        console.log('❌ Failed to load dealers:', dealersResponse?.message || 'Unknown error');
        Alert.alert('Error', 'Failed to load dealers: ' + (dealersResponse?.message || 'Unknown error'));
        setDealers([]);
      }
      
      // Don't fetch all sub dealers upfront - will fetch when dealer is selected
      setSubDealers([]);
      
      // Fetch products
      console.log('🔍 Fetching products...');
      const productsResponse = await getProducts({ limit: 100, isActive: true });
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

      // Filter out inactive products
      const normalizedProducts = productList.map(normalizeProduct);
      const activeProducts = normalizedProducts.filter(product => product.isActive !== false);
      setProducts(activeProducts);
      console.log('✅ Products loaded:', activeProducts.length, '(filtered', normalizedProducts.length - activeProducts.length, 'inactive)');

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
    setSelectedSubDealer(null);
    setShowDealerDropdown(false);

    // Auto-apply dealer's price list and discount from Ledger.Other1 / Other2
    const plName = dealer.Other1 && dealer.Other1 !== '-' ? dealer.Other1.trim() : null;
    const discount = parseFloat(dealer.Other2 || '0') || 0;
    setDealerDiscount(discount);
    if (plName) {
      await handleSelectPriceList(plName, discount);
    } else {
      // Reset price list if dealer has none assigned
      setSelectedPriceListName(null);
      setPriceListEntries([]);
      setPriceListDifference(0);
    }

    // Fetch subdealers for this specific dealer
    try {
      console.log('🔍 Fetching subdealers for dealer:', dealer._id);
      const response = await apiService.getSubDealersByDealer(dealer._id);
      console.log('📡 Subdealers response:', response);
      
      if (response?.success && response.data?.subdealers) {
        const subdealers = response.data.subdealers || [];
        // Map SubDealer fields to SubDealer interface
        const mappedSubDealers = subdealers.map((subdealer: any) => ({
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
        setSubDealers(mappedSubDealers);
        console.log('✅ Subdealers loaded for dealer:', mappedSubDealers.length);
      } else {
        console.log('ℹ️ No subdealers found for this dealer');
        setSubDealers([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch subdealers:', error);
      setSubDealers([]);
    }
  };

  const handleSubDealerSelect = async (subDealer: SubDealer) => {
    console.log('🎯 Sub dealer selected:', subDealer);
    setSelectedSubDealer(subDealer);
    setSubDealerInput(subDealer.SDName || subDealer.name || '');
    setShowSubDealerDropdown(false);

    // Sub-dealer uses dealer.Other3 price list, no discount
    if (selectedDealer) {
      const subPlName = selectedDealer.Other3 && selectedDealer.Other3 !== '-' ? selectedDealer.Other3.trim() : null;
      setDealerDiscount(0);
      if (subPlName) {
        await handleSelectPriceList(subPlName, 0);
      } else {
        setSelectedPriceListName(null);
        setPriceListEntries([]);
        setPriceListDifference(0);
      }
    }
  };

  const handleClearSubDealer = async () => {
    setSelectedSubDealer(null);
    setSubDealerInput('');
    setShowSubDealerDropdown(false);

    // Revert to dealer's own price list + discount
    if (selectedDealer) {
      const plName = selectedDealer.Other1 && selectedDealer.Other1 !== '-' ? selectedDealer.Other1.trim() : null;
      const discount = parseFloat(selectedDealer.Other2 || '0') || 0;
      setDealerDiscount(discount);
      if (plName) {
        await handleSelectPriceList(plName, discount);
      } else {
        setSelectedPriceListName(null);
        setPriceListEntries([]);
        setPriceListDifference(0);
      }
    }
  };

  const handleSaveCustomSubDealer = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const alreadyExists =
      [...subDealers, ...customSubDealerEntries].some(
        (sd) => (sd.SDName || sd.name || '').toLowerCase() === trimmed.toLowerCase()
      );
    const customEntry: SubDealer = {
      _id: `custom_${Date.now()}`,
      SDName: trimmed,
      name: trimmed,
    };
    if (!alreadyExists) {
      setCustomSubDealerEntries((prev) => [...prev, customEntry]);
    }
    setSelectedSubDealer(customEntry);
    setSubDealerInput(trimmed);
    setShowSubDealerDropdown(false);

    // Apply same Other3 pricing logic as regular sub-dealer select
    if (selectedDealer) {
      const subPlName = selectedDealer.Other3 && selectedDealer.Other3 !== '-' ? selectedDealer.Other3.trim() : null;
      setDealerDiscount(0);
      if (subPlName) {
        await handleSelectPriceList(subPlName, 0);
      } else {
        setSelectedPriceListName(null);
        setPriceListEntries([]);
        setPriceListDifference(0);
      }
    }
  };

  const handleSelectPriceList = async (plname: string | null, discountOverride?: number) => {
    setSelectedPriceListName(plname);

    if (!plname) {
      setPriceListEntries([]);
      setPriceListDifference(0);
      setOrderItems((prev) =>
        applyGstToItems(
          prev.map((item) => {
            const product = products.find((p) => p._id === item.productId);
            const originalPrice = product ? getProductPrice(product) : item.unitPrice;
            return { ...item, priceListRate: 0, difference: 0, finalRate: 0, unitPrice: originalPrice || item.unitPrice };
          }),
          gstType
        )
      );
      return;
    }

    try {
      setLoadingPriceLists(true);
      const response = await apiService.getPriceLists({ plname });
      if (response?.success && Array.isArray(response.data)) {
        const entries: PriceListEntry[] = response.data;
        setPriceListEntries(entries);
        // Discount comes from dealer's Other2; discountOverride used when called from handleDealerSelect
        const discount = discountOverride !== undefined ? discountOverride : dealerDiscount;
        setPriceListDifference(discount);
        setOrderItems((prev) =>
          applyGstToItems(
            prev.map((item) => {
              const entry = entries.find(
                (e) => e.itemname.toLowerCase() === item.productName.toLowerCase()
              );
              if (entry) {
                const plrate = entry.plrate || 0;
                const finalRate = plrate + discount;
                return {
                  ...item,
                  priceListRate: plrate,
                  difference: discount,
                  finalRate,
                  unitPrice: Math.max(0, finalRate > 0 ? finalRate : plrate),
                };
              }
              return { ...item, priceListRate: 0, difference: 0, finalRate: 0 };
            }),
            gstType
          )
        );
      }
    } catch (err) {
      console.error('Failed to fetch price list entries:', err);
    } finally {
      setLoadingPriceLists(false);
    }
  };

  const handleAddSubDealer = async () => {
    const { SDName, SDMobileNo, SDEmail, SDAddress1, SDAddress2, SDState } = addSubDealerForm;
    if (!SDName.trim()) {
      Alert.alert('Required', 'Sub dealer name is required');
      return;
    }
    if (!SDMobileNo.trim()) {
      Alert.alert('Required', 'Mobile number is required');
      return;
    }
    try {
      setAddingSubDealer(true);
      const data = {
        SDName: SDName.trim(),
        SDMobileNo: SDMobileNo.trim(),
        SDEmail: SDEmail.trim() || '',
        SDContactPerson: SDName.trim(),
        SDAddress1: SDAddress1.trim() || '',
        SDAddress2: SDAddress2.trim() || '',
        SDState: SDState.trim() || '',
        SDType: 'Sub Dealer' as const,
        dealerId: selectedDealer?._id,
      };
      const result = await apiService.adminCreateSubDealer(data);
      if (result?.success) {
        setShowAddSubDealerModal(false);
        setAddSubDealerForm({ SDName: '', SDMobileNo: '', SDEmail: '', SDAddress1: '', SDAddress2: '', SDState: '' });

        // Re-fetch the full list from the server so the new entry (with real _id) appears
        if (selectedDealer) {
          try {
            const refreshed = await apiService.getSubDealersByDealer(selectedDealer._id);
            if (refreshed?.success && refreshed.data?.subdealers) {
              const mapped: SubDealer[] = refreshed.data.subdealers.map((sd: any) => ({
                _id: sd._id,
                SDName: sd.SDName,
                name: sd.SDName,
                SDMobileNo: sd.SDMobileNo,
                mobile: sd.SDMobileNo,
                SDEmail: sd.SDEmail,
                email: sd.SDEmail,
                SDAddress1: sd.SDAddress1,
                SDAddress2: sd.SDAddress2,
                SDAddress3: sd.SDAddress3,
                SDState: sd.SDState,
                address: {
                  street: sd.SDAddress1 || '',
                  city: sd.SDAddress2 || '',
                  state: sd.SDState || '',
                  pincode: sd.SDPincode || '',
                  country: sd.SDCountry || 'India',
                },
              }));
              setSubDealers(mapped);
              const newEntry = mapped.find(sd => sd.SDName === data.SDName) || mapped[mapped.length - 1];
              if (newEntry) {
                setSelectedSubDealer(newEntry);
                setSubDealerInput(newEntry.SDName || newEntry.name || '');
              }
            }
          } catch {
            // Fallback: keep local state with temp entry
            const tempEntry: SubDealer = {
              _id: `new_${Date.now()}`,
              SDName: data.SDName,
              name: data.SDName,
              SDMobileNo: data.SDMobileNo,
              mobile: data.SDMobileNo,
              SDEmail: data.SDEmail,
              email: data.SDEmail,
              SDAddress1: data.SDAddress1,
              SDAddress2: data.SDAddress2,
              SDState: data.SDState,
              address: { street: data.SDAddress1, city: data.SDAddress2, state: data.SDState, country: 'India' },
            };
            setSubDealers(prev => [...prev, tempEntry]);
            setSelectedSubDealer(tempEntry);
            setSubDealerInput(data.SDName);
          }
        }
      } else {
        Alert.alert('Error', result?.message || 'Failed to add sub dealer');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add sub dealer');
    } finally {
      setAddingSubDealer(false);
    }
  };

  const createSelectionState = (): ProductSelectionState => ({
    quantity: '0',
    validating: false,
    isValid: false,
    availableStock: 0,
    error: '',
    adding: false,
    lastValidatedQuantity: undefined,
    productData: undefined,
  });

  const getSelectionState = (product: Product): ProductSelectionState =>
    productSelections[product._id] ?? createSelectionState();

  const getFreshProduct = async (productId: string): Promise<Product> => {
    const response = await getProductById(productId);
    if (!response?.success || !response.product) {
      throw new Error(response?.message || 'Product not available at the moment.');
    }
  const rawProduct = response.product || response.data?.product || response.data;
  return normalizeProduct(rawProduct);
  };

  const handleProductQuantityChange = (product: Product, rawValue: string) => {
    // Allow digits and a single decimal point (including values like .23 or 0.12)
    const sanitized = rawValue
      .replace(/[^0-9.]/g, '')
      .replace(/(\..*)\./g, '$1');
    const quantityString = sanitized === '' ? '0' : sanitized;
    const quantityNumber = parseFloat(quantityString) || 0;

    setProductSelections((prev) => {
      const prevState = prev[product._id] ?? createSelectionState();
      return {
        ...prev,
        [product._id]: {
          ...prevState,
          quantity: quantityString,
          isValid: quantityNumber > 0,
          error: '',
        },
      };
    });
  };

  const handleProductQuantityBlur = (product: Product) => {
    const selection = getSelectionState(product);
    const quantityNumber = parseFloat(selection.quantity) || 0;
    // Normalise display: ".23" → "0.23", "0." → "0", "" → "0"
    const normalised = quantityNumber > 0 ? String(quantityNumber) : '0';
    if (normalised !== selection.quantity) {
      setProductSelections((prev) => ({
        ...prev,
        [product._id]: {
          ...(prev[product._id] ?? createSelectionState()),
          quantity: normalised,
        },
      }));
    }
  };

  const adjustProductSelectionQuantity = (product: Product, delta: number) => {
    const currentSelection = getSelectionState(product);
    const currentQuantity = parseFloat(currentSelection.quantity) || 0;
    const nextQuantity = Math.max(0, Math.round((currentQuantity + delta) * 100) / 100);
    handleProductQuantityChange(product, String(nextQuantity));
  };

  const handleAddProductSelection = async (product: Product) => {
    const selection = getSelectionState(product);
    const quantityNumber = parseFloat(selection.quantity) || 0;

    if (quantityNumber <= 0 || selection.adding) {
      return;
    }

    setProductSelections((prev) => {
      const prevState = prev[product._id] ?? createSelectionState();
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

      if (!freshProduct) {
        freshProduct = await getFreshProduct(product._id);
      }

      const success = await addProductToOrder(product, quantityNumber, freshProduct);

      if (success) {
        const resetState = createSelectionState();
        setProductSelections((prev) => ({
          ...prev,
          [product._id]: resetState,
        }));
      } else {
        setProductSelections((prev) => {
          const prevState = prev[product._id] ?? createSelectionState();
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
        const prevState = prev[product._id] ?? createSelectionState();
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
        const quantity = parseFloat(selection.quantity) || 0;
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

        if (!freshProduct) {
          freshProduct = await getFreshProduct(product._id);
        }

        const success = await addProductToOrder(product, quantity, freshProduct);
        if (success) {
          addedCount += 1;
          setProductSelections((prev) => ({
            ...prev,
            [product._id]: createSelectionState(),
          }));
        } else {
          const message = `${freshProduct.productName}: Failed to add to order.`;
          errorMessages.push(message);
          setProductSelections((prev) => ({
            ...prev,
            [product._id]: {
              ...(prev[product._id] ?? createSelectionState()),
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
            ...(prev[product._id] ?? createSelectionState()),
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
      const resolvedPrice = getProductPrice(freshProduct);
      const resolvedGstRate = getProductGstRate(freshProduct);
      const resolvedName = getProductName(freshProduct);
      const partNumber = getProductPartNo(freshProduct);
      const hsnCode = getProductHsn(freshProduct);
      const category = getProductCategory(freshProduct);

      // Look up price list entry for this product
      let plRate = 0;
      let plDifference = 0;
      let plFinalRate = 0;
      if (selectedPriceListName && priceListEntries.length > 0) {
        const entry = priceListEntries.find(
          (e) => e.itemname.toLowerCase() === resolvedName.toLowerCase()
        );
        if (entry) {
          plRate = entry.plrate || 0;
          plDifference = priceListDifference; // global difference from price list
          plFinalRate = plRate + plDifference;
        }
      }
      const effectiveUnitPrice = plRate > 0 ? Math.max(0, plFinalRate) : resolvedPrice;

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
            unitPrice: effectiveUnitPrice,
            priceListRate: plRate,
            difference: plDifference,
            finalRate: plFinalRate,
            gstRate: previous.gstRate ?? resolvedGstRate,
            availableStock: 0,
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
            unitPrice: effectiveUnitPrice,
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
            availableStock: 0,
            priceListRate: plRate,
            difference: plDifference,
            finalRate: plFinalRate,
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
    
    setOrderItems((prevItems) =>
      applyGstToItems(
        prevItems.map((it) =>
          it.productId === productId
            ? {
                ...it,
                quantity: newQuantity,
              }
            : it
        ),
        gstType
      )
    );
    console.log(`✅ Updated quantity for ${item.productName}: ${newQuantity}`);
  };

  const removeItem = (productId: string) => {
    setOrderItems(orderItems.filter(item => item.productId !== productId));
  };

  const handleRemoveProductFromOrder = (product: Product) => {
    const resolvedUnit = getProductUnitLabel(product, getUnitLabel(product.unit));
    const resolvedPrice = getProductPrice(product);
    setOrderItems((prev) =>
      prev.filter(
        (it) =>
          !(it.productId === product._id &&
            it.unitPrice === resolvedPrice &&
            it.unit === resolvedUnit)
      )
    );
    // Reset the selection input back to zero
    setProductSelections((prev) => ({
      ...prev,
      [product._id]: createSelectionState(),
    }));
  };

  const handleCreateOrder = async () => {
    if (!selectedDealer) {
      Alert.alert('Validation Error', 'Please select a dealer');
      return;
    }
    
    // Validate dealer ID
    if (!selectedDealer._id) {
      Alert.alert('Validation Error', 'Dealer ID is missing. Please select a valid dealer.');
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
      
      const trimmedCustomMode = customMode.trim();
      const trimmedTermsOfPayment = termsOfPayment.trim();
      const trimmedOtherReference = otherReference.trim();
      const trimmedTermsOfDelivery1 = termsOfDelivery1.trim();
      const trimmedTermsOfDelivery2 = termsOfDelivery2.trim();
      const modePayload = mode === 'Other' ? (trimmedCustomMode || 'Other') : mode;

      const finalSummary = calculateOrderSummary(itemsWithQuantity);
      
      // Ensure IDs are properly converted to strings
      const dealerId = selectedDealer._id?.toString();
      const rawSubDealerId = selectedSubDealer?._id?.toString();
      const subDealerId =
        rawSubDealerId && !rawSubDealerId.startsWith('custom_') ? rawSubDealerId : null;
      
      if (!dealerId) {
        Alert.alert('Validation Error', 'Invalid dealer ID. Please select a valid dealer.');
        setSaving(false);
        return;
      }
      
      console.log('📋 Order creation - Dealer ID:', dealerId);
      console.log('📋 Order creation - SubDealer ID:', subDealerId);
      console.log('📋 Order creation - Selected Dealer:', selectedDealer);
      console.log('📋 Order creation - Selected SubDealer:', selectedSubDealer);
      
      const orderData: any = {
        customerId: dealerId,
        customerName: selectedDealer.LedgerName || selectedDealer.name || '',
        customerEmail: selectedDealer.Email || selectedDealer.email || '',
        customerMobile: selectedDealer.LedgerMobile || selectedDealer.mobile || '',
        customerAddress: normalizeAddress(selectedDealer.address),
        dealerId: dealerId, // Save dealer ID separately (from Ledger)
        dealerName: selectedDealer.LedgerName || selectedDealer.name || '',
        subDealerId: subDealerId, // Save subdealer ID separately (from SubDealer)
        subDealerName: selectedSubDealer ? (selectedSubDealer.SDName || selectedSubDealer.name || '') : null,
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
          priceListRate: item.priceListRate ?? 0,
          difference: item.difference ?? 0,
          finalRate: item.finalRate ?? item.unitPrice,
        })),
        priceListName: selectedPriceListName || null,
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
        orderEntryDate: orderEntryDate,
        status: 'draft',
        orderType: 'admin_created',
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
            setSelectedPriceListName(null);
            setPriceListEntries([]);
            setPriceListDifference(0);
            setDealerDiscount(0);

            setCreatedOrder({
              orderNumber: response.order?.orderNumber || 'N/A',
              totalAmount: finalSummary.totalAmount,
            });
            setShowSuccessModal(true);
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
      <Text style={styles.dropdownItemText}>{item.LedgerName || item.name}</Text>
      <Text style={styles.dropdownItemSubtext}>{item.LedgerMobile || item.mobile}</Text>
      {(item.Email || item.email) ? (
        <Text style={styles.dropdownItemMeta}>{item.Email || item.email}</Text>
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
      <Text style={styles.dropdownItemText}>{item.SDName || item.name}</Text>
      <Text style={styles.dropdownItemSubtext}>{formatAddress(item.address)}</Text>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }: { item: Product }) => {
    const selection = getSelectionState(item);
    const quantityNumber = parseFloat(selection.quantity) || 0;
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

    const addButtonVisible = quantityNumber > 0;
    const isLoading = selection.adding;
    const canAdd = addButtonVisible && !isLoading;
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
              <Ionicons name="remove" size={18} color="#111827" />
            </TouchableOpacity>
            <TextInput
              style={styles.selectionQuantityInput}
              value={selection.quantity}
              onChangeText={(value) => handleProductQuantityChange(item, value)}
              onBlur={() => handleProductQuantityBlur(item)}
              keyboardType="decimal-pad"
              returnKeyType="done"
              editable={!isLoading}
              maxLength={10}
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
              <Ionicons name="add" size={18} color="#111827" />
            </TouchableOpacity>
          </View>

          <View style={styles.productActionButtons}>
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

            {existingItem && (
              <TouchableOpacity
                style={styles.removeProductActionButton}
                onPress={() => handleRemoveProductFromOrder(item)}
                disabled={isLoading}
              >
                <Ionicons name="trash-outline" size={15} color="#EF4444" />
                <Text style={styles.removeProductActionButtonText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

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
        {isManualRate ? (
          <View style={styles.manualRateRow}>
            <Text style={styles.plItemLabel}>Rate (Manual)</Text>
            <TextInput
              style={styles.manualRateInput}
              value={item.unitPrice > 0 ? item.unitPrice.toString() : ''}
              onChangeText={(text) => {
                const rate = parseFloat(text) || 0;
                setOrderItems((prev) =>
                  applyGstToItems(
                    prev.map((i) =>
                      i.productId === item.productId && i.unit === item.unit
                        ? { ...i, unitPrice: rate }
                        : i
                    ),
                    gstType
                  )
                );
              }}
              keyboardType="numeric"
              placeholder="Enter rate"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        ) : (
          <Text style={styles.orderItemPrice}>{formatCurrency(item.unitPrice)}</Text>
        )}
        {item.priceListRate > 0 && (
          <View style={styles.plItemRow}>
            <View style={styles.plItemField}>
              <Text style={styles.plItemLabel}>List Rate</Text>
              <Text style={styles.plItemValue}>₹{item.priceListRate.toFixed(2)}</Text>
            </View>
            <View style={styles.plItemField}>
              <Text style={styles.plItemLabel}>Difference</Text>
              <Text style={[styles.plItemValue, item.difference < 0 && styles.plItemValueAmber]}>
                {item.difference > 0 ? '+' : ''}{item.difference}
              </Text>
            </View>
            <View style={styles.plItemField}>
              <Text style={styles.plItemLabel}>Final Rate</Text>
              <Text style={[styles.plItemValue, styles.plFinalRateValue]}>₹{item.finalRate.toFixed(2)}</Text>
            </View>
          </View>
        )}
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

  const filteredProducts = useMemo(() => {
    const q = productSearchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p =>
      p.productName?.toLowerCase().includes(q) ||
      p.productCode?.toLowerCase().includes(q) ||
      p.partNo?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    );
  }, [products, productSearchQuery]);

  const filteredDealers = useMemo(() => {
    const q = dealerSearchQuery.trim().toLowerCase();
    if (!q) return dealers;
    return dealers.filter(d => {
      const name = (d.LedgerName || d.name || '').toLowerCase();
      const email = (d.Email || d.email || '').toLowerCase();
      const mobile = (d.LedgerMobile || d.mobile || '').toLowerCase();
      return name.includes(q) || email.includes(q) || mobile.includes(q);
    });
  }, [dealers, dealerSearchQuery]);

  const productSelectionEntries = products.map((product) => {
    const selection = getSelectionState(product);
    const quantity = parseFloat(selection.quantity) || 0;
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

  const renderSuccessModal = () => (
    <Modal
      visible={showSuccessModal}
      animationType="fade"
      transparent
      onRequestClose={() => setShowSuccessModal(false)}
    >
      <View style={styles.successOverlay}>
        <View style={styles.successCard}>
          {/* Animated tick circle */}
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark-circle" size={64} color="#10B981" />
          </View>

          <Text style={styles.successTitle}>Order Created!</Text>
          <Text style={styles.successSub}>Your order has been placed successfully.</Text>

          <View style={styles.successInfoBox}>
            <View style={styles.successInfoRow}>
              <Text style={styles.successInfoLabel}>Order Number</Text>
              <Text style={styles.successInfoValue}>#{createdOrder?.orderNumber}</Text>
            </View>
            <View style={[styles.successInfoRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.successInfoLabel}>Total Amount</Text>
              <Text style={[styles.successInfoValue, { color: '#10B981', fontWeight: '800' }]}>
                ₹ {createdOrder?.totalAmount.toFixed(2)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.successPrimaryBtn}
            onPress={() => {
              setShowSuccessModal(false);
              (navigation as any).navigate('AdminOrderList');
            }}
          >
            <Ionicons name="list-outline" size={18} color="#fff" />
            <Text style={styles.successPrimaryBtnText}>View Order List</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.successSecondaryBtn}
            onPress={() => setShowSuccessModal(false)}
          >
            <Text style={styles.successSecondaryBtnText}>Create Another Order</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {renderSuccessModal()}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#513737" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Order</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
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
                  setDealerDiscount(0);
                  setSelectedPriceListName(null);
                  setPriceListEntries([]);
                  setPriceListDifference(0);
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
        <View style={[styles.section, { zIndex: 10 }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Shipping Address (Sub Dealer) - Optional</Text>
            {selectedDealer && (
              <TouchableOpacity
                style={styles.addSubDealerBtn}
                onPress={() => {
                  setAddSubDealerForm({ SDName: '', SDMobileNo: '', SDEmail: '', SDAddress1: '', SDAddress2: '', SDState: '' });
                  setShowAddSubDealerModal(true);
                }}
              >
                <Ionicons name="add-circle-outline" size={18} color="#3B82F6" />
                <Text style={styles.addSubDealerBtnText}>Add New</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.inlineComboBox}>
            <View style={styles.inlineComboBoxInputRow}>
              <Ionicons name="search-outline" size={16} color="#6B7280" />
              <TextInput
                ref={subDealerInputRef}
                style={styles.inlineComboBoxInput}
                placeholder={loading ? 'Loading sub dealers...' : 'Type name or select...'}
                placeholderTextColor="#9CA3AF"
                value={subDealerInput}
                editable={!loading}
                onChangeText={(text) => {
                  setSubDealerInput(text);
                  setShowSubDealerDropdown(true);
                  if (selectedSubDealer && (selectedSubDealer.SDName || selectedSubDealer.name) !== text) {
                    handleClearSubDealer();
                  }
                }}
                onFocus={() => setShowSubDealerDropdown(true)}
                onBlur={() => {
                  setTimeout(() => {
                    setShowSubDealerDropdown(false);
                    const trimmed = subDealerInput.trim();
                    if (trimmed && !selectedSubDealer) {
                      handleSaveCustomSubDealer(trimmed);
                    }
                  }, 200);
                }}
                returnKeyType="done"
                onSubmitEditing={() => {
                  const trimmed = subDealerInput.trim();
                  if (trimmed && !selectedSubDealer) {
                    handleSaveCustomSubDealer(trimmed);
                  }
                  setShowSubDealerDropdown(false);
                }}
              />
              {subDealerInput.length > 0 && (
                <TouchableOpacity
                  onPress={() => handleClearSubDealer()}
                >
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => setShowSubDealerDropdown((v) => !v)}
              >
                <Ionicons
                  name={showSubDealerDropdown ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            {showSubDealerDropdown && (
              <View style={styles.inlineDropdownList}>
                <ScrollView
                  style={styles.inlineDropdownScroll}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  {filteredSubDealers.length === 0 && !subDealerInput.trim() && (
                    <View style={styles.inlineDropdownEmpty}>
                      <Text style={styles.inlineDropdownEmptyText}>No sub dealers available</Text>
                    </View>
                  )}
                  {filteredSubDealers.map((item) => (
                    <TouchableOpacity
                      key={item._id}
                      style={styles.inlineDropdownItem}
                      onPress={() => handleSubDealerSelect(item)}
                    >
                      <Text style={styles.inlineDropdownItemName}>{item.SDName || item.name}</Text>
                      {item.address && formatAddress(item.address) !== 'Address not specified' && (
                        <Text style={styles.inlineDropdownItemAddress}>{formatAddress(item.address)}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                  {subDealerInput.trim().length > 0 &&
                    !filteredSubDealers.some(
                      (sd) =>
                        (sd.SDName || sd.name || '').toLowerCase() ===
                        subDealerInput.trim().toLowerCase()
                    ) && (
                      <TouchableOpacity
                        style={styles.inlineDropdownSaveCustom}
                        onPress={() => {
                          handleSaveCustomSubDealer(subDealerInput);
                          setShowSubDealerDropdown(false);
                        }}
                      >
                        <Ionicons name="add-circle-outline" size={16} color="#3B82F6" />
                        <Text style={styles.inlineDropdownSaveCustomText}>
                          Use "{subDealerInput.trim()}" as sub dealer name
                        </Text>
                      </TouchableOpacity>
                    )}
                </ScrollView>
              </View>
            )}
          </View>

          {selectedSubDealer && (
            <View style={styles.comboBoxSelectedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#059669" />
              <Text style={styles.comboBoxSelectedText}>
                {selectedSubDealer._id.startsWith('custom_') ? 'Custom entry saved' : 'Selected from list'}
              </Text>
            </View>
          )}
          {selectedSubDealer?.address && formatAddress(selectedSubDealer.address) !== 'Address not specified' && (
            <Text style={styles.addressText}>{formatAddress(selectedSubDealer.address)}</Text>
          )}
          {!selectedSubDealer && subDealers.length === 0 && !loading && (
            <Text style={styles.infoText}>Choose a dealer to enable sub-dealer selection, or leave blank to ship to the dealer.</Text>
          )}
        </View>

        {/* Price List — auto-filled from dealer */}
        {(selectedPriceListName || loadingPriceLists) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price List</Text>
            {loadingPriceLists ? (
              <View style={styles.plChip}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={styles.plChipLoading}>Loading price list...</Text>
              </View>
            ) : (
              <View style={styles.plChip}>
                <Ionicons name="pricetag-outline" size={16} color="#1D4ED8" />
                <Text style={styles.plChipName}>{selectedPriceListName}</Text>
                {priceListDifference !== 0 && (
                  <View style={[styles.plDiscountBadge, priceListDifference < 0 ? styles.plDiscountBadgeGreen : styles.plDiscountBadgeAmber]}>
                    <Text style={[styles.plDiscountText, priceListDifference < 0 ? styles.plDiscountTextGreen : styles.plDiscountTextAmber]}>
                      {priceListDifference > 0 ? '+' : ''}{priceListDifference}%
                    </Text>
                  </View>
                )}
                <TouchableOpacity onPress={() => handleSelectPriceList(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

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

        {/* Date of Order Entry */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date of Order Entry</Text>
          <View style={styles.dateDisplayContainer}>
            <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
            <Text style={styles.dateDisplayText}>{orderEntryDate}</Text>
          </View>
        </View>

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
        onRequestClose={() => { setShowDealerDropdown(false); setDealerSearchQuery(''); }}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => { setShowDealerDropdown(false); setDealerSearchQuery(''); }}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Dealer</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search dealers..."
              value={dealerSearchQuery}
              onChangeText={setDealerSearchQuery}
              placeholderTextColor="#9CA3AF"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>

          <FlatList
            data={filteredDealers}
            renderItem={renderDealerItem}
            keyExtractor={(item) => item._id}
            style={styles.dropdownList}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>No dealers found</Text>
              </View>
            }
          />
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Sub Dealer Modal */}
      <Modal
        visible={showAddSubDealerModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowAddSubDealerModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowAddSubDealerModal(false)}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Sub Dealer</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.addSDFormContent} keyboardShouldPersistTaps="handled">
            <View style={styles.addSDField}>
              <Text style={styles.addSDLabel}>Name <Text style={{ color: '#EF4444' }}>*</Text></Text>
              <TextInput
                style={styles.addSDInput}
                value={addSubDealerForm.SDName}
                onChangeText={(t) => setAddSubDealerForm(f => ({ ...f, SDName: t }))}
                placeholder="Sub dealer name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.addSDField}>
              <Text style={styles.addSDLabel}>Mobile <Text style={{ color: '#EF4444' }}>*</Text></Text>
              <TextInput
                style={styles.addSDInput}
                value={addSubDealerForm.SDMobileNo}
                onChangeText={(t) => setAddSubDealerForm(f => ({ ...f, SDMobileNo: t }))}
                placeholder="Mobile number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.addSDField}>
              <Text style={styles.addSDLabel}>Email</Text>
              <TextInput
                style={styles.addSDInput}
                value={addSubDealerForm.SDEmail}
                onChangeText={(t) => setAddSubDealerForm(f => ({ ...f, SDEmail: t }))}
                placeholder="Email address (optional)"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.addSDField}>
              <Text style={styles.addSDLabel}>Address Line 1</Text>
              <TextInput
                style={styles.addSDInput}
                value={addSubDealerForm.SDAddress1}
                onChangeText={(t) => setAddSubDealerForm(f => ({ ...f, SDAddress1: t }))}
                placeholder="Street / locality (optional)"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.addSDField}>
              <Text style={styles.addSDLabel}>Address Line 2</Text>
              <TextInput
                style={styles.addSDInput}
                value={addSubDealerForm.SDAddress2}
                onChangeText={(t) => setAddSubDealerForm(f => ({ ...f, SDAddress2: t }))}
                placeholder="City / area (optional)"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.addSDField}>
              <Text style={styles.addSDLabel}>State</Text>
              <TextInput
                style={styles.addSDInput}
                value={addSubDealerForm.SDState}
                onChangeText={(t) => setAddSubDealerForm(f => ({ ...f, SDState: t }))}
                placeholder="State (optional)"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <TouchableOpacity
              style={[styles.addSDSaveBtn, addingSubDealer && styles.addSDSaveBtnDisabled]}
              onPress={handleAddSubDealer}
              disabled={addingSubDealer}
            >
              {addingSubDealer ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.addSDSaveBtnText}>Save Sub Dealer</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Product Dropdown Modal */}
      <Modal
        visible={showProductDropdown}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => { setShowProductDropdown(false); setProductSearchQuery(''); }}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => { setShowProductDropdown(false); setProductSearchQuery(''); }}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Product</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              value={productSearchQuery}
              onChangeText={setProductSearchQuery}
              placeholderTextColor="#9CA3AF"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>

          <FlatList
            data={filteredProducts}
            renderItem={renderProductItem}
            keyExtractor={(item) => item._id}
            style={styles.dropdownList}
            contentContainerStyle={styles.productListContent}
            extraData={productSelections}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            automaticallyAdjustKeyboardInsets
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
        </KeyboardAvoidingView>
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
  dateDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  dateDisplayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
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
    paddingTop: 10,
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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    paddingVertical: 6,
  },
  dropdownList: {
    flex: 1,
    padding: 16,
  },
  productListContent: {
    paddingBottom: 120,
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
  productActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
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
  removeProductActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  removeProductActionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
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
  // Inline combobox styles for sub dealer
  inlineComboBox: {
    position: 'relative',
  },
  inlineComboBoxInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 48,
    gap: 8,
  },
  inlineComboBoxInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    paddingVertical: 10,
  },
  inlineDropdownList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  inlineDropdownScroll: {
    maxHeight: 220,
  },
  inlineDropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  inlineDropdownItemName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  inlineDropdownItemAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  inlineDropdownEmpty: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  inlineDropdownEmptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  inlineDropdownSaveCustom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#EFF6FF',
    borderTopWidth: 1,
    borderTopColor: '#DBEAFE',
  },
  inlineDropdownSaveCustomText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
    flex: 1,
  },
  comboBoxSelectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  comboBoxSelectedText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  // ─── Success Modal ───────────────────────────────────────────────────────────
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  successSub: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  successInfoBox: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
    overflow: 'hidden',
  },
  successInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  successInfoLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  successInfoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
  },
  successPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: '#3B82F6',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  successPrimaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  successSecondaryBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  successSecondaryBtnText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addSubDealerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  addSubDealerBtnText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600',
  },
  addSDFormContent: {
    padding: 16,
    gap: 4,
  },
  addSDField: {
    marginBottom: 16,
  },
  addSDLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  addSDInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  addSDSaveBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  addSDSaveBtnDisabled: {
    opacity: 0.6,
  },
  addSDSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Price list styles
  plInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  plInfoLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  plInfoValue: {
    fontSize: 14,
    color: '#1D4ED8',
    fontWeight: '700',
  },
  plInfoValueNegative: {
    color: '#D97706',
  },
  plChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  plChipLoading: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },
  plChipName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1E40AF',
    letterSpacing: 0.2,
  },
  plDiscountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  plDiscountBadgeGreen: {
    backgroundColor: '#DCFCE7',
  },
  plDiscountBadgeAmber: {
    backgroundColor: '#FEF3C7',
  },
  plDiscountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  plDiscountTextGreen: {
    color: '#166534',
  },
  plDiscountTextAmber: {
    color: '#92400E',
  },
  manualRateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  manualRateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D97706',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    color: '#111827',
    backgroundColor: '#FFFBEB',
  },
  plItemRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  plItemField: {
    flex: 1,
    alignItems: 'center',
  },
  plItemLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  plItemValue: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
  },
  plItemValueAmber: {
    color: '#D97706',
  },
  plFinalRateValue: {
    color: '#059669',
  },
  plModalItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default AdminCreateOrder;
