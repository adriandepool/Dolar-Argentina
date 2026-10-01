import React, { useState } from 'react';
import { DolarRate } from '../types';
import { ArrowRightLeft, DollarSign, Calculator, ShoppingCart, Banknote } from 'lucide-react';

interface ConverterProps {
  rates: DolarRate[];
  selectedCasa?: string;
}

export const Converter: React.FC<ConverterProps> = ({ rates, selectedCasa = 'blue' }) => {
  const [operation, setOperation] = useState<'BUY' | 'SELL'>('BUY'); // BUY = Quiero Comprar USD, SELL = Quiero Vender USD
  const [inputCurrency, setInputCurrency] = useState<'USD' | 'ARS'>('USD');
  const [amount, setAmount] = useState<number>(100);
  const [activeCasa, setActiveCasa] = useState<string>(selectedCasa);

  const selectedRate = rates.find(r => r.casa.toLowerCase() === activeCasa.toLowerCase()) || rates[0];

  // Regla financiera:
  // - Si quiero COMPRAR USD: el mercado me cobra el precio de VENTA (rate.venta).
  // - Si quiero VENDER USD: el mercado me paga el precio de COMPRA (rate.compra || rate.venta).
  const getEffectiveRate = (rate: DolarRate, op: 'BUY' | 'SELL') => {
    if (op === 'BUY') {
      return rate.venta;
    } else {
      return rate.compra || rate.venta;
    }
  };

  const calculateResult = (rate: DolarRate, op: 'BUY' | 'SELL', inCurrency: 'USD' | 'ARS', val: number) => {
    if (!val || val <= 0) return 0;
    const price = getEffectiveRate(rate, op);
    if (price <= 0) return 0;

    if (inCurrency === 'USD') {
      // Ingresó USD -> calcular ARS
      return val * price;
    } else {
      // Ingresó ARS -> calcular USD
      return val / price;
    }
  };

  const handleToggleInputCurrency = () => {
    setInputCurrency(prev => (prev === 'USD' ? 'ARS' : 'USD'));
  };

  const quickAmounts = inputCurrency === 'USD' ? [50, 100, 500, 1000] : [100000, 500000, 1000000];

  const currentEffectiveRate = selectedRate ? getEffectiveRate(selectedRate, operation) : 0;
  const convertedResult = selectedRate ? calculateResult(selectedRate, operation, inputCurrency, amount) : 0;

  return (
    <section id="converter-section" className="bg-[#0e1526]/80 backdrop-blur-md rounded-2xl p-5 sm:p-7 border border-slate-800/90 shadow-xl">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="w-5 h-5 text-cyan-400" />
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Calculadora de Conversión
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Calcula exactamente cuánto pagas al comprar o cuánto recibes al vender
          </p>
        </div>
      </div>

      {/* Selector de Operación: Comprar vs Vender */}
      <div className="grid grid-cols-2 gap-3 mb-6 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl">
        <button
          onClick={() => setOperation('BUY')}
          className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            operation === 'BUY'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-400/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Quiero Comprar USD</span>
        </button>

        <button
          onClick={() => setOperation('SELL')}
          className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            operation === 'SELL'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-400/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Banknote className="w-4 h-4" />
          <span>Quiero Vender USD</span>
        </button>
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

          {/* Campo de Entrada & Inversión de Moneda */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {inputCurrency === 'USD' ? 'Monto en Dólares (USD)' : 'Monto en Pesos (ARS)'}
              </label>
              <button
                onClick={handleToggleInputCurrency}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition-colors"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" /> Cambiar a {inputCurrency === 'USD' ? 'ARS' : 'USD'}
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold font-mono">
                {inputCurrency === 'USD' ? 'US$' : '$'}
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
                  {inputCurrency === 'USD' ? `$${q}` : `$${q.toLocaleString('es-AR')}`}
                </button>
              ))}
            </div>
          </div>

          {/* Tarjeta de Resultado Destacado */}
          <div className={`p-4 sm:p-5 rounded-xl border ${
            operation === 'BUY'
              ? 'bg-gradient-to-r from-emerald-950/40 via-teal-950/20 to-slate-900 border-emerald-500/30'
              : 'bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-slate-900 border-cyan-500/30'
          }`}>
            <span className="text-xs font-semibold text-slate-300 block mb-1">
              {operation === 'BUY'
                ? inputCurrency === 'USD'
                  ? `Para comprar ${amount} USD necesitas pagar:`
                  : `Con ${amount.toLocaleString('es-AR')} ARS compras:`
                : inputCurrency === 'USD'
                  ? `Al vender ${amount} USD recibes:`
                  : `Para recibir ${amount.toLocaleString('es-AR')} ARS necesitas vender:`}
            </span>

            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
              {inputCurrency === 'USD'
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

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 mt-2">
              <span>
                Operación:{' '}
                <strong className={operation === 'BUY' ? 'text-emerald-400' : 'text-cyan-400'}>
                  {operation === 'BUY' ? 'Compra de USD (Pagas Venta)' : 'Venta de USD (Te pagan Compra)'}
                </strong>
              </span>
              <span>
                Cotización aplicada ({selectedRate?.nombre}):{' '}
                <strong className="text-slate-200 font-mono">
                  ${currentEffectiveRate?.toLocaleString('es-AR')}
                </strong>
              </span>
            </div>
          </div>

        </div>

        {/* Comparador Simultáneo con Todos los Dólares */}
        <div className="lg:col-span-5 bg-slate-900/60 rounded-xl p-4 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-cyan-400" /> Comparativa de mercados
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                operation === 'BUY'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
              }`}>
                {operation === 'BUY' ? 'Precios Venta' : 'Precios Compra'}
              </span>
            </div>

            <div className="space-y-2.5">
              {rates.map(r => {
                const converted = calculateResult(r, operation, inputCurrency, amount);
                const rateUsed = getEffectiveRate(r, operation);
                return (
                  <div
                    key={r.casa}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60 last:border-0"
                  >
                    <div>
                      <span className="text-slate-300 font-medium block">Dólar {r.nombre}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ${rateUsed.toLocaleString('es-AR')}
                      </span>
                    </div>

                    <span className="font-mono font-bold text-slate-200 text-sm">
                      {inputCurrency === 'USD'
                        ? converted.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
                        : converted.toLocaleString('es-AR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-4 text-center">
            {operation === 'BUY'
              ? 'Calculado con la cotización de Venta (lo que te cobran por comprar dólares).'
              : 'Calculado con la cotización de Compra (lo que te pagan por tus dólares).'}
          </p>
        </div>
      </div>
    </section>
  );
};
