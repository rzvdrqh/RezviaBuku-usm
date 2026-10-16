import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Truck,
  CheckCircle2,
  UploadCloud,
  AlertCircle,
  Copy,
  Check,
  Heart,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/storeService';
import { formatRupiah, generateOrderNumber } from '../utils/formatters';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (orderNumber: string) => void;
}

const SHIPPING_OPTIONS = [
  { id: 'jne', name: 'JNE Reguler (2-3 Hari)', cost: 12000 },
  { id: 'sicepat', name: 'SiCepat Best (1-2 Hari)', cost: 15000 },
  { id: 'instant', name: 'Kurir Sameday / Instan', cost: 25000 },
];

const PAYMENT_METHODS = [
  {
    id: 'bca',
    name: 'Transfer Bank BCA',
    account: '828-091-2345',
    holder: 'PT Pustaka Via Mandiri',
    badge: 'BCA',
  },
  {
    id: 'mandiri',
    name: 'Transfer Bank Mandiri',
    account: '137-00-9821-4321',
    holder: 'PT Pustaka Via Mandiri',
    badge: 'Mandiri',
  },
  {
    id: 'bri',
    name: 'Transfer Bank BRI',
    account: '012-34-567890-50-8',
    holder: 'PT Pustaka Via Mandiri',
    badge: 'BRI',
  },
  {
    id: 'qris',
    name: 'QRIS Instan (GoPay, OVO, Dana, ShopeePay)',
    account: 'NMID: ID1020349812498',
    holder: 'PustakaVia Official Store',
    badge: 'QRIS',
  },
];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  const { items, subtotal, clearCart } = useCart();

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [shippingMethod, setShippingMethod] = useState(SHIPPING_OPTIONS[0].id);
  const [paymentMethod, setPaymentMethod] = useState<'bca' | 'mandiri' | 'bri' | 'qris'>('bca');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');

  const [copiedAccount, setCopiedAccount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const selectedShipping = SHIPPING_OPTIONS.find((s) => s.id === shippingMethod) || SHIPPING_OPTIONS[0];
  const shippingCost = selectedShipping.cost;
  const totalAmount = subtotal + shippingCost;
  const currentBank = PAYMENT_METHODS.find((p) => p.id === paymentMethod) || PAYMENT_METHODS[0];

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(currentBank.account.replace(/[^0-9]/g, ''));
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage('Ukuran file maksimal 2 MB agar dapat disimpan ke database.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setPaymentProofUrl(reader.result as string);
        setErrorMessage('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseSampleSlip = () => {
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
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('BUKTI TRANSFER PUSTAKAVIA', 20, 40);
      ctx.fillStyle = '#4c0519';
      ctx.font = '13px sans-serif';
      ctx.fillText(`Bank: ${currentBank.name}`, 20, 75);
      ctx.fillText(`Tujuan: ${currentBank.account} (${currentBank.holder})`, 20, 100);
      ctx.fillText(`Pembeli: ${customerName || 'Pelanggan PustakaVia'}`, 20, 125);
      ctx.fillStyle = '#e11d48';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`Total: ${formatRupiah(totalAmount)}`, 20, 170);
      ctx.fillStyle = '#9f1239';
      ctx.font = '11px sans-serif';
      ctx.fillText(`Waktu: ${new Date().toLocaleString('id-ID')}`, 20, 205);
      setPaymentProofUrl(canvas.toDataURL('image/jpeg', 0.85));
      setErrorMessage('');
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim() || !shippingAddress.trim()) {
      setErrorMessage('Mohon lengkapi seluruh kolom identitas dan alamat pengiriman.');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Keranjang belanja kosong.');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderNumber = generateOrderNumber().replace('PK-', 'PV-');
      const orderItems = items.map((i) => ({
        bookId: i.book.id,
        title: i.book.title,
        author: i.book.author,
        price: i.book.price,
        quantity: i.quantity,
        coverImage: i.book.coverImage,
      }));

      await createOrder({
        orderNumber,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        shippingAddress: shippingAddress.trim(),
        items: orderItems,
        subtotal,
        shippingCost,
        totalAmount,
        paymentMethod,
        notes: notes.trim(),
        initialProofUrl: paymentProofUrl || undefined,
      });

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f43f5e', '#fb7185', '#fda4af', '#fef08a', '#a7f3d0'],
        });
      } catch {
        // ignore
      }

      clearCart();
      setIsSubmitting(false);
      onOrderSuccess(orderNumber);
      onClose();
    } catch (err) {
      console.error('Checkout error:', err);
      setIsSubmitting(false);
      let msg = 'Terjadi kendala saat menyimpan pesanan ke database Firestore.';
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          msg = parsed.error || err.message;
        } catch {
          msg = err.message;
        }
      }
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div
        className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-rose-100 overflow-hidden relative my-6 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Pastel */}
        <div className="px-6 py-4 bg-gradient-to-r from-rose-100/80 via-pink-50 to-amber-50/70 border-b border-rose-100 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg sm:text-xl font-bold text-slate-800">
              Checkout Pesanan PustakaVia
            </h2>
            <p className="text-xs text-rose-700/80 font-medium">
              Data pesanan langsung tercatat di cloud database Firestore secara real-time
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmitOrder} className="p-6">
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Customer Info & Shipping */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5 border-b border-rose-100 pb-2">
                <Truck className="w-4 h-4 text-rose-500" />
                1. Data Pembeli & Alamat Pengiriman
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Siti Rahma"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-rose-50/20 border border-rose-200/80 rounded-2xl focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. WhatsApp / HP <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0812-3456-7890"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-rose-50/20 border border-rose-200/80 rounded-2xl focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="nama@email.com (untuk nota & pelacakan)"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-rose-50/20 border border-rose-200/80 rounded-2xl focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Lengkap Pengiriman <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Jl. Kenanga No. 12, Kelurahan, Kecamatan, Kota / Kabupaten, Kode Pos"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-rose-50/20 border border-rose-200/80 rounded-2xl focus:ring-2 focus:ring-rose-400/20 focus:border-rose-400"
                />
              </div>

              {/* Kurir Ekspedisi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Pilihan Jasa Ekspedisi
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SHIPPING_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      className={`p-2.5 rounded-2xl border text-xs cursor-pointer flex flex-col justify-between transition-all ${
                        shippingMethod === opt.id
                          ? 'border-rose-400 bg-rose-50/70 ring-1 ring-rose-400'
                          : 'border-rose-100 bg-[#fdfcfb] hover:bg-rose-50/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping"
                        value={opt.id}
                        checked={shippingMethod === opt.id}
                        onChange={() => setShippingMethod(opt.id)}
                        className="sr-only"
                      />
                      <span className="font-medium text-slate-800">{opt.name}</span>
                      <span className="font-mono font-bold text-rose-600 mt-1">
                        {formatRupiah(opt.cost)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan untuk Penjual (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Tolong bubble wrap tebal, kirim hari kerja..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-rose-50/20 border border-rose-200/80 rounded-2xl"
                />
              </div>
            </div>

            {/* Right: Payment Method & Proof Upload */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5 border-b border-rose-100 pb-2">
                <CreditCard className="w-4 h-4 text-rose-500" />
                2. Metode Pembayaran & Transfer
              </h3>

              {/* Payment selector */}
              <div className="space-y-1.5">
                {PAYMENT_METHODS.map((pm) => (
                  <label
                    key={pm.id}
                    className={`p-2.5 rounded-2xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                      paymentMethod === pm.id
                        ? 'border-rose-400 bg-rose-50/70 ring-1 ring-rose-400'
                        : 'border-rose-100 hover:bg-rose-50/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={pm.id}
                        checked={paymentMethod === pm.id}
                        onChange={() => setPaymentMethod(pm.id as any)}
                        className="text-rose-500 focus:ring-rose-400"
                      />
                      <span className="font-semibold text-slate-800">{pm.name}</span>
                    </div>
                    <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded-full border border-rose-200 text-rose-700 font-bold">
                      {pm.badge}
                    </span>
                  </label>
                ))}
              </div>

              {/* Bank Account Info Card (Pastel Tint) */}
              <div className="p-3.5 bg-gradient-to-br from-rose-900 to-pink-950 text-white rounded-2xl space-y-2 text-xs shadow-xs">
                <div className="flex items-center justify-between text-rose-200 text-[11px]">
                  <span>Rekening Tujuan Transfer:</span>
                  <span className="font-semibold text-amber-300">{currentBank.badge}</span>
                </div>
                <div className="flex items-center justify-between font-mono text-base font-bold text-rose-100">
                  <span>{currentBank.account}</span>
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    className="p-1 hover:bg-rose-800/60 rounded text-rose-200 hover:text-white transition-colors"
                    title="Salin Nomor Rekening"
                  >
                    {copiedAccount ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-[11px] text-rose-200">a.n. {currentBank.holder}</div>
                <div className="pt-2 border-t border-rose-800/80 flex justify-between items-center text-xs">
                  <span className="text-rose-200">Total Nominal Transfer:</span>
                  <span className="font-bold font-mono text-amber-300 text-sm">
                    {formatRupiah(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Upload Bukti Pembayaran */}
              <div className="p-3.5 bg-rose-50/50 rounded-2xl border border-rose-200/70">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-rose-500" />
                    Upload Bukti Transfer
                  </label>
                  <span className="text-[10px] text-slate-500">(Bisa sekarang atau nanti)</span>
                </div>

                {paymentProofUrl ? (
                  <div className="relative group rounded-xl overflow-hidden border border-emerald-300 bg-white p-2">
                    <img
                      src={paymentProofUrl}
                      alt="Bukti bayar"
                      className="max-h-24 w-full object-contain rounded-lg"
                    />
                    <div className="flex items-center justify-between mt-1 text-[11px] text-emerald-700 font-semibold">
                      <span>✓ Bukti siap dikirim untuk approval</span>
                      <button
                        type="button"
                        onClick={() => setPaymentProofUrl('')}
                        className="text-rose-600 hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-rose-500 file:text-white hover:file:bg-rose-600 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={handleUseSampleSlip}
                      className="w-full text-center py-1.5 px-2 bg-white hover:bg-rose-50/50 border border-rose-200 rounded-xl text-[11px] text-rose-700 font-medium transition-colors"
                    >
                      ⚡ Gunakan Struk Simulasi Cepat (Untuk Tes Instan)
                    </button>
                  </div>
                )}
              </div>

              {/* Ringkasan Biaya */}
              <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-rose-100">
                <div className="flex justify-between">
                  <span>Subtotal ({items.length} buku):</span>
                  <span className="font-mono">{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ongkos Kirim ({selectedShipping.name}):</span>
                  <span className="font-mono">{formatRupiah(shippingCost)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-rose-100">
                  <span>Total Tagihan:</span>
                  <span className="text-rose-600 font-mono text-base font-extrabold">
                    {formatRupiah(totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 pt-4 border-t border-rose-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-2xl hover:bg-slate-100 transition-colors"
            >
              Batalkan
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 disabled:bg-slate-300 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md shadow-rose-200 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan Pesanan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Konfirmasi & Buat Pesanan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
