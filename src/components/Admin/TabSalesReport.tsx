import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  BookOpen,
  Calendar,
  Printer,
  Award,
  Layers,
  ArrowUpRight,
  PieChart,
} from 'lucide-react';
import { Order, Book } from '../../types';
import { formatRupiah } from '../../utils/formatters';

interface TabSalesReportProps {
  orders: Order[];
  books: Book[];
}

export const TabSalesReport: React.FC<TabSalesReportProps> = ({ orders, books }) => {
  const [period, setPeriod] = useState<'all' | '30days' | '7days'>('all');

  const now = new Date().getTime();
  const filteredOrders = orders.filter((o) => {
    // Only count completed or processed orders as revenue
    const isValidSale = o.status !== 'dibatalkan';
    if (!isValidSale) return false;

    if (period === 'all') return true;
    const orderTime = new Date(o.createdAt).getTime();
    if (period === '30days') return now - orderTime <= 30 * 24 * 60 * 60 * 1000;
    if (period === '7days') return now - orderTime <= 7 * 24 * 60 * 60 * 1000;
    return true;
  });

  // Calculate metrics
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalSubtotal = filteredOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const totalBooksSold = filteredOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, it) => s + it.quantity, 0),
    0
  );
  const completedOrdersCount = filteredOrders.filter(
    (o) => o.status === 'selesai' || o.status === 'diproses' || o.status === 'dikirim'
  ).length;
  const averageOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

  // Calculate COGS and Gross Profit from actual costPrice
  const totalCogs = filteredOrders.reduce(
    (sum, o) =>
      sum +
      o.items.reduce(
        (s, it) => s + (it.costPrice || Math.round(it.price * 0.7)) * it.quantity,
        0
      ),
    0
  );
  const totalGrossProfit = Math.max(0, totalRevenue - totalCogs);
  const grossProfitMargin =
    totalRevenue > 0 ? Number(((totalGrossProfit / totalRevenue) * 100).toFixed(1)) : 0;

  // Omnichannel breakdown: PoS Cashier vs Online Webstore
  const posOrders = filteredOrders.filter((o) => o.channel === 'pos');
  const webOrders = filteredOrders.filter((o) => o.channel !== 'pos');
  const posRevenue = posOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const webRevenue = webOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Category sales breakdown
  const categorySales: Record<string, { revenue: number; units: number }> = {
    'Novel': { revenue: 0, units: 0 },
    'Komik Jepang': { revenue: 0, units: 0 },
    'Teknologi & Sains': { revenue: 0, units: 0 },
    'Bahasa': { revenue: 0, units: 0 },
    'Buku Tes (TOEFL / CPNS / UTBK)': { revenue: 0, units: 0 },
  };

  // Best selling books counter
  const bookSalesMap: Record<string, { title: string; author: string; units: number; revenue: number }> = {};

  filteredOrders.forEach((o) => {
    o.items.forEach((it) => {
      // Find book for category
      const bookObj = books.find((b) => b.id === it.bookId);
      const catName = bookObj?.category || 'Lainnya';

      if (!categorySales[catName]) {
        categorySales[catName] = { revenue: 0, units: 0 };
      }
      categorySales[catName].revenue += it.price * it.quantity;
      categorySales[catName].units += it.quantity;

      if (!bookSalesMap[it.bookId]) {
        bookSalesMap[it.bookId] = {
          title: it.title,
          author: it.author,
          units: 0,
          revenue: 0,
        };
      }
      bookSalesMap[it.bookId].units += it.quantity;
      bookSalesMap[it.bookId].revenue += it.price * it.quantity;
    });
  });

  const topBooks = Object.values(bookSalesMap)
    .sort((a, b) => b.units - a.units)
    .slice(0, 5);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Laporan Penjualan & Kinerja Finansial
          </h3>
          <p className="text-xs text-slate-500">
            Analisis pendapatan, pergerakan stok, dan performa buku terlaris.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setPeriod('all')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                period === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Semua Waktu
            </button>
            <button
              onClick={() => setPeriod('30days')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                period === '30days' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              30 Hari
            </button>
            <button
              onClick={() => setPeriod('7days')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                period === '7days' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              7 Hari
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omset */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Pendapatan</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {formatRupiah(totalRevenue)}
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> {filteredOrders.length} total transaksi masuk
          </p>
        </div>

        {/* Laba Kotor (Gross Profit) */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/40 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-bold uppercase tracking-wider">Estimasi Laba Kotor</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
              +{grossProfitMargin}%
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700">
            {formatRupiah(totalGrossProfit)}
          </div>
          <p className="text-[11px] text-slate-500">
            Modal HPP: <span className="font-mono">{formatRupiah(totalCogs)}</span>
          </p>
        </div>

        {/* Books Sold */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Buku Terjual</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {totalBooksSold} <span className="text-sm font-sans font-normal text-slate-500">Eksemplar</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {completedOrdersCount} transaksi selesai diproses
          </p>
        </div>

        {/* AOV */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Rata-Rata Order (AOV)</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {formatRupiah(averageOrderValue)}
          </div>
          <p className="text-[11px] text-slate-500">Nilai rata-rata keranjang pembeli</p>
        </div>
      </div>

      {/* Omnichannel Channel Split Banner: Webstore vs PoS Kasir */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PoS Store */}
        <div className="flex items-center justify-between p-3.5 bg-rose-50/60 border border-rose-100 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              PoS
            </div>
            <div>
              <h5 className="font-bold text-xs text-rose-950">Transaksi Kasir Toko (Offline)</h5>
              <p className="text-[11px] text-rose-700">{posOrders.length} transaksi kasir selesai</p>
            </div>
          </div>
          <div className="text-right">
            <span className="font-mono font-bold text-sm text-rose-900 block">{formatRupiah(posRevenue)}</span>
            <span className="text-[10px] text-rose-600 font-medium">
              {totalRevenue > 0 ? ((posRevenue / totalRevenue) * 100).toFixed(0) : 0}% total omset
            </span>
          </div>
        </div>

        {/* Webstore Online */}
        <div className="flex items-center justify-between p-3.5 bg-sky-50/60 border border-sky-100 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              Web
            </div>
            <div>
              <h5 className="font-bold text-xs text-sky-950">Pesanan Webstore Marketplace</h5>
              <p className="text-[11px] text-sky-700">{webOrders.length} pesanan online masuk</p>
            </div>
          </div>
          <div className="text-right">
            <span className="font-mono font-bold text-sm text-sky-900 block">{formatRupiah(webRevenue)}</span>
            <span className="text-[10px] text-sky-600 font-medium">
              {totalRevenue > 0 ? ((webRevenue / totalRevenue) * 100).toFixed(0) : 0}% total omset
            </span>
          </div>
        </div>
      </div>

      {/* Two columns: Category Breakdown & Top Selling Books */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-heading font-bold text-slate-800 text-sm flex items-center gap-2">
              <PieChart className="w-4 h-4 text-rose-500" />
              Kontribusi Penjualan per Kategori (5 Kategori)
            </h4>
          </div>

          <div className="space-y-4">
            {Object.entries(categorySales).map(([cat, data]) => {
              const percentage = totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 100) : 0;

              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{cat}</span>
                    <span className="font-mono text-slate-600 font-bold">
                      {formatRupiah(data.revenue)} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        cat === 'Novel'
                          ? 'bg-rose-400'
                          : cat === 'Komik Jepang'
                          ? 'bg-purple-400'
                          : cat === 'Teknologi & Sains'
                          ? 'bg-sky-400'
                          : cat === 'Bahasa'
                          ? 'bg-emerald-400'
                          : 'bg-amber-400'
                      }`}
                      style={{ width: `${Math.max(percentage, data.revenue > 0 ? 5 : 0)}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 text-right">
                    {data.units} buku terjual
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 Best-Selling Books */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-serif font-bold text-slate-900 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Peringkat Buku Terlaris (Top Selling)
            </h4>
          </div>

          {topBooks.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Belum ada data penjualan buku pada periode ini.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {topBooks.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : idx === 1
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900 line-clamp-1">{item.title}</p>
                      <p className="text-[11px] text-slate-400">{item.author}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-800 block">
                      {item.units} Terjual
                    </span>
                    <span className="text-[11px] font-mono text-emerald-700">
                      {formatRupiah(item.revenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
