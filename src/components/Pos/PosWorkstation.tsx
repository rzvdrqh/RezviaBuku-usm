import React, { useState } from 'react';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  DollarSign,
  QrCode,
  CreditCard,
  Printer,
  RotateCcw,
  BookOpen,
  ArrowLeft,
  Clock,
  Sparkles,
  AlertCircle,
  User,
  Phone,
} from 'lucide-react';
import { Book, Order } from '../../types';
import { createPosTransaction } from '../../services/storeService';
import { formatRupiah } from '../../utils/formatters';
import { PosReceiptModal } from './PosReceiptModal';
import { useAuth } from '../../context/AuthContext';
import { getCategoryPastelStyle } from '../BookCard';

interface PosWorkstationProps {
  books: Book[];
  onBack: () => void;
}

interface PosCartItem {
  book: Book;
  quantity: number;
}

const CATEGORIES = [
  'Semua Kategori',
  'Novel',
  'Komik Jepang',
  'Teknologi & Sains',
  'Bahasa',
  'Buku Tes (TOEFL / CPNS / UTBK)',
];

export const PosWorkstation: React.FC<PosWorkstationProps> = ({ books, onBack }) => {
  const { adminUser } = useAuth();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');

  // Pos Cart state
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'tunai' | 'qris' | 'bca' | 'mandiri'>('tunai');
  const [cashPaidInput, setCashPaidInput] = useState<number | ''>('');

  // Transaction processing & receipt state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Filter books
  const filteredBooks = books.filter((b) => {
    const matchCat = selectedCategory === 'Semua Kategori' || b.category === selectedCategory;
    const matchSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      (b.isbn && b.isbn.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  // Cart calculations
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.book.price * item.quantity, 0);

  // Cash change calculation
  const cashPaid = typeof cashPaidInput === 'number' ? cashPaidInput : 0;
  const changeDue = Math.max(0, cashPaid - subtotal);
  const isCashInsufficient = paymentMethod === 'tunai' && cashPaid < subtotal && cashPaidInput !== '';

  const addToCart = (book: Book) => {
    if (book.stock <= 0) return;
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.book.id === book.id);
      if (idx > -1) {
        const cur = prev[idx];
        const newQty = Math.min(book.stock, cur.quantity + 1);
        const updated = [...prev];
        updated[idx] = { ...cur, quantity: newQty };
        return updated;
      } else {
        return [...prev, { book, quantity: 1 }];
      }
    });
    setErrorMsg('');
  };

  const updateQuantity = (bookId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.book.id === bookId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            const validQty = Math.min(item.book.stock, newQty);
            return { ...item, quantity: validQty };
          }
          return item;
        })
        .filter(Boolean) as PosCartItem[]
    );
  };

  const removeFromCart = (bookId: string) => {
    setCart((prev) => prev.filter((i) => i.book.id !== bookId));
  };

  const clearCart = () => {
    setCart([]);
    setCashPaidInput('');
    setErrorMsg('');
  };

  const handleQuickCash = (amount: number) => {
    setCashPaidInput(amount);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setErrorMsg('Keranjang kasir masih kosong. Silakan pilih buku terlebih dahulu.');
      return;
    }

    if (paymentMethod === 'tunai' && (typeof cashPaidInput !== 'number' || cashPaidInput < subtotal)) {
      setErrorMsg(`Uang tunai yang diserahkan kurang (${formatRupiah(subtotal - (cashPaidInput || 0))} lagi).`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const cashierName = adminUser?.name || 'Kasir PustakaVia';
      const orderId = await createPosTransaction({
        items: cart,
        paymentMethod,
        cashPaid: paymentMethod === 'tunai' ? Number(cashPaidInput) : subtotal,
        changeDue: paymentMethod === 'tunai' ? changeDue : 0,
        customerName: customerName.trim() || 'Pelanggan Kasir Toko',
        customerPhone: customerPhone.trim() || '-',
        cashierName,
      });

      // Prepare order object for receipt printing
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const fakeOrderNumber = `POS-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;

      const receiptOrder: Order = {
        id: orderId,
        orderNumber: fakeOrderNumber,
        customerName: customerName.trim() || 'Pelanggan Walk-in Toko',
        customerEmail: 'pos@pustakavia.com',
        customerPhone: customerPhone.trim() || '-',
        shippingAddress: 'Transaksi Kasir Langsung (PoS)',
        items: cart.map((c) => ({
          bookId: c.book.id,
          title: c.book.title,
          author: c.book.author,
          price: c.book.price,
          costPrice: c.book.costPrice,
          quantity: c.quantity,
          coverImage: c.book.coverImage,
        })),
        subtotal,
        shippingCost: 0,
        totalAmount: subtotal,
        status: 'selesai',
        paymentMethod,
        channel: 'pos',
        cashPaid: paymentMethod === 'tunai' ? Number(cashPaidInput) : subtotal,
        changeDue: paymentMethod === 'tunai' ? changeDue : 0,
        cashierName,
        createdAt: new Date().toISOString(),
      };

      setCompletedOrder(receiptOrder);
      clearCart();
      setCustomerName('');
      setCustomerPhone('');
    } catch (err) {
      console.error('POS Checkout error:', err);
      let msg = 'Gagal memproses transaksi kasir.';
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          msg = parsed.error || err.message;
        } catch {
          msg = err.message;
        }
      }
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf7f2] flex flex-col font-sans pb-12">
      {/* Top POS Header */}
      <header className="bg-white border-b border-rose-100 shadow-2xs sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-rose-50 rounded-2xl transition-colors"
              title="Kembali ke Menu Utama"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-pink-400 to-amber-300 flex items-center justify-center text-white shadow-xs">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-bold text-lg text-slate-800">
                  Kasir PoS PustakaVia
                </h1>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Live Terminal
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kasir: <strong className="text-slate-700">{adminUser?.name || 'Kasir 01'}</strong> • Stok Terpotong Real-Time
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-2xl text-xs font-semibold border border-rose-200 transition-colors"
            >
              Kembali ke Toko
            </button>
          </div>
        </div>
      </header>

      {/* Main Workstation Layout: Left Catalog Grid, Right Cashier Cart */}
      <div className="max-w-7xl mx-auto px-4 pt-4 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
        {/* Left Column: Product Search, Category Filters, Fast Grid (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-rose-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari judul buku, penulis, atau nomor ISBN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-rose-200/80 rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400 shadow-2xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Hapus
              </button>
            )}
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-rose-500 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-rose-50/60 border border-rose-100'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Book Catalog Grid for Cashier */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
            {filteredBooks.map((book) => {
              const badgeStyle = getCategoryPastelStyle(book.category);
              const isOutOfStock = book.stock <= 0;

              return (
                <div
                  key={book.id}
                  onClick={() => !isOutOfStock && addToCart(book)}
                  className={`bg-white rounded-2xl border p-3 flex flex-col justify-between transition-all select-none ${
                    isOutOfStock
                      ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50'
                      : 'cursor-pointer hover:border-rose-300 hover:shadow-md border-rose-100 shadow-2xs active:scale-98'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-rose-50/30 border border-rose-100/60">
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <span
                        className={`absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                      >
                        {book.category}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-heading font-bold text-slate-800 text-xs line-clamp-2 leading-tight">
                        {book.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{book.author}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-rose-50 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-xs text-rose-600 block">
                        {formatRupiah(book.price)}
                      </span>
                      <span
                        className={`text-[10px] font-semibold ${
                          isOutOfStock
                            ? 'text-rose-600'
                            : book.stock <= 5
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {isOutOfStock ? 'Stok Habis' : `Stok: ${book.stock}`}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isOutOfStock}
                      className="w-7 h-7 rounded-xl bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white flex items-center justify-center transition-colors shadow-2xs font-bold text-xs"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Cashier Struk & Checkout Panel (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-rose-100 shadow-sm p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            {/* Cashier Struk Header */}
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                  {totalItems}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-800">
                    Struk Belanja Kasir
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {totalItems} buku di keranjang kasir
                  </p>
                </div>
              </div>

              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-slate-400 hover:text-rose-600 p-1 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Customer identity inputs (Optional) */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Nama Pembeli (opsional)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-rose-50/20 border border-rose-200/60 rounded-xl text-xs"
                />
              </div>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="No. WA / HP (opsional)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-rose-50/20 border border-rose-200/60 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Error notice */}
            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Cart Items List */}
            <div className="space-y-2 overflow-y-auto max-h-56 divide-y divide-rose-50 pr-1">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-1">
                  <ShoppingCart className="w-8 h-8 mx-auto text-rose-200" />
                  <p className="text-xs font-semibold text-slate-600">Keranjang Masih Kosong</p>
                  <p className="text-[11px] text-slate-400">
                    Klik produk di sebelah kiri untuk memasukkan ke struk kasir.
                  </p>
                </div>
              ) : (
                cart.map(({ book, quantity }) => (
                  <div key={book.id} className="pt-2 flex items-center justify-between text-xs">
                    <div className="flex-1 pr-2">
                      <div className="font-heading font-bold text-slate-800 line-clamp-1">
                        {book.title}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {formatRupiah(book.price)}
                      </div>
                    </div>

                    {/* Quantity steppers */}
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center border border-rose-200 rounded-xl bg-rose-50/30">
                        <button
                          onClick={() => updateQuantity(book.id, -1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-rose-100 rounded-l-xl font-bold"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-mono font-bold text-slate-800 text-xs">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(book.id, 1)}
                          disabled={quantity >= book.stock}
                          className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-rose-100 rounded-r-xl font-bold disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>

                      <div className="w-20 text-right font-mono font-bold text-slate-900 text-xs">
                        {formatRupiah(book.price * quantity)}
                      </div>

                      <button
                        onClick={() => removeFromCart(book.id)}
                        className="p-1 text-slate-300 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bottom Payment Processing Section */}
          <div className="pt-4 border-t border-rose-100 space-y-3 bg-[#fdfbf9] p-4 rounded-2xl">
            {/* Total tagihan */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Total Tagihan Kasir:</span>
              <span className="font-mono text-xl font-extrabold text-rose-600">
                {formatRupiah(subtotal)}
              </span>
            </div>

            {/* Payment method selector tabs */}
            <div className="grid grid-cols-3 gap-1.5 bg-rose-50/60 p-1 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setPaymentMethod('tunai')}
                className={`py-1.5 rounded-xl transition-all ${
                  paymentMethod === 'tunai'
                    ? 'bg-white text-rose-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                💵 Tunai
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('qris');
                  setCashPaidInput(subtotal);
                }}
                className={`py-1.5 rounded-xl transition-all ${
                  paymentMethod === 'qris'
                    ? 'bg-white text-rose-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📱 QRIS
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('bca');
                  setCashPaidInput(subtotal);
                }}
                className={`py-1.5 rounded-xl transition-all ${
                  paymentMethod === 'bca'
                    ? 'bg-white text-rose-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🏦 Transfer
              </button>
            </div>

            {/* Tunai calculations */}
            {paymentMethod === 'tunai' && (
              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Nominal Uang Diterima:
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    placeholder="Contoh: 100000"
                    value={cashPaidInput}
                    onChange={(e) => setCashPaidInput(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl font-mono text-sm font-bold text-slate-900"
                  />
                </div>

                {/* Quick Bills Shortcuts */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickCash(subtotal)}
                    className="px-2.5 py-1 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg text-[11px] font-bold text-rose-700"
                  >
                    Uang Pas
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickCash(50000)}
                    className="px-2.5 py-1 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg text-[11px] font-mono text-slate-700"
                  >
                    50.000
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickCash(100000)}
                    className="px-2.5 py-1 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg text-[11px] font-mono text-slate-700"
                  >
                    100.000
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickCash(200000)}
                    className="px-2.5 py-1 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg text-[11px] font-mono text-slate-700"
                  >
                    200.000
                  </button>
                </div>

                {/* Kembalian row */}
                <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/70 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-900">Uang Kembalian:</span>
                  <span className="font-mono text-base font-extrabold text-emerald-700">
                    {formatRupiah(changeDue)}
                  </span>
                </div>
              </div>
            )}

            {/* QRIS / Transfer info note */}
            {paymentMethod !== 'tunai' && (
              <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-sky-600 shrink-0" />
                <span>
                  Konfirmasi pembayaran digital {paymentMethod.toUpperCase()} senilai{' '}
                  <strong className="font-mono">{formatRupiah(subtotal)}</strong>.
                </span>
              </div>
            )}

            {/* Submit & Print CTA */}
            <button
              onClick={handleCheckout}
              disabled={isSubmitting || cart.length === 0 || isCashInsufficient}
              className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 disabled:bg-slate-300 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md shadow-rose-200 flex items-center justify-center gap-2 transition-all"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memproses Transaksi Kasir...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Selesaikan & Cetak Struk</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Thermal Receipt Preview Modal */}
      <PosReceiptModal
        order={completedOrder}
        onClose={() => setCompletedOrder(null)}
      />
    </div>
  );
};
