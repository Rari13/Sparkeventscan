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
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/5">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">TicketScan</h1>
              <p className="text-xs text-white/50">{user?.full_name || user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSync}
              className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center"
            >
              <RefreshCw className={`w-5 h-5 text-white/70 ${syncing ? 'animate-spin' : ''}`} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center"
            >
              <LogOut className="w-5 h-5 text-white/70" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-1">Mes événements</h2>
          <p className="text-white/50 text-sm">Sélectionnez un événement pour commencer à scanner</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-4">
                <Skeleton className="h-6 w-3/4 bg-white/10 mb-3" />
                <Skeleton className="h-4 w-1/2 bg-white/10 mb-2" />
                <Skeleton className="h-4 w-1/3 bg-white/10" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-white/30" />
            </div>
            <h3 className="text-lg font-medium mb-2">Aucun événement</h3>
            <p className="text-white/50 text-sm">Créez un événement sur votre plateforme pour commencer</p>
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
                  className="bg-gradient-to-br from-white/[0.08] to-white/[0.03] rounded-2xl p-4 border border-white/5 cursor-pointer active:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-2 truncate">{event.title}</h3>
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-white/60 text-sm">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>
                            {format(new Date(event.date), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                          </span>
                        </div>
                        
                        {event.venue && (
                          <div className="flex items-center gap-2 text-white/60 text-sm">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{event.venue}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-white/60 text-sm">
                          <Users className="w-4 h-4 flex-shrink-0" />
                          <span>
                            <span className="text-emerald-400 font-medium">{event.scanned_tickets || 0}</span>
                            <span className="text-white/40"> / </span>
                            <span>{event.total_tickets || 0}</span>
                            <span className="text-white/40"> scannés</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4 flex-shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
                        <ChevronRight className="w-5 h-5 text-violet-400" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${event.total_tickets ? (event.scanned_tickets / event.total_tickets) * 100 : 0}%` 
                        }}
                        transition={{ duration: 0.5, delay: index * 0.05 + 0.2 }}
                        className="h-full bg-gradient-to-r from-violet-600 to-purple-500 rounded-full"
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
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-xl rounded-full px-4 py-2 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4 animate-spin text-violet-400" />
            <span className="text-sm">Synchronisation...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}