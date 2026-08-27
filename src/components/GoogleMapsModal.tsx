import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Map as MapIcon, Key } from "lucide-react";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";

interface GoogleMapsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleMapsModal: React.FC<GoogleMapsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [apiKey, setApiKey] = useState<string>(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "");
  const [isKeyValid, setIsKeyValid] = useState<boolean>(!!import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
  
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col h-[80vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-green-50/30">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-green-600 text-white shadow-md shadow-green-600/20">
                <MapIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900">Google Maps</h3>
                <p className="text-xs text-slate-500 font-mono">Інтеграція картографічних сервісів Google</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 flex flex-col relative bg-slate-50">
            {!isKeyValid ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center mb-6">
                  <Key className="w-8 h-8 text-amber-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2 font-serif">Потрібен ключ API</h2>
                <p className="text-sm text-slate-600 text-center max-w-md mb-8">
                  Для використання Google Maps Platform, будь ласка, надайте дійсний ключ API (Maps Demo Key або власний). <br/> Використання Google Maps Platform може вимагати витрат з вашого облікового запису Google Cloud.
                </p>
                <div className="w-full max-w-md flex flex-col gap-3">
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm"
                  />
                  <button
                    onClick={() => {
                      if (apiKey.trim()) setIsKeyValid(true);
                    }}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors"
                  >
                    Зберегти ключ
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full h-full relative">
                <APIProvider apiKey={apiKey} language="uk" region="UA">
                  <Map
                    defaultCenter={{ lat: 50.4501, lng: 30.5234 }}
                    defaultZoom={12}
                    mapId="DEMO_MAP_ID"
                    style={{ width: "100%", height: "100%" }}
                    internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
                  >
                    <AdvancedMarker position={{ lat: 50.4501, lng: 30.5234 }} />
                  </Map>
                </APIProvider>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
