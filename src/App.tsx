import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { DolarRate, PriceAlert } from './types';
import { fetchDolarRates, evaluateAlerts } from './services/dolarApi';
import { Navbar } from './components/Navbar';
import { DollarCard } from './components/DollarCard';
import { HistoricalChart } from './components/HistoricalChart';
import { Converter } from './components/Converter';
import { AlertsModal } from './components/AlertsModal';
import { CustomizeModal } from './components/CustomizeModal';
import { MarketTicker } from './components/MarketTicker';
import { Footer } from './components/Footer';
import { AlertCircle, CheckCircle, BellRing, SlidersHorizontal, RotateCcw } from 'lucide-react';

const REFRESH_INTERVAL_SECONDS = 120; // 2 minutos
const ALERTS_STORAGE_KEY = 'dolar_argentina_alerts_v1';
const CARD_PREFS_KEY = 'dolar_card_preferences_v2';
const DEFAULT_ORDER = ['blue', 'oficial', 'bolsa', 'contadoconliqui', 'cripto', 'mayorista', 'tarjeta'];

interface CardPrefs {
  order: string[];
  hidden: string[];
}

export function App() {
  const [rates, setRates] = useState<DolarRate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(REFRESH_INTERVAL_SECONDS);
  
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem(ALERTS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [cardPrefs, setCardPrefs] = useState<CardPrefs>(() => {
    try {
      const saved = localStorage.getItem(CARD_PREFS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return { order: DEFAULT_ORDER, hidden: [] };
  });

  const [draggedCasa, setDraggedCasa] = useState<string | null>(null);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [modalInitialCasa, setModalInitialCasa] = useState<string | undefined>();
  const [modalInitialPrice, setModalInitialPrice] = useState<number | undefined>();
  const [activeToast, setActiveToast] = useState<{ message: string; type: 'success' | 'alert' } | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Escuchar evento de instalación PWA
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice?.outcome === 'accepted') {
      showToast('¡Aplicación instalada con éxito!');
    }
    setDeferredPrompt(null);
  };

  const lastFetchTimeRef = useRef<number>(Date.now());
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Guardar alertas en localStorage cada vez que cambien
  useEffect(() => {
    try {
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
    } catch (e) {
      console.warn('Error al guardar alertas en localStorage:', e);
    }
  }, [alerts]);

  // Guardar preferencias de orden y visibilidad
  useEffect(() => {
    try {
      localStorage.setItem(CARD_PREFS_KEY, JSON.stringify(cardPrefs));
    } catch (e) {
      console.warn('Error guardando preferencias de tarjetas:', e);
    }
  }, [cardPrefs]);

  const showToast = (message: string, type: 'success' | 'alert' = 'success') => {
    setActiveToast({ message, type });
    setTimeout(() => {
      setActiveToast(null);
    }, 4500);
  };

  // Carga de cotizaciones
  const loadRates = useCallback(async (force = false) => {
    try {
      setIsRefreshing(true);
      const { rates: newRates } = await fetchDolarRates(force);
      setRates(newRates);
      setError(null);
      lastFetchTimeRef.current = Date.now();
      setCountdown(REFRESH_INTERVAL_SECONDS);

      // Evaluar alertas
      setAlerts(prevAlerts => {
        return evaluateAlerts(prevAlerts, newRates, (triggeredAlert, currentPrice) => {
          showToast(
            `🔔 ¡Alerta: Dólar ${triggeredAlert.nombre} cotiza a $${currentPrice.toLocaleString('es-AR')}!`,
            'alert'
          );
        });
      });
    } catch (err: unknown) {
      console.error('Error cargando cotizaciones:', err);
      const message = err instanceof Error ? err.message : 'Error desconocido al cargar cotizaciones.';
      setError(message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Primera carga al montar
  useEffect(() => {
    loadRates(false);
  }, [loadRates]);

  // Manejador de temporizador y Page Visibility API
  useEffect(() => {
    countdownIntervalRef.current = setInterval(() => {
      if (document.hidden) return;

      setCountdown(prev => {
        if (prev <= 1) {
          loadRates(true);
          return REFRESH_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const elapsed = (Date.now() - lastFetchTimeRef.current) / 1000;
        if (elapsed >= REFRESH_INTERVAL_SECONDS) {
          loadRates(true);
        } else {
          setCountdown(Math.max(1, Math.round(REFRESH_INTERVAL_SECONDS - elapsed)));
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadRates]);

  // Manejo de alertas
  const handleAddAlert = (newAlertData: Omit<PriceAlert, 'id' | 'createdAt'>) => {
    const newAlert: PriceAlert = {
      ...newAlertData,
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setAlerts(prev => [...prev, newAlert]);
    showToast(`Alerta para Dólar ${newAlert.nombre} activada.`);
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    showToast('Alerta eliminada.');
  };

  const handleToggleAlert = (id: string) => {
    setAlerts(prev =>
      prev.map(a => (a.id === id ? { ...a, active: !a.active } : a))
    );
  };

  const handleOpenAlertForCard = (casa: string, nombre: string, currentPrice: number) => {
    setModalInitialCasa(casa);
    setModalInitialPrice(currentPrice);
    setIsAlertsModalOpen(true);
  };

  const handleScrollToConverter = () => {
    const el = document.getElementById('converter-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, casa: string) => {
    setDraggedCasa(casa.toLowerCase());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, targetCasa: string) => {
    e.preventDefault();
    const source = draggedCasa;
    const target = targetCasa.toLowerCase();
    if (!source || source === target) return;

    setCardPrefs(prev => {
      const currentOrder = [...prev.order];
      rates.forEach(r => {
        const k = r.casa.toLowerCase();
        if (!currentOrder.includes(k)) currentOrder.push(k);
      });

      const sourceIdx = currentOrder.indexOf(source);
      const targetIdx = currentOrder.indexOf(target);
      if (sourceIdx === -1 || targetIdx === -1) return prev;

      currentOrder.splice(sourceIdx, 1);
      currentOrder.splice(targetIdx, 0, source);

      return {
        ...prev,
        order: currentOrder,
      };
    });
  };

  const handleDragEnd = () => {
    setDraggedCasa(null);
  };

  const handleHideCard = (casa: string) => {
    const k = casa.toLowerCase();
    setCardPrefs(prev => ({
      ...prev,
      hidden: prev.hidden.includes(k) ? prev.hidden : [...prev.hidden, k],
    }));
    const rateName = rates.find(r => r.casa.toLowerCase() === k)?.nombre || casa;
    showToast(`Dólar ${rateName} ocultado. Pulsa "Personalizar" para restaurarlo.`);
  };

  const handleToggleVisibility = (casa: string) => {
    const k = casa.toLowerCase();
    setCardPrefs(prev => ({
      ...prev,
      hidden: prev.hidden.includes(k)
        ? prev.hidden.filter(item => item !== k)
        : [...prev.hidden, k],
    }));
  };

  const handleResetLayout = () => {
    setCardPrefs({ order: DEFAULT_ORDER, hidden: [] });
    showToast('Orden y visibilidad restablecidos.');
  };

  // Filtrado y ordenamiento interactivo según preferencias del usuario
  const displayedRates = useMemo(() => {
    if (!rates.length) return [];
    const ratesMap = new Map(rates.map(r => [r.casa.toLowerCase(), r]));

    const fullOrder = [...cardPrefs.order];
    rates.forEach(r => {
      const k = r.casa.toLowerCase();
      if (!fullOrder.includes(k)) fullOrder.push(k);
    });

    const ordered: DolarRate[] = [];
    fullOrder.forEach(k => {
      if (!cardPrefs.hidden.includes(k) && ratesMap.has(k)) {
        ordered.push(ratesMap.get(k)!);
      }
    });

    return ordered;
  }, [rates, cardPrefs]);

  const hiddenCount = cardPrefs.hidden.length;

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100">
      
      {/* Navbar Superior */}
      <Navbar
        countdown={countdown}
        isRefreshing={isRefreshing}
        onRefresh={() => loadRates(true)}
        activeAlertsCount={alerts.filter(a => a.active).length}
        onOpenAlerts={() => {
          setModalInitialCasa(undefined);
          setModalInitialPrice(undefined);
          setIsAlertsModalOpen(true);
        }}
        onScrollToConverter={handleScrollToConverter}
        onInstallApp={handleInstallApp}
        canInstallApp={!!deferredPrompt}
      />

      {/* Ticker de Indicadores Macroeconómicos & Compartir */}
      <MarketTicker rates={rates} onShowToast={showToast} />

      {/* Notificación Toast Flotante */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900/95 border border-cyan-500/40 text-white rounded-xl shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-300">
          {activeToast.type === 'alert' ? (
            <BellRing className="w-5 h-5 text-amber-400 animate-bounce" />
          ) : (
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          )}
          <span className="text-xs sm:text-sm font-medium">{activeToast.message}</span>
        </div>
      )}

      {/* Contenido Principal */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-8">

        {/* Mensaje de Error si la API falla */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-300 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{error} Reintentando en la próxima sincronización...</span>
          </div>
        )}

        {/* Grilla de Tarjetas de Cotizaciones */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-200">
                Cotizaciones Principales
              </h3>
              <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                ({displayedRates.length} activas)
              </span>
            </div>

            {/* Controles de Personalización & Reordenamiento */}
            <div className="flex items-center gap-2">
              {hiddenCount > 0 && (
                <button
                  onClick={() => setIsCustomizeModalOpen(true)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                >
                  {hiddenCount} {hiddenCount === 1 ? 'oculta' : 'ocultas'}
                </button>
              )}

              <button
                onClick={() => setIsCustomizeModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Personalizar</span>
              </button>

              {(hiddenCount > 0 || JSON.stringify(cardPrefs.order) !== JSON.stringify(DEFAULT_ORDER)) && (
                <button
                  onClick={handleResetLayout}
                  title="Restablecer orden y visibilidad por defecto"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-44 rounded-2xl bg-slate-900/50 border border-slate-800/80 animate-pulse p-6 flex flex-col justify-between"
                >
                  <div className="h-5 w-28 bg-slate-800 rounded-md" />
                  <div className="h-10 w-full bg-slate-800/60 rounded-xl" />
                  <div className="h-4 w-36 bg-slate-800/40 rounded-md" />
                </div>
              ))}
            </div>
          ) : displayedRates.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800">
              <p className="text-sm text-slate-400 mb-3">Has ocultado todas las cotizaciones.</p>
              <button
                onClick={handleResetLayout}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-all"
              >
                Mostrar todas de nuevo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {displayedRates.map(rate => (
                <DollarCard
                  key={rate.casa}
                  rate={rate}
                  isPopular={rate.casa.toLowerCase() === 'blue' || rate.casa.toLowerCase() === 'oficial'}
                  onSetAlert={handleOpenAlertForCard}
                  onSelectForConvert={handleScrollToConverter}
                  onHideCard={handleHideCard}
                  onCopyPrice={(val, type, nombre) =>
                    showToast(`Dólar ${nombre} (${type}): $${val.toLocaleString('es-AR')} copiado al portapapeles.`)
                  }
                  isDragging={draggedCasa === rate.casa.toLowerCase()}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </div>
          )}
        </section>

        {/* Gráfico Histórico Interactivo */}
        <HistoricalChart />

        {/* Calculadora / Conversor de Moneda */}
        {rates.length > 0 && <Converter rates={rates} selectedCasa="blue" />}

      </main>

      {/* Pie de Página */}
      <Footer />

      {/* Modal de Alertas */}
      <AlertsModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        alerts={alerts}
        rates={rates}
        onAddAlert={handleAddAlert}
        onDeleteAlert={handleDeleteAlert}
        onToggleAlert={handleToggleAlert}
        initialCasa={modalInitialCasa}
        initialPrice={modalInitialPrice}
      />

      {/* Modal de Personalización (Mostrar / Ocultar / Reordenar) */}
      <CustomizeModal
        isOpen={isCustomizeModalOpen}
        onClose={() => setIsCustomizeModalOpen(false)}
        allRates={rates}
        hiddenCasas={cardPrefs.hidden}
        onToggleVisibility={handleToggleVisibility}
        onResetLayout={handleResetLayout}
      />

    </div>
  );
}
