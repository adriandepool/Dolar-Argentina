import React, { useState } from 'react';
import { PriceAlert, DolarRate } from '../types';
import { notificationService } from '../services/notificationService';
import { Bell, X, Plus, Trash2, Volume2, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface AlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: PriceAlert[];
  rates: DolarRate[];
  onAddAlert: (newAlert: Omit<PriceAlert, 'id' | 'createdAt'>) => void;
  onDeleteAlert: (id: string) => void;
  onToggleAlert: (id: string) => void;
  initialCasa?: string;
  initialPrice?: number;
}

export const AlertsModal: React.FC<AlertsModalProps> = ({
  isOpen,
  onClose,
  alerts,
  rates,
  onAddAlert,
  onDeleteAlert,
  onToggleAlert,
  initialCasa,
  initialPrice,
}) => {
  const [casa, setCasa] = useState<string>(initialCasa || 'blue');
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [targetPrice, setTargetPrice] = useState<number>(
    initialPrice ? Math.round(initialPrice) : 1400
  );
  const [hasPermission, setHasPermission] = useState<boolean>(notificationService.hasPermission());
  const [tested, setTested] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const granted = await notificationService.requestPermission();
    setHasPermission(granted);
    if (granted) {
      notificationService.send('¡Notificaciones activadas!', 'Recibirás avisos cuando el dólar alcance tus objetivos.');
    }
  };

  const handleTestChime = () => {
    notificationService.playChime('alert');
    setTested(true);
    setTimeout(() => setTested(false), 2000);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPrice || targetPrice <= 0) return;

    const rate = rates.find(r => r.casa.toLowerCase() === casa.toLowerCase());
    const nombre = rate ? rate.nombre : casa;

    onAddAlert({
      casa,
      nombre,
      condition,
      targetPrice,
      active: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0e1526] border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Alertas de Cotización</h2>
              <p className="text-xs text-slate-400">Avisos sonoros y en escritorio al cruzar umbrales</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Estado de Permisos y Prueba de Audio */}
        <div className="my-5 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {hasPermission ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span className="text-slate-300">
              {hasPermission ? 'Notificaciones activas en tu navegador' : 'Permiso de notificaciones pendiente'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!hasPermission && (
              <button
                onClick={handleRequestPermission}
                className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg transition-colors shadow-sm"
              >
                Permitir
              </button>
            )}
            <button
              onClick={handleTestChime}
              title="Probar sonido de campana"
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{tested ? '¡Sonando!' : 'Probar sonido'}</span>
            </button>
          </div>
        </div>

        {/* Formulario Nueva Alerta */}
        <form onSubmit={handleCreate} className="space-y-4 mb-6">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Configurar nueva alerta</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Tipo de dólar */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Dólar</label>
              <select
                value={casa}
                onChange={e => setCasa(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
              >
                {rates.map(r => (
                  <option key={r.casa} value={r.casa}>
                    {r.nombre} (${r.venta})
                  </option>
                ))}
              </select>
            </div>

            {/* Condición */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Condición</label>
              <select
                value={condition}
                onChange={e => setCondition(e.target.value as 'ABOVE' | 'BELOW')}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="ABOVE">Sube de (≥)</option>
                <option value="BELOW">Baja de (≤)</option>
              </select>
            </div>

            {/* Valor objetivo */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Precio Objetivo ($)</label>
              <input
                type="number"
                min="1"
                step="1"
                value={targetPrice || ''}
                onChange={e => setTargetPrice(parseFloat(e.target.value) || 0)}
                placeholder="1450"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Agregar Alerta
          </button>
        </form>

        {/* Lista de Alertas Activas */}
        <div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Tus alertas guardadas ({alerts.length})
          </h3>

          {alerts.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
              No tienes alertas activas. Configura una arriba para recibir avisos sonoros cuando el precio cambie.
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map(a => {
                const currentRate = rates.find(r => r.casa.toLowerCase() === a.casa.toLowerCase());
                const currentVal = currentRate ? currentRate.venta : null;

                return (
                  <div
                    key={a.id}
                    className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => onToggleAlert(a.id)}
                        title={a.active ? 'Desactivar alerta' : 'Activar alerta'}
                        className={`p-1 rounded-md transition-colors ${
                          a.active ? 'text-cyan-400 hover:text-cyan-300' : 'text-slate-600 hover:text-slate-400'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>

                      <div>
                        <div className="font-semibold text-slate-200">
                          Dólar {a.nombre}:{' '}
                          <span className={a.condition === 'ABOVE' ? 'text-emerald-400' : 'text-rose-400'}>
                            {a.condition === 'ABOVE' ? '≥' : '≤'} ${a.targetPrice.toLocaleString('es-AR')}
                          </span>
                        </div>
                        {currentVal && (
                          <div className="text-[11px] text-slate-400">
                            Precio actual: <span className="font-mono text-slate-300">${currentVal.toLocaleString('es-AR')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteAlert(a.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Eliminar alerta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Nota explicativa de rate limits */}
        <p className="text-[11px] text-slate-500 mt-5 text-center leading-relaxed">
          💡 La verificación se realiza automáticamente en tu navegador cada 2 minutos. No satura la API y conserva la batería.
        </p>

      </div>
    </div>
  );
};
