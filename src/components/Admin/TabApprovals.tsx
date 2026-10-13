import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  AlertTriangle,
  ZoomIn,
  Clock,
  CreditCard,
  User,
  Check,
  X,
  FileCheck,
} from 'lucide-react';
import { Order } from '../../types';
import { approvePaymentProof, rejectPaymentProof } from '../../services/storeService';
import { formatRupiah, formatDate } from '../../utils/formatters';

interface TabApprovalsProps {
  orders: Order[];
}

export const TabApprovals: React.FC<TabApprovalsProps> = ({ orders }) => {
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [rejectModalOrder, setRejectModalOrder] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState('Nominal transfer tidak sesuai atau gambar struk tidak terbaca.');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Pending queue
  const pendingApprovals = orders.filter((o) => o.status === 'menunggu_approval');
  // Approved history
  const approvedHistory = orders.filter((o) => o.status === 'diproses' || o.status === 'dikirim' || o.status === 'selesai');

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3500);
  };

  const handleApprove = async (order: Order) => {
    setIsProcessing(true);
    try {
      await approvePaymentProof(order.id);
      showToast(`Pembayaran pesanan ${order.orderNumber} berhasil DISETUJUI! Pesanan beralih ke status Diproses.`);
    } catch (err) {
      alert('Gagal menyetujui: ' + String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalOrder) return;
    setIsProcessing(true);
    try {
      await rejectPaymentProof(rejectModalOrder.id, rejectReason.trim());
      showToast(`Bukti bayar pesanan ${rejectModalOrder.orderNumber} DITOLAK. Pelanggan dapat mengupload ulang.`);
      setRejectModalOrder(null);
    } catch (err) {
      alert('Gagal menolak bukti: ' + String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {successToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-indigo-600" />
            Approval Bukti Pembayaran Pelanggan
          </h3>
          <p className="text-xs text-slate-500">
            Verifikasi transfer bank atau QRIS dari pembeli sebelum buku dikemas dan dikirim.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold">
            {pendingApprovals.length} Antrean Perlu Ditinjau
          </span>
        </div>
      </div>

      {/* Pending Approvals List */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          Antrean Menunggu Approval ({pendingApprovals.length})
        </h4>

        {pendingApprovals.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
            <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
            <h5 className="font-bold text-slate-700 text-sm">Semua Pembayaran Telah Diverifikasi</h5>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Tidak ada bukti transfer baru yang menunggu persetujuan saat ini. Ketika pembeli mengupload bukti, antrean akan muncul di sini secara real-time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingApprovals.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border-2 border-indigo-100 hover:border-indigo-300 shadow-sm p-4 space-y-4 transition-all"
              >
                {/* Header card */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {order.orderNumber}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Diupload: {formatDate(order.paymentProofUploadedAt || order.updatedAt || '')}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {order.paymentMethod}
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Data Pembeli</span>
                    <strong className="text-slate-800">{order.customerName}</strong>
                    <span className="block text-slate-500 text-[11px]">{order.customerPhone}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase">Total Tagihan</span>
                    <strong className="text-amber-700 font-mono text-sm block">
                      {formatRupiah(order.totalAmount)}
                    </strong>
                    <span className="text-[10px] text-slate-500">
                      {order.items.length} judul buku
                    </span>
                  </div>
                </div>

                {/* Proof Image Box */}
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900/90 group">
                  {order.paymentProofUrl ? (
                    <>
                      <img
                        src={order.paymentProofUrl}
                        alt="Bukti Transfer"
                        className="w-full h-36 object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                      />
                      <button
                        onClick={() => setZoomImage(order.paymentProofUrl || null)}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold gap-1.5"
                      >
                        <ZoomIn className="w-4 h-4" /> Perbesar Foto Bukti
                      </button>
                    </>
                  ) : (
                    <div className="h-32 flex items-center justify-center text-slate-400 text-xs">
                      Tidak ada foto lampiran
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      setRejectModalOrder(order);
                      setRejectReason('Nominal transfer tidak sesuai dengan total tagihan pesanan.');
                    }}
                    disabled={isProcessing}
                    className="flex-1 py-2 px-3 border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Tolak Bukti</span>
                  </button>

                  <button
                    onClick={() => handleApprove(order)}
                    disabled={isProcessing}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Setujui Pembayaran</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History of Approved Payments */}
      <div className="space-y-3 pt-6 border-t border-slate-200">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Riwayat Pembayaran Disetujui ({approvedHistory.length})
        </h4>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-4">No. Pesanan</th>
                  <th className="py-2.5 px-4">Pembeli</th>
                  <th className="py-2.5 px-4">Nominal Disetujui</th>
                  <th className="py-2.5 px-4">Metode</th>
                  <th className="py-2.5 px-4">Status Transaksi</th>
                  <th className="py-2.5 px-4 text-right">Bukti Transfer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {approvedHistory.slice(0, 6).map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{ord.orderNumber}</td>
                    <td className="py-2.5 px-4 text-slate-800">{ord.customerName}</td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-emerald-700">
                      {formatRupiah(ord.totalAmount)}
                    </td>
                    <td className="py-2.5 px-4 uppercase font-mono text-[11px] text-slate-600">
                      {ord.paymentMethod}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {ord.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {ord.paymentProofUrl ? (
                        <button
                          onClick={() => setZoomImage(ord.paymentProofUrl || null)}
                          className="text-indigo-600 hover:text-indigo-800 font-semibold text-[11px] inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Lihat Struk
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Zoom Image Modal */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-2xl w-full p-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setZoomImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-amber-400 p-2"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={zoomImage}
              alt="Bukti Transfer Zoom"
              className="w-full max-h-[80vh] object-contain rounded-2xl bg-slate-900 shadow-2xl border border-slate-700"
            />
          </div>
        </div>
      )}

      {/* Reject Payment Reason Modal */}
      {rejectModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-rose-700 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Tolak Bukti Pembayaran
              </h3>
              <button
                onClick={() => setRejectModalOrder(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Alasan penolakan akan diberitahukan kepada pembeli ({rejectModalOrder.customerName}) di pelacak pesanan mereka:
            </p>

            <div>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Contoh: Nominal transfer kurang dari total tagihan..."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalOrder(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={isProcessing}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Kirim Penolakan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
