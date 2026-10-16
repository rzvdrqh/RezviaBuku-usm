import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  Package,
  Layers,
  Sparkles,
  Percent,
  Calculator,
} from 'lucide-react';
import { Book } from '../../types';
import { addBook, updateBook, deleteBook, resetBooksToDefault } from '../../services/storeService';
import { formatRupiah } from '../../utils/formatters';
import { resolveCoverUrl } from '../../utils/coverResolver';

interface TabProductsProps {
  books: Book[];
  onOpenPricingTab?: () => void;
}

const CATEGORIES = [
  'Semua Kategori',
  'Novel',
  'Komik Jepang',
  'Teknologi & Sains',
  'Bahasa',
  'Buku Tes (TOEFL / CPNS / UTBK)',
];

export const TabProducts: React.FC<TabProductsProps> = ({ books, onOpenPricingTab }) => {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('Semua Kategori');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formCategory, setFormCategory] = useState('Novel');
  const [formCostPrice, setFormCostPrice] = useState(70000);
  const [formProfitRatio, setFormProfitRatio] = useState(30);
  const [formPrice, setFormPrice] = useState(91000);
  const [formStock, setFormStock] = useState(20);
  const [formCoverImage, setFormCoverImage] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsbn, setFormIsbn] = useState('');
  const [formPages, setFormPages] = useState(300);

  const notify = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(''), 3000);
  };

  const filteredBooks = books.filter((b) => {
    const matchCat = selectedCat === 'Semua Kategori' || b.category === selectedCat;
    const matchSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleCostPriceChange = (val: number) => {
    setFormCostPrice(val);
    const raw = val * (1 + formProfitRatio / 100);
    setFormPrice(Math.round(raw / 500) * 500);
  };

  const handleProfitRatioChange = (val: number) => {
    setFormProfitRatio(val);
    const raw = formCostPrice * (1 + val / 100);
    setFormPrice(Math.round(raw / 500) * 500);
  };

  const handlePriceChange = (val: number) => {
    setFormPrice(val);
    if (formCostPrice > 0) {
      const ratio = ((val - formCostPrice) / formCostPrice) * 100;
      setFormProfitRatio(Number(ratio.toFixed(1)));
    }
  };

  const openAddModal = () => {
    setFormTitle('');
    setFormAuthor('');
    setFormCategory('Novel');
    setFormCostPrice(70000);
    setFormProfitRatio(30);
    setFormPrice(91000);
    setFormStock(20);
    setFormCoverImage('https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=640&auto=format&fit=crop');
    setFormDescription('');
    setFormIsbn('978-602-000000');
    setFormPages(280);
    setIsAddModalOpen(true);
  };

  const openEditModal = (book: Book) => {
    const cost = book.costPrice || Math.round(book.price * 0.7);
    const ratio = book.profitRatio || Number((((book.price - cost) / cost) * 100).toFixed(1));

    setEditingBook(book);
    setFormTitle(book.title);
    setFormAuthor(book.author);
    setFormCategory(book.category);
    setFormCostPrice(cost);
    setFormProfitRatio(ratio);
    setFormPrice(book.price);
    setFormStock(book.stock);
    setFormCoverImage(book.coverImage);
    setFormDescription(book.description);
    setFormIsbn(book.isbn || '');
    setFormPages(book.pages || 300);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formAuthor || !formCoverImage) return;

    try {
      if (editingBook) {
        await updateBook(editingBook.id, {
          title: formTitle.trim(),
          author: formAuthor.trim(),
          category: formCategory,
          costPrice: Number(formCostPrice),
          profitRatio: Number(formProfitRatio),
          price: Number(formPrice),
          stock: Number(formStock),
          coverImage: formCoverImage.trim(),
          description: formDescription.trim(),
          isbn: formIsbn.trim(),
          pages: Number(formPages),
        });
        notify(`Buku "${formTitle}" berhasil diperbarui!`);
        setEditingBook(null);
      } else {
        await addBook({
          title: formTitle.trim(),
          author: formAuthor.trim(),
          category: formCategory,
          costPrice: Number(formCostPrice),
          profitRatio: Number(formProfitRatio),
          price: Number(formPrice),
          stock: Number(formStock),
          coverImage: formCoverImage.trim(),
          description: formDescription.trim(),
          isbn: formIsbn.trim(),
          pages: Number(formPages),
          rating: 4.8,
        });
        notify(`Buku "${formTitle}" berhasil ditambahkan ke katalog!`);
        setIsAddModalOpen(false);
      }
    } catch (err) {
      alert('Gagal menyimpan buku: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleInlineStock = async (book: Book, delta: number) => {
    const newStock = Math.max(0, book.stock + delta);
    try {
      await updateBook(book.id, { stock: newStock });
    } catch (err) {
      console.error('Error update stock:', err);
    }
  };

  const handleDeleteBook = async (id: string) => {
    try {
      await deleteBook(id);
      notify('Buku berhasil dihapus dari database.');
      setDeletingId(null);
    } catch (err) {
      alert('Gagal menghapus: ' + String(err));
    }
  };

  const handleResetCatalog = async () => {
    if (confirm('Apakah Anda yakin ingin mengatur ulang katalog ke 15 buku bawaan dengan sampul buku asli?')) {
      setIsResetting(true);
      try {
        await resetBooksToDefault();
        notify('Katalog berhasil diperbarui ke 15 buku dengan sampul asli & rasio profit!');
      } catch (err) {
        alert('Gagal mereset: ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      {actionNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h3 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" />
            Manajemen Produk & Stok Buku
          </h3>
          <p className="text-xs text-slate-500">
            Total {books.length} judul buku terdaftar di database Firestore secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenPricingTab && (
            <button
              onClick={onOpenPricingTab}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 transition-colors flex items-center gap-1.5"
              title="Buka Pengaturan Harga & Rasio Margin"
            >
              <Percent className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kelola Auto-Ratio Profit</span>
            </button>
          )}

          <button
            onClick={handleResetCatalog}
            disabled={isResetting}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
            title="Reset ke 12 buku default"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Reset 12 Buku Standar</span>
          </button>

          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Buku Baru</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari judul buku atau nama penulis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 font-medium text-slate-700"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Books Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Buku & Penulis</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Harga Jual</th>
                <th className="py-3 px-4">HPP & Rasio Profit</th>
                <th className="py-3 px-4">Stok Saat Ini</th>
                <th className="py-3 px-4 text-center">Ubah Stok Cepat</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada buku yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredBooks.map((book) => {
                  const isLow = book.stock > 0 && book.stock <= 5;
                  const isOut = book.stock === 0;
                  const cost = book.costPrice || Math.round(book.price * 0.7);
                  const ratio = book.profitRatio || Number((((book.price - cost) / cost) * 100).toFixed(1));
                  const profitAmt = book.price - cost;

                  return (
                    <tr key={book.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Book info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={resolveCoverUrl(book.coverImage, book.title)}
                            alt={book.title}
                            className="w-10 h-14 object-cover rounded-md border border-slate-200 shadow-2xs shrink-0 bg-rose-50"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.src.endsWith('/covers/cover_bumi_manusia.jpg')) {
                                target.src = '/covers/cover_bumi_manusia.jpg';
                              }
                            }}
                          />
                          <div>
                            <span className="font-serif font-bold text-slate-900 text-sm block">
                              {book.title}
                            </span>
                            <span className="text-slate-500 text-[11px] block">{book.author}</span>
                            <span className="text-[10px] font-mono text-slate-400">
                              ISBN: {book.isbn || '-'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[10px]">
                          {book.category}
                        </span>
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {formatRupiah(book.price)}
                      </td>

                      {/* HPP & Margin */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="text-slate-500 font-mono text-[11px]">
                            HPP: {formatRupiah(cost)}
                          </div>
                          <div className="flex items-center gap-1 font-mono text-[11px]">
                            <span className="bg-emerald-50 text-emerald-800 font-bold px-1 rounded border border-emerald-200">
                              +{ratio}%
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              (+{formatRupiah(profitAmt)})
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Stock badge */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-extrabold text-sm ${
                              isOut
                                ? 'text-rose-600'
                                : isLow
                                ? 'text-amber-600'
                                : 'text-emerald-700'
                            }`}
                          >
                            {book.stock}
                          </span>
                          {isOut && (
                            <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded">
                              HABIS
                            </span>
                          )}
                          {isLow && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                              MENIPIS
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Quick stock buttons */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1">
                          <button
                            onClick={() => handleInlineStock(book, -1)}
                            disabled={book.stock <= 0}
                            className="w-6 h-6 flex items-center justify-center rounded bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs disabled:opacity-30 shadow-2xs"
                            title="Kurang 1 stok"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => handleInlineStock(book, 1)}
                            className="w-6 h-6 flex items-center justify-center rounded bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs shadow-2xs"
                            title="Tambah 1 stok"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => handleInlineStock(book, 5)}
                            className="px-1.5 h-6 flex items-center justify-center rounded bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-[10px] shadow-2xs"
                            title="Tambah 5 stok sekaligus"
                          >
                            +5
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(book)}
                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit buku"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(book.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus buku"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-base text-slate-900">Hapus Buku Ini?</h3>
            </div>
            <p className="text-xs text-slate-600">
              Tindakan ini akan menghapus buku secara permanen dari database Firestore real-time.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteBook(deletingId)}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Book Modal */}
      {(isAddModalOpen || editingBook) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-6 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-serif text-lg font-bold text-slate-900">
                {editingBook ? 'Edit Data Buku' : 'Tambah Buku Baru ke Katalog'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingBook(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Judul Buku *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Contoh: Bumi Manusia"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Penulis *</label>
                  <input
                    type="text"
                    required
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    placeholder="Contoh: Pramoedya Ananta Toer"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Novel">Novel</option>
                    <option value="Komik Jepang">Komik Jepang</option>
                    <option value="Teknologi & Sains">Teknologi & Sains</option>
                    <option value="Bahasa">Bahasa</option>
                    <option value="Buku Tes (TOEFL / CPNS / UTBK)">Buku Tes (TOEFL / CPNS / UTBK)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jumlah Stok Fisik *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              {/* Live Pricing & Auto-Ratio Calculator Box */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-amber-600" />
                    Kalkulator Auto-Ratio Profit Toko
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Rumus Markup: Jual = HPP × (1 + Margin%)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 text-[11px] mb-1">
                      Harga Beli / HPP (Rp) *
                    </label>
                    <input
                      type="number"
                      min="1000"
                      step="500"
                      required
                      value={formCostPrice}
                      onChange={(e) => handleCostPriceChange(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-200 rounded-xl font-mono text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 text-[11px] mb-1">
                      Rasio Margin Profit (%) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="300"
                        step="0.5"
                        required
                        value={formProfitRatio}
                        onChange={(e) => handleProfitRatioChange(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-200 rounded-xl font-mono text-xs font-bold text-emerald-700 pr-6"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[11px]">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 text-[11px] mb-1">
                      Harga Jual Kasir/Web (Rp) *
                    </label>
                    <input
                      type="number"
                      min="1000"
                      step="500"
                      required
                      value={formPrice}
                      onChange={(e) => handlePriceChange(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-xl font-mono text-xs font-bold text-amber-900 ring-2 ring-amber-400/20"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-amber-200/60 text-slate-600">
                  <span>Estimasi Keuntungan Kotor per Buku:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    +{formatRupiah(Math.max(0, formPrice - formCostPrice))} ({formProfitRatio}%)
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">URL Gambar Cover *</label>
                <input
                  type="url"
                  required
                  value={formCoverImage}
                  onChange={(e) => setFormCoverImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor ISBN</label>
                  <input
                    type="text"
                    value={formIsbn}
                    onChange={(e) => setFormIsbn(e.target.value)}
                    placeholder="978-602-123456"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jumlah Halaman</label>
                  <input
                    type="number"
                    value={formPages}
                    onChange={(e) => setFormPages(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sinopsis / Deskripsi Buku</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Deskripsi cerita atau isi buku..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingBook(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs"
                >
                  {editingBook ? 'Simpan Perubahan' : 'Tambahkan ke Toko'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
