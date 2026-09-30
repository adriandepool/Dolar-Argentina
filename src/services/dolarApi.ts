import { DolarRate, HistoricalDataPoint, PriceAlert, TimeRange } from '../types';
import { notificationService } from './notificationService';

const DOLAR_API_URL = 'https://dolarapi.com/v1/dolares';
const CACHE_KEY_RATES = 'dolar_argentina_rates_cache_v1';
const CACHE_KEY_HISTORICAL = 'dolar_argentina_hist_cache_v1';
const RATES_CACHE_TTL = 90 * 1000; // 90 segundos
const HISTORICAL_CACHE_TTL = 60 * 60 * 1000; // 1 hora

const formatDateForApi = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export const fetchDolarRates = async (forceRefresh = false): Promise<{ rates: DolarRate[]; isCached: boolean }> => {
  // Verificar caché
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(CACHE_KEY_RATES);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < RATES_CACHE_TTL) {
          return { rates: data, isCached: true };
        }
      }
    } catch (e) {
      console.warn('Error leyendo caché de cotizaciones:', e);
    }
  }

  // Llamada a la API
  const response = await fetch(DOLAR_API_URL);
  if (!response.ok) {
    throw new Error(`Error en API (${response.status}): No se pudo obtener cotizaciones.`);
  }

  const rawData: DolarRate[] = await response.json();

  // Filtrar tipos de cambio no comunes si se desea o mantenerlos todos
  // Obtenemos el oficial para calcular la brecha
  const oficial = rawData.find(d => d.casa.toLowerCase() === 'oficial');
  const oficialVenta = oficial ? oficial.venta : 0;

  const processedRates: DolarRate[] = rawData.map(rate => {
    let brecha = 0;
    if (oficialVenta > 0 && rate.casa.toLowerCase() !== 'oficial') {
      brecha = ((rate.venta - oficialVenta) / oficialVenta) * 100;
    }
    return {
      ...rate,
      brechaConOficial: Number(brecha.toFixed(1)),
    };
  });

  // Guardar en caché
  try {
    localStorage.setItem(
      CACHE_KEY_RATES,
      JSON.stringify({
        timestamp: Date.now(),
        data: processedRates,
      })
    );
  } catch (e) {
    console.warn('No se pudo guardar en caché:', e);
  }

  return { rates: processedRates, isCached: false };
};

export const fetchHistoricalData = async (
  casa: string = 'informal',
  range: TimeRange = '30D'
): Promise<HistoricalDataPoint[]> => {
  const cacheKey = `${CACHE_KEY_HISTORICAL}_${casa}_${range}`;

  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { timestamp, data } = JSON.parse(cached);
      if (Date.now() - timestamp < HISTORICAL_CACHE_TTL) {
        return data;
      }
    }
  } catch (e) {
    console.warn('Error leyendo histórico de caché:', e);
  }

  const endDate = new Date();
  const startDate = new Date();

  if (range === '30D') {
    startDate.setDate(endDate.getDate() - 30);
  } else if (range === '90D') {
    startDate.setDate(endDate.getDate() - 90);
  } else {
    // 1Y
    startDate.setFullYear(endDate.getFullYear() - 1);
  }

  // Ámbito soporta: informal, oficial, mep, cll
  let ambitoSlug = 'informal';
  if (casa === 'oficial') ambitoSlug = 'oficial';
  else if (casa === 'bolsa') ambitoSlug = 'mep';
  else if (casa === 'contadoconliqui') ambitoSlug = 'cll';

  const apiUrl = `https://mercados.ambito.com/dolar/${ambitoSlug}/historico-general/${formatDateForApi(startDate)}/${formatDateForApi(endDate)}`;

  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error('Error al conectar con el histórico de Ámbito.');
  }

  const raw = await response.json();
  if (!Array.isArray(raw) || raw.length <= 1) {
    return [];
  }

  // Omitir cabecera ["Fecha", "Compra", "Venta"]
  const rows = raw.slice(1);
  const points: HistoricalDataPoint[] = [];

  for (const item of rows) {
    if (Array.isArray(item) && item.length >= 3) {
      const dateStr = item[0];
      const compraStr = item[1];
      const ventaStr = item[2];

      const compra = typeof compraStr === 'string' ? parseFloat(compraStr.replace(',', '.')) : 0;
      const venta = typeof ventaStr === 'string' ? parseFloat(ventaStr.replace(',', '.')) : 0;

      if (!isNaN(venta) && venta > 0) {
        points.push({
          date: dateStr,
          compra: isNaN(compra) ? venta : compra,
          venta,
        });
      }
    }
  }

  // Orden cronológico (más antiguo al más reciente)
  points.reverse();

  try {
    localStorage.setItem(
      cacheKey,
      JSON.stringify({
        timestamp: Date.now(),
        data: points,
      })
    );
  } catch (e) {
    console.warn('Error guardando histórico en caché:', e);
  }

  return points;
};

// Evaluación de alertas en memoria del navegador
export const evaluateAlerts = (
  alerts: PriceAlert[],
  rates: DolarRate[],
  onTriggered: (alert: PriceAlert, currentPrice: number) => void
): PriceAlert[] => {
  let updated = false;

  const newAlerts = alerts.map(alert => {
    if (!alert.active) return alert;

    const rate = rates.find(r => r.casa.toLowerCase() === alert.casa.toLowerCase());
    if (!rate) return alert;

    const currentPrice = rate.venta;
    let shouldTrigger = false;

    if (alert.condition === 'ABOVE' && currentPrice >= alert.targetPrice) {
      shouldTrigger = true;
    } else if (alert.condition === 'BELOW' && currentPrice <= alert.targetPrice) {
      shouldTrigger = true;
    }

    if (shouldTrigger) {
      // Evitar notificar repetidamente en el mismo minuto
      const now = Date.now();
      const lastTrigger = alert.lastTriggeredAt ? new Date(alert.lastTriggeredAt).getTime() : 0;
      const cooldown = 30 * 60 * 1000; // 30 minutos de cooldown entre alertas repetidas del mismo umbral

      if (now - lastTrigger > cooldown) {
        updated = true;
        const conditionText = alert.condition === 'ABOVE' ? 'superó los' : 'bajó de';
        notificationService.send(
          `🔔 ¡Alerta de Cotización: ${alert.nombre}!`,
          `El ${alert.nombre} ${conditionText} $${alert.targetPrice.toLocaleString('es-AR')}. Valor actual: $${currentPrice.toLocaleString('es-AR')}.`
        );
        onTriggered(alert, currentPrice);

        return {
          ...alert,
          lastTriggeredAt: new Date().toISOString(),
        };
      }
    }

    return alert;
  });

  return newAlerts;
};
