import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Flashlight, FlashlightOff, History, BarChart3, Keyboard, Camera, Zap, Video } from 'lucide-react';
import jsQR from 'jsqr';
import ScanFeedback from '@/components/scanner/ScanFeedback';
import ScannerViewfinder from '@/components/scanner/ScannerViewfinder';
import StatsBar from '@/components/scanner/StatsBar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Scanner() {
  const [event, setEvent] = useState(null);
  const [user, setUser] = useState(null);
  const [scanning, setScanning] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [ticketInfo, setTicketInfo] = useState(null);
  const [stats, setStats] = useState({ total: 0, scanned: 0, errors: 0 });
  const [showStats, setShowStats] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [localTickets, setLocalTickets] = useState([]);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const lastScannedRef = useRef(null);
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('eventId');

  useEffect(() => {
    loadData();
    return () => {
      stopCamera();
    };
  }, [eventId]);

  useEffect(() => {
    if (event && !manualMode) {
      startCamera();
    }
    return () => {
      if (!manualMode) stopCamera();
    };
  }, [event, manualMode]);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (eventId) {
        const events = await base44.entities.Event.filter({ id: eventId });
        if (events.length > 0) {
          const evt = events[0];
          setEvent(evt);
          setStats({
            total: evt.total_tickets || 0,
            scanned: evt.scanned_tickets || 0,
            errors: 0
          });
          
          // Load tickets for this event (for offline mode)
          const tickets = await base44.entities.Ticket.filter({ event_id: eventId });
          setLocalTickets(tickets);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setCameraError(false);
      startScanning();
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError(true);
      setManualMode(true);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startScanning = () => {
    if (scanIntervalRef.current) return;
    
    scanIntervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current && !processing) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        // Simple QR detection simulation - in production you'd use a library
        // For now, we'll rely on manual input or integrate jsQR
      }
    }, 100);
  };

  const toggleTorch = async () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      
      if (capabilities.torch) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: !torchOn }]
          });
          setTorchOn(!torchOn);
        } catch (e) {
          console.error('Torch error:', e);
        }
      }
    }
  };

  const processTicket = async (code) => {
    if (processing || !code) return;
    if (lastScannedRef.current === code) return; // Prevent double scan
    
    setProcessing(true);
    lastScannedRef.current = code;
    
    try {
      // Find ticket in local cache first
      let ticket = localTickets.find(t => t.ticket_code === code);
      
      if (!ticket) {
        // Try to fetch from server
        const tickets = await base44.entities.Ticket.filter({ ticket_code: code });
        ticket = tickets[0];
      }
      
      if (!ticket) {
        setScanResult('invalid');
        setTicketInfo(null);
        setStats(prev => ({ ...prev, errors: prev.errors + 1 }));
        
        // Log the scan attempt
        await base44.entities.ScanLog.create({
          event_id: eventId,
          ticket_code: code,
          result: 'invalid',
          scanned_by: user?.email
        });
        return;
      }
      
      if (ticket.event_id !== eventId) {
        setScanResult('wrong_event');
        setTicketInfo(ticket);
        setStats(prev => ({ ...prev, errors: prev.errors + 1 }));
        
        await base44.entities.ScanLog.create({
          event_id: eventId,
          ticket_id: ticket.id,
          ticket_code: code,
          result: 'wrong_event',
          scanned_by: user?.email
        });
        return;
      }
      
      if (ticket.status === 'scanned') {
        setScanResult('already_scanned');
        setTicketInfo(ticket);
        setStats(prev => ({ ...prev, errors: prev.errors + 1 }));
        
        await base44.entities.ScanLog.create({
          event_id: eventId,
          ticket_id: ticket.id,
          ticket_code: code,
          result: 'already_scanned',
          scanned_by: user?.email
        });
        return;
      }
      
      // Valid ticket - update status
      await base44.entities.Ticket.update(ticket.id, {
        status: 'scanned',
        scanned_at: new Date().toISOString(),
        scanned_by: user?.email
      });
      
      // Update event stats
      await base44.entities.Event.update(eventId, {
        scanned_tickets: (event.scanned_tickets || 0) + 1
      });
      
      // Log successful scan
      await base44.entities.ScanLog.create({
        event_id: eventId,
        ticket_id: ticket.id,
        ticket_code: code,
        result: 'success',
        scanned_by: user?.email
      });
      
      // Update local state
      setLocalTickets(prev => 
        prev.map(t => t.id === ticket.id ? { ...t, status: 'scanned' } : t)
      );
      
      setStats(prev => ({ ...prev, scanned: prev.scanned + 1 }));
      setScanResult('success');
      setTicketInfo(ticket);
      
    } catch (error) {
      console.error('Scan error:', error);
      setScanResult('invalid');
    } finally {
      setProcessing(false);
      setTimeout(() => {
        lastScannedRef.current = null;
      }, 2000);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      processTicket(manualCode.trim());
      setManualCode('');
    }
  };

  const closeFeedback = () => {
    setScanResult(null);
    setTicketInfo(null);
  };

  const goBack = () => {
    navigate(createPageUrl('EventSelection'));
  };

  const goToHistory = () => {
    navigate(createPageUrl('ScanHistory') + `?eventId=${eventId}`);
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-pulse text-white/50">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      {/* Header */}
      <div className="relative z-20 bg-gradient-to-b from-black/80 to-transparent">
        <div className="px-4 py-4 flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={goBack}
            className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xl flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          
          <div className="text-center flex-1 px-4">
            <h1 className="font-semibold truncate">{event.title}</h1>
            <p className="text-xs text-white/50">{stats.scanned} / {stats.total} scannés</p>
          </div>
          
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={goToHistory}
              className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xl flex items-center justify-center"
            >
              <History className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Camera / Manual Input */}
      <div className="flex-1 relative">
        {!manualMode ? (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40" />
            
            {/* Viewfinder */}
            <ScannerViewfinder scanning={scanning && !processing} />
            
            {/* Camera controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center justify-center gap-4 mb-4">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleTorch}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                    torchOn ? 'bg-yellow-500' : 'bg-white/10 backdrop-blur-xl'
                  }`}
                >
                  {torchOn ? (
                    <Flashlight className="w-6 h-6 text-black" />
                  ) : (
                    <FlashlightOff className="w-6 h-6" />
                  )}
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setManualMode(true)}
                  className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center"
                >
                  <Keyboard className="w-6 h-6" />
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowStats(!showStats)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                    showStats ? 'bg-violet-600' : 'bg-white/10 backdrop-blur-xl'
                  }`}
                >
                  <BarChart3 className="w-6 h-6" />
                </motion.button>
              </div>
              
              <p className="text-center text-white/60 text-sm">
                Pointez la caméra vers le QR code
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-sm"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center mx-auto mb-6">
                <Keyboard className="w-10 h-10" />
              </div>
              
              <h2 className="text-xl font-semibold text-center mb-2">Saisie manuelle</h2>
              <p className="text-white/50 text-center text-sm mb-6">
                Entrez le code du billet manuellement
              </p>
              
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <Input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Code du billet (UUID)"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-14 text-center text-lg font-mono"
                  autoFocus
                />
                
                <Button
                  type="submit"
                  disabled={!manualCode.trim() || processing}
                  className="w-full h-14 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-lg font-semibold"
                >
                  {processing ? (
                    <Zap className="w-5 h-5 animate-pulse" />
                  ) : (
                    'Valider le billet'
                  )}
                </Button>
              </form>
              
              {!cameraError && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setManualMode(false)}
                  className="w-full mt-4 py-3 text-white/60 hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Retour au scanner
                </motion.button>
              )}
            </motion.div>
          </div>
        )}
      </div>

      {/* Stats panel */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 p-4 z-30"
          >
            <StatsBar 
              total={stats.total} 
              scanned={stats.scanned} 
              errors={stats.errors} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scan feedback */}
      <AnimatePresence>
        {scanResult && (
          <ScanFeedback
            result={scanResult}
            ticketInfo={ticketInfo}
            onClose={closeFeedback}
          />
        )}
      </AnimatePresence>
    </div>
  );
}