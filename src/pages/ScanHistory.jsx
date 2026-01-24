import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, X, AlertTriangle, Search, Filter, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export default function ScanHistory() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [event, setEvent] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    try {
      if (eventId) {
        // Charger l'événement
        const { data: eventData } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();
        
        if (eventData) {
          setEvent(eventData);
        }
        
        // Charger les billets scannés (utilisés)
        const { data: tickets } = await supabase
          .from('tickets')
          .select('*')
          .eq('event_id', eventId)
          .not('used_at', 'is', null)
          .order('used_at', { ascending: false });
        
        // Transformer les tickets en format log
        const scanLogs = (tickets || []).map(ticket => ({
          id: ticket.id,
          ticket_code: ticket.qr_token,
          result: 'success',
          created_date: ticket.used_at,
          ticket_id: ticket.id
        }));
        
        setLogs(scanLogs);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    navigate(`/Scanner?eventId=${eventId}`);
  };

  const getResultConfig = (result) => {
    const configs = {
      success: {
        icon: Check,
        bg: 'bg-emerald-100',
        color: 'text-emerald-600',
        label: 'Validé'
      },
      already_scanned: {
        icon: AlertTriangle,
        bg: 'bg-amber-100',
        color: 'text-amber-600',
        label: 'Déjà scanné'
      },
      invalid: {
        icon: X,
        bg: 'bg-red-100',
        color: 'text-red-600',
        label: 'Invalide'
      },
      wrong_event: {
        icon: X,
        bg: 'bg-red-100',
        color: 'text-red-600',
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
    { value: 'success', label: 'Validés' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200">
        <div className="px-4 py-4 flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={goBack}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </motion.button>
          
          <div className="flex-1">
            <h1 className="font-semibold text-gray-900">Historique des scans</h1>
            <p className="text-xs text-gray-500">{event?.title || 'Chargement...'}</p>
          </div>
        </div>

        {/* Search and filters */}
        <div className="px-4 pb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un code..."
              className="pl-10 bg-gray-100 border-0 text-gray-900 placeholder:text-gray-400"
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
                    ? 'bg-[#8B7FE8] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
              <div key={i} className="bg-white rounded-xl p-4 border border-gray-200">
                <Skeleton className="h-4 w-3/4 bg-gray-200 mb-2" />
                <Skeleton className="h-3 w-1/2 bg-gray-200" />
              </div>
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-medium mb-1 text-gray-900">Aucun scan trouvé</h3>
            <p className="text-gray-500 text-sm">
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
                    className="bg-white rounded-xl p-4 border border-gray-200"
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
                        
                        <p className="font-mono text-sm text-gray-700 truncate">
                          {log.ticket_code?.substring(0, 20)}...
                        </p>
                        
                        <p className="text-xs text-gray-500 mt-1">
                          {log.created_date 
                            ? format(new Date(log.created_date), "d MMM yyyy 'à' HH:mm:ss", { locale: fr })
                            : 'Date inconnue'
                          }
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
        
        {/* Stats footer */}
        {!loading && filteredLogs.length > 0 && (
          <div className="mt-6 text-center text-gray-500 text-sm">
            {filteredLogs.length} billet{filteredLogs.length > 1 ? 's' : ''} scanné{filteredLogs.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
