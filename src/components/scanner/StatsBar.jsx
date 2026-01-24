import React from 'react';
import { motion } from 'framer-motion';
import { Users, CheckCircle, XCircle } from 'lucide-react';

export default function StatsBar({ total, scanned, errors }) {
  const percentage = total > 0 ? Math.round((scanned / total) * 100) : 0;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-white/60" />
          <span className="text-sm text-white/60">Progression</span>
        </div>
        <span className="text-sm font-semibold">{percentage}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-gradient-to-r from-violet-600 to-purple-500 rounded-full"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-white/50">Total</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <p className="text-2xl font-bold text-emerald-400">{scanned}</p>
          </div>
          <p className="text-xs text-white/50">Scannés</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <XCircle className="w-4 h-4 text-red-400" />
            <p className="text-2xl font-bold text-red-400">{errors}</p>
          </div>
          <p className="text-xs text-white/50">Erreurs</p>
        </div>
      </div>
    </motion.div>
  );
}