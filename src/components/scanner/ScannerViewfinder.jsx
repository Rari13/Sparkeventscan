import React from 'react';
import { motion } from 'framer-motion';

export default function ScannerViewfinder({ scanning }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="relative w-64 h-64">
        {/* Corner brackets */}
        {/* Top Left */}
        <motion.div
          animate={{ opacity: scanning ? [0.5, 1, 0.5] : 1 }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute top-0 left-0 w-12 h-12 border-l-4 border-t-4 border-white rounded-tl-xl"
        />
        {/* Top Right */}
        <motion.div
          animate={{ opacity: scanning ? [0.5, 1, 0.5] : 1 }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          className="absolute top-0 right-0 w-12 h-12 border-r-4 border-t-4 border-white rounded-tr-xl"
        />
        {/* Bottom Left */}
        <motion.div
          animate={{ opacity: scanning ? [0.5, 1, 0.5] : 1 }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
          className="absolute bottom-0 left-0 w-12 h-12 border-l-4 border-b-4 border-white rounded-bl-xl"
        />
        {/* Bottom Right */}
        <motion.div
          animate={{ opacity: scanning ? [0.5, 1, 0.5] : 1 }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
          className="absolute bottom-0 right-0 w-12 h-12 border-r-4 border-b-4 border-white rounded-br-xl"
        />

        {/* Scanning line */}
        {scanning && (
          <motion.div
            initial={{ top: '0%' }}
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-violet-500 to-transparent"
            style={{ boxShadow: '0 0 20px 4px rgba(139, 92, 246, 0.5)' }}
          />
        )}
      </div>
    </div>
  );
}