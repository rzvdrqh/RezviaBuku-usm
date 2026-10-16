import React from 'react';
import { Printer, X, CheckCircle2, BookOpen } from 'lucide-react';
import { Order } from '../../types';
import { formatRupiah, formatDate } from '../../utils/formatters';

interface PosReceiptModalProps {
  order: Order | null;
  onClose: () => void;
}

export const PosReceiptModal: React.FC<PosReceiptModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div
        className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-rose-100 space-y-4 animate-in fade-in zoom-in-95 my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Controls */}
        <div className="flex items-center justify-between border-b border-rose-100 pb-3 no-print">
          <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Transaksi Berhasil Disimpan</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Thermal Receipt Container */}
        <div id="thermal-receipt" className="bg-[#fffefb] p-4 rounded-xl border border-dashed border-slate-300 font-mono text-slate-800 text-xs space-y-3">
          {/* Store Brand Header */}
          <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-3">
            <div className="font-heading font-extrabold text-base tracking-wide text-slate-900">
              PUSTAKAVIA STORE
            </div>
            <p className="text-[10px] text-slate-500">Toko Buku & Komik Terkurasi</p>
            <p className="text-[10px] text-slate-500">Jl. Nusantara No. 88, Jakarta</p>
            <p className="text-[10px] text-slate-500">Telp: 0812-3456-7890</p>
          </div>

          {/* Receipt Metadata */}
          <div className="text-[11px] space-y-0.5 text-slate-600 border-b border-dashed border-slate-300 pb-2">
            <div className="flex justify-between">
              <span>No. Struk</span>
              <span className="font-bold text-slate-900">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Tanggal</span>
              <span>{formatDate(order.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>Kasir</span>
              <span>{order.cashierName || 'Kasir 01'}</span>
            </div>
            <div className="flex justify-between">
              <span>Pelanggan</span>
              <span>{order.customerName || 'Walk-in'}</span>
            </div>
          </div>

          {/* Itemized List */}
          <div className="space-y-1.5 py-1 border-b border-dashed border-slate-300">
            {order.items.map((it, idx) => (
              <div key={idx} className="text-[11px] leading-tight">
                <div className="font-bold text-slate-900 line-clamp-1">{it.title}</div>
                <div className="flex justify-between text-slate-600 text-[10px]">
                  <span>{it.quantity} x {formatRupiah(it.price)}</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {formatRupiah(it.price * it.quantity)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals & Payment Calculations */}
          <div className="space-y-1 text-xs pt-1 border-b border-dashed border-slate-300 pb-3">
            <div className="flex justify-between text-slate-600">
              <span>Total Qty</span>
              <span>{order.items.reduce((s, i) => s + i.quantity, 0)} buku</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 text-sm pt-1">
              <span>TOTAL HARGA</span>
              <span className="text-rose-600">{formatRupiah(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-700 text-[11px] pt-1">
              <span>Metode Bayar</span>
              <span className="uppercase font-bold">{order.paymentMethod}</span>
            </div>
            {order.cashPaid !== undefined && order.cashPaid > 0 && (
              <>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Tunai Diterima</span>
                  <span>{formatRupiah(order.cashPaid)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700 text-xs">
                  <span>Kembalian</span>
                  <span>{formatRupiah(order.changeDue || 0)}</span>
                </div>
              </>
            )}
          </div>

          {/* Receipt Footer Message */}
          <div className="text-center text-[10px] text-slate-500 pt-1 space-y-1">
            <p>Terima kasih atas kunjungan Anda!</p>
            <p>Buku yang sudah dibeli dapat ditukar jika terdapat cacat cetak dalam 3 hari.</p>
            <div className="pt-1 text-[9px] text-slate-400 font-mono">
              *** PUSTAKAVIA KASIR POS ***
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1 no-print">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>Cetak Struk Kasir</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-2xl text-xs font-bold transition-colors"
          >
            Transaksi Baru
          </button>
        </div>
      </div>
    </div>
  );
};
