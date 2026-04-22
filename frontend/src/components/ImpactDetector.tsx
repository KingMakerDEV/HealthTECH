import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';

// ====== TUNED CONSTANTS (LOWER FOR TESTING) ======
const IMPACT_THRESHOLD = 12;          // 12 m/s² ≈ 1.2g (was 20)
const FREE_FALL_THRESHOLD = 2;        // Near 0g (was 3)
const COOLDOWN_MS = 3000;             // 3 seconds between triggers

const ImpactDetector = ({ patientName, patientPhone, userId }: any) => {
  const { t } = useTranslation();
  const [sensorsEnabled, setSensorsEnabled] = useState(false);
  const [showEnableBtn, setShowEnableBtn] = useState(false);

  const lastTriggerTime = useRef(0);
  const freeFallDetected = useRef(false);
  const lastMotionTime = useRef(Date.now());

  // ============================
  // 1. FORCE SENSOR AVAILABILITY CHECK
  // ============================
  useEffect(() => {
    if (!window) return;

    if (typeof DeviceMotionEvent === "undefined") {
      return;
    }

    // Always show enable button first
    setShowEnableBtn(true);
  }, []);

  // ============================
  // 2. ENABLE SENSORS (USER GESTURE REQUIRED)
  // ============================
  const enableSensors = async () => {
    try {
      // iOS requires permission
      if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
        const res = await (DeviceMotionEvent as any).requestPermission();
        if (res !== "granted") {
          toast.error("Motion permission denied");
          return;
        }
      }

      setSensorsEnabled(true);
      setShowEnableBtn(false);
      toast.success(t('common.success'));

    } catch (e) {
      toast.error(t('common.error'));
    }
  };

  // ============================
  // 3. CORE DETECTION LOGIC (IMPROVED)
  // ============================
  useEffect(() => {
    if (!sensorsEnabled) return;

    const handleMotion = (e: DeviceMotionEvent) => {
      const now = Date.now();
      lastMotionTime.current = now;

      // Debounce
      if (now - lastTriggerTime.current < COOLDOWN_MS) return;

      // Prefer acceleration WITHOUT gravity
      let acc = e.acceleration;

      // fallback
      if (!acc || acc.x === null) {
        acc = e.accelerationIncludingGravity;
      }

      if (!acc) return;

      const x = acc.x ?? 0;
      const y = acc.y ?? 0;
      const z = acc.z ?? 0;

      const magnitude = Math.sqrt(x * x + y * y + z * z);

      // ===== STEP 1: FREE FALL DETECTION =====
      if (magnitude < FREE_FALL_THRESHOLD) {
        if (!freeFallDetected.current) {
          freeFallDetected.current = true;
        }
        return;
      }

      // ===== STEP 2: IMPACT DETECTION =====
      if (magnitude > IMPACT_THRESHOLD) {
        // Trigger if we saw a free fall recently (within 1 second)
        const freeFallRecently = freeFallDetected.current;

        // Reset free fall flag
        freeFallDetected.current = false;

        if (freeFallRecently) {
          lastTriggerTime.current = now;
          triggerAlert();
        }
      }
    };

    const interval = setInterval(() => {
      if (Date.now() - lastMotionTime.current > 1000) {
        if (freeFallDetected.current) {
          freeFallDetected.current = false;
        }
      }
    }, 500);

    window.addEventListener("devicemotion", handleMotion);

    return () => {
      window.removeEventListener("devicemotion", handleMotion);
      clearInterval(interval);
    };
  }, [sensorsEnabled]);

  // ============================
  // 4. ALERT TRIGGER
  // ============================
  const triggerAlert = useCallback(async () => {
    toast.error(t('emergency.emergencyAlert'));

    let lat = null;
    let lng = null;

    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej)
      );

      lat = pos.coords.latitude;
      lng = pos.coords.longitude;

    } catch {
      console.log("No GPS");
    }

    try {
      await api.post("/emergency/impact", {
        latitude: lat,
        longitude: lng,
        reported_by_name: patientName,
        reported_by_phone: patientPhone,
        reported_by_user_id: userId,
      });

      toast.success(t('common.success'));

    } catch {
      toast.error(t('common.error'));
    }

  }, [patientName, patientPhone, userId, t]);

  // ============================
  // UI
  // ============================
  return (
    <div className="fixed bottom-24 left-4 z-40 flex flex-col gap-2">
      {showEnableBtn && (
        <button 
          onClick={enableSensors}
          className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg hover:bg-orange-600 transition-colors"
        >
          {t('emergency.enableProtection')}
        </button>
      )}

      {sensorsEnabled && (
        <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm border border-emerald-500/20">
          {t('emergency.shieldActive')}
        </div>
      )}

      <button 
        onClick={triggerAlert}
        className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all"
      >
        <span className="font-bold text-xs">{t('emergency.sos')}</span>
      </button>
    </div>
  );
};

export default ImpactDetector;