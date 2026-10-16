import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Package,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Edit2,
  X,
  ArrowRight,
  Calculator,
} from 'lucide-react';
import { Book } from '../../types';
import { updateBookPricing, bulkUpdateProfitRatio } from '../../services/storeService';
import { formatRupiah } from '../../utils/formatters';

interface TabInventoryPricingProps {
  books: Book[];
}

export const TabInventoryPricing: React.FC<TabInventoryPricingProps> = ({ books }) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua Kategori');

  // Bulk Markup Tool state
  const [bulkRatio, setBulkRatio] = useState<number>(30);
  const [bulkCategory, setBulkCategory] = useState<string>('Semua Kategori');
  const [isBulkApplying, setIsBulkApplying] = useState(false);

  // Edit single book pricing modal
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [costPriceInput, setCostPriceInput] = useState<number>(0);
  const [profitRatioInput, setProfitRatioInput] = useState<number>(30);
  const [sellingPriceInput, setSellingPriceInput] = useState<number>(0);

  // Notice toast
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Inventory financial totals
  const totalCostValuation = books.reduce(
    (sum, b) => sum + (b.costPrice || Math.round(b.price * 0.7)) * b.stock,
    0
  );
  const totalRetailValuation = books.reduce((sum, b) => sum + b.price * b.stock, 0);
  const totalProjectedProfit = totalRetailValuation - totalCostValuation;
  const avgProfitRatio =
    books.length > 0
      ? books.reduce(
          (sum, b) =>
            sum +
            (b.profitRatio ||
              Math.round(
                ((b.price - (b.costPrice || b.price * 0.7)) / (b.costPrice || b.price * 0.7)) * 100
              )),
          0
        ) / books.length
      : 30;

  // Filtered books
  const filtered = books.filter((b) => {
    const matchCat = categoryFilter === 'Semua Kategori' || b.category === categoryFilter;
    const matchSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      (b.isbn && b.isbn.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const openEditModal = (book: Book) => {
    const currentCost = book.costPrice || Math.round(book.price * 0.7);
    const currentRatio =
      book.profitRatio ||
      Number((((book.price - currentCost) / currentCost) * 100).toFixed(1));

    setEditingBook(book);
    setCostPriceInput(currentCost);
    setProfitRatioInput(currentRatio);
    setSellingPriceInput(book.price);
  };

  // Bidirectional calculator:
  // When cost or ratio changes -> compute selling price
  const handleRatioChange = (newRatio: number) => {
    setProfitRatioInput(newRatio);
    const raw = costPriceInput * (1 + newRatio / 100);
    // Round to nearest 500 IDR for neat book price
    setSellingPriceInput(Math.round(raw / 500) * 500);
  };

  const handleCostChange = (newCost: number) => {
    setCostPriceInput(newCost);
    const raw = newCost * (1 + profitRatioInput / 100);
    setSellingPriceInput(Math.round(raw / 500) * 500);
  };

  // When selling price changes -> compute resulting ratio
  const handlePriceChange = (newPrice: number) => {
    setSellingPriceInput(newPrice);
    if (costPriceInput > 0) {
      const computedRatio = ((newPrice - costPriceInput) / costPriceInput) * 100;
      setProfitRatioInput(Number(computedRatio.toFixed(1)));
    }
  };

  const handleSaveBookPricing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;

    try {
      await updateBookPricing(
        editingBook.id,
        costPriceInput,
        sellingPriceInput,
        profitRatioInput
      );
      showToast(`Harga buku "${editingBook.title}" berhasil diperbarui dengan ratio profit ${profitRatioInput}%!`);
      setEditingBook(null);
    } catch (err) {
      alert('Gagal menyimpan harga: ' + String(err));
    }
  };

  const handleApplyBulkMarkup = async () => {
    if (bulkRatio <= 0) {
      alert('Rasio profit harus lebih besar dari 0%.');
      return;
    }

    if (
      confirm(
        `Terapkan auto-ratio profit ${bulkRatio}% untuk ${bulkCategory}? Harga jual seluruh buku yang dipilih akan dihitung ulang secara otomatis.`
      )
    ) {
      setIsBulkApplying(true);
      try {
        const count = await bulkUpdateProfitRatio(bulkRatio, bulkCategory);
        showToast(`Auto-ratio ${bulkRatio}% berhasil diterapkan ke ${count} buku!`);
      } catch (err) {
        alert('Gagal menerapkan rasio massal: ' + String(err));
      } finally {
        setIsBulkApplying(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {toastMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-heading text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-rose-500" />
            Pengaturan Harga & Auto Ratio Profit Toko
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola Harga Pokok Penjualan (HPP / Beli), margin keuntungan, dan kalkulasi otomatis harga jual katalog.
          </p>
        </div>

        <div className="text-xs bg-rose-50/70 border border-rose-200/60 px-3.5 py-1.5 rounded-2xl text-rose-800 font-semibold">
          Rata-rata Margin: <strong className="font-mono">{avgProfitRatio.toFixed(1)}%</strong>
        </div>
      </div>

      {/* KPI Cards: Valuasi Inventaris & Profit */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Modal Inventaris */}
        <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Modal Inventaris (HPP)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-800">
            {formatRupiah(totalCostValuation)}
          </div>
          <p className="text-[11px] text-slate-400">Total nilai beli seluruh stok buku</p>
        </div>

        {/* Total Nilai Jual Retail */}
        <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Potensi Nilai Jual</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-800">
            {formatRupiah(totalRetailValuation)}
          </div>
          <p className="text-[11px] text-slate-400">Jika seluruh stok buku terjual habis</p>
        </div>

        {/* Total Proyeksi Laba Bersih */}
        <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Proyeksi Laba Kotor</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600">
            {formatRupiah(totalProjectedProfit)}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium">
            Margin kotor rata-rata ~{avgProfitRatio.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Bulk Auto-Ratio Profit Generator Box */}
      <div className="bg-gradient-to-r from-rose-50/80 via-pink-50/50 to-amber-50/60 p-5 rounded-3xl border border-rose-200/80 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-500" />
            <h4 className="font-heading font-bold text-sm text-slate-800">
              Kalkulator Auto Ratio Profit Massal (Bulk Pricing Rule)
            </h4>
          </div>
          <span className="text-[10px] bg-rose-200/80 text-rose-900 px-2 py-0.5 rounded-full font-bold">
            Auto Markup
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
          Atur rasio margin secara cepat untuk seluruh buku dalam satu kategori atau semua produk. Rumus: <code className="bg-white/80 px-1.5 py-0.5 rounded border border-rose-200 text-rose-700 font-mono">Harga Jual = Harga Beli + (Harga Beli × Ratio%)</code> dibulatkan otomatis ke kelipatan Rp 500 terdekat.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
              Target Ratio:
            </label>
            <div className="relative w-32">
              <input
                type="number"
                min={5}
                max={200}
                value={bulkRatio}
                onChange={(e) => setBulkRatio(Number(e.target.value))}
                className="w-full pr-7 pl-3 py-1.5 bg-white border border-rose-200 rounded-xl text-xs font-bold font-mono"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                %
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">Kategori:</label>
            <select
              value={bulkCategory}
              onChange={(e) => setBulkCategory(e.target.value)}
              className="px-3 py-1.5 bg-white border border-rose-200 rounded-xl text-xs font-medium text-slate-700"
            >
              <option value="Semua Kategori">Semua Kategori (15 Buku)</option>
              <option value="Novel">Novel</option>
              <option value="Komik Jepang">Komik Jepang</option>
              <option value="Teknologi & Sains">Teknologi & Sains</option>
              <option value="Bahasa">Bahasa</option>
              <option value="Buku Tes (TOEFL / CPNS / UTBK)">Buku Tes (TOEFL / CPNS / UTBK)</option>
            </select>
          </div>

          <button
            onClick={handleApplyBulkMarkup}
            disabled={isBulkApplying}
            className="w-full sm:w-auto px-4 py-1.5 bg-rose-500 hover:bg-rose-600 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            {isBulkApplying ? (
              <span>Menerapkan...</span>
            ) : (
              <>
                <Percent className="w-3.5 h-3.5" />
                <span>Terapkan Rasio Sekarang</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-rose-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari judul buku, penulis, atau ISBN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-rose-200/80 rounded-2xl focus:ring-2 focus:ring-rose-400/20"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-white border border-rose-200/80 rounded-2xl font-medium text-slate-700"
        >
          <option value="Semua Kategori">Semua Kategori</option>
          <option value="Novel">Novel</option>
          <option value="Komik Jepang">Komik Jepang</option>
          <option value="Teknologi & Sains">Teknologi & Sains</option>
          <option value="Bahasa">Bahasa</option>
          <option value="Buku Tes (TOEFL / CPNS / UTBK)">Buku Tes (TOEFL / CPNS / UTBK)</option>
        </select>
      </div>

      {/* Pricing & Stock Table */}
      <div className="bg-white rounded-3xl border border-rose-100 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#fdfaf8] border-b border-rose-100 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Buku & Penulis</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Stok</th>
                <th className="py-3 px-4">Harga Beli (HPP)</th>
                <th className="py-3 px-4">Rasio Profit (%)</th>
                <th className="py-3 px-4">Harga Jual</th>
                <th className="py-3 px-4">Laba per Unit</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50">
              {filtered.map((book) => {
                const cost = book.costPrice || Math.round(book.price * 0.7);
                const marginNominal = book.price - cost;
                const ratio =
                  book.profitRatio || Number(((marginNominal / cost) * 100).toFixed(1));

                return (
                  <tr key={book.id} className="hover:bg-rose-50/30 transition-colors">
                    {/* Title */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-9 h-12 object-cover rounded-lg border border-rose-100 shrink-0"
                        />
                        <div>
                          <strong className="font-heading text-slate-800 text-xs block line-clamp-1">
                            {book.title}
                          </strong>
                          <span className="text-[11px] text-slate-400">{book.author}</span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        {book.category}
                      </span>
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-4">
                      <span
                        className={`font-mono font-bold text-xs ${
                          book.stock <= 0
                            ? 'text-rose-600'
                            : book.stock <= 5
                            ? 'text-amber-600'
                            : 'text-emerald-700'
                        }`}
                      >
                        {book.stock} unit
                      </span>
                    </td>

                    {/* Cost Price (HPP) */}
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {formatRupiah(cost)}
                    </td>

                    {/* Profit Ratio Badge */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                        +{ratio}%
                      </span>
                    </td>

                    {/* Selling Price */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {formatRupiah(book.price)}
                    </td>

                    {/* Gross Profit per unit */}
                    <td className="py-3 px-4 font-mono text-emerald-600 font-semibold">
                      +{formatRupiah(marginNominal)}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openEditModal(book)}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-[11px] font-bold border border-rose-200 transition-colors inline-flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Kalkulasi</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Single Book Pricing & Ratio Calculator Modal */}
      {editingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100 space-y-4 animate-in fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <div>
                <h3 className="font-heading font-bold text-base text-slate-800">
                  Kalkulator Harga & Rasio Profit
                </h3>
                <p className="text-xs text-slate-400 line-clamp-1">{editingBook.title}</p>
              </div>
              <button
                onClick={() => setEditingBook(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBookPricing} className="space-y-3.5 text-xs">
              {/* Cost Price */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  1. Harga Beli / HPP (IDR):
                </label>
                <input
                  type="number"
                  min={1000}
                  step={500}
                  required
                  value={costPriceInput}
                  onChange={(e) => handleCostChange(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-rose-50/20 border border-rose-200 rounded-xl font-mono text-sm font-bold text-slate-900"
                />
              </div>

              {/* Profit Ratio Slider & Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700">
                    2. Rasio Profit / Margin Markup (%):
                  </label>
                  <span className="font-mono font-bold text-rose-600 text-sm">
                    +{profitRatioInput}%
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={150}
                  step={1}
                  value={profitRatioInput}
                  onChange={(e) => handleRatioChange(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              {/* Selling Price (Two-way linked) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  3. Harga Jual Akhir ke Pelanggan (IDR):
                </label>
                <input
                  type="number"
                  min={1000}
                  step={500}
                  required
                  value={sellingPriceInput}
                  onChange={(e) => handlePriceChange(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-rose-50/20 border border-rose-200 rounded-xl font-mono text-sm font-extrabold text-rose-600"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  *Anda bisa langsung mengubah harga jual, dan rasio di atas akan otomatis terkalkulasi.
                </span>
              </div>

              {/* Summary box */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1">
                <div className="flex justify-between text-slate-600 text-xs">
                  <span>Estimasi Laba Kotor per Unit:</span>
                  <strong className="text-emerald-700 font-mono">
                    +{formatRupiah(sellingPriceInput - costPriceInput)}
                  </strong>
                </div>
                <div className="flex justify-between text-slate-600 text-xs">
                  <span>Potensi Keuntungan Total (Stok: {editingBook.stock}):</span>
                  <strong className="text-emerald-700 font-mono">
                    +{formatRupiah((sellingPriceInput - costPriceInput) * editingBook.stock)}
                  </strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-100">
                <button
                  type="button"
                  onClick={() => setEditingBook(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  Simpan Harga & Rasio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
