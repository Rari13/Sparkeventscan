import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertTriangle, RefreshCw } from 'lucide-react';

export default function ScanFeedback({ result, ticketInfo, onClose }) {
  if (!result) return null;

  const configs = {
    success: {
      bg: 'from-emerald-600 to-emerald-700',
      icon: Check,
      title: 'Entrée validée',
      subtitle: 'Billet scanné avec succès',
      iconBg: 'bg-white/20'
    },
    already_scanned: {
      bg: 'from-amber-600 to-orange-600',
      icon: AlertTriangle,
      title: 'Déjà scanné',
      subtitle: 'Ce billet a déjà été utilisé',
      iconBg: 'bg-white/20'
    },
    invalid: {
      bg: 'from-red-600 to-red-700',
      icon: X,
      title: 'Billet invalide',
      subtitle: 'Ce billet n\'existe pas',
      iconBg: 'bg-white/20'
    },
    wrong_event: {
      bg: 'from-red-600 to-red-700',
      icon: X,
      title: 'Mauvais événement',
      subtitle: 'Ce billet appartient à un autre événement',
      iconBg: 'bg-white/20'
    }
  };

  const config = configs[result] || configs.invalid;
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
        onClick={onClose}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Content */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className={`relative w-full max-w-sm rounded-3xl bg-gradient-to-br ${config.bg} p-8 text-white text-center shadow-2xl`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 400, delay: 0.1 }}
            className={`w-24 h-24 rounded-full ${config.iconBg} flex items-center justify-center mx-auto mb-6`}
          >
            <Icon className="w-12 h-12" strokeWidth={3} />
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-2xl font-bold mb-2"
          >
            {config.title}
          </motion.h2>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/80 mb-6"
          >
            {config.subtitle}
          </motion.p>

          {/* Ticket Info */}
          {ticketInfo && result === 'success' && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="bg-white/10 rounded-2xl p-4 mb-6 text-left"
            >
              {ticketInfo.buyer_name && (
                <div className="mb-2">
                  <p className="text-white/60 text-xs uppercase tracking-wider">Nom</p>
                  <p className="font-semibold">{ticketInfo.buyer_name}</p>
                </div>
              )}
              {ticketInfo.ticket_type && (
                <div>
                  <p className="text-white/60 text-xs uppercase tracking-wider">Type de billet</p>
                  <p className="font-semibold">{ticketInfo.ticket_type}</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Close button */}
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="w-full py-4 bg-white/20 hover:bg-white/30 rounded-2xl font-semibold transition-colors"
          >
            Continuer à scanner
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}