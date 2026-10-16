import React from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, BookOpen } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatRupiah } from '../utils/formatters';
import { resolveCoverUrl } from '../utils/coverResolver';

interface CartDrawerProps {
  onProceedCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedCheckout }) => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    totalItems,
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header (Pastel) */}
          <div className="px-5 py-4 border-b border-rose-100 flex items-center justify-between bg-gradient-to-r from-rose-50/80 via-pink-50/60 to-amber-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-slate-800 text-base sm:text-lg">
                  Keranjang PustakaVia
                </h3>
                <p className="text-xs text-rose-700/80 font-medium">{totalItems} buku dipilih</p>
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-white/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 divide-y divide-rose-50">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-16 h-16 rounded-3xl bg-rose-50 flex items-center justify-center text-rose-300 mb-3 border border-rose-100">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-heading font-bold text-slate-700 text-base">Keranjang Anda Masih Kosong</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                  Yuk jelajahi koleksi Novel, Komik Jepang, dan modul tes favoritmu di PustakaVia!
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-5 px-4 py-2 bg-rose-500 text-white text-xs font-bold rounded-2xl hover:bg-rose-600 transition-colors inline-flex items-center gap-1.5 shadow-sm shadow-rose-200"
                >
                  <BookOpen className="w-4 h-4" />
                  Lihat Katalog Buku
                </button>
              </div>
            ) : (
              items.map(({ book, quantity }) => (
                <div key={book.id} className="py-3.5 flex gap-3 group">
                  {/* Book thumbnail */}
                  <img
                    src={resolveCoverUrl(book.coverImage, book.title)}
                    alt={book.title}
                    className="w-16 h-22 object-cover rounded-xl border border-rose-100 shrink-0 shadow-2xs bg-rose-50"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.endsWith('/covers/cover_bumi_manusia.jpg')) {
                        target.src = '/covers/cover_bumi_manusia.jpg';
                      }
                    }}
                  />

                  {/* Info and controls */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-sm font-heading font-bold text-slate-800 line-clamp-1">
                          {book.title}
                        </h4>
                        <button
                          onClick={() => removeFromCart(book.id)}
                          className="text-slate-300 hover:text-rose-500 transition-colors p-0.5"
                          title="Hapus buku"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-400">{book.author}</p>
                      <p className="text-xs font-mono font-bold text-rose-600 mt-0.5">
                        {formatRupiah(book.price)}
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center justify-between mt-2 pt-1">
                      <div className="flex items-center border border-rose-200 rounded-xl bg-rose-50/40">
                        <button
                          onClick={() => updateQuantity(book.id, quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-rose-100 rounded-l-xl text-xs font-bold"
                        >
                          -
                        </button>
                        <span className="w-7 text-center text-xs font-mono font-bold text-slate-800">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(book.id, quantity + 1)}
                          disabled={quantity >= book.stock}
                          className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-rose-100 rounded-r-xl text-xs font-bold disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-xs font-bold text-slate-800 font-mono">
                        {formatRupiah(book.price * quantity)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Action */}
          {items.length > 0 && (
            <div className="p-5 border-t border-rose-100 bg-[#fdfbf9] space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Subtotal ({totalItems} buku)</span>
                <span className="font-mono font-bold text-slate-800">{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Estimasi Ongkos Kirim</span>
                <span className="font-mono text-emerald-600 font-semibold">Mulai Rp 10.000</span>
              </div>
              <div className="pt-2 border-t border-rose-100 flex items-center justify-between text-sm font-bold text-slate-900">
                <span>Total Estimasi</span>
                <span className="text-base text-rose-600 font-mono font-extrabold">
                  {formatRupiah(subtotal)}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={clearCart}
                  className="px-3 py-2.5 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-2xl border border-rose-200 transition-colors"
                  title="Kosongkan Keranjang"
                >
                  Reset
                </button>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    onProceedCheckout();
                  }}
                  className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs sm:text-sm font-bold py-2.5 px-4 rounded-2xl shadow-md shadow-rose-200 flex items-center justify-center gap-2 transition-all"
                >
                  <span>Lanjut ke Pembayaran</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
