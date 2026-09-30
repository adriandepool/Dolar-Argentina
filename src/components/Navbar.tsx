import React from 'react';
import { Bell, RefreshCw, Clock, ArrowRightLeft, Sparkles } from 'lucide-react';

interface NavbarProps {
  countdown: number;
  isRefreshing: boolean;
  onRefresh: () => void;
  activeAlertsCount: number;
  onOpenAlerts: () => void;
  onScrollToConverter: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  countdown,
  isRefreshing,
  onRefresh,
  activeAlertsCount,
  onOpenAlerts,
  onScrollToConverter,
}) => {
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#090d16]/80 border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo y Título */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
                <span className="text-xl sm:text-2xl select-none">🇦🇷</span>
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  Dólar <span className="text-cyan-400">Argentina</span>
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  <Sparkles className="w-2.5 h-2.5" /> EN VIVO
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Cotizaciones en tiempo real del mercado cambiario</p>
            </div>
          </div>

          {/* Acciones de la barra */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Temporizador & Refresco Manual */}
            <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-1 px-2.5 text-xs text-slate-300 shadow-inner">
              <Clock className="w-3.5 h-3.5 text-slate-400 mr-1.5 hidden sm:inline" />
              <span className="text-slate-400 hidden md:inline mr-1">Actualiza en:</span>
              <span className="font-mono font-medium text-cyan-400 min-w-[32px] text-center">
                {formatCountdown(countdown)}
              </span>
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Actualizar cotizaciones ahora"
                className="ml-2 p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </div>

            {/* Acceso a Calculadora */}
            <button
              onClick={onScrollToConverter}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/70 transition-all hover:border-slate-600"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
              <span>Calculadora</span>
            </button>

            {/* Botón de Alertas */}
            <button
              onClick={onOpenAlerts}
              className="relative flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 border border-cyan-500/30 transition-all hover:border-cyan-500/50 shadow-sm shadow-cyan-500/10 active:scale-95"
            >
              <Bell className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Alertas</span>
              {activeAlertsCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold text-white bg-cyan-600 rounded-full">
                  {activeAlertsCount}
                </span>
              )}
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
