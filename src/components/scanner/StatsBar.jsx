import React from 'react';
import { motion } from 'framer-motion';
import { Users, CheckCircle, XCircle } from 'lucide-react';

export default function StatsBar({ total, scanned, errors }) {
  const percentage = total > 0 ? Math.round((scanned / total) * 100) : 0;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white rounded-2xl p-4 border border-gray-200 shadow-lg"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-600" />
          <span className="text-sm text-gray-600">Progression</span>
        </div>
        <span className="text-sm font-semibold text-gray-900">{percentage}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-gradient-to-r from-[#8B7FE8] to-[#7B6FD8] rounded-full"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{total}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <p className="text-2xl font-bold text-emerald-500">{scanned}</p>
          </div>
          <p className="text-xs text-gray-500">Scannés</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <XCircle className="w-4 h-4 text-red-500" />
            <p className="text-2xl font-bold text-red-500">{errors}</p>
          </div>
          <p className="text-xs text-gray-500">Erreurs</p>
        </div>
      </div>
    </motion.div>
  );
}