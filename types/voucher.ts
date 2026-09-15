export type VoucherStatus = "active" | "inactive";

export type Voucher = {
  id: string;
  codePreview: string;
  destinationId: string;
  destinationName: string;
  amount: number;
  usageLimit: number;
  redeemedCount: number;
  status: VoucherStatus;
  createdAt: string;
};

export type VoucherRedemption = {
  id: string;
  voucherId: string;
  amount: number;
  finalAmount: number;
};
