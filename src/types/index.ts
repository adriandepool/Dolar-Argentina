export interface DolarRate {
  moneda: string;
  casa: string;
  nombre: string;
  compra: number | null;
  venta: number;
  fechaActualizacion: string;
  // Campos calculados
  variacion24h?: number;
  brechaConOficial?: number;
}

export type DolarCasa = 'oficial' | 'blue' | 'bolsa' | 'contadoconliqui' | 'mayorista' | 'cripto' | 'tarjeta';

export interface PriceAlert {
  id: string;
  casa: string;
  nombre: string;
  condition: 'ABOVE' | 'BELOW'; // 'ABOVE' = sube de, 'BELOW' = baja de
  targetPrice: number;
  createdAt: string;
  lastTriggeredAt?: string;
  active: boolean;
}

export interface HistoricalDataPoint {
  date: string;
  compra: number;
  venta: number;
}

export type TimeRange = '30D' | '90D' | '1Y';
