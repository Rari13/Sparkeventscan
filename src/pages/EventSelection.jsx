import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, MapPin, Users, ChevronRight, RefreshCw, LogOut, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export default function EventSelection() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      const allEvents = await base44.entities.Event.filter({ organizer_id: currentUser.email });
      setEvents(allEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    await loadData();
    setTimeout(() => setSyncing(false), 1000);
  };

  const selectEvent = (event) => {
    navigate(createPageUrl('Scanner') + `?eventId=${event.id}`);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B7FE8] to-[#7B6FD8] flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">TicketScan</h1>
              <p className="text-xs text-gray-500">{user?.full_name || user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSync}
              className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-gray-700 ${syncing ? 'animate-spin' : ''}`} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <LogOut className="w-5 h-5 text-gray-700" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-1 text-gray-900">Mes événements</h2>
          <p className="text-gray-500 text-sm">Sélectionnez un événement pour commencer à scanner</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                <Skeleton className="h-6 w-3/4 bg-gray-200 mb-3" />
                <Skeleton className="h-4 w-1/2 bg-gray-200 mb-2" />
                <Skeleton className="h-4 w-1/3 bg-gray-200" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-gray-900">Aucun événement</h3>
            <p className="text-gray-500 text-sm">Créez un événement sur votre plateforme pour commencer</p>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => selectEvent(event)}
                  className="bg-white rounded-2xl p-4 border border-gray-200 cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-2 truncate text-gray-900">{event.title}</h3>
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>
                            {format(new Date(event.date), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                          </span>
                        </div>
                        
                        {event.venue && (
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{event.venue}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Users className="w-4 h-4 flex-shrink-0" />
                          <span>
                            <span className="text-[#8B7FE8] font-medium">{event.scanned_tickets || 0}</span>
                            <span className="text-gray-400"> / </span>
                            <span>{event.total_tickets || 0}</span>
                            <span className="text-gray-400"> scannés</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4 flex-shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-[#8B7FE8]/10 flex items-center justify-center">
                        <ChevronRight className="w-5 h-5 text-[#8B7FE8]" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${event.total_tickets ? (event.scanned_tickets / event.total_tickets) * 100 : 0}%` 
                        }}
                        transition={{ duration: 0.5, delay: index * 0.05 + 0.2 }}
                        className="h-full bg-gradient-to-r from-[#8B7FE8] to-[#7B6FD8] rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Sync indicator */}
      <AnimatePresence>
        {syncing && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-full px-4 py-2 flex items-center gap-2 border border-gray-200"
          >
            <RefreshCw className="w-4 h-4 animate-spin text-[#8B7FE8]" />
            <span className="text-sm text-gray-700">Synchronisation...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}