'use client';

import { useRouter } from "next/navigation";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import logo from '../../../public/images/logo.png';
import styles from "./welcome.module.scss";
import Link from 'next/link';

export default function Welcome() {
  const router = useRouter();
  const [eventCode, setEventCode] = useState("");

  // Canvas fingerprint
  const getCanvasFingerprint = async (): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Liquidity Bars Fingerprint', 2, 2);
    return canvas.toDataURL();
  };

  // SHA-256 helper
  const sha256 = async (str: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  // Stable device ID from multiple signals
  const generateStableDeviceId = async (): Promise<string> => {
    const canvas = await getCanvasFingerprint();
    const hardware = `${navigator.hardwareConcurrency || 0}`;
    const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    const platform = navigator.platform;

    const signals = {
      canvas,
      hardware,
      screen: screenInfo,
      timezone,
      language,
      platform,
    };

    return sha256(JSON.stringify(signals));
  };

  // IP geolocation fallback
  const getIPLocation = async () => {
    try {
      console.log("🔄 Fetching IP location...");
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      if (data.latitude && data.longitude) {
        localStorage.setItem("latitude", data.latitude.toString());
        localStorage.setItem("longitude", data.longitude.toString());
        console.log("✅ IP location saved:", {
          lat: data.latitude,
          lng: data.longitude,
          city: data.city
        });
      }
    } catch (error) {
      console.log("❌ IP location failed:", error);
      // Default fallback
      localStorage.setItem("latitude", "40.7128");
      localStorage.setItem("longitude", "-74.0060");
      console.log("📍 Using default location: NYC");
    }
  };

  // GPS + fallback
  const initLocation = async () => {
    if (typeof window === "undefined") return;

    const lat = localStorage.getItem("latitude");
    const lng = localStorage.getItem("longitude");

    if (lat && lng) {
      console.log("✅ Using cached location:", { lat, lng });
      return;
    }

    if (navigator.geolocation) {
      console.log("🔄 Requesting GPS location...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLat = position.coords.latitude.toString();
          const newLng = position.coords.longitude.toString();
          localStorage.setItem("latitude", newLat);
          localStorage.setItem("longitude", newLng);
          console.log("✅ GPS location saved:", { lat: newLat, lng: newLng });
        },
        (error) => {
          console.log("❌ GPS failed:", error.message);
          getIPLocation();
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 5 * 60 * 1000,
        }
      );
    } else {
      getIPLocation();
    }
  };

  // 🔥 MAIN INIT: Clear ALL localStorage + generate fresh device/location
  useEffect(() => {
    if (typeof window === "undefined") return;

    const initAll = async () => {
      // 🧹 CLEAR ALL PREVIOUS LOCALSTORAGE DATA FOR FRESH START
      console.log("🧹 Clearing ALL localStorage data for fresh start...");
      localStorage.clear();

      // Device ID (NEW since storage cleared)
      let deviceId = localStorage.getItem("device_id");
      if (!deviceId) {
        console.log("🔄 Generating NEW stable device fingerprint...");
        deviceId = await generateStableDeviceId();
        localStorage.setItem("device_id", deviceId);
        console.log("✅ NEW STABLE Device ID:", deviceId.substring(0, 16) + "...");
      } else {
        console.log("✅ EXISTING STABLE Device ID:", deviceId.substring(0, 16) + "...");
      }

      // Location (fresh fetch since storage cleared)
      await initLocation();

      // Final debug log
      setTimeout(() => {
        const lat = localStorage.getItem("latitude");
        const lng = localStorage.getItem("longitude");
        console.log("📍 FINAL FRESH STATE:", {
          device_id: localStorage.getItem("device_id")?.substring(0, 16) + "...",
          lat,
          lng,
        });
      }, 3000);
    };

    void initAll();
  }, []);

  // Auto redirect if logged in (unlikely after clear, but safety check)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const loggedIn = localStorage.getItem("isLoggedIn");
    if (loggedIn === "true") {
      router.replace("/home");
    }
  }, [router]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = eventCode.trim();
    if (!trimmed) {
      alert("Please enter an event code");
      return;
    }
    localStorage.setItem("shop_id", trimmed);
    router.push(`/outlet/${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className={styles.welcome_wrapper}>
      <div className="logoArea">
        <Image alt="Liquidity Logo" src={logo} />
      </div>

      <p>
        Welcome, please sign in or enter<br />
        your event information
      </p>

      <form onSubmit={handleVerify} className={`${styles.welcomeForm} mt-5 mb-3`}>
        <input
          type="text"
          value={eventCode}
          onChange={(e) => setEventCode(e.target.value)}
          className={`${styles.textbox} rounded-lg`}
          placeholder="Enter event code"
          autoFocus
        />
        <button type="submit" style={{ display: "none" }}>Submit</button>
      </form>

      <p>or</p>

      <div className={styles.welcomeForm}>
        <div className="grid grid-cols-1 sm:grid-cols-1 my-3 gap-4">
          <Link
            href="/choose"
            className="bg-primary px-3 py-3 rounded-lg w-full text-white text-center"
          >
            Sign Up / Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
