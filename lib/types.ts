export interface Profile {
    id: string;
    role: 'customer' | 'merchant' | 'bank_admin';
    full_name: string | null;
    username: string | null;
    email: string | null;
    status: string;
    created_at: string;
  }
  
  export interface Voucher {
    id: string;
    customer_id: string;
    voucher_number: string;
    initial_amount: number;
    current_balance: number;
    currency: string;
    status: string;
    expires_at: string | null;
    created_at: string;
  }
  
  export interface Merchant {
    id: string;
    profile_id: string;
    business_name: string;
    status: string;
    created_at: string;
  }
  
  export interface RedemptionRequest {
    id: string;
    merchant_id: string;
    amount: number;
    currency: string;
    status: string;
    submitted_at: string;
    reviewed_at: string | null;
    bank_reference: string | null;
    rejection_reason: string | null;
  }