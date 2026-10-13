import React from 'react';
import {
  BookOpen,
  ShoppingBag,
  ShieldCheck,
  Search,
  Truck,
  Sparkles,
  LayoutDashboard,
  LogOut,
  Radio,
  Heart,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentView: 'store' | 'admin';
  setCurrentView: (view: 'store' | 'admin') => void;
  onOpenTracker: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isDbLive: boolean;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  onOpenTracker,
  searchQuery,
  setSearchQuery,
  isDbLive,
}) => {
  const { totalItems, setIsCartOpen } = useCart();
  const { isAdmin, adminUser, setIsLoginModalOpen, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-[#fffcf9]/95 backdrop-blur-md border-b border-rose-100/80 shadow-2xs">
      {/* Top pastel micro banner */}
      <div className="bg-gradient-to-r from-rose-100/90 via-pink-100/80 to-amber-100/80 text-rose-900 text-xs px-4 py-1.5 flex items-center justify-between font-medium border-b border-rose-200/50">
        <div className="flex items-center gap-2">
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-400" />
          <span className="text-[11px] sm:text-xs">
            Selamat datang di PustakaVia • Toko Buku, Komik & Modul Tes Pastel Pilihan
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-rose-800 font-semibold bg-white/70 px-2.5 py-0.5 rounded-full border border-rose-200/60">
            <Radio className={`w-3 h-3 ${isDbLive ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`} />
            <span>{isDbLive ? 'Firestore Live Sync' : 'Menghubungkan...'}</span>
          </div>
          {isAdmin && (
            <div className="hidden sm:flex items-center gap-1.5 bg-rose-200/70 px-2 py-0.5 rounded-full text-[11px] text-rose-950 font-medium">
              <ShieldCheck className="w-3 h-3 text-rose-700" />
              <span>Admin: {adminUser?.name || 'Admin'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo & Brand */}
          <div
            onClick={() => setCurrentView('store')}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-400 via-pink-400 to-amber-300 flex items-center justify-center text-white shadow-md shadow-rose-200 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-2xl font-bold tracking-tight text-slate-800">
                  Pustaka<span className="text-rose-500 font-bold">Via</span>
                </span>
                <span className="text-[10px] font-bold tracking-wider bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                  Pastel Store
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block font-medium">
                Koleksi Novel, Komik Jepang, Sains & Buku Tes
              </p>
            </div>
          </div>

          {/* Search bar (Store mode) */}
          {currentView === 'store' && (
            <div className="flex-1 max-w-xl mx-2 hidden md:block">
              <div className="relative">
                <Search className="w-4 h-4 text-rose-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari novel, komik Jepang, modul TOEFL/CPNS, sains..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white/90 border border-rose-200/80 rounded-full focus:outline-hidden focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 transition-all placeholder:text-slate-400 text-slate-800 shadow-2xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Switcher: Store vs Admin */}
            {currentView === 'admin' ? (
              <button
                onClick={() => setCurrentView('store')}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-rose-800 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-2xl transition-all shadow-2xs"
              >
                <BookOpen className="w-4 h-4 text-rose-500" />
                <span className="hidden sm:inline">Kembali ke Webstore</span>
                <span className="sm:hidden">Toko</span>
              </button>
            ) : (
              <>
                {/* Lacak Pesanan Button */}
                <button
                  onClick={onOpenTracker}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50/70 rounded-2xl transition-colors border border-transparent hover:border-rose-200"
                  title="Lacak status pesanan dan upload bukti transfer"
                >
                  <Truck className="w-4 h-4 text-rose-500" />
                  <span className="hidden sm:inline">Lacak Pesanan</span>
                </button>

                {/* Shopping Cart Button */}
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="relative inline-flex items-center justify-center p-2.5 text-slate-700 hover:text-rose-600 hover:bg-rose-50/60 rounded-2xl transition-all border border-rose-200/80 hover:border-rose-300 shadow-2xs"
                  aria-label="Keranjang Belanja"
                >
                  <ShoppingBag className="w-5 h-5 text-rose-600" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-xs animate-bounce">
                      {totalItems}
                    </span>
                  )}
                </button>
              </>
            )}

            {/* Admin Portal Toggle */}
            {isAdmin ? (
              <div className="flex items-center gap-1.5">
                {currentView !== 'admin' && (
                  <button
                    onClick={() => setCurrentView('admin')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 rounded-2xl shadow-sm shadow-rose-200 transition-all"
                  >
                    <LayoutDashboard className="w-4 h-4 text-amber-200" />
                    <span>Panel Admin</span>
                  </button>
                )}
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Keluar Admin"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-rose-700 bg-rose-50/70 hover:bg-rose-100/80 rounded-2xl transition-colors border border-rose-200/70"
              >
                <ShieldCheck className="w-4 h-4 text-rose-500" />
                <span className="hidden sm:inline">Login Admin</span>
                <span className="sm:hidden">Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile search bar if on store */}
        {currentView === 'store' && (
          <div className="pb-3 md:hidden">
            <div className="relative">
              <Search className="w-4 h-4 text-rose-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari novel, komik, sains, modul tes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-rose-200/80 rounded-full focus:outline-hidden focus:ring-2 focus:ring-rose-400/30"
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
