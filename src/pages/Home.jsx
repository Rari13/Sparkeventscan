import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { QrCode, ArrowRight, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const isAuth = await base44.auth.isAuthenticated();
    if (isAuth) {
      navigate(createPageUrl('EventSelection'));
    } else {
      setChecking(false);
    }
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl('EventSelection'));
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8B7FE8] to-[#7B6FD8] flex items-center justify-center mx-auto mb-4 animate-pulse">
            <QrCode className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo & Title */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 300 }}
            className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#8B7FE8] to-[#7B6FD8] flex items-center justify-center mx-auto mb-6 relative shadow-2xl"
          >
            <QrCode className="w-12 h-12 text-white" />
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles className="w-6 h-6 text-[#8B7FE8]" />
            </motion.div>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold text-gray-900 mb-3"
          >
            TicketScan
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-gray-600 text-lg"
          >
            Scanner de billets pour organisateurs
          </motion.p>
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Connexion Organisateur
          </h2>

          <Button
            onClick={handleLogin}
            className="w-full h-16 bg-gradient-to-r from-[#8B7FE8] to-[#7B6FD8] hover:from-[#7B6FD8] hover:to-[#6B5FC8] text-lg font-semibold shadow-lg"
          >
            Se connecter
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <p className="text-sm text-gray-500 text-center mt-6">
            Réservé aux organisateurs d'événements
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="bg-white rounded-2xl p-4 border border-gray-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#8B7FE8]/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-[#8B7FE8]" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Scan instantané</h3>
              <p className="text-sm text-gray-600">Validation rapide des QR codes</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Mode hors ligne</h3>
              <p className="text-sm text-gray-600">Fonctionne sans connexion internet</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#8B7FE8]/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-[#8B7FE8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Statistiques en temps réel</h3>
              <p className="text-sm text-gray-600">Suivi des entrées en direct</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}