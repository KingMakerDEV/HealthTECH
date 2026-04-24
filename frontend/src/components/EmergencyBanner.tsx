import { useState, useEffect } from 'react';
import { AlertTriangle, Phone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Alert {
  id: string;
  patient: string;
  patient_id: string;
  message: string;
  time: string;
}

interface Props {
  alerts: Alert[];
  onDismiss: (id: string) => void;
  onDispatch: (id: string) => void;
}

const EmergencyBanner = ({ alerts, onDismiss, onDispatch }: Props) => {
  const [dispatching, setDispatching] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!dispatching) return;
    if (countdown <= 0) {
      onDispatch(dispatching);
      toast.success('Emergency dispatch confirmed');
      setDispatching(null);
      setCountdown(3);
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [dispatching, countdown, onDispatch]);

  if (alerts.length === 0) return null;

  return (
    <AnimatePresence>
      {alerts.map((alert) => (
        <motion.div
          key={alert.id}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-destructive/10 border-b-2 border-destructive"
        >
          <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <AlertTriangle size={20} className="text-destructive shrink-0" />
              <div>
                <p className="text-sm font-semibold text-destructive">{alert.patient} ({alert.patient_id})</p>
                <p className="text-xs text-destructive/80">{alert.message} · {alert.time}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {dispatching === alert.id ? (
                <button className="px-4 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium">
                  Dispatching in {countdown}s...
                </button>
              ) : (
                <button
                  onClick={() => { setDispatching(alert.id); setCountdown(3); }}
                  className="px-4 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 flex items-center gap-1.5"
                >
                  <Phone size={14} /> Dispatch
                </button>
              )}
              <button onClick={() => onDismiss(alert.id)} className="px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive text-sm hover:bg-destructive/10">
                <X size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

export default EmergencyBanner;
