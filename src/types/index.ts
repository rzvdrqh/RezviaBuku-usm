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
  price: number;
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
  paymentMethod: 'bca' | 'mandiri' | 'bri' | 'qris';
  paymentProofUrl?: string;
  paymentProofUploadedAt?: string;
  paymentRejectionReason?: string;
  notes?: string;
  trackingNumber?: string;
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
