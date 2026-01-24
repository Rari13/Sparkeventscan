import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSupabaseAuth } from '@/lib/SupabaseAuthContext';
import { supabase, validateTicket, getEventStats } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Flashlight, FlashlightOff, History, BarChart3, Keyboard, Camera, Zap, Video } from 'lucide-react';
import jsQR from 'jsqr';
import ScanFeedback from '@/components/scanner/ScanFeedback';
import ScannerViewfinder from '@/components/scanner/ScannerViewfinder';
import StatsBar from '@/components/scanner/StatsBar';
import CameraPermissionRequest from '@/components/scanner/CameraPermissionRequest';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Scanner() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  
  const [event, setEvent] = useState(null);
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
  const [cameraPermission, setCameraPermission] = useState('prompt');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const lastScannedRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();

  useEffect(() => {
    loadEventData();
    return () => {
      stopCamera();
    };
  }, [eventId]);

  useEffect(() => {
    if (event && !manualMode && cameraPermission === 'granted') {
      startCamera();
    }
    return () => {
      if (!manualMode) stopCamera();
    };
  }, [event, manualMode, cameraPermission]);

  const loadEventData = async () => {
    if (!eventId) return;
    
    try {
      // Charger l'événement
      const { data: eventData, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      if (error) throw error;
      setEvent(eventData);
      
      // Charger les stats
      const eventStats = await getEventStats(eventId);
      setStats({
        total: eventStats.total,
        scanned: eventStats.scanned,
        errors: 0
      });
    } catch (error) {
      console.error('Error loading event:', error);
    }
  };

  const requestCameraPermission = async () => {
    try {
      setCameraPermission('prompt');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      setCameraPermission('granted');
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setCameraError(false);
      startScanning();
    } catch (error) {
      console.error('Camera error:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraPermission('denied');
      }
      setCameraError(true);
      setManualMode(true);
    }
  };

  const startCamera = async () => {
    await requestCameraPermission();
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
      if (videoRef.current && canvasRef.current && !processing && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        if (canvas.width > 0 && canvas.height > 0) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });
          
          if (code && code.data) {
            setScanning(false);
            processTicket(code.data);
          }
        }
      }
    }, 150);
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

  const processTicket = async (qrToken) => {
    if (processing || !qrToken) return;
    if (lastScannedRef.current === qrToken) return;
    
    setProcessing(true);
    lastScannedRef.current = qrToken;
    
    try {
      // Valider le billet via Supabase
      const result = await validateTicket(qrToken, eventId);
      
      if (result.success) {
        setScanResult('success');
        setTicketInfo(result.ticket);
        setStats(prev => ({ ...prev, scanned: prev.scanned + 1 }));
        
        // Vibration feedback
        if (navigator.vibrate) {
          navigator.vibrate(100);
        }
      } else {
        setScanResult(result.error);
        setTicketInfo(result.ticket || null);
        setStats(prev => ({ ...prev, errors: prev.errors + 1 }));
        
        // Vibration d'erreur
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
      }
    } catch (error) {
      console.error('Scan error:', error);
      setScanResult('invalid');
      setStats(prev => ({ ...prev, errors: prev.errors + 1 }));
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
    setScanning(true);
  };

  const goBack = () => {
    navigate('/');
  };

  const goToHistory = () => {
    navigate(`/ScanHistory?eventId=${eventId}`);
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* Header */}
      <div className="relative z-20 bg-white/95 backdrop-blur-xl border-b border-gray-200">
        <div className="px-4 py-4 flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={goBack}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </motion.button>
          
          <div className="text-center flex-1 px-4">
            <h1 className="font-semibold truncate text-gray-900">{event.title}</h1>
            <p className="text-xs text-gray-500">{stats.scanned} / {stats.total} scannés</p>
          </div>
          
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={goToHistory}
              className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <History className="w-5 h-5 text-gray-700" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Camera Permission Screens */}
      {cameraPermission === 'prompt' && !manualMode && (
        <CameraPermissionRequest
          onGrant={requestCameraPermission}
          onManualMode={() => setManualMode(true)}
        />
      )}

      {cameraPermission === 'denied' && !manualMode && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-gray-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-sm"
          >
            <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
              <Video className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">Accès caméra refusé</h2>
            <p className="text-gray-600 text-sm mb-6">
              Pour scanner les QR codes, vous devez autoriser l'accès à la caméra dans les paramètres.
            </p>
            <Button
              onClick={() => setManualMode(true)}
              className="w-full bg-[#8B7FE8] hover:bg-[#7B6FD8]"
            >
              Utiliser la saisie manuelle
            </Button>
          </motion.div>
        </div>
      )}

      {/* Camera / Manual Input */}
      <div className="flex-1 relative">
        {!manualMode && cameraPermission === 'granted' ? (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute inset-0 bg-black/40" />
            
            <ScannerViewfinder scanning={scanning && !processing} />
            
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
              <div className="flex items-center justify-center gap-4 mb-4">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleTorch}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-lg ${
                    torchOn ? 'bg-yellow-400' : 'bg-white border-2 border-gray-200'
                  }`}
                >
                  {torchOn ? (
                    <Flashlight className="w-6 h-6 text-white" />
                  ) : (
                    <FlashlightOff className="w-6 h-6 text-gray-700" />
                  )}
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setManualMode(true)}
                  className="w-14 h-14 rounded-full bg-white border-2 border-gray-200 shadow-lg flex items-center justify-center"
                >
                  <Keyboard className="w-6 h-6 text-gray-700" />
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowStats(!showStats)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-lg ${
                    showStats ? 'bg-[#8B7FE8]' : 'bg-white border-2 border-gray-200'
                  }`}
                >
                  <BarChart3 className={`w-6 h-6 ${showStats ? 'text-white' : 'text-gray-700'}`} />
                </motion.button>
              </div>
              
              <p className="text-center text-gray-600 text-sm">
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
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#8B7FE8] to-[#7B6FD8] flex items-center justify-center mx-auto mb-6">
                <Keyboard className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-xl font-semibold text-center mb-2 text-gray-900">Saisie manuelle</h2>
              <p className="text-gray-500 text-center text-sm mb-6">
                Entrez le code du billet manuellement
              </p>

              <form onSubmit={handleManualSubmit} className="space-y-4">
                <Input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Code du billet (QR Token)"
                  className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 h-14 text-center text-lg font-mono"
                  autoFocus
                />

                <Button
                  type="submit"
                  disabled={!manualCode.trim() || processing}
                  className="w-full h-14 bg-gradient-to-r from-[#8B7FE8] to-[#7B6FD8] hover:from-[#7B6FD8] hover:to-[#6B5FC8] text-lg font-semibold"
                >
                  {processing ? (
                    <Zap className="w-5 h-5 animate-pulse" />
                  ) : (
                    'Valider le billet'
                  )}
                </Button>
              </form>

              {!cameraError && cameraPermission === 'granted' && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setManualMode(false)}
                  className="w-full mt-4 py-3 text-gray-600 hover:text-gray-900 transition-colors flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Retour au scanner
                </motion.button>
              )}

              {cameraPermission === 'prompt' && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={requestCameraPermission}
                  className="w-full mt-4 py-3 text-gray-600 hover:text-gray-900 transition-colors flex items-center justify-center gap-2"
                >
                  <Video className="w-5 h-5" />
                  Activer le scanner caméra
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
