'use client';

import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect } from 'react';
import Link from "next/link";
import Image from 'next/image';
import styles from "./bar-order.module.scss";

interface Shop {
  id: string;
  name: string;
  image: string;
  address: string;
}

export default function TablePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [shopName, setShopName] = useState('Liquidity Bars');
  const [shopDetails, setShopDetails] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const shopId = searchParams.get('shop') || '';

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

  // *** NEW: Clear ALL localStorage on page mount (BAR FLOW) ***
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Clear ALL previous localStorage data
    localStorage.clear();
    console.log("🧹 CLEARED ALL localStorage data on BarOrder page mount");
  }, []); // Empty dependency array = runs ONCE on mount

  // ✅ FIXED: Initialize device ID + STORE shop_id + SET order_type="bar" (AFTER clear)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const initDeviceIdAndShop = async () => {
      let deviceId = localStorage.getItem("device_id");
      if (!deviceId) {
        console.log("🔄 Generating stable device fingerprint...");
        deviceId = await generateStableDeviceId();
        localStorage.setItem("device_id", deviceId);
        console.log("✅ NEW STABLE Device ID:", deviceId);
      } else {
        console.log("✅ EXISTING STABLE Device ID:", deviceId);
      }

      // ✅ Store shop_id IMMEDIATELY when page loads
      if (shopId) {
        localStorage.setItem("shop_id", shopId);
        console.log("✅ STORING shop_id:", shopId);
      }

      // ✅ BAR FLOW: Set order_type = "bar" for bar flow
      localStorage.setItem("order_type", "bar");
      console.log("✅ SET order_type=bar for bar flow");
    };

    void initDeviceIdAndShop();
  }, [shopId]); // Runs when shopId is available

  // Fetch shop details from API
  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const response = await fetch('https://dev2024.co.in/web/liquidity-backend/admin/api/fetchDashboardDataForTempUsers');
        const data = await response.json();
        
        if (data.status === '1' && data.shops) {
         const shop = data.shops.find((s: Shop) => s.id === shopId);
         if (shop) {
           setShopDetails(shop);
           setShopName(shop.name);
         }
        }
      } catch (error) {
        console.error('Failed to fetch shop data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (shopId) {
      fetchShopData();
    } else {
      setLoading(false);
    }
  }, [shopId]);

  const handleGuestProceed = () => {
    // ✅ Store shop_id only (NO table_number needed)
    localStorage.setItem('shop_id', shopId);
    
    // Navigate to guest page WITHOUT table parameter
    router.push(`/bar-guest?shop=${shopId}`);
  };

  const handleLogin = () => {
    router.push(`/order-choose`);
  };

  if (loading) {
    return (
      <div className={styles.welcome_wrapper}>
        <div className="flex justify-center items-center h-64">
         {/* <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div> */}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.welcome_wrapper}>
      {/* Shop Header */}
      {shopDetails ? (
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-primary mb-1">Welcome to</h2>
          <h1 className="text-2xl font-black text-gray-900">{shopName}</h1>
        </div>
      ) : (
        <>
          <h2 className="text-3xl font-bold text-primary">Welcome to</h2>
          <h1 className="text-2xl font-black text-gray-900 mb-4">{shopName}</h1>
        </>
      )}

      <p className="text-lg text-center mb-8 leading-relaxed">
        Please <span className="font-semibold">sign in</span> or <span className="font-semibold">proceed as a guest</span>
      </p>      

      {/* Buttons */}
      <div className={styles.welcomeForm}>
        <button 
          onClick={handleLogin}
          className="bg-primary px-3 py-3 rounded-lg w-full text-white text-center mt-3"
        >
          Sign Up / Sign In
        </button>

        <p className="text-center text-lg font-semibold text-gray-600 mb-3">or</p>
        
        <button
          onClick={handleGuestProceed}
          className="bg-primary px-3 py-3 rounded-lg w-full text-white hover:from-blue-700 hover:to-primary-dark transition-all transform hover:-translate-y-1"
        >
          Proceed as Guest
        </button>
      </div>

      {/* ✅ FIXED: Dynamic table link with shopId */}
      <div className={styles.otpFooter}>
        <p className="text-center">
          <Link href={`/table?shop=${shopId}`}>Ordering at a table?</Link>
        </p>
      </div>
    </div>
  );
}
