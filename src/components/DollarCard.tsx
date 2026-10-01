import React from 'react';
import { DolarRate } from '../types';
import { BellPlus, TrendingUp, DollarSign, GripVertical, EyeOff } from 'lucide-react';

interface DollarCardProps {
  rate: DolarRate;
  onSetAlert: (casa: string, nombre: string, currentPrice: number) => void;
  onSelectForConvert: (casa: string) => void;
  onHideCard?: (casa: string) => void;
  isPopular?: boolean;
  // Drag and Drop props
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent, casa: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnter?: (e: React.DragEvent, casa: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export const DollarCard: React.FC<DollarCardProps> = ({
  rate,
  onSetAlert,
  onSelectForConvert,
  onHideCard,
  isPopular,
  isDragging,
  onDragStart,
  onDragOver,
  onDragEnter,
  onDragEnd,
}) => {
  const formatCurrency = (val: number | null) => {
    if (val === null || typeof val === 'undefined') return '—';
    return val.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatShortDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) + ' hs';
    } catch {
      return 'Reciente';
    }
  };

  // Color temático según el tipo de dólar
  const getColorScheme = (casa: string) => {
    switch (casa.toLowerCase()) {
      case 'blue':
        return {
          glow: 'from-cyan-500/20 via-blue-500/10 to-transparent',
          border: 'border-cyan-500/30 hover:border-cyan-400/60',
          badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
          accent: 'text-cyan-400',
        };
      case 'oficial':
        return {
          glow: 'from-emerald-500/20 via-green-500/10 to-transparent',
          border: 'border-emerald-500/30 hover:border-emerald-400/60',
          badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
          accent: 'text-emerald-400',
        };
      case 'bolsa':
        return {
          glow: 'from-indigo-500/20 via-blue-500/10 to-transparent',
          border: 'border-indigo-500/30 hover:border-indigo-400/60',
          badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
          accent: 'text-indigo-400',
        };
      case 'contadoconliqui':
        return {
          glow: 'from-amber-500/20 via-orange-500/10 to-transparent',
          border: 'border-amber-500/30 hover:border-amber-400/60',
          badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
          accent: 'text-amber-400',
        };
      case 'cripto':
        return {
          glow: 'from-purple-500/20 via-violet-500/10 to-transparent',
          border: 'border-purple-500/30 hover:border-purple-400/60',
          badge: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
          accent: 'text-purple-400',
        };
      default:
        return {
          glow: 'from-slate-500/10 to-transparent',
          border: 'border-slate-800 hover:border-slate-700',
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
          accent: 'text-slate-300',
        };
    }
  };

  const scheme = getColorScheme(rate.casa);

  return (
    <div
      draggable
      onDragStart={e => onDragStart?.(e, rate.casa)}
      onDragOver={onDragOver}
      onDragEnter={e => onDragEnter?.(e, rate.casa)}
      onDragEnd={onDragEnd}
      className={`group relative rounded-2xl bg-[#0e1526]/80 backdrop-blur-md p-5 sm:p-6 border ${
        scheme.border
      } transition-all duration-200 hover:shadow-2xl hover:shadow-cyan-950/40 flex flex-col justify-between overflow-hidden cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-40 scale-95 border-dashed border-cyan-400 ring-2 ring-cyan-500/30' : ''
      }`}
    >
      {/* Resplandor sutil de fondo */}
      <div
        className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${scheme.glow} rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-500`}
      />

      <div>
        {/* Cabecera de la tarjeta con Grip y Botones de Acción */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            {/* Grip handle visual */}
            <span
              title="Arrastra para reordenar esta cotización"
              className="text-slate-600 group-hover:text-slate-400 transition-colors p-0.5 cursor-grab"
            >
              <GripVertical className="w-4 h-4" />
            </span>

            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${scheme.badge}`}>
                  Dólar {rate.nombre}
                </span>
                {isPopular && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    ★ Popular
                  </span>
                )}
              </div>
              {rate.brechaConOficial !== undefined && rate.brechaConOficial > 0 && (
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-cyan-400 inline" />
                  Brecha vs Oficial: <span className="font-semibold text-cyan-300">+{rate.brechaConOficial}%</span>
                </p>
              )}
            </div>
          </div>

          {/* Botones de acción rápida: Ocultar y Alerta */}
          <div className="flex items-center gap-1.5 shrink-0">
            {onHideCard && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onHideCard(rate.casa);
                }}
                title={`Ocultar Dólar ${rate.nombre}`}
                className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/60 transition-all active:scale-95 shadow-sm"
              >
                <EyeOff className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onSetAlert(rate.casa, rate.nombre, rate.venta);
              }}
              title={`Crear alerta para Dólar ${rate.nombre}`}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 border border-slate-700/60 hover:border-cyan-500/40 transition-all active:scale-95 shadow-sm"
            >
              <BellPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Precios Principales (Compra y Venta) */}
        <div className="grid grid-cols-2 gap-3 my-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
          <div>
            <span className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">
              Compra
            </span>
            <span className="text-base sm:text-lg font-bold text-slate-200 font-mono tracking-tight">
              {formatCurrency(rate.compra)}
            </span>
          </div>

          <div className="border-l border-slate-800 pl-3">
            <span className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">
              Venta
            </span>
            <span className={`text-lg sm:text-xl font-extrabold ${scheme.accent} font-mono tracking-tight`}>
              {formatCurrency(rate.venta)}
            </span>
          </div>
        </div>
      </div>

      {/* Pie de la tarjeta */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
        <span title={`Actualizado: ${rate.fechaActualizacion}`}>
          Act. {formatShortDate(rate.fechaActualizacion)}
        </span>
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onSelectForConvert(rate.casa);
          }}
          className="text-slate-400 hover:text-cyan-300 font-medium flex items-center gap-1 hover:underline transition-colors"
        >
          <DollarSign className="w-3 h-3" /> Convertir
        </button>
      </div>
    </div>
  );
};
