import React, { useState } from 'react';
import { Users, Search, Phone, Mail, ShoppingBag, Calendar, ExternalLink, MessageCircle } from 'lucide-react';
import { Customer, Order } from '../../types';
import { formatRupiah, formatDate } from '../../utils/formatters';

interface TabCustomersProps {
  customers: Customer[];
  orders: Order[];
}

export const TabCustomers: React.FC<TabCustomersProps> = ({ customers, orders }) => {
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const customerOrders = selectedCustomer
    ? orders.filter(
        (o) =>
          o.customerEmail.toLowerCase() === selectedCustomer.email.toLowerCase() ||
          o.customerPhone === selectedCustomer.phone
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" />
            Data Pelanggan Toko
          </h3>
          <p className="text-xs text-slate-500">
            Daftar pembeli terdaftar, riwayat transaksi belanja, dan total akumulasi pembelanjaan.
          </p>
        </div>

        <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          Total Terdata: <strong className="text-slate-800">{customers.length} Pelanggan</strong>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Cari berdasarkan nama pelanggan, email, atau nomor HP/WA..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Nama Pelanggan</th>
                <th className="py-3 px-4">Kontak (Email / No. HP)</th>
                <th className="py-3 px-4 text-center">Total Pesanan</th>
                <th className="py-3 px-4">Total Belanja (IDR)</th>
                <th className="py-3 px-4">Pesanan Terakhir</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Belum ada data pelanggan yang cocok.
                  </td>
                </tr>
              ) : (
                filtered.map((cust) => {
                  const cleanPhone = cust.phone.replace(/[^0-9]/g, '');
                  const waNumber = cleanPhone.startsWith('0')
                    ? '62' + cleanPhone.slice(1)
                    : cleanPhone;

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block text-sm">{cust.name}</span>
                        <span className="text-[11px] text-slate-400">
                          Sejak: {formatDate(cust.createdAt)}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="flex items-center gap-1.5 text-slate-700">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {cust.email}
                          </span>
                          <span className="flex items-center gap-1.5 text-slate-700">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {cust.phone}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 font-bold text-slate-800 font-mono">
                          {cust.totalOrders}x
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                        {formatRupiah(cust.totalSpent)}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {formatDate(cust.lastOrderDate)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/${waNumber}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Chat WhatsApp Pelanggan"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => setSelectedCustomer(cust)}
                            className="px-2.5 py-1 text-slate-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg text-[11px] font-semibold border border-slate-200"
                          >
                            Riwayat
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

      {/* Customer Orders History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-serif text-base font-bold text-slate-900">
                  Riwayat Transaksi: {selectedCustomer.name}
                </h4>
                <p className="text-xs text-slate-500">
                  Total Belanja: {formatRupiah(selectedCustomer.totalSpent)} ({selectedCustomer.totalOrders} pesanan)
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                Tutup
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {customerOrders.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Belum ada riwayat pesanan.</p>
              ) : (
                customerOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-900 block">{ord.orderNumber}</span>
                      <span className="text-[11px] text-slate-500">{formatDate(ord.createdAt)}</span>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {ord.items.map((i) => i.title).join(', ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-amber-700 block">
                        {formatRupiah(ord.totalAmount)}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-slate-500">
                        {ord.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
