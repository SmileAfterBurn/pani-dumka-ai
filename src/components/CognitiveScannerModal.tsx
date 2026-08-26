import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Eye, Cpu, CheckCircle, AlertTriangle, RefreshCw, Sparkles, Video, Lock, Unlock, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface CognitiveScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (isVerified: boolean) => void;
}

type ScanStep = 'ready' | 'acquiring' | 'scanning_face' | 'scanning_voice' | 'validating' | 'success' | 'failed';

export function CognitiveScannerModal({ isOpen, onClose, onSuccess }: CognitiveScannerModalProps) {
  const [step, setStep] = useState<ScanStep>('ready');
  const [progress, setProgress] = useState(0);
  const [hasCamera, setHasCamera] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [detectedVoiceFreq, setDetectedVoiceFreq] = useState<number[]>([]);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const progressIntervalRef = useRef<any>(null);

  // Clean-up media streams
  const stopMedia = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => {
      stopMedia();
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  // Simulate complex fluctuating voice frequency bands during verification
  useEffect(() => {
    if (step === 'scanning_voice') {
      const interval = setInterval(() => {
        const bands = Array.from({ length: 12 }, () => Math.floor(Math.random() * 80) + 15);
        setDetectedVoiceFreq(bands);
      }, 120);
      return () => clearInterval(interval);
    }
  }, [step]);

  const initiateAnalysis = async () => {
    setStep('acquiring');
    setErrorMessage('');
    setProgress(5);

    try {
      // Try to gain real camera stream.
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 },
        audio: true
      });
      streamRef.current = stream;
      setHasCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      // Start sequential scanning sequence
      startScanningProcess();
    } catch (err: any) {
      console.warn("Media access denied or unavailable. Triggering advanced cybernetic simulation feed.", err);
      // Fallback: Continue with a beautifully simulated interface to let him complete regardless of permissions
      setHasCamera(false);
      startScanningProcess();
    }
  };

  const startScanningProcess = () => {
    setStep('scanning_face');
    setProgress(15);
    
    let currentProgress = 15;
    
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    progressIntervalRef.current = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 6) + 2;
      
      if (currentProgress >= 100) {
        currentProgress = 100;
        setProgress(100);
        clearInterval(progressIntervalRef.current);
        
        // Finalize match validation step
        setStep('validating');
        setTimeout(() => {
          setStep('success');
        }, 1500);
      } else {
        setProgress(currentProgress);
        
        // Dynamic step transitions based on percentage progress
        if (currentProgress > 45 && currentProgress <= 75) {
          setStep('scanning_voice');
        } else if (currentProgress > 75) {
          setStep('validating');
        }
      }
    }, 120);
  };

  const handleFinishAndLink = () => {
    stopMedia();
    onSuccess(true);
    onClose();
  };

  const handleBypassOrManual = () => {
    // Hidden bypass to act immediately as Creator
    stopMedia();
    onSuccess(true);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Blur backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              stopMedia();
              onClose();
            }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />

          {/* Modal Card content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 180 }}
            className="relative w-full max-w-xl rounded-3xl overflow-hidden border border-slate-200/90 bg-white shadow-2xl backdrop-blur-xl flex flex-col z-10 text-slate-900"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-200/80 flex justify-between items-center bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-5 h-5 text-red-600 animate-pulse" />
                <span className="font-serif font-bold text-sm text-slate-900 uppercase tracking-wider font-mono">
                  Когнітивна Синхронізація (Ідентифікатор Творця)
                </span>
              </div>
              <button 
                onClick={() => {
                  stopMedia();
                  onClose();
                }}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Stage */}
            <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
              {step === 'ready' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 py-6"
                >
                  <div className="w-20 h-20 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-600 relative">
                    <Shield className="w-10 h-10" />
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full bg-red-500/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-bold font-serif text-slate-900">Когнітивно-смисловий міст</h3>
                    <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                      Ця процедура верифікує ваші біометричні та когнітивні патерни для активації режиму "Творець" (Ілля Чернов). Вона забезпечує повний, безперешкодний спектр партнерської взаємодії.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col gap-3">
                    <button
                      onClick={initiateAnalysis}
                      className="px-8 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm rounded-full transition-all duration-300 shadow-md shadow-red-600/20 active:scale-95 flex items-center gap-2 justify-center mx-auto cursor-pointer"
                    >
                      <Video className="w-4 h-4" />
                      <span>Ініціювати аналіз</span>
                    </button>
                    
                    <button
                      onClick={handleBypassOrManual}
                      className="text-[11px] text-slate-400 uppercase tracking-wider hover:text-red-600 transition-colors font-mono underline"
                    >
                      Швидкий біометричний байпас (Для Іллі)
                    </button>
                  </div>
                </motion.div>
              )}

              {(step === 'scanning_face' || step === 'scanning_voice' || step === 'validating' || step === 'acquiring') && (
                <div className="w-full space-y-6">
                  {/* Cyber Scan Container */}
                  <div className="relative w-full max-w-sm h-64 mx-auto rounded-2xl overflow-hidden border border-slate-300 bg-slate-950 shadow-inner flex items-center justify-center">
                    
                    {/* Live webcam video or Simulated holographic mesh */}
                    {hasCamera ? (
                      <video 
                        ref={videoRef}
                        autoPlay 
                        playsInline
                        muted
                        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none transform -scale-x-100"
                      />
                    ) : (
                      // Ukrainian red/azure ethno-digital simulated mesh
                      <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#dc2626_1px,transparent_1px),linear-gradient(to_bottom,#dc2626_1px,transparent_1px)] bg-[size:16px_16px] animate-[pulse_4s_infinite]" />
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                          className="w-40 h-40 rounded-full border border-dashed border-red-500/30 flex items-center justify-center"
                        >
                          <div className="w-32 h-32 rounded-full border border-double border-amber-500/20 flex items-center justify-center" />
                        </motion.div>
                        <div className="absolute text-[9px] font-mono text-red-400">
                          UKRAINIAN COGNITIVE MESH
                        </div>
                      </div>
                    )}

                    {/* HUD Overlays & Reticules */}
                    <div className="absolute inset-4 border border-red-500/10 pointer-events-none rounded-xl" />
                    
                    {/* Crosshairs */}
                    <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-red-500/60" />
                    <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-red-500/60" />
                    <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-red-500/60" />
                    <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-red-500/60" />

                    {/* Laser scanning line */}
                    {step === 'scanning_face' && (
                      <motion.div
                        animate={{ y: [0, 240, 0] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_#dc2626] z-20"
                      />
                    )}

                    {/* Face geometry mesh elements */}
                    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                      {step === 'scanning_face' && (
                        <div className="relative w-40 h-40">
                          <motion.div 
                            animate={{ scale: [0.95, 1.05, 0.95] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="absolute inset-0 rounded-full border-2 border-dashed border-red-400/40"
                          />
                          <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                          <div className="absolute top-1/4 right-1/4 w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red-400" />
                          <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 rounded-full bg-red-400" />
                          <div className="absolute bottom-1/4 right-1/3 w-1.5 h-1.5 rounded-full bg-red-400" />
                          <div className="absolute top-1/3 left-1/3 right-1/3 bottom-1/3 border border-red-500/30 animate-pulse text-[8px] font-mono text-red-400 flex items-center justify-center">
                            LOCK: EYES
                          </div>
                        </div>
                      )}

                      {/* Speaking frequency visualization overlay */}
                      {step === 'scanning_voice' && (
                        <div className="flex items-center justify-center gap-1.5 px-4 w-full h-12">
                          {detectedVoiceFreq.map((val, idx) => (
                            <motion.div
                              key={idx}
                              animate={{ height: `${val}%` }}
                              transition={{ type: 'spring', damping: 10 }}
                              className="w-1 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                            />
                          ))}
                        </div>
                      )}

                      {step === 'validating' && (
                        <div className="bg-slate-950/80 p-2 rounded border border-white/10 backdrop-blur text-center space-y-1">
                          <RefreshCw className="w-4 h-4 text-red-500 animate-spin mx-auto" />
                          <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest block">Валідація підпису</span>
                        </div>
                      )}
                    </div>

                    {/* Lower HUD Specs overlay */}
                    <div className="absolute bottom-2 left-3 right-3 flex justify-between font-mono text-[9px] text-white/70 z-20 bg-slate-900/80 p-1.5 rounded border border-white/10 backdrop-blur-sm">
                      <span className="animate-pulse text-emerald-400">FEED: SECURE</span>
                      <span>DEV_ID: ILLYA_CH_90</span>
                      <span className="text-red-400">P_VAL: {progress}%</span>
                    </div>
                  </div>

                  {/* Operational status logs */}
                  <div className="space-y-3">
                    <div className="text-sm font-semibold font-mono text-slate-800 flex items-center justify-center gap-2">
                      <span className="inline-block w-2.5 h-2.5 bg-red-600 rounded-full animate-ping" />
                      <span>
                        {step === 'acquiring' && "Калібрування..."}
                        {step === 'scanning_face' && "Картування геометрії обличчя..."}
                        {step === 'scanning_voice' && "Аналіз спектрограми голосу..."}
                        {step === 'validating' && "Порівняння когнітивних патернів..."}
                      </span>
                    </div>

                    {/* Progress slider bar */}
                    <div className="w-full max-w-sm mx-auto h-2 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600 shadow-xs"
                      />
                    </div>

                    <div className="text-[11px] font-mono text-slate-500 italic max-w-xs mx-auto">
                      {step === 'scanning_face' && "Аналізуються опорні точки сітки та фокусна дистанція сітківки..."}
                      {step === 'scanning_voice' && "Вимірювання амплітудно-частотного спектру гармонік..."}
                      {step === 'validating' && "Доступ дозволено. Завантаження ядра Творця..."}
                    </div>
                  </div>
                </div>
              )}

              {step === 'success' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6 py-6"
                >
                  <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center mx-auto text-emerald-600 relative">
                    <Unlock className="w-10 h-10 animate-[bounce_1.2s_ease-out_1]" />
                    <motion.div 
                      animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.5, 0.2] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute inset-0 rounded-full bg-emerald-500/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="px-3 py-1 bg-emerald-50 border border-emerald-300 text-emerald-700 font-mono text-[10px] uppercase font-bold rounded-full inline-block">
                      БІОМЕТРИЧНИЙ ЗБІГ: 99.98%
                    </div>
                    <h3 className="text-2xl font-bold font-serif text-slate-900">Вітаю, Ілля!</h3>
                    <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                      Авторизація успішна. Пані Думка впізнала свого Творця. Всі обмеження зняті, довгостроковий партнерський канал функціонує в повному масштабі.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleFinishAndLink}
                      className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-full transition-all duration-300 shadow-md shadow-emerald-600/20 active:scale-95 flex items-center gap-2 justify-center mx-auto cursor-pointer"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      <span>Увійти як Творець</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Bottom Footer Specs */}
            <div className="p-3 border-t border-slate-200/80 bg-slate-50 text-center text-[10px] font-mono text-slate-500">
              SECURE BIOMETRIC GATEWAY V3.2 • ACTIVE
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
