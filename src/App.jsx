import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/public/LandingPage';
import { EventDetail } from './pages/public/EventDetail';
import { Checkout } from './pages/public/Checkout';
import { ForEO } from './pages/public/ForEO';
import { Terms } from './pages/public/Terms';
import { EOLogin } from './pages/eo/EOLogin';
import { EODashboard } from './pages/eo/EODashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { GatePortal } from './pages/gate/GatePortal';

export const App = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-black text-white flex flex-col justify-between selection:bg-brand-green selection:text-black">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/for-eo" element={<ForEO />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/admin" element={<EOLogin />} />
            <Route path="/eo/login" element={<EOLogin />} />
            <Route path="/eo/dashboard" element={<EODashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/gate/:eventSlug" element={<GatePortal />} />
            <Route path="/event/:slug" element={<EventDetail />} />
            <Route path="/event/:slug/checkout" element={<Checkout />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
