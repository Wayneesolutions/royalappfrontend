// frontend/src/utils/gst.ts
export type GstType = 'INTRA_STATE' | 'INTER_STATE' | 'UNKNOWN';

export const DEFAULT_GST_RATE = 18;

const safeNumber = (value: number | string | undefined | null, fallback = 0) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

export const extractState = (value?: string | null): string => {
  if (!value) {
    return '';
  }
  return value.toString().trim();
};

const normalizeState = (value?: string | null) => extractState(value).toLowerCase();

export const determineGstType = (
  sellerState?: string | null,
  buyerState?: string | null
): GstType => {
  const normalizedSeller = normalizeState(sellerState);
  const normalizedBuyer = normalizeState(buyerState);

  if (!normalizedSeller || !normalizedBuyer) {
    return 'UNKNOWN';
  }

  return normalizedSeller === normalizedBuyer ? 'INTRA_STATE' : 'INTER_STATE';
};

export interface GstComputationInput {
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  gstRate?: number;
  gstType: GstType;
}

export interface GstComputationResult {
  baseAmount: number;
  discountAmount: number;
  taxableValue: number;
  gstRate: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTaxAmount: number;
  lineTotal: number;
}

export const computeGstBreakdown = ({
  quantity,
  unitPrice,
  discountPercent = 0,
  gstRate = DEFAULT_GST_RATE,
  gstType,
}: GstComputationInput): GstComputationResult => {
  const qty = Math.max(0, safeNumber(quantity, 0));
  const price = Math.max(0, safeNumber(unitPrice, 0));
  const discountRate = Math.max(0, safeNumber(discountPercent, 0));
  const normalizedGstRate = Math.max(0, safeNumber(gstRate, DEFAULT_GST_RATE));

  const baseAmount = qty * price;
  const discountAmount = (baseAmount * discountRate) / 100;
  const taxableValue = Math.max(0, baseAmount - discountAmount);

  let cgstRate = 0;
  let sgstRate = 0;
  let igstRate = 0;

  if (gstType === 'INTRA_STATE') {
    cgstRate = normalizedGstRate / 2;
    sgstRate = normalizedGstRate / 2;
  } else if (gstType === 'INTER_STATE') {
    igstRate = normalizedGstRate;
  } else {
    igstRate = normalizedGstRate;
  }

  const cgstAmount = (taxableValue * cgstRate) / 100;
  const sgstAmount = (taxableValue * sgstRate) / 100;
  const igstAmount = (taxableValue * igstRate) / 100;
  const totalTaxAmount = cgstAmount + sgstAmount + igstAmount;
  const lineTotal = taxableValue + totalTaxAmount;

  return {
    baseAmount,
    discountAmount,
    taxableValue,
    gstRate: normalizedGstRate,
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    igstRate,
    igstAmount,
    totalTaxAmount,
    lineTotal,
  };
};

