import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { fetchHistoricalData } from '../services/dolarApi';
import { HistoricalDataPoint, TimeRange } from '../types';
import { LineChart, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const HistoricalChart: React.FC = () => {
  const [selectedCurrency, setSelectedCurrency] = useState<'informal' | 'oficial' | 'bolsa'>('informal');
  const [selectedRange, setSelectedRange] = useState<TimeRange>('30D');
  const [dataPoints, setDataPoints] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const points = await fetchHistoricalData(selectedCurrency, selectedRange);
        if (isMounted) {
          setDataPoints(points);
        }
      } catch (err) {
        console.error('Error cargando histórico:', err);
        if (isMounted) setError('No se pudieron cargar los datos históricos en este momento.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [selectedCurrency, selectedRange]);

  // Cálculos estadísticos del período
  const stats = useMemo(() => {
    if (!dataPoints.length) return null;
    const values = dataPoints.map(p => p.venta);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const first = values[0];
    const last = values[values.length - 1];
    const diff = last - first;
    const pct = first > 0 ? (diff / first) * 100 : 0;

    return { min, max, avg, diff, pct, current: last };
  }, [dataPoints]);

  const currencyLabels = {
    informal: 'Dólar Blue',
    oficial: 'Dólar Oficial',
    bolsa: 'Dólar MEP',
  };

  const chartData = {
    labels: dataPoints.map(p => {
      const parts = p.date.split(/[-/]/);
      if (parts.length === 3) {
        return `${parts[0]}/${parts[1]}`;
      }
      return p.date;
    }),
    datasets: [
      {
        label: `Venta ${currencyLabels[selectedCurrency]}`,
        data: dataPoints.map(p => p.venta),
        borderColor: '#22d3ee',
        backgroundColor: (context: { chart: { ctx: CanvasRenderingContext2D } }) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(34, 211, 238, 0.35)');
          gradient.addColorStop(1, 'rgba(34, 211, 238, 0.0)');
          return gradient;
        },
        borderWidth: 2.5,
        fill: true,
        tension: 0.25,
        pointRadius: dataPoints.length > 40 ? 0 : 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#22d3ee',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#94a3b8',
          font: { family: 'JetBrains Mono', size: 11 },
          callback: value => `$${Number(value).toLocaleString('es-AR')}`,
        },
      },
      x: {
        grid: { display: false },
        ticks: {
          color: '#94a3b8',
          font: { size: 10 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#e2e8f0',
        bodyColor: '#38bdf8',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { family: 'JetBrains Mono', size: 13, weight: 'bold' },
        callbacks: {
          label: ctx => `Cotización: $${Number(ctx.parsed.y).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
        },
      },
    },
  };

  return (
    <section className="bg-[#0e1526]/80 backdrop-blur-md rounded-2xl p-5 sm:p-7 border border-slate-800/90 shadow-xl">
      {/* Controles y Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <LineChart className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Evolución Histórica
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Tendencia de precios provista por Ámbito Financiero
          </p>
        </div>

        {/* Selectores */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de divisa */}
          <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            {(['informal', 'oficial', 'bolsa'] as const).map(curr => (
              <button
                key={curr}
                onClick={() => setSelectedCurrency(curr)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedCurrency === curr
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {curr === 'informal' ? 'Blue' : curr === 'oficial' ? 'Oficial' : 'MEP'}
              </button>
            ))}
          </div>

          {/* Selector de rango */}
          <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            {(['30D', '90D', '1Y'] as const).map(range => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedRange === range
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {range === '30D' ? '30 Días' : range === '90D' ? '3 Meses' : '1 Año'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tarjetas de Estadísticas Resumidas */}
      {stats && !loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
            <span className="block text-[11px] text-slate-400">Variación Período</span>
            <div className="flex items-center gap-1 mt-1">
              {stats.pct >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-rose-400" />
              )}
              <span
                className={`font-mono text-sm font-bold ${
                  stats.pct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {stats.pct >= 0 ? '+' : ''}
                {stats.pct.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
            <span className="block text-[11px] text-slate-400">Mínimo Período</span>
            <span className="font-mono text-sm font-bold text-slate-200 mt-1 block">
              ${stats.min.toLocaleString('es-AR')}
            </span>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
            <span className="block text-[11px] text-slate-400">Máximo Período</span>
            <span className="font-mono text-sm font-bold text-slate-200 mt-1 block">
              ${stats.max.toLocaleString('es-AR')}
            </span>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
            <span className="block text-[11px] text-slate-400">Promedio Período</span>
            <span className="font-mono text-sm font-bold text-cyan-300 mt-1 block">
              ${stats.avg.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      )}

      {/* Contenedor del Gráfico */}
      <div className="relative h-[320px] sm:h-[380px] w-full">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-slate-900/30 rounded-xl">
            <Activity className="w-8 h-8 text-cyan-400 animate-pulse" />
            <p className="text-xs text-slate-400">Cargando histórico de cotizaciones...</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center text-center p-4">
            <p className="text-sm text-rose-400 bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/20">
              {error}
            </p>
          </div>
        ) : dataPoints.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
            No hay datos disponibles para este intervalo.
          </div>
        ) : (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>
    </section>
  );
};
