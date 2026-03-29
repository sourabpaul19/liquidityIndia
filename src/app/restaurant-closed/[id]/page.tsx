"use client";

import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { RefreshCw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { EllipsisVertical, ClockFading } from "lucide-react";
import BottomNavigation from "@/components/common/BottomNavigation/BottomNavigation";
import styles from "../restautant-closed.module.scss";
import statusImg from "../../../../public/images/closed.webp";

interface ShopData {
  id: string;
  name: string;
  is_open: number;
  image?: string | null;
}

export default function RestaurantClosed() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const shopId = params.id as string;
  const table = searchParams.get("table") || "";

  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const fetchShopStatus = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      console.log("🔄 Checking shop status:", shopId);
      const res = await fetch(
        "https://dev2024.co.in/web/liquidity-backend/admin/api/fetchDashboardDataForTempUsers"
      );
      const data = await res.json();

      if (!isMountedRef.current) return;

      if (data.status === "1" && Array.isArray(data.shops)) {
        const shop = data.shops.find((s: any) => String(s.id) === shopId);
        if (shop) {
          const shopInfo: ShopData = {
            id: shop.id,
            name: shop.name || "Restaurant",
            is_open: Number(shop.is_open ?? 0),
            image: shop.image || null,
          };
          setShopData(shopInfo);

          // AUTO-REDIRECT when open!
          if (shopInfo.is_open === 1) {
            console.log("✅ Shop OPEN! Redirecting to restaurant...");
            const redirectUrl = `/restaurant/${shopId}${table ? `?table=${table}` : ''}`;
            router.replace(redirectUrl);
            return;
          }
        }
      }
      console.log("❌ Shop still closed or not found");
    } catch (e) {
      console.error("Shop status fetch error:", e);
    }
  }, [shopId, table, router]); // ✅ Fixed deps

  // Poll every 10 seconds
  useEffect(() => {
    isMountedRef.current = true;
    
    // Initial check
    fetchShopStatus();

    // Start polling
    pollIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        fetchShopStatus();
      }
    }, 10000);

    setIsPolling(true);

    return () => {
      isMountedRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchShopStatus]); // ✅ Stable callback

  const handleManualRefresh = useCallback(() => {
    setIsPolling(false);
    fetchShopStatus().finally(() => {
      if (isMountedRef.current) {
        setIsPolling(true);
      }
    });
  }, [fetchShopStatus]);

  if (!shopData) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="text-lg">Loading shop status...</div>
      </div>
    );
  }

  return (
    <section className="pageWrapper">
        <div className="pageContainer vMiddle">
          <div className={styles.successWrapper}>
            <div className={styles.successIcon}>
              <Image src={statusImg} alt="Order status" fill />
            </div>

            <h4 className="text-center mb-2">
              Sorry, {shopData.name} is not currently accepting mobile orders.
            </h4>

            <p className="text-center">
              Please wait a few minutes and check back in,<br/>or ask your server for more information.
            </p>

            

    
          </div>
        </div>
      </section>
  );
}
