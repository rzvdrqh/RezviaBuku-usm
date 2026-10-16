export interface Book {
  id: string;
  title: string;
  author: string;
  category:
    | 'Novel'
    | 'Komik Jepang'
    | 'Teknologi & Sains'
    | 'Bahasa'
    | 'Buku Tes (TOEFL / CPNS / UTBK)'
    | string;
  price: number; // Harga Jual
  costPrice?: number; // Harga Beli / HPP
  profitRatio?: number; // Rasio Keuntungan (%)
  stock: number;
  description: string;
  coverImage: string;
  isbn?: string;
  pages?: number;
  rating?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  book: Book;
  quantity: number;
}

export type OrderStatus =
  | 'menunggu_pembayaran'
  | 'menunggu_approval'
  | 'diproses'
  | 'dikirim'
  | 'selesai'
  | 'dibatalkan';

export interface OrderItem {
  bookId: string;
  title: string;
  author: string;
  price: number;
  costPrice?: number;
  quantity: number;
  coverImage: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: 'bca' | 'mandiri' | 'bri' | 'qris' | 'tunai';
  paymentProofUrl?: string;
  paymentProofUploadedAt?: string;
  paymentRejectionReason?: string;
  notes?: string;
  trackingNumber?: string;
  channel?: 'web' | 'pos';
  cashPaid?: number;
  changeDue?: number;
  cashierName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  createdAt: string;
}

export interface PosTransactionPayload {
  items: {
    book: Book;
    quantity: number;
  }[];
  paymentMethod: 'tunai' | 'qris' | 'bca' | 'mandiri';
  cashPaid?: number;
  changeDue?: number;
  customerName?: string;
  customerPhone?: string;
  cashierName?: string;
  notes?: string;
}
