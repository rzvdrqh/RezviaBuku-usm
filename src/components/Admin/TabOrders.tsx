import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  X,
  CreditCard,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { updateOrderStatus } from '../../services/storeService';
import { formatRupiah, formatDate, getStatusDetails } from '../../utils/formatters';

interface TabOrdersProps {
  orders: Order[];
  onOpenApprovalTab?: () => void;
}

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'Semua Status' },
  { key: 'menunggu_approval', label: 'Menunggu Approval' },
  { key: 'menunggu_pembayaran', label: 'Menunggu Pembayaran' },
  { key: 'diproses', label: 'Diproses' },
  { key: 'dikirim', label: 'Dikirim' },
  { key: 'selesai', label: 'Selesai' },
  { key: 'dibatalkan', label: 'Dibatalkan' },
];

export const TabOrders: React.FC<TabOrdersProps> = ({ orders, onOpenApprovalTab }) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Status updating state
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<OrderStatus>('menunggu_pembayaran');
  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const filteredOrders = orders.filter((order) => {
    const matchStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchSearch =
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      order.customerPhone.includes(search) ||
      order.customerEmail.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const openStatusEditor = (order: Order) => {
    setUpdatingId(order.id);
    setEditStatus(order.status);
    setTrackingNumberInput(order.trackingNumber || '');
  };

  const handleSaveStatus = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, editStatus, trackingNumberInput.trim());
      setActionSuccess('Status pesanan berhasil diperbarui!');
      setTimeout(() => setActionSuccess(''), 3000);
      setUpdatingId(null);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: editStatus, trackingNumber: trackingNumberInput } : null));
      }
    } catch (err) {
      alert('Gagal update status: ' + String(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Action notice */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Header & Stats Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-600" />
            Data Order & Riwayat Transaksi
          </h3>
          <p className="text-xs text-slate-500">
            Total {orders.length} pesanan tercatat di database dengan auto-refresh live.
          </p>
        </div>

        {/* Quick Pending Counter */}
        {orders.filter((o) => o.status === 'menunggu_approval').length > 0 && (
          <button
            onClick={onOpenApprovalTab}
            className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
            <span>
              {orders.filter((o) => o.status === 'menunggu_approval').length} Pesanan Menunggu Approval Bukti Bayar
            </span>
          </button>
        )}
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari berdasarkan No. Pesanan, Nama Pembeli, Email, atau No. HP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 font-medium text-slate-700"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">No. Pesanan & Waktu</th>
                <th className="py-3 px-4">Data Pembeli</th>
                <th className="py-3 px-4">Buku Dipesan</th>
                <th className="py-3 px-4">Total Biaya</th>
                <th className="py-3 px-4">Metode Bayar</th>
                <th className="py-3 px-4">Status Pesanan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Belum ada data pesanan yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const statusInfo = getStatusDetails(order.status);
                  const isPendingApproval = order.status === 'menunggu_approval';

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Order info */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 block">
                          {order.orderNumber}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {formatDate(order.createdAt)}
                        </span>
                        {order.trackingNumber && (
                          <span className="text-[10px] text-purple-700 font-mono bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded inline-block mt-1">
                            Resi: {order.trackingNumber}
                          </span>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{order.customerName}</span>
                        <span className="text-slate-500 text-[11px] block">{order.customerPhone}</span>
                        <span className="text-slate-400 text-[10px] block">{order.customerEmail}</span>
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block">
                          {order.items.reduce((s, i) => s + i.quantity, 0)} buku
                        </span>
                        <span className="text-[11px] text-slate-500 line-clamp-1 max-w-xs">
                          {order.items.map((i) => `${i.title} (${i.quantity})`).join(', ')}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {formatRupiah(order.totalAmount)}
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="uppercase font-mono font-bold text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                            {order.paymentMethod}
                          </span>
                          {order.paymentProofUrl && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Bukti bayar terunggah" />
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.borderColor}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Lihat Detail Pesanan"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openStatusEditor(order)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-[11px] transition-colors"
                            title="Ubah Status Pesanan"
                          >
                            Ubah
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

      {/* Quick Status Editor Modal */}
      {updatingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">Perbarui Status Pesanan</h3>
              <button
                onClick={() => setUpdatingId(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Status Baru:</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as OrderStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="menunggu_pembayaran">Menunggu Pembayaran</option>
                  <option value="menunggu_approval">Menunggu Approval</option>
                  <option value="diproses">Sedang Diproses / Dikemas</option>
                  <option value="dikirim">Sedang Dikirim</option>
                  <option value="selesai">Selesai</option>
                  <option value="dibatalkan">Dibatalkan</option>
                </select>
              </div>

              {editStatus === 'dikirim' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nomor Resi Ekspedisi (JNE/SiCepat):
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: JNE8291038419"
                    value={trackingNumberInput}
                    onChange={(e) => setTrackingNumberInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setUpdatingId(null)}
                className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg text-xs"
              >
                Batal
              </button>
              <button
                onClick={() => handleSaveStatus(updatingId)}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-xs"
              >
                Simpan Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail View Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-6 animate-in fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                  Detail Transaksi Pesanan
                </span>
                <h3 className="font-serif text-lg font-bold text-slate-900 font-mono">
                  {selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              {/* Status Header */}
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Status Saat Ini</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {getStatusDetails(selectedOrder.status).label}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase">Waktu Pesan</span>
                  <span className="text-slate-700 font-medium">{formatDate(selectedOrder.createdAt)}</span>
                </div>
              </div>

              {/* Customer and shipping info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-800">Identitas Pembeli</h4>
                  <p><span className="text-slate-400">Nama:</span> <strong>{selectedOrder.customerName}</strong></p>
                  <p><span className="text-slate-400">No. HP:</span> {selectedOrder.customerPhone}</p>
                  <p><span className="text-slate-400">Email:</span> {selectedOrder.customerEmail}</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-800">Alamat & Pengiriman</h4>
                  <p className="line-clamp-2"><span className="text-slate-400">Alamat:</span> {selectedOrder.shippingAddress}</p>
                  {selectedOrder.trackingNumber && (
                    <p><span className="text-slate-400">Resi:</span> <strong className="font-mono text-purple-700">{selectedOrder.trackingNumber}</strong></p>
                  )}
                  {selectedOrder.notes && (
                    <p className="italic text-slate-500 bg-slate-50 p-1 rounded">Catatan: {selectedOrder.notes}</p>
                  )}
                </div>
              </div>

              {/* Items Purchased */}
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-2">Item Pembelian</h4>
                <div className="divide-y divide-slate-100">
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={it.coverImage}
                          alt={it.title}
                          className="w-8 h-10 object-cover rounded border"
                        />
                        <div>
                          <p className="font-medium text-slate-900">{it.title}</p>
                          <p className="text-[11px] text-slate-500">
                            {formatRupiah(it.price)} x {it.quantity}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-slate-800">
                        {formatRupiah(it.price * it.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
                  <span>Total Tagihan (termasuk ongkir)</span>
                  <span className="text-amber-700 font-mono font-extrabold">
                    {formatRupiah(selectedOrder.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Payment Slip if available */}
              {selectedOrder.paymentProofUrl && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-2">Lampiran Bukti Bayar</h4>
                  <img
                    src={selectedOrder.paymentProofUrl}
                    alt="Bukti bayar"
                    className="max-h-48 rounded-lg border border-slate-200 object-contain mx-auto"
                  />
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => openStatusEditor(selectedOrder)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs"
              >
                Ubah Status Pesanan Ini
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
