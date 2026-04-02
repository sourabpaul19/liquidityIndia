'use client';

import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from "./bar-guest.module.scss";

interface Shop {
  id: string;
  name: string;
  image: string;
  address: string;
}

export default function GuestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [shopName, setShopName] = useState('Liquidity Bars');
  const [shopDetails, setShopDetails] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const shopId = searchParams.get('shop') || '';
  const tableNumber = searchParams.get('table') || '';

  // ✅ Generate 11-DIGIT NUMERIC user_id only (stable across sessions)
  const generateNumericUserId = (): string => {
    let existingUserId = localStorage.getItem('user_id');
    if (!existingUserId) {
      // Generate stable 11-digit numeric ID: timestamp (7 digits) + random (4 digits)
      const timestamp = Date.now().toString().slice(-7); // Last 7 digits of timestamp
      const randomNum = Math.floor(Math.random() * 10000); // 4-digit random (0000-9999)
      existingUserId = (parseInt(timestamp + randomNum)).toString().padStart(11, '0');
      localStorage.setItem('user_id', existingUserId);
    }
    return existingUserId;
  };

  // Load existing device_id + generate 11-digit numeric user_id on mount
  useEffect(() => {
    const initIds = () => {
      // ✅ Get existing device_id (permanent from previous page/table)
      const existingDeviceId = localStorage.getItem('device_id') || '';
      setDeviceId(existingDeviceId);

      // ✅ Generate 11-digit numeric user_id (stable for this guest session)
      const numericUserId = generateNumericUserId();
      setUserId(numericUserId);
    };
    initIds();
  }, []);

  // Fetch shop details from API
  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const response = await fetch('https://dev2024.co.in/web/liquidity-india-backend/admin/api/fetchDashboardDataForTempUsers');
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

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    const name = userName.trim();
    
    if (name) {
      // ✅ 11-digit numeric user_id + device_id both permanent in localStorage
      const finalUserId = localStorage.getItem('user_id') || '';
      const finalDeviceId = localStorage.getItem('device_id') || deviceId;
      
      // Store ALL details (NO table_number in localStorage)
      localStorage.setItem('user_id', finalUserId);
      localStorage.setItem('device_id', finalDeviceId);
      localStorage.setItem('shop_id', shopId);
      localStorage.setItem('user_name', name);
      
      // ✅ Navigate WITHOUT table parameter
      router.push(`/restaurant/${shopId}`);
    }
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
          <h1 className="text-2xl font-black text-gray-900 mb-2">{shopName}</h1>
          {tableNumber && (
            <div className="bg-green-100 p-3 rounded-lg mb-4">
              <p className="text-lg font-bold text-green-800">🪑 Table #{tableNumber}</p>
            </div>
          )}
        </div>
      ) : (
        <>
          <h2 className="text-3xl font-bold text-primary">Welcome to</h2>
          <h1 className="text-2xl font-black text-gray-900 mb-4">{shopName}</h1>
        </>
      )}

      <p className="text-lg text-center mb-8 leading-relaxed">
        Enter your name to start ordering
      </p>

      {/* Name Input Form */}
      <form onSubmit={handleContinue} className={`${styles.welcomeForm} mb-3`}>
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className={`${styles.textbox} rounded-lg`}
          placeholder="Enter the name on your government ID"
          autoFocus
        />
        
        <button 
          type="submit" 
          className="mt-4 px-3 py-3 rounded-lg w-full text-white bg-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!userName.trim() || !userId || !deviceId}
        >
          I'm Ready to Order
        </button>
      </form>
      
      {/* Debug: 11-digit Numeric IDs (remove in production) */}
      {process.env.NODE_ENV === 'development' && (userId || deviceId) && (
        <div className="text-xs text-gray-500 text-center mb-4 p-2 bg-gray-100 rounded space-y-1">
          <div>User ID: <code className="font-mono bg-green-100 px-1 py-0.5 rounded text-xs">{userId} (11-digit numeric)</code></div>
          <div>Device ID: <code className="font-mono">{deviceId}</code></div>
          <div className="text-[10px]">Length: {userId.length} digits</div>
        </div>
      )}
      
      <div className={styles.otpFooter}>
        <p className="text-center">Please ensure the name you order under matches your government ID, as the establishment may request proof of age</p>
      </div>
    </div>
  );
}
