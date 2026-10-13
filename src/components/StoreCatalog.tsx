import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  ArrowUpDown,
  CheckCircle2,
  Truck,
  ShieldCheck,
  Heart,
  Smile,
  GraduationCap,
  Sparkle,
} from 'lucide-react';
import { Book } from '../types';
import { BookCard } from './BookCard';

interface StoreCatalogProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
}

const CATEGORIES = [
  'Semua Koleksi',
  'Novel',
  'Komik Jepang',
  'Teknologi & Sains',
  'Bahasa',
  'Buku Tes (TOEFL / CPNS / UTBK)',
];

export const StoreCatalog: React.FC<StoreCatalogProps> = ({
  books,
  onSelectBook,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
}) => {
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'stock'>('default');

  // Filter books
  const filtered = books.filter((b) => {
    const matchesCat =
      selectedCategory === 'Semua Koleksi' || b.category === selectedCategory;
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Sort books
  const sortedBooks = [...filtered].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'stock') return b.stock - a.stock;
    return 0;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Banner Section (Cerah, Pastel, Soft) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-100/90 via-[#fff5f0] to-amber-100/70 text-slate-800 rounded-3xl mx-4 sm:mx-6 lg:mx-8 mt-6 shadow-sm border border-rose-200/60">
        {/* Soft pastel decorative shapes */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-pink-200/40 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-amber-200/40 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 py-10 sm:py-14 lg:py-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl space-y-3.5 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-rose-200 text-rose-700 text-xs font-semibold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span>Koleksi Terpilih: Novel, Komik Jepang & Modul Belajar</span>
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
              Membaca Lebih Menyenangkan di{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500">
                PustakaVia
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
              Toko buku dengan katalog terkurasi, suasana pastel yang tenang, dan inventaris tersinkronisasi langsung ke database Firestore secara real-time. Temukan novel bestseller, serial komik Jepang original, modul bahasa, hingga buku lolos tes CPNS/UTBK.
            </p>

            {/* Micro badges pastel */}
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-1.5 bg-white/70 px-2.5 py-1 rounded-full border border-rose-100">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>100% Buku Asli Segel</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/70 px-2.5 py-1 rounded-full border border-rose-100">
                <Truck className="w-4 h-4 text-rose-500" />
                <span>Pengiriman Cepat Aman</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/70 px-2.5 py-1 rounded-full border border-rose-100">
                <CheckCircle2 className="w-4 h-4 text-sky-500" />
                <span>Real-Time Live Stock</span>
              </div>
            </div>
          </div>

          {/* Quick Category Showcase Cards pastel */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-1 gap-2.5 w-full md:w-80 shrink-0">
            <div
              onClick={() => setSelectedCategory('Novel')}
              className="p-3 bg-white/80 hover:bg-white rounded-2xl border border-rose-200/80 cursor-pointer transition-all flex items-center justify-between group shadow-2xs"
            >
              <div>
                <span className="text-[10px] text-rose-500 uppercase tracking-wider block font-bold">Kategori 1</span>
                <span className="text-xs font-bold text-slate-800 group-hover:text-rose-600 transition-colors">
                  Novel Pilihan
                </span>
              </div>
              <span className="text-[11px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-mono font-semibold">
                3 Judul
              </span>
            </div>

            <div
              onClick={() => setSelectedCategory('Komik Jepang')}
              className="p-3 bg-white/80 hover:bg-white rounded-2xl border border-purple-200/80 cursor-pointer transition-all flex items-center justify-between group shadow-2xs"
            >
              <div>
                <span className="text-[10px] text-purple-600 uppercase tracking-wider block font-bold">Kategori 2</span>
                <span className="text-xs font-bold text-slate-800 group-hover:text-purple-600 transition-colors">
                  Komik Jepang (Manga)
                </span>
              </div>
              <span className="text-[11px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-mono font-semibold">
                3 Judul
              </span>
            </div>

            <div
              onClick={() => setSelectedCategory('Buku Tes (TOEFL / CPNS / UTBK)')}
              className="p-3 bg-white/80 hover:bg-white rounded-2xl border border-amber-200/80 cursor-pointer transition-all flex items-center justify-between group shadow-2xs col-span-2 sm:col-span-1"
            >
              <div>
                <span className="text-[10px] text-amber-600 uppercase tracking-wider block font-bold">Kategori 5</span>
                <span className="text-xs font-bold text-slate-800 group-hover:text-amber-600 transition-colors">
                  Modul Tes & Ujian
                </span>
              </div>
              <span className="text-[11px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-mono font-semibold">
                3 Judul
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation & Filters Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-rose-100/80 pb-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              const count =
                cat === 'Semua Koleksi'
                  ? books.length
                  : books.filter((b) => b.category === cat).length;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-rose-500 text-white shadow-sm shadow-rose-200'
                      : 'bg-white text-slate-700 hover:bg-rose-50/60 border border-rose-100'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? 'bg-rose-700 text-rose-100' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-semibold text-slate-700 bg-white border border-rose-200/80 rounded-2xl px-3 py-2 focus:ring-2 focus:ring-rose-400/20"
            >
              <option value="default">Urutkan: Rekomendasi</option>
              <option value="price-asc">Harga: Terendah ke Tertinggi</option>
              <option value="price-desc">Harga: Tertinggi ke Terendah</option>
              <option value="stock">Stok: Terbanyak Tersedia</option>
            </select>
          </div>
        </div>

        {/* Results indicator */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Menampilkan <strong className="text-slate-800">{sortedBooks.length}</strong> buku
            {selectedCategory !== 'Semua Koleksi' && ` dalam kategori "${selectedCategory}"`}
            {searchQuery && ` dengan kata kunci "${searchQuery}"`}
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-rose-600 font-semibold hover:underline"
            >
              Reset Pencarian
            </button>
          )}
        </div>

        {/* Book Grid */}
        {sortedBooks.length === 0 ? (
          <div className="bg-white rounded-3xl border border-rose-100 p-12 text-center text-slate-400 space-y-3">
            <BookOpen className="w-12 h-12 mx-auto text-rose-200" />
            <h4 className="font-heading font-bold text-slate-700 text-base">Tidak Ada Buku Ditemukan</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Cobalah memilih kategori lain seperti Novel, Komik Jepang, atau Buku Tes.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Semua Koleksi');
              }}
              className="px-4 py-2 bg-rose-500 text-white text-xs font-semibold rounded-2xl hover:bg-rose-600 transition-colors shadow-sm shadow-rose-200"
            >
              Tampilkan Semua Koleksi
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {sortedBooks.map((book) => (
              <BookCard key={book.id} book={book} onSelect={onSelectBook} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
