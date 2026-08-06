import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/public/LandingPage';
import { ToastProvider } from './context/ToastContext';
import { RefreshCw } from 'lucide-react';

const EventDetail = lazy(() => import('./pages/public/EventDetail').then(m => ({ default: m.EventDetail })));
const Checkout = lazy(() => import('./pages/public/Checkout').then(m => ({ default: m.Checkout })));
const OrderSuccess = lazy(() => import('./pages/public/OrderSuccess').then(m => ({ default: m.OrderSuccess })));
const ForEO = lazy(() => import('./pages/public/ForEO').then(m => ({ default: m.ForEO })));
const Terms = lazy(() => import('./pages/public/Terms').then(m => ({ default: m.Terms })));
const EOLogin = lazy(() => import('./pages/eo/EOLogin').then(m => ({ default: m.EOLogin })));
const EODashboard = lazy(() => import('./pages/eo/EODashboard').then(m => ({ default: m.EODashboard })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const GatePortal = lazy(() => import('./pages/gate/GatePortal').then(m => ({ default: m.GatePortal })));

const LoadingFallback = () => (
  <div className="py-24 text-center space-y-3 bg-[#0a0a0a]">
    <RefreshCw className="w-8 h-8 text-brand-blue animate-spin mx-auto" />
    <p className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest">MEMUAT HALAMAN LOKTIK...</p>
  </div>
);

export const App = () => {
  return (
    <ToastProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-black text-white flex flex-col justify-between selection:bg-brand-green selection:text-black">
          <Navbar />
          <main className="flex-grow">
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/for-eo" element={<ForEO />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/admin" element={<EOLogin />} />
                <Route path="/eo/login" element={<EOLogin />} />
                <Route path="/eo/dashboard" element={<EODashboard />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/gate" element={<GatePortal />} />
                <Route path="/gate/:eventSlug" element={<GatePortal />} />
                <Route path="/event/:slug" element={<EventDetail />} />
                <Route path="/event/:slug/checkout" element={<Checkout />} />
                <Route path="/order-success" element={<OrderSuccess />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;
