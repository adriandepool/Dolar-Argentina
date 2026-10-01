export interface MarketIndicators {
  riesgoPais: number | null;
  riesgoPaisFecha: string | null;
  inflacionMensual: number | null;
  inflacionFecha: string | null;
  mercadoAbierto: boolean;
}

const CACHE_KEY = 'dolar_market_indicators_v1';
const TTL = 30 * 60 * 1000; // 30 minutos

export const isMarketOpen = (): boolean => {
  // Horario financiero en Argentina: Lunes a Viernes de 10:30 a 16:30 (UTC-3)
  const now = new Date();
  // Obtener hora en Argentina (UTC-3)
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const arTime = new Date(utc - 3 * 3600000);
  const day = arTime.getDay(); // 0 = Domingo, 6 = Sábado
  const hours = arTime.getHours();
  const minutes = arTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // Lunes (1) a Viernes (5) entre 10:30 (630 min) y 16:30 (990 min)
  const isWeekday = day >= 1 && day <= 5;
  const isBusinessHours = timeInMinutes >= 630 && timeInMinutes <= 990;

  return isWeekday && isBusinessHours;
};

export const fetchMarketIndicators = async (): Promise<MarketIndicators> => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { timestamp, data } = JSON.parse(cached);
      if (Date.now() - timestamp < TTL) {
        return {
          ...data,
          mercadoAbierto: isMarketOpen(),
        };
      }
    }
  } catch (e) {
    console.warn('Error leyendo indicadores en caché:', e);
  }

  let riesgoPais: number | null = null;
  let riesgoPaisFecha: string | null = null;
  let inflacionMensual: number | null = null;
  let inflacionFecha: string | null = null;

  // 1. Obtener Riesgo País
  try {
    const resRiesgo = await fetch('https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais/ultimo');
    if (resRiesgo.ok) {
      const data = await resRiesgo.json();
      riesgoPais = data.valor || null;
      riesgoPaisFecha = data.fecha || null;
    }
  } catch (err) {
    console.warn('No se pudo obtener Riesgo País:', err);
  }

  // 2. Obtener Inflación
  try {
    const resInflacion = await fetch('https://api.argentinadatos.com/v1/finanzas/indices/inflacion');
    if (resInflacion.ok) {
      const data = await resInflacion.json();
      if (Array.isArray(data) && data.length > 0) {
        const ultimo = data[data.length - 1];
        inflacionMensual = ultimo.valor;
        inflacionFecha = ultimo.fecha;
      }
    }
  } catch (err) {
    console.warn('No se pudo obtener Inflación:', err);
  }

  const result: MarketIndicators = {
    riesgoPais,
    riesgoPaisFecha,
    inflacionMensual,
    inflacionFecha,
    mercadoAbierto: isMarketOpen(),
  };

  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        data: result,
      })
    );
  } catch (e) {
    console.warn('Error guardando indicadores en caché:', e);
  }

  return result;
};
