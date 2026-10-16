import React, { useState, useEffect } from 'react';
import { Book, Order, Customer } from './types';
import {
  subscribeBooks,
  subscribeOrders,
  subscribeCustomers,
  seedBooksIfEmpty,
} from './services/storeService';
import { testConnection } from './lib/firebase';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { StoreCatalog } from './components/StoreCatalog';
import { BookDetailModal } from './components/BookDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { AdminLoginModal } from './components/Admin/AdminLoginModal';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { PosWorkstation } from './components/Pos/PosWorkstation';
import { BookOpen, ShieldCheck, Heart, Truck, Sparkles } from 'lucide-react';

function StoreApp() {
  const { isAdmin } = useAuth();

  // Real-time Firestore state
  const [books, setBooks] = useState<Book[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isDbLive, setIsDbLive] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // App navigation state
  const [currentView, setCurrentView] = useState<'store' | 'admin' | 'pos'>('store');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua Koleksi');

  // Modals state
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [trackedOrderNumber, setTrackedOrderNumber] = useState('');

  // 1. Initial database seed & connectivity test
  useEffect(() => {
    let isMounted = true;

    async function initDB() {
      try {
        const connected = await testConnection();
        if (isMounted) setIsDbLive(connected);
        await seedBooksIfEmpty();
      } catch (e) {
        console.warn('Initial DB check note:', e);
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    }

    initDB();

    // 2. Real-time Firestore subscriptions (Single source of truth)
    const unsubBooks = subscribeBooks((updatedBooks) => {
      setBooks(updatedBooks);
      setIsDbLive(true);
      setLoadingInitial(false);
    });

    const unsubOrders = subscribeOrders((updatedOrders) => {
      setOrders(updatedOrders);
    });

    const unsubCustomers = subscribeCustomers((updatedCusts) => {
      setCustomers(updatedCusts);
    });

    return () => {
      isMounted = false;
      unsubBooks();
      unsubOrders();
      unsubCustomers();
    };
  }, []);

  // Proteksi rute: jika bukan admin, kembalikan ke etalase webstore
  useEffect(() => {
    if (!isAdmin && (currentView === 'admin' || currentView === 'pos')) {
      setCurrentView('store');
    }
  }, [isAdmin, currentView]);

  const handleOrderSuccess = (orderNumber: string) => {
    setTrackedOrderNumber(orderNumber);
    setIsTrackerOpen(true);
  };

  const handleInstantCheckout = () => {
    setIsCheckoutOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenTracker={() => {
          setTrackedOrderNumber('');
          setIsTrackerOpen(true);
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isDbLive={isDbLive}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {/* Main View Router */}
      <div className="flex-1">
        {currentView === 'pos' && isAdmin ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <PosWorkstation
              books={books}
              onBack={() => setCurrentView('store')}
            />
          </div>
        ) : currentView === 'admin' && isAdmin ? (
          <AdminDashboard
            books={books}
            orders={orders}
            customers={customers}
            isDbLive={isDbLive}
            onBackToStore={() => setCurrentView('store')}
            onOpenPos={() => setCurrentView('pos')}
          />
        ) : (
          <StoreCatalog
            books={books}
            onSelectBook={(b) => setSelectedBook(b)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        )}
      </div>

      {/* Modals & Drawers */}
      <BookDetailModal
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
        onInstantCheckout={handleInstantCheckout}
      />

      <CartDrawer
        onProceedCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={handleOrderSuccess}
      />

      <OrderTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        orders={orders}
        defaultOrderNumber={trackedOrderNumber}
      />

      <AdminLoginModal />

      {/* Footer (Only on store view) */}
      {currentView === 'store' && (
        <footer className="bg-gradient-to-b from-[#251820] to-[#1a1117] text-rose-200/70 text-xs border-t border-rose-950 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              {/* Brand info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-white">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-400 to-pink-500 flex items-center justify-center text-white shadow-xs">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span className="font-heading text-lg font-bold">PustakaVia</span>
                </div>
                <p className="text-rose-200/60 text-xs leading-relaxed">
                  Webstore buku & komik bernuansa pastel cerah dengan sistem inventaris tersinkronisasi database Firestore secara real-time. Menghadirkan novel pilihan, komik Jepang original, sains, bahasa, dan modul tes terpercaya.
                </p>
                <div className="text-[11px] text-rose-300 font-medium">
                  🟢 Database Firestore Terhubung & Sinkron Live
                </div>
              </div>

              {/* 5 Categories list */}
              <div>
                <h4 className="font-heading font-bold text-white uppercase tracking-wider text-xs mb-3">
                  Kategori Buku Pilihan
                </h4>
                <ul className="space-y-1.5 text-xs">
                  <li>
                    <button
                      onClick={() => setSelectedCategory('Novel')}
                      className="hover:text-rose-300 transition-colors text-left"
                    >
                      • Novel Pilihan
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setSelectedCategory('Komik Jepang')}
                      className="hover:text-rose-300 transition-colors text-left"
                    >
                      • Komik Jepang (Manga)
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setSelectedCategory('Teknologi & Sains')}
                      className="hover:text-rose-300 transition-colors text-left"
                    >
                      • Teknologi & Sains
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setSelectedCategory('Bahasa')}
                      className="hover:text-rose-300 transition-colors text-left"
                    >
                      • Bahasa (Inggris, Jepang, Korea)
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setSelectedCategory('Buku Tes (TOEFL / CPNS / UTBK)')}
                      className="hover:text-rose-300 transition-colors text-left"
                    >
                      • Buku Tes (TOEFL / CPNS / UTBK)
                    </button>
                  </li>
                </ul>
              </div>

              {/* Layanan & Lacak */}
              <div>
                <h4 className="font-heading font-bold text-white uppercase tracking-wider text-xs mb-3">
                  Layanan Belanja
                </h4>
                <ul className="space-y-1.5 text-xs text-rose-200/60">
                  <li>
                    <button
                      onClick={() => setIsTrackerOpen(true)}
                      className="hover:text-rose-300 transition-colors text-left"
                    >
                      • Lacak Status Pesanan & Upload Struk
                    </button>
                  </li>
                  <li>
                    <span>• Pengiriman JNE, SiCepat & Instan</span>
                  </li>
                  <li>
                    <span>• Jaminan 100% Produk Original Segel</span>
                  </li>
                  <li>
                    <span>• Auto-Refresh Database Real-Time</span>
                  </li>
                </ul>
              </div>

              {/* Pembayaran & Keamanan */}
              <div>
                <h4 className="font-heading font-bold text-white uppercase tracking-wider text-xs mb-3">
                  Metode Pembayaran
                </h4>
                <p className="text-[11px] text-rose-200/60 mb-2">
                  Mendukung transfer bank resmi & QRIS instan:
                </p>
                <div className="flex flex-wrap gap-1.5 font-mono text-[10px] font-bold text-rose-100">
                  <span className="bg-rose-950/80 px-2 py-1 rounded-lg border border-rose-900">BCA</span>
                  <span className="bg-rose-950/80 px-2 py-1 rounded-lg border border-rose-900">MANDIRI</span>
                  <span className="bg-rose-950/80 px-2 py-1 rounded-lg border border-rose-900">BRI</span>
                  <span className="bg-rose-950/80 px-2 py-1 rounded-lg border border-rose-900 text-amber-300">QRIS</span>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-rose-950 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-rose-300/50">
              <p>© 2026 PustakaVia Store. Hak Cipta Dilindungi.</p>
              <p className="flex items-center gap-1">
                Toko Buku Pastel • Didukung Real-Time Cloud Firestore Sync
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <StoreApp />
      </CartProvider>
    </AuthProvider>
  );
}
