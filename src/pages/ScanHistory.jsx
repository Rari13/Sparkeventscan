import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, X, AlertTriangle, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export default function ScanHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [event, setEvent] = useState(null);
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('eventId');

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    try {
      if (eventId) {
        const events = await base44.entities.Event.filter({ id: eventId });
        if (events.length > 0) {
          setEvent(events[0]);
        }
        
        const scanLogs = await base44.entities.ScanLog.filter(
          { event_id: eventId }, 
          '-created_date'
        );
        setLogs(scanLogs);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    navigate(createPageUrl('Scanner') + `?eventId=${eventId}`);
  };

  const getResultConfig = (result) => {
    const configs = {
      success: {
        icon: Check,
        bg: 'bg-emerald-500/20',
        color: 'text-emerald-400',
        label: 'Validé'
      },
      already_scanned: {
        icon: AlertTriangle,
        bg: 'bg-amber-500/20',
        color: 'text-amber-400',
        label: 'Déjà scanné'
      },
      invalid: {
        icon: X,
        bg: 'bg-red-500/20',
        color: 'text-red-400',
        label: 'Invalide'
      },
      wrong_event: {
        icon: X,
        bg: 'bg-red-500/20',
        color: 'text-red-400',
        label: 'Mauvais événement'
      }
    };
    return configs[result] || configs.invalid;
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.ticket_code?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || log.result === filterType;
    return matchesSearch && matchesFilter;
  });

  const filterOptions = [
    { value: 'all', label: 'Tous' },
    { value: 'success', label: 'Validés' },
    { value: 'already_scanned', label: 'Doublons' },
    { value: 'invalid', label: 'Invalides' }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/5">
        <div className="px-4 py-4 flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={goBack}
            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          
          <div className="flex-1">
            <h1 className="font-semibold">Historique des scans</h1>
            <p className="text-xs text-white/50">{event?.title}</p>
          </div>
        </div>

        {/* Search and filters */}
        <div className="px-4 pb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un code..."
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filterOptions.map((option) => (
              <motion.button
                key={option.value}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterType(option.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filterType === option.value
                    ? 'bg-violet-600 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {option.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white/5 rounded-xl p-4">
                <Skeleton className="h-4 w-3/4 bg-white/10 mb-2" />
                <Skeleton className="h-3 w-1/2 bg-white/10" />
              </div>
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-white/30" />
            </div>
            <h3 className="font-medium mb-1">Aucun scan trouvé</h3>
            <p className="text-white/50 text-sm">
              {searchQuery ? 'Essayez une autre recherche' : 'Commencez à scanner des billets'}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="space-y-2">
              {filteredLogs.map((log, index) => {
                const config = getResultConfig(log.result);
                const Icon = config.icon;
                
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="bg-white/[0.03] rounded-xl p-4 border border-white/5"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                        
                        <p className="font-mono text-sm text-white/70 truncate">
                          {log.ticket_code}
                        </p>
                        
                        <p className="text-xs text-white/40 mt-1">
                          {format(new Date(log.created_date), "d MMM yyyy 'à' HH:mm:ss", { locale: fr })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}