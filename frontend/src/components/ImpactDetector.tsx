import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';

// ====== TUNED CONSTANTS (LOWER FOR TESTING) ======
const IMPACT_THRESHOLD = 12;          // 12 m/s² ≈ 1.2g (was 20)
const FREE_FALL_THRESHOLD = 2;        // Near 0g (was 3)
const COOLDOWN_MS = 3000;             // 3 seconds between triggers

const ImpactDetector = ({ patientName, patientPhone, userId }: any) => {
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

      // ===== DEBUG (IMPORTANT) =====
      console.log(`[Motion] magnitude: ${magnitude.toFixed(2)} m/s², freeFall: ${freeFallDetected.current}`);

      // ===== STEP 1: FREE FALL DETECTION =====
      if (magnitude < FREE_FALL_THRESHOLD) {
        if (!freeFallDetected.current) {
          freeFallDetected.current = true;
          console.log("🔽 Free fall started");
        }
        return;
      }

      // ===== STEP 2: IMPACT DETECTION =====
      if (magnitude > IMPACT_THRESHOLD) {
        console.log(`💥 Impact detected: ${magnitude.toFixed(2)} m/s²`);

        // Trigger if we saw a free fall recently (within 1 second)
        const freeFallRecently = freeFallDetected.current;

        // Reset free fall flag
        freeFallDetected.current = false;

        if (freeFallRecently) {
          console.log("✅ Free fall → impact pattern confirmed");
          lastTriggerTime.current = now;
          triggerAlert();
        } else {
          console.log("⚠️ Impact without prior free fall – ignoring (false positive)");
          // Optional: For testing, you can still trigger after 2 such impacts
          // Or just ignore to avoid false alarms
        }
      } else {
        // No impact, reset free fall after a short grace period?
        // But if we stay above threshold but not impact, reset free fall after 200ms
        // This is handled by the fact that free fall flag will be cleared only on impact or timeout.
      }
    };

    // Optional: reset free fall flag if no motion for 1 second (prevents stale flag)
    const interval = setInterval(() => {
      if (Date.now() - lastMotionTime.current > 1000) {
        if (freeFallDetected.current) {
          console.log("⏱️ Free fall flag reset due to inactivity");
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