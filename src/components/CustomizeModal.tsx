import React from 'react';
import { DolarRate } from '../types';
import { X, Eye, EyeOff, RotateCcw, SlidersHorizontal, Check } from 'lucide-react';

interface CustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  allRates: DolarRate[];
  hiddenCasas: string[];
  onToggleVisibility: (casa: string) => void;
  onResetLayout: () => void;
}

export const CustomizeModal: React.FC<CustomizeModalProps> = ({
  isOpen,
  onClose,
  allRates,
  hiddenCasas,
  onToggleVisibility,
  onResetLayout,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0e1526] border border-slate-800 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Personalizar Cotizaciones
              </h2>
              <p className="text-xs text-slate-400">
                Elige qué cotizaciones mostrar en tu panel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Cotizaciones con Toggle de Visibilidad */}
        <div className="my-5 space-y-2">
          {allRates.map(r => {
            const isHidden = hiddenCasas.includes(r.casa.toLowerCase());
            return (
              <div
                key={r.casa}
                onClick={() => onToggleVisibility(r.casa)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  isHidden
                    ? 'bg-slate-900/40 border-slate-800/60 opacity-60 hover:opacity-80'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                      !isHidden
                        ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                        : 'border-slate-700 bg-slate-800'
                    }`}
                  >
                    {!isHidden && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-200 block">
                      Dólar {r.nombre}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Venta: ${r.venta.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  title={isHidden ? 'Mostrar cotización' : 'Ocultar cotización'}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isHidden
                      ? 'text-slate-500 hover:text-slate-300'
                      : 'text-cyan-400 hover:text-cyan-300'
                  }`}
                >
                  {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            );
          })}
        </div>

        {/* Acciones del Modal */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onResetLayout}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer orden</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
          >
            Guardar cambios
          </button>
        </div>

        <p className="text-[11px] text-slate-500 mt-4 text-center">
          💡 También puedes arrastrar las tarjetas directamente en el panel para ordenarlas a tu gusto.
        </p>

      </div>
    </div>
  );
};
