import React, { useState } from 'react';
import { DolarRate } from '../types';
import { ArrowRightLeft, DollarSign, Calculator } from 'lucide-react';

interface ConverterProps {
  rates: DolarRate[];
  selectedCasa?: string;
}

export const Converter: React.FC<ConverterProps> = ({ rates, selectedCasa = 'blue' }) => {
  const [amount, setAmount] = useState<number>(100);
  const [mode, setMode] = useState<'USD_TO_ARS' | 'ARS_TO_USD'>('USD_TO_ARS');
  const [activeCasa, setActiveCasa] = useState<string>(selectedCasa);

  const selectedRate = rates.find(r => r.casa.toLowerCase() === activeCasa.toLowerCase()) || rates[0];

  const calculateConversion = (rate: DolarRate, fromMode: 'USD_TO_ARS' | 'ARS_TO_USD', val: number) => {
    if (!val || val <= 0) return 0;
    // Para cambiar USD a ARS se toma la cotización de Compra (lo que te pagan por tus dólares) o Venta según la operación
    // Por convención retail: si vendes USD recibes Compra; si compras USD pagas Venta.
    if (fromMode === 'USD_TO_ARS') {
      const price = rate.compra || rate.venta;
      return val * price;
    } else {
      const price = rate.venta;
      return val / price;
    }
  };

  const handleToggleMode = () => {
    setMode(prev => (prev === 'USD_TO_ARS' ? 'ARS_TO_USD' : 'USD_TO_ARS'));
  };

  const quickAmounts = mode === 'USD_TO_ARS' ? [50, 100, 500, 1000] : [100000, 500000, 1000000];

  const convertedResult = selectedRate ? calculateConversion(selectedRate, mode, amount) : 0;

  return (
    <section id="converter-section" className="bg-[#0e1526]/80 backdrop-blur-md rounded-2xl p-5 sm:p-7 border border-slate-800/90 shadow-xl">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="w-5 h-5 text-cyan-400" />
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Calculadora de Conversión
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Calcula equivalencias instantáneas en pesos o dólares
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulario Principal */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Selector de tipo de cambio */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Tipo de cambio de referencia
            </label>
            <div className="flex flex-wrap gap-1.5">
              {rates.map(r => (
                <button
                  key={r.casa}
                  onClick={() => setActiveCasa(r.casa)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeCasa.toLowerCase() === r.casa.toLowerCase()
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {r.nombre}
                </button>
              ))}
            </div>
          </div>

          {/* Campo de Entrada & Inversión */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {mode === 'USD_TO_ARS' ? 'Monto en Dólares (USD)' : 'Monto en Pesos (ARS)'}
              </label>
              <button
                onClick={handleToggleMode}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition-colors"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" /> Invertir cálculo
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold font-mono">
                {mode === 'USD_TO_ARS' ? 'US$' : '$'}
              </span>
              <input
                type="number"
                min="0"
                value={amount || ''}
                onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="Ingresa un monto..."
                className="w-full pl-12 pr-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-lg font-mono font-bold text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
            </div>

            {/* Accesos rápidos */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-500 mr-1">Rápido:</span>
              {quickAmounts.map(q => (
                <button
                  key={q}
                  onClick={() => setAmount(q)}
                  className="px-2 py-0.5 rounded text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors font-mono"
                >
                  {mode === 'USD_TO_ARS' ? `$${q}` : `$${q.toLocaleString('es-AR')}`}
                </button>
              ))}
            </div>
          </div>

          {/* Tarjeta de Resultado Destacado */}
          <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-slate-900 border border-cyan-500/30">
            <span className="text-xs font-semibold text-cyan-400 block mb-1">
              Total estimado ({selectedRate?.nombre}):
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
              {mode === 'USD_TO_ARS'
                ? convertedResult.toLocaleString('es-AR', {
                    style: 'currency',
                    currency: 'ARS',
                    maximumFractionDigits: 0,
                  })
                : convertedResult.toLocaleString('es-AR', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Cotización usada:{' '}
              <span className="text-slate-300 font-mono">
                ${(mode === 'USD_TO_ARS' ? selectedRate?.compra || selectedRate?.venta : selectedRate?.venta)?.toLocaleString('es-AR')}
              </span>
            </p>
          </div>

        </div>

        {/* Comparador Simultáneo con Todos los Dólares */}
        <div className="lg:col-span-5 bg-slate-900/60 rounded-xl p-4 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-cyan-400" /> Comparativa entre tipos de cambio
            </h3>
            <div className="space-y-2.5">
              {rates.map(r => {
                const converted = calculateConversion(r, mode, amount);
                return (
                  <div
                    key={r.casa}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60 last:border-0"
                  >
                    <span className="text-slate-400 font-medium">Dólar {r.nombre}</span>
                    <span className="font-mono font-bold text-slate-200">
                      {mode === 'USD_TO_ARS'
                        ? converted.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
                        : converted.toLocaleString('es-AR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-4 text-center">
            Valores orientativos calculados según cotización de mercado actual.
          </p>
        </div>
      </div>
    </section>
  );
};
