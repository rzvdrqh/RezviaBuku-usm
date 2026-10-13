import React, { useState } from 'react';
import {
  X,
  Search,
  Package,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  Truck,
  CreditCard,
  ZoomIn,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { uploadPaymentProof } from '../services/storeService';
import { formatRupiah, formatDate, getStatusDetails } from '../utils/formatters';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  defaultOrderNumber?: string;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  orders,
  defaultOrderNumber = '',
}) => {
  const [searchTerm, setSearchTerm] = useState(defaultOrderNumber);
  const [activeOrderNumber, setActiveOrderNumber] = useState(defaultOrderNumber);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  if (!isOpen) return null;

  // Find targeted order
  const currentOrder = orders.find(
    (o) =>
      o.orderNumber.toLowerCase() === activeOrderNumber.toLowerCase() ||
      o.id === activeOrderNumber
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setActiveOrderNumber(searchTerm.trim());
      setUploadError('');
      setUploadSuccess(false);
    }
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentOrder) return;

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Ukuran file maksimal 2 MB.');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          await uploadPaymentProof(currentOrder.id, reader.result as string);
          setIsUploading(false);
          setUploadSuccess(true);
          setTimeout(() => setUploadSuccess(false), 4000);
        } catch (err) {
          setUploadError(err instanceof Error ? err.message : 'Gagal mengupload bukti pembayaran.');
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploading(false);
      setUploadError('Gagal memproses gambar bukti bayar.');
    }
  };

  const handleQuickSampleProof = async () => {
    if (!currentOrder) return;
    setIsUploading(true);
    setUploadError('');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#fff5f7';
        ctx.fillRect(0, 0, 400, 240);
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(0, 0, 400, 8);
        ctx.fillStyle = '#881337';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('BUKTI TRANSFER PELANGGAN', 20, 40);
        ctx.fillStyle = '#4c0519';
        ctx.font = '12px sans-serif';
        ctx.fillText(`Nomor Pesanan: ${currentOrder.orderNumber}`, 20, 75);
        ctx.fillText(`Pembeli: ${currentOrder.customerName}`, 20, 100);
        ctx.fillStyle = '#e11d48';
        ctx.font = 'bold 20px monospace';
        ctx.fillText(`Total: ${formatRupiah(currentOrder.totalAmount)}`, 20, 150);
        ctx.fillStyle = '#9f1239';
        ctx.font = '11px sans-serif';
        ctx.fillText(`Timestamp: ${new Date().toLocaleString('id-ID')}`, 20, 200);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        await uploadPaymentProof(currentOrder.id, dataUrl);
        setIsUploading(false);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 4000);
      }
    } catch (err) {
      setIsUploading(false);
      setUploadError(err instanceof Error ? err.message : 'Gagal mengirim bukti simulasi.');
    }
  };

  // Status steps mapping
  const statusSteps: { key: OrderStatus; label: string }[] = [
    { key: 'menunggu_pembayaran', label: 'Pesanan Dibuat' },
    { key: 'menunggu_approval', label: 'Verifikasi Bayar' },
    { key: 'diproses', label: 'Sedang Dikemas' },
    { key: 'dikirim', label: 'Pengiriman' },
    { key: 'selesai', label: 'Selesai' },
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'menunggu_pembayaran':
        return 0;
      case 'menunggu_approval':
        return 1;
      case 'diproses':
        return 2;
      case 'dikirim':
        return 3;
      case 'selesai':
        return 4;
      default:
        return 0;
    }
  };

  const statusBadge = currentOrder ? getStatusDetails(currentOrder.status) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div
        className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-rose-100 overflow-hidden relative my-6 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Pastel */}
        <div className="px-6 py-4 bg-gradient-to-r from-rose-100/80 via-pink-50 to-amber-50/70 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-slate-800">
                Pelacak Pesanan PustakaVia
              </h2>
              <p className="text-xs text-rose-700/80 font-medium">
                Cek status real-time atau upload struk transfer pembayaran
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Search box */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-rose-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Masukkan Nomor Pesanan (Contoh: PV-20261013-1234)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-rose-50/20 border border-rose-200/80 rounded-2xl focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-2xl shadow-sm shadow-rose-200 transition-colors"
            >
              Lacak
            </button>
          </form>

          {/* Quick list of recent orders if no direct search */}
          {!currentOrder && orders.length > 0 && (
            <div className="bg-[#fdfbf9] p-4 rounded-2xl border border-rose-100">
              <p className="text-xs font-semibold text-rose-900 mb-2">
                Pilih Dari Pesanan Terbaru di PustakaVia:
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {orders.slice(0, 5).map((o) => (
                  <button
                    key={o.id}
                    onClick={() => {
                      setSearchTerm(o.orderNumber);
                      setActiveOrderNumber(o.orderNumber);
                    }}
                    className="w-full text-left p-2.5 bg-white hover:bg-rose-50/60 rounded-xl border border-rose-100 flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-800">{o.orderNumber}</span>
                      <span className="text-slate-500 ml-2">({o.customerName})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-rose-600 font-semibold">
                        {formatRupiah(o.totalAmount)}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getStatusDetails(o.status).bgColor} ${getStatusDetails(o.status).textColor}`}
                      >
                        {getStatusDetails(o.status).label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* If current order found */}
          {currentOrder ? (
            <div className="space-y-6">
              {/* Top Banner Status */}
              <div
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${statusBadge?.bgColor} ${statusBadge?.borderColor}`}
              >
                <div>
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-medium">
                    Status Pesanan
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-base font-bold ${statusBadge?.textColor}`}>
                      {statusBadge?.label}
                    </span>
                    <span className="text-xs font-mono bg-white/90 px-2 py-0.5 rounded-full border border-rose-200 text-slate-700">
                      {currentOrder.orderNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Waktu Pesan: {formatDate(currentOrder.createdAt)}
                  </p>
                </div>

                {currentOrder.trackingNumber && (
                  <div className="bg-white p-2.5 rounded-xl border border-rose-200 text-right">
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">No. Resi Ekspedisi</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {currentOrder.trackingNumber}
                    </span>
                  </div>
                )}
              </div>

              {/* Status Timeline */}
              {currentOrder.status !== 'dibatalkan' && (
                <div className="py-2">
                  <div className="grid grid-cols-5 gap-1 relative text-center">
                    {statusSteps.map((step, idx) => {
                      const curIdx = getStepIndex(currentOrder.status);
                      const isCompleted = idx <= curIdx;
                      const isCurrent = idx === curIdx;

                      return (
                        <div key={step.key} className="flex flex-col items-center">
                          <div
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              isCompleted
                                ? 'bg-rose-500 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                            } ${isCurrent ? 'ring-4 ring-rose-100' : ''}`}
                          >
                            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                          </div>
                          <span
                            className={`text-[10px] sm:text-xs mt-1.5 font-medium leading-tight ${
                              isCompleted ? 'text-slate-900 font-semibold' : 'text-slate-400'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Payment Proof Rejection Notice */}
              {currentOrder.paymentRejectionReason && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Bukti Transfer Ditolak Admin:</span>
                    <p className="mt-0.5">{currentOrder.paymentRejectionReason}</p>
                    <p className="mt-1 text-[11px] text-rose-600 font-medium">
                      Silakan unggah ulang bukti transfer yang valid di bawah ini.
                    </p>
                  </div>
                </div>
              )}

              {/* Upload Proof Action Area */}
              <div className="p-4 bg-rose-50/30 rounded-2xl border border-rose-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-rose-500" />
                    Bukti Pembayaran Pelanggan
                  </h4>
                  {currentOrder.paymentProofUrl ? (
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold">
                      ✓ Bukti Sudah Terunggah
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full font-semibold">
                      Belum Upload Bukti
                    </span>
                  )}
                </div>

                {uploadSuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Bukti berhasil diupload! Menunggu approval admin PustakaVia.</span>
                  </div>
                )}

                {uploadError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
                    {uploadError}
                  </div>
                )}

                {currentOrder.paymentProofUrl ? (
                  <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-rose-100">
                    <img
                      src={currentOrder.paymentProofUrl}
                      alt="Bukti bayar"
                      className="w-20 h-16 object-cover rounded-xl border border-rose-100"
                    />
                    <div className="flex-1 text-xs">
                      <p className="font-semibold text-slate-800">
                        Bukti Pembayaran ({currentOrder.paymentMethod.toUpperCase()})
                      </p>
                      <p className="text-slate-400 text-[11px]">
                        Diunggah: {formatDate(currentOrder.paymentProofUploadedAt || currentOrder.updatedAt || '')}
                      </p>
                      {currentOrder.status === 'menunggu_approval' && (
                        <p className="text-rose-600 text-[11px] font-medium mt-1">
                          Sedang ditinjau oleh tim pengelola PustakaVia...
                        </p>
                      )}
                    </div>

                    <label className="cursor-pointer text-[11px] font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                      Ganti Bukti
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProofUpload}
                        className="sr-only"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-600">
                      Unggah foto bukti struk ATM, tangkapan layar m-Banking, atau nota QRIS Anda agar admin dapat segera memproses pengiriman buku:
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <label className="flex-1 flex items-center justify-center gap-2 p-2.5 bg-white hover:bg-rose-50/50 border border-rose-200 rounded-2xl cursor-pointer text-xs font-semibold text-slate-700 transition-colors">
                        <UploadCloud className="w-4 h-4 text-rose-500" />
                        <span>Pilih Foto Bukti Transfer</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProofUpload}
                          className="sr-only"
                        />
                      </label>

                      <button
                        onClick={handleQuickSampleProof}
                        disabled={isUploading}
                        className="p-2.5 bg-rose-100/70 hover:bg-rose-100 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800 transition-colors"
                      >
                        ⚡ Kirim Bukti Simulasi
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Items & Shipping Address details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Items */}
                <div className="p-3.5 bg-white rounded-2xl border border-rose-100 space-y-2">
                  <span className="font-bold text-slate-800 block border-b border-rose-50 pb-1">
                    Daftar Buku ({currentOrder.items.length})
                  </span>
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {currentOrder.items.map((it, i) => (
                      <div key={i} className="flex justify-between items-center text-slate-700">
                        <div className="line-clamp-1 pr-2">
                          <span className="font-semibold text-rose-600">{it.quantity}x</span> {it.title}
                        </div>
                        <span className="font-mono font-semibold shrink-0">
                          {formatRupiah(it.price * it.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-rose-100 flex justify-between font-bold text-slate-900">
                    <span>Total Pembayaran</span>
                    <span className="text-rose-600 font-mono font-bold">{formatRupiah(currentOrder.totalAmount)}</span>
                  </div>
                </div>

                {/* Delivery details */}
                <div className="p-3.5 bg-white rounded-2xl border border-rose-100 space-y-1.5 text-slate-600">
                  <span className="font-bold text-slate-800 block border-b border-rose-50 pb-1">
                    Detail Pengiriman
                  </span>
                  <p><span className="text-slate-400">Penerima:</span> <strong className="text-slate-800">{currentOrder.customerName}</strong> ({currentOrder.customerPhone})</p>
                  <p><span className="text-slate-400">Email:</span> {currentOrder.customerEmail}</p>
                  <p className="line-clamp-2"><span className="text-slate-400">Alamat:</span> {currentOrder.shippingAddress}</p>
                  {currentOrder.notes && (
                    <p className="italic text-[11px] bg-rose-50/50 p-1.5 rounded-lg border border-rose-100">Catatan: {currentOrder.notes}</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Package className="w-12 h-12 mx-auto text-rose-200 mb-2" />
              <p className="text-sm font-semibold text-slate-700">Pesanan Belum Ditemukan</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Silakan ketik nomor pesanan yang Anda terima saat checkout, contoh: PV-20261013-1234
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
