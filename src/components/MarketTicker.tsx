import React, { useEffect, useState } from 'react';
import { MarketIndicators, fetchMarketIndicators } from '../services/marketIndicators';
import { TrendingDown, Percent, Clock, Share2, Check } from 'lucide-react';
import { DolarRate } from '../types';

interface MarketTickerProps {
  rates: DolarRate[];
  onShowToast: (msg: string) => void;
}

export const MarketTicker: React.FC<MarketTickerProps> = ({ rates, onShowToast }) => {
  const [indicators, setIndicators] = useState<MarketIndicators | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    fetchMarketIndicators().then(setIndicators);
  }, []);

  const handleShare = async () => {
    const blue = rates.find(r => r.casa.toLowerCase() === 'blue');
    const oficial = rates.find(r => r.casa.toLowerCase() === 'oficial');
    const mep = rates.find(r => r.casa.toLowerCase() === 'bolsa');
    const ccl = rates.find(r => r.casa.toLowerCase() === 'contadoconliqui');

    const text = [
      '💵 Cotizaciones Dólar Hoy en Argentina:',
      blue ? `• Blue: Compra $${blue.compra?.toLocaleString('es-AR')} | Venta $${blue.venta?.toLocaleString('es-AR')}` : '',
      oficial ? `• Oficial: Compra $${oficial.compra?.toLocaleString('es-AR')} | Venta $${oficial.venta?.toLocaleString('es-AR')}` : '',
      mep ? `• MEP: $${mep.venta?.toLocaleString('es-AR')}` : '',
      ccl ? `• CCL: $${ccl.venta?.toLocaleString('es-AR')}` : '',
      '',
      '👉 Cotizaciones en vivo: https://adriandepool.github.io/Dolar-Argentina/',
    ]
      .filter(Boolean)
      .join('\n');

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Cotizaciones Dólar Argentina',
          text,
          url: 'https://adriandepool.github.io/Dolar-Argentina/',
        });
        return;
      } catch {
        // Fallback a clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedShare(true);
      onShowToast('¡Resumen copiado al portapapeles listo para enviar por WhatsApp!');
      setTimeout(() => setCopiedShare(false), 2500);
    } catch {
      onShowToast('No se pudo copiar al portapapeles.');
    }
  };

  return (
    <div className="w-full bg-[#0a101d] border-b border-slate-800/80 py-2 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-2 gap-x-4">
        
        {/* Métricas Macroeconómicas */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-medium">
          
          {/* Estado de Mercado */}
          <div className="flex items-center gap-1.5">
            <span className="flex h-2 w-2 relative">
              {indicators?.mercadoAbierto && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  indicators?.mercadoAbierto ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              ></span>
            </span>
            <span className="text-slate-300">
              Mercado {indicators?.mercadoAbierto ? 'Abierto' : 'Cerrado'}
            </span>
            <span className="text-[10px] text-slate-500 hidden sm:inline">(10:30 a 16:30 hs)</span>
          </div>

          <span className="text-slate-700 hidden sm:inline">•</span>

          {/* Riesgo País */}
          {indicators?.riesgoPais && (
            <div className="flex items-center gap-1.5" title={`Riesgo País (EMBI+) al ${indicators.riesgoPaisFecha || 'día'}`}>
              <TrendingDown className="w-3.5 h-3.5 text-cyan-400" />
              <span>Riesgo País:</span>
              <span className="font-mono font-bold text-slate-200">
                {indicators.riesgoPais.toLocaleString('es-AR')} pts
              </span>
            </div>
          )}

          <span className="text-slate-700 hidden sm:inline">•</span>

          {/* Inflación */}
          {indicators?.inflacionMensual !== null && typeof indicators?.inflacionMensual !== 'undefined' && (
            <div className="flex items-center gap-1.5" title={`Inflación mensual INDEC`}>
              <Percent className="w-3 h-3 text-cyan-400" />
              <span>Inflación m/m:</span>
              <span className="font-mono font-bold text-slate-200">
                {indicators.inflacionMensual}%
              </span>
            </div>
          )}

        </div>

        {/* Botón Compartir Resumen */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-slate-700 transition-all active:scale-95"
          title="Compartir cotizaciones por WhatsApp o redes"
        >
          {copiedShare ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-300">¡Copiado!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3 h-3 text-cyan-400" />
              <span>Compartir precios</span>
            </>
          )}
        </button>

      </div>
    </div>
  );
};
