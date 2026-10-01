import { useState, useEffect, useCallback, useRef } from 'react';
import { DolarRate, PriceAlert } from './types';
import { fetchDolarRates, evaluateAlerts } from './services/dolarApi';
import { Navbar } from './components/Navbar';
import { DollarCard } from './components/DollarCard';
import { HistoricalChart } from './components/HistoricalChart';
import { Converter } from './components/Converter';
import { AlertsModal } from './components/AlertsModal';
import { Footer } from './components/Footer';
import { AlertCircle, CheckCircle, BellRing } from 'lucide-react';

const REFRESH_INTERVAL_SECONDS = 120; // 2 minutos
const ALERTS_STORAGE_KEY = 'dolar_argentina_alerts_v1';

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

  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
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
      // Si la pestaña está oculta, no actualizamos el contador para ahorrar recursos
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
        // Al volver a la pestaña, si pasaron más de 120 segundos desde la última petición, recargar
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

  // Filtrado de las tarjetas más relevantes primero (Blue, Oficial, MEP, CCL, Mayorista, Cripto)
  const sortedRates = [...rates].sort((a, b) => {
    const priority: Record<string, number> = {
      blue: 1,
      oficial: 2,
      bolsa: 3,
      contadoconliqui: 4,
      cripto: 5,
      mayorista: 6,
      tarjeta: 7,
    };
    return (priority[a.casa.toLowerCase()] || 99) - (priority[b.casa.toLowerCase()] || 99);
  });

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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-200">
              Cotizaciones Principales
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {rates.length > 0 ? `${rates.length} mercados activos` : ''}
            </span>
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
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {sortedRates.map(rate => (
                <DollarCard
                  key={rate.casa}
                  rate={rate}
                  isPopular={rate.casa.toLowerCase() === 'blue' || rate.casa.toLowerCase() === 'oficial'}
                  onSetAlert={handleOpenAlertForCard}
                  onSelectForConvert={handleScrollToConverter}
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

    </div>
  );
}
