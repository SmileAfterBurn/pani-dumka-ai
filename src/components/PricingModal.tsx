import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle2, Shield, CreditCard, Sparkles, Smartphone, Zap, ArrowRight, Loader2 } from "lucide-react";
import { UkrainianOrnament } from "./UkrainianOrnament";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMobileMode?: boolean; // Determines if we show Web vs Mobile (Google Play) UI
}

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, isMobileMode = false }) => {
  const [step, setStep] = useState<"plans" | "checkout" | "success">("plans");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");

  if (!isOpen) return null;

  const handleCheckout = () => {
    if (isMobileMode) {
      // One-click Google Play Billing simulation
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setStep("success");
      }, 1500);
    } else {
      setStep("checkout");
    }
  };

  const processPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep("success");
    }, 2000);
  };

  const closeAndReset = () => {
    setTimeout(() => setStep("plans"), 300);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-50 to-amber-50 text-red-600 border border-red-100 shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-xl text-slate-900">
                  {isMobileMode ? "Оновлення через Google Play" : "Преміум Доступ"}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Розширте когнітивні можливості Пані Думки
                </p>
              </div>
            </div>
            <button
              onClick={closeAndReset}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors relative z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/30">
            {step === "plans" && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                className="max-w-3xl mx-auto space-y-8"
              >
                <div className="text-center space-y-2">
                  <h4 className="text-2xl md:text-3xl font-bold text-slate-900">Оберіть свій тариф</h4>
                  <p className="text-sm text-slate-600">Отримайте доступ до всіх 15 вузькоспеціалізованих агентів, аналітики реального часу та кастомних інтеграцій.</p>
                </div>

                {isMobileMode ? (
                  /* Mobile / Google Play Specific View */
                  <div className="bg-white rounded-3xl border-2 border-red-100 p-6 shadow-xl shadow-red-900/5 max-w-sm mx-auto relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl">
                      Google Play
                    </div>
                    <div className="space-y-6">
                      <div>
                        <h5 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                          Pro Версія <Sparkles className="w-4 h-4 text-amber-500" />
                        </h5>
                        <div className="mt-2 flex items-baseline gap-1 text-slate-900">
                          <span className="text-3xl font-bold">₴399</span>
                          <span className="text-sm text-slate-500 font-medium">/ місяць</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {[
                          'Ексклюзивний голос Пані Думки та кастомний голос',
                          'Безлімітний голосовий зв’язок у реальному часі',
                          'Пріоритетний доступ до всіх 15 агентів',
                          'Глибокий розвідувальний аналіз (OSINT & Profiler)',
                          'Повна синхронізація пам’яті (Літописець)'
                        ].map((benefit, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="text-sm text-slate-700">{benefit}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={handleCheckout}
                        disabled={isProcessing}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3.5 font-medium flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-slate-900/20 disabled:opacity-70 cursor-pointer"
                      >
                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Smartphone className="w-5 h-5" />}
                        {isProcessing ? "Обробка..." : "Оплатити в один клік"}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Web Comparison View */
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Free Plan */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 lg:p-8 flex flex-col">
                      <div className="mb-6">
                        <h5 className="text-lg font-bold text-slate-900">Базовий</h5>
                        <div className="mt-2 flex items-baseline gap-1 text-slate-900">
                          <span className="text-4xl font-bold">₴0</span>
                          <span className="text-sm text-slate-500 font-medium">/ назавжди</span>
                        </div>
                        <p className="text-sm text-slate-500 mt-2">Ідеально для щоденної взаємодії, написання сценаріїв та стандартних задач.</p>
                      </div>
                      
                      <div className="space-y-4 mb-8 flex-1">
                        {[
                          'Стандартні голоси Gemini Live та ElevenLabs',
                          'Промптинг відео та генерація сценаріїв',
                          'Спілкування з Пані Думкою та базовими агентами',
                          'Базовий пошук та аналіз інформації',
                          'Стандартний час голосових сесій'
                        ].map((benefit, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                            <span className="text-sm text-slate-700">{benefit}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        disabled
                        className="w-full bg-slate-100 text-slate-400 rounded-xl py-3 font-medium flex justify-center cursor-not-allowed"
                      >
                        Поточний план
                      </button>
                    </div>

                    {/* Pro Plan */}
                    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 lg:p-8 flex flex-col relative overflow-hidden shadow-2xl shadow-red-900/20">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                      
                      <div className="mb-6 relative z-10">
                        <div className="flex items-center justify-between">
                          <h5 className="text-lg font-bold text-white flex items-center gap-2">
                            Преміум <Sparkles className="w-4 h-4 text-amber-400" />
                          </h5>
                          <span className="text-[10px] uppercase tracking-wider font-bold bg-red-500/20 text-red-400 px-2.5 py-1 rounded-full">
                            Рекомендовано
                          </span>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1 text-white">
                          <span className="text-4xl font-bold">₴399</span>
                          <span className="text-sm text-slate-400 font-medium">/ місяць</span>
                        </div>
                        <p className="text-sm text-slate-400 mt-2">Для професіоналів, розробників та дослідників із максимальними вимогами.</p>
                      </div>
                      
                      <div className="space-y-4 mb-8 flex-1 relative z-10">
                        {[
                          'Ексклюзивний голос Пані Думки та власний кастомний голос',
                          'Повний безлімітний голосовий зв’язок у реальному часі',
                          'Всі 15 вузькоспеціалізованих агентів із найвищим пріоритетом',
                          'Глибокий мультимодальний аналіз (комп’ютерний зір, файли, код)',
                          'Повна довгострокова пам’ять (Stan & Lytopisec)',
                          'Пріоритетна підтримка та контекст ко-фаундера'
                        ].map((benefit, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-red-400 shrink-0" />
                            <span className="text-sm text-slate-200">{benefit}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={handleCheckout}
                        className="w-full bg-red-600 hover:bg-red-500 text-white rounded-xl py-3 font-medium flex justify-center items-center gap-2 transition-all relative z-10 shadow-lg shadow-red-900/50 cursor-pointer"
                      >
                        Оновити зараз <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {step === "checkout" && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={() => setStep("plans")} className="text-slate-400 hover:text-slate-700 transition-colors">
                    <ArrowRight className="w-5 h-5 rotate-180" />
                  </button>
                  <h4 className="text-xl font-bold text-slate-900">Оплата підписки</h4>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-8 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">Преміум (Місячний)</div>
                    <div className="text-xs text-slate-500 mt-0.5">Автоподовження. Скасувати можна будь-коли.</div>
                  </div>
                  <div className="text-lg font-bold text-slate-900">₴399.00</div>
                </div>

                <form onSubmit={processPayment} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Номер картки</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="text" 
                        required
                        placeholder="0000 0000 0000 0000" 
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Термін дії</label>
                      <input 
                        type="text" 
                        required
                        placeholder="ММ/РР" 
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">CVC / CVV</label>
                      <div className="relative">
                        <input 
                          type="password" 
                          required
                          maxLength={3}
                          placeholder="***" 
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-mono"
                        />
                        <Shield className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Ім'я на картці</label>
                    <input 
                      type="text" 
                      required
                      placeholder="TARAS SHEVCHENKO" 
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all uppercase"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3.5 font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-900/10 active:scale-95 disabled:opacity-70 cursor-pointer"
                    >
                      {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                      {isProcessing ? "Обробка транзакції..." : "Оплатити безпечно ₴399"}
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
                    <Shield className="w-3 h-3" />
                    256-bit SSL безпечне шифрування
                  </div>
                </form>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="max-w-md mx-auto bg-white rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-900/5 p-8 text-center space-y-6"
              >
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-sm">
                  <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    transition={{ type: "spring", delay: 0.2 }}
                  >
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </motion.div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-2xl font-bold text-slate-900">Оплата успішна!</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Преміум-статус активовано. Вітаємо у клубі професіоналів. Тепер вам доступні всі можливості Пані Думки.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-left">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-500">ID Транзакції</span>
                    <span className="font-mono text-slate-900">TRX-{Math.floor(Math.random() * 1000000)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Сума</span>
                    <span className="font-semibold text-emerald-600">₴399.00</span>
                  </div>
                </div>

                <button
                  onClick={closeAndReset}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 font-medium transition-colors cursor-pointer"
                >
                  Почати використання
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
