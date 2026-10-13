import React, { useState } from 'react';
import { X, Star, ShoppingBag, ShieldCheck, Truck, CheckCircle2, Heart } from 'lucide-react';
import { Book } from '../types';
import { formatRupiah } from '../utils/formatters';
import { useCart } from '../context/CartContext';
import { getCategoryPastelStyle } from './BookCard';

interface BookDetailModalProps {
  book: Book | null;
  onClose: () => void;
  onInstantCheckout?: (book: Book, quantity: number) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  onClose,
  onInstantCheckout,
}) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [addedAlert, setAddedAlert] = useState(false);

  if (!book) return null;

  const isOutOfStock = book.stock <= 0;
  const badgeStyle = getCategoryPastelStyle(book.category);

  const handleAdd = () => {
    if (!isOutOfStock) {
      addToCart(book, quantity);
      setAddedAlert(true);
      setTimeout(() => setAddedAlert(false), 2000);
    }
  };

  const handleBuyNow = () => {
    if (!isOutOfStock) {
      addToCart(book, quantity);
      if (onInstantCheckout) {
        onInstantCheckout(book, quantity);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div
        className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-rose-100 overflow-hidden relative my-8 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-slate-700 bg-white/90 hover:bg-white rounded-full shadow-xs transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
          {/* Cover Section (Strictly picture of book) */}
          <div className="md:col-span-5 bg-gradient-to-b from-rose-50/70 to-pink-50/40 p-6 sm:p-8 flex items-center justify-center relative border-b md:border-b-0 md:border-r border-rose-100/60">
            <div className="w-48 sm:w-56 aspect-[3/4] rounded-2xl shadow-md overflow-hidden border-2 border-white ring-1 ring-rose-200/60">
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Details Section */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Category & Rating */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`text-[11px] font-bold tracking-wide border px-3 py-1 rounded-full ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                >
                  {book.category}
                </span>
                <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{book.rating || 4.8} / 5.0</span>
                </div>
              </div>

              {/* Title & Author */}
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-800 leading-snug">
                {book.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Karya: <span className="font-semibold text-slate-700">{book.author}</span>
              </p>

              {/* Price & Stock */}
              <div className="mt-4 p-3.5 bg-[#fdfaf8] rounded-2xl flex items-center justify-between border border-rose-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Harga Resmi</span>
                  <div className="text-xl font-bold font-mono text-slate-800">
                    {formatRupiah(book.price)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Ketersediaan</span>
                  <div className={`text-xs font-semibold ${isOutOfStock ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {isOutOfStock ? 'Stok Habis' : `Tersedia ${book.stock} Buku`}
                  </div>
                </div>
              </div>

              {/* Metadata specs */}
              <div className="grid grid-cols-2 gap-2 mt-3.5 text-xs text-slate-600">
                <div className="bg-rose-50/40 p-2.5 rounded-xl border border-rose-100/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">ISBN</span>
                  <span className="font-mono text-slate-700">{book.isbn || '978-602-00123'}</span>
                </div>
                <div className="bg-rose-50/40 p-2.5 rounded-xl border border-rose-100/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Halaman</span>
                  <span className="font-medium text-slate-700">{book.pages || 350} Halaman</span>
                </div>
              </div>

              {/* Description */}
              <div className="mt-3.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Sinopsis / Ringkasan Buku
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-h-32 overflow-y-auto pr-1">
                  {book.description}
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-rose-100">
              {addedAlert && (
                <div className="mb-3 p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Berhasil menambahkan {quantity} buku ke keranjang!</span>
                </div>
              )}

              <div className="flex items-center gap-2.5">
                {/* Quantity Stepper */}
                <div className="flex items-center border border-rose-200 rounded-2xl bg-white px-2 py-1 shadow-2xs">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="w-7 h-7 text-slate-600 hover:text-rose-600 disabled:opacity-30 font-bold"
                  >
                    -
                  </button>
                  <span className="w-7 text-center text-xs font-semibold text-slate-800 font-mono">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(book.stock, q + 1))}
                    disabled={quantity >= book.stock || isOutOfStock}
                    className="w-7 h-7 text-slate-600 hover:text-rose-600 disabled:opacity-30 font-bold"
                  >
                    +
                  </button>
                </div>

                {/* Add to Cart button */}
                <button
                  onClick={handleAdd}
                  disabled={isOutOfStock}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-rose-500 hover:bg-rose-600 disabled:bg-slate-200 text-white transition-all shadow-md shadow-rose-200"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>+ Keranjang</span>
                </button>

                {/* Direct Buy button */}
                <button
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 text-white transition-all shadow-2xs"
                >
                  Beli Langsung
                </button>
              </div>

              {/* Value propositions */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-4 pt-3 border-t border-rose-50">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 100% Asli Bersegel
                </span>
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-rose-400" /> Dikirim Cepat dari Gudang
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
