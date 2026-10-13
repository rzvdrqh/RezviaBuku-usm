import React, { useState } from 'react';
import {
  Package,
  FileText,
  FileCheck,
  Users,
  TrendingUp,
  ShieldCheck,
  Radio,
  BookOpen,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { Book, Order, Customer } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { TabProducts } from './TabProducts';
import { TabOrders } from './TabOrders';
import { TabApprovals } from './TabApprovals';
import { TabCustomers } from './TabCustomers';
import { TabSalesReport } from './TabSalesReport';

interface AdminDashboardProps {
  books: Book[];
  orders: Order[];
  customers: Customer[];
  isDbLive: boolean;
  onBackToStore: () => void;
}

type AdminTab = 'products' | 'orders' | 'approvals' | 'customers' | 'sales';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  books,
  orders,
  customers,
  isDbLive,
  onBackToStore,
}) => {
  const { adminUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('products');

  const pendingApprovalsCount = orders.filter((o) => o.status === 'menunggu_approval').length;

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16">
      {/* Admin Subheader Banner */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-lg font-bold text-white">
                  Dashboard Administrasi PustakaVia
                </h1>
                <span className="text-[10px] font-bold bg-rose-400 text-slate-950 px-2 py-0.5 rounded-full uppercase">
                  Live Firestore
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Login sebagai: <strong className="text-slate-200">{adminUser?.name || 'Admin'}</strong> ({adminUser?.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <Radio className={`w-3 h-3 ${isDbLive ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
              <span>{isDbLive ? 'Sinkronisasi Real-Time Aktif' : 'Menghubungkan...'}</span>
            </div>

            <button
              onClick={onBackToStore}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Buka Tampilan Toko</span>
            </button>

            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Keluar Admin"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-2 sm:space-x-3 overflow-x-auto py-2.5">
            {/* Tab 1: Products */}
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'products'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Data Produk & Stok</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === 'products' ? 'bg-slate-950 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {books.length}
              </span>
            </button>

            {/* Tab 2: Orders */}
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'orders'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Data Order & Riwayat</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === 'orders' ? 'bg-slate-950 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {orders.length}
              </span>
            </button>

            {/* Tab 3: Payment Approvals */}
            <button
              onClick={() => setActiveTab('approvals')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'approvals'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Approval Bukti Pembayaran</span>
              {pendingApprovalsCount > 0 ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-600 text-white animate-pulse font-extrabold">
                  {pendingApprovalsCount}
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
                  0
                </span>
              )}
            </button>

            {/* Tab 4: Customers */}
            <button
              onClick={() => setActiveTab('customers')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'customers'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Data Pelanggan</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === 'customers' ? 'bg-slate-950 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {customers.length}
              </span>
            </button>

            {/* Tab 5: Sales Report */}
            <button
              onClick={() => setActiveTab('sales')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'sales'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Laporan Sales</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'products' && <TabProducts books={books} />}
        {activeTab === 'orders' && (
          <TabOrders orders={orders} onOpenApprovalTab={() => setActiveTab('approvals')} />
        )}
        {activeTab === 'approvals' && <TabApprovals orders={orders} />}
        {activeTab === 'customers' && <TabCustomers customers={customers} orders={orders} />}
        {activeTab === 'sales' && <TabSalesReport orders={orders} books={books} />}
      </main>
    </div>
  );
};
