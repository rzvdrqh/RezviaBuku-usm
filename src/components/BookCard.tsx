import React from 'react';
import { Star, ShoppingCart, Eye, Check } from 'lucide-react';
import { Book } from '../types';
import { formatRupiah } from '../utils/formatters';
import { useCart } from '../context/CartContext';
import { resolveCoverUrl } from '../utils/coverResolver';

interface BookCardProps {
  book: Book;
  onSelect: (book: Book) => void;
}

export function getCategoryPastelStyle(category: string): { bg: string; text: string; border: string } {
  if (category.includes('Novel')) {
    return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
  }
  if (category.includes('Komik')) {
    return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
  }
  if (category.includes('Teknologi') || category.includes('Sains')) {
    return { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' };
  }
  if (category.includes('Bahasa')) {
    return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
  }
  if (category.includes('Tes') || category.includes('TOEFL') || category.includes('CPNS') || category.includes('UTBK')) {
    return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
  }
  return { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' };
}

export const BookCard: React.FC<BookCardProps> = ({ book, onSelect }) => {
  const { addToCart, items } = useCart();
  const isOutOfStock = book.stock <= 0;
  const isLowStock = book.stock > 0 && book.stock <= 5;

  const cartItem = items.find((item) => item.book.id === book.id);
  const qtyInCart = cartItem ? cartItem.quantity : 0;

  const badgeStyle = getCategoryPastelStyle(book.category);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOutOfStock) {
      addToCart(book, 1);
    }
  };

  return (
    <div
      onClick={() => onSelect(book)}
      className="group bg-white rounded-3xl border border-rose-100/80 hover:border-rose-300 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden cursor-pointer relative"
    >
      {/* Category Pill Tag */}
      <div className="absolute top-3 left-3 z-10">
        <span
          className={`text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full shadow-2xs border backdrop-blur-xs ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
        >
          {book.category}
        </span>
      </div>

      {/* Stock indicator badge */}
      <div className="absolute top-3 right-3 z-10">
        {isOutOfStock ? (
          <span className="text-[10px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full shadow-2xs">
            Stok Habis
          </span>
        ) : isLowStock ? (
          <span className="text-[10px] font-bold bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full shadow-2xs animate-pulse">
            Sisa {book.stock}!
          </span>
        ) : (
          <span className="text-[10px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full shadow-2xs">
            {book.stock} Ada
          </span>
        )}
      </div>

      {/* Cover Image Container (Strictly pictures of books) */}
      <div className="relative aspect-[3/4] w-full bg-[#fdf8f5] overflow-hidden p-3 flex items-center justify-center">
        <div className="w-full h-full rounded-2xl overflow-hidden shadow-xs border border-rose-100/60 relative">
          <img
            src={resolveCoverUrl(book.coverImage, book.title)}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.endsWith('/covers/cover_bumi_manusia.jpg')) {
                target.src = '/covers/cover_bumi_manusia.jpg';
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
            <span className="text-white text-[11px] font-semibold flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-3 py-1 rounded-full">
              <Eye className="w-3.5 h-3.5" /> Lihat Sinopsis
            </span>
          </div>
        </div>
      </div>

      {/* Book Information */}
      <div className="p-4 pt-1 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium mb-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-slate-700">{book.rating ? book.rating.toFixed(1) : '4.8'}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-400 text-[11px]">{book.pages ? `${book.pages} hlm` : 'Buku Asli'}</span>
          </div>

          <h3 className="font-heading font-bold text-slate-800 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-rose-600 transition-colors">
            {book.title}
          </h3>

          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
            Oleh: <span className="text-slate-700 font-medium">{book.author}</span>
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-rose-50 flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Harga</p>
            <p className="text-sm sm:text-base font-bold text-slate-800 font-mono">
              {formatRupiah(book.price)}
            </p>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold transition-all shadow-2xs ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : qtyInCart > 0
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-rose-500 hover:bg-rose-600 text-white hover:shadow-md hover:shadow-rose-200'
            }`}
            title={qtyInCart > 0 ? `Sudah ada ${qtyInCart} di keranjang` : 'Tambah ke keranjang'}
          >
            {qtyInCart > 0 ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Ada ({qtyInCart})</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>+ Keranjang</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
