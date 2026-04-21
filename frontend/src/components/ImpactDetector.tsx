import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';

// ====== TUNED CONSTANTS ======
const IMPACT_THRESHOLD = 20;     // Impact spike
const FREE_FALL_THRESHOLD = 3;   // Near 0g
const COOLDOWN_MS = 3000;

const ImpactDetector = ({ patientName, patientPhone, userId }: any) => {
  const [sensorsEnabled, setSensorsEnabled] = useState(false);
  const [showEnableBtn, setShowEnableBtn] = useState(false);

  const lastTriggerTime = useRef(0);
  const freeFallDetected = useRef(false);

  // ============================
  // 1. FORCE SENSOR AVAILABILITY CHECK
  // ============================
  useEffect(() => {
    if (!window) return;

    // DO NOT block based on this check (your previous mistake)
    if (typeof DeviceMotionEvent === "undefined") {
      toast.error("DeviceMotion not available on this device");
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
      toast.success("Sensors activated");

    } catch (e) {
      toast.error("Sensor activation failed");
    }
  };

  // ============================
  // 3. CORE DETECTION LOGIC (CORRECTED)
  // ============================
  useEffect(() => {
    if (!sensorsEnabled) return;

    const handleMotion = (e: DeviceMotionEvent) => {
      const now = Date.now();

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

      // ===== DEBUG (IMPORTANT) =====
      console.log("Acceleration:", magnitude);

      // ===== STEP 1: FREE FALL DETECTION =====
      if (magnitude < FREE_FALL_THRESHOLD) {
        freeFallDetected.current = true;
        console.log("Free fall detected");
        return;
      }

      // ===== STEP 2: IMPACT AFTER FREE FALL =====
      if (freeFallDetected.current && magnitude > IMPACT_THRESHOLD) {
        console.log("Impact detected");

        freeFallDetected.current = false;
        lastTriggerTime.current = now;

        triggerAlert();
      }
    };

    window.addEventListener("devicemotion", handleMotion);

    return () => {
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, [sensorsEnabled]);

  // ============================
  // 4. ALERT TRIGGER
  // ============================
  const triggerAlert = useCallback(async () => {
    toast.error("Impact Detected!");

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

      toast.success("Emergency alert sent");

    } catch {
      toast.error("Failed to send alert");
    }

  }, [patientName, patientPhone, userId]);

  // ============================
  // UI
  // ============================
  return (
    <div style={{ position: "fixed", bottom: 20, left: 20, zIndex: 9999 }}>
      {showEnableBtn && (
        <button onClick={enableSensors}>
          Enable Fall Detection
        </button>
      )}

      {sensorsEnabled && (
        <div>Monitoring Active</div>
      )}

      <button onClick={triggerAlert}>
        🚨 SOS
      </button>
    </div>
  );
};

export default ImpactDetector;