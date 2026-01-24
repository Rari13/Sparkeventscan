import React from 'react';
import { motion } from 'framer-motion';
import { Video, Camera, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CameraPermissionRequest({ onGrant, onManualMode }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-sm"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 300, delay: 0.1 }}
          className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#8B7FE8] to-[#7B6FD8] flex items-center justify-center mx-auto mb-8 relative"
        >
          <Camera className="w-12 h-12 text-white" />
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center"
          >
            <ShieldCheck className="w-5 h-5 text-white" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold mb-3 text-gray-900"
        >
          Autoriser la caméra
        </motion.h2>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-gray-600 mb-8"
        >
          Pour scanner les billets, nous avons besoin d'accéder à votre caméra. Vos données sont sécurisées.
        </motion.p>

        {/* Features */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-3 mb-8 text-left"
        >
          <div className="flex items-start gap-3 text-sm">
            <div className="w-5 h-5 rounded-full bg-[#8B7FE8]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-[#8B7FE8]" />
            </div>
            <p className="text-gray-700">Scan automatique et instantané des QR codes</p>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <div className="w-5 h-5 rounded-full bg-[#8B7FE8]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-[#8B7FE8]" />
            </div>
            <p className="text-gray-700">Fonctionne en mode hors ligne</p>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <div className="w-5 h-5 rounded-full bg-[#8B7FE8]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-[#8B7FE8]" />
            </div>
            <p className="text-gray-700">Aucune donnée n'est enregistrée ou partagée</p>
          </div>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="space-y-3"
        >
          <Button
            onClick={onGrant}
            className="w-full h-14 bg-gradient-to-r from-[#8B7FE8] to-[#7B6FD8] hover:from-[#7B6FD8] hover:to-[#6B5FC8] text-lg font-semibold"
          >
            <Video className="w-5 h-5 mr-2" />
            Autoriser la caméra
          </Button>
          
          <button
            onClick={onManualMode}
            className="w-full py-3 text-gray-500 hover:text-gray-700 transition-colors text-sm"
          >
            Utiliser la saisie manuelle
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}