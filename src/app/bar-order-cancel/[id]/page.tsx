"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { EllipsisVertical, ClockFading } from "lucide-react";
import BottomNavigation from "@/components/common/BottomNavigation/BottomNavigation";
import styles from "../bar-order-cancel.module.scss";
import statusImg from "../../../../public/images/cancel.png";

// -----------------------------------------
// TYPES
// -----------------------------------------
interface OrderProduct {
  id: string;
  product_name: string;
  quantity: number;
  unit: string;
  choice_of_mixer_name?: string;
  shot_count?: string;
  special_instruction?: string;
}

interface Order {
  id: string;
  outlet_slug?: string;
  status?: string; // "1" | "2"
  is_ready?: string; // "0" | "1"
  sqaure_order_id?: string;
  products?: OrderProduct[];
}

type SquareStatus = "PROPOSED" | "RESERVED" | "PREPARED" | "COMPLETED" | "CANCELED" | null;

// -----------------------------------------
// STATUS TEXT
// -----------------------------------------
const STATUS_MESSAGES: Record<string, string> = {
  PROPOSED: "Your order has been placed, and will be with you shortly",
  RESERVED: "The Bar Is Preparing Your Order",
  PREPARED: "Your Order Is Ready For Pickup",
  COMPLETED: "Your Order Has Been Completed",
  CANCELED: "Your Order Has Been Cancelled",
  null: "Your order is being processed",
};

const getStatusMessage = (status: SquareStatus) => {
  const key = status ?? "null";
  return STATUS_MESSAGES[key] ?? STATUS_MESSAGES.null;
};

// -----------------------------------------
// COMPONENT
// -----------------------------------------
export default function OrderCancel() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [squareStatus, setSquareStatus] = useState<SquareStatus>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleBack = useCallback(() => {
    clearPolling();
    if (order?.outlet_slug) {
      router.push(`/outlet-menu/${order.outlet_slug}`);
    } else {
      router.push("/outlet-menu");
    }
  }, [order?.outlet_slug, router, clearPolling]);

  // -----------------------------
  // GET LOCALSTORAGE VALUES
  // -----------------------------
  const getLocalStorageValues = useCallback(() => {
    if (typeof window === "undefined") return { shopId: "", tableNo: "" };
    
    const shopId = localStorage.getItem("shop_id") || "";
    const tableNo = localStorage.getItem("table_number") || localStorage.getItem("table_no") || "";
    
    return { shopId, tableNo };
  }, []);

  const handleOrderAnother = useCallback(() => {
    clearPolling();
    const { shopId, tableNo } = getLocalStorageValues();
    router.push(`/restaurant/${shopId}`);
  }, [router, clearPolling, getLocalStorageValues]);

  // ✅ FIXED: Stable dependencies
  const handleViewTab = useCallback(() => {
    clearPolling();
    router.push(`/bar-order-details/${id}`);
  }, [router, clearPolling, id]);

  // -----------------------------
  // API HELPERS - STABLE DEPENDENCIES
  // -----------------------------
  const fetchOrderDetails = useCallback(async (): Promise<Order | null> => {
    try {
      const res = await fetch(
        `https://dev2024.co.in/web/liquidity-india-backend/admin/api/tblOrderDetails/${id}`,
        { cache: "no-store" }
      );
      const data = await res.json();

      if (data.status === "1" && data.order) {
        const safeOrder: Order = {
          ...data.order,
          products: Array.isArray(data.order.products)
            ? data.order.products
            : [],
        };
        return safeOrder;
      }

      return null;
    } catch (e) {
      console.error("orderDetails error", e);
      return null;
    }
  }, [id]); // ✅ Only id dependency

  const fetchSquareStatus = useCallback(
    async (squareOrderId: string): Promise<SquareStatus> => {
      try {
        const res = await fetch(
          `https://dev2024.co.in/web/liquidity-india-backend/admin/api/getSquareOrderStatus/${squareOrderId}`,
          { cache: "no-store" }
        );
        const data = await res.json();

        if (data.status === "1" && typeof data.square_order_status === "string") {
          const raw = data.square_order_status as string;

          if (
            raw === "PROPOSED" ||
            raw === "RESERVED" ||
            raw === "PREPARED" ||
            raw === "COMPLETED" ||
            raw === "CANCELED"
          ) {
            return raw as SquareStatus;
          }
        }

        return null;
      } catch (e) {
        console.error("square status error", e);
        return null;
      }
    },
    [] // ✅ No dependencies - stable function
  );

  // -----------------------------
  // ✅ FIXED: Stable useEffect dependencies
  // -----------------------------
  useEffect(() => {
    if (!id) return;

    let mounted = true;

    const run = async () => {
      const orderData = await fetchOrderDetails();

      if (!mounted) return;

      if (!orderData) {
        setError("Order not found or deleted.");
        setOrder(null);
        setLoading(false);
        return;
      }

      setError(null);
      setOrder(orderData);

      if (!orderData.sqaure_order_id) {
        setSquareStatus(null);
        setLoading(false);
        return;
      }

      const sq = await fetchSquareStatus(orderData.sqaure_order_id);

      if (!mounted) return;

      setSquareStatus(sq);

      if (sq === "RESERVED") {
        const updated = { ...orderData, status: "2", is_ready: "0" };
        setOrder(updated);
      } else if (sq === "PREPARED") {
        const updated = { ...orderData, status: "2", is_ready: "1" };
        setOrder(updated);
      } else if (sq === "COMPLETED") {
        const updated = { ...orderData, status: "2", is_ready: "1" };
        setOrder(updated);
        clearPolling(); // Stop polling when completed
      }

      setLoading(false);
    };

    setLoading(true);
    run();

    if (!intervalRef.current) {
      intervalRef.current = setInterval(run, 10000);
    }

    return () => {
      mounted = false;
      clearPolling();
    };
  }, [id, fetchOrderDetails, fetchSquareStatus, clearPolling]); // ✅ Stable dependencies only

  // -----------------------------
  // RENDER
  // -----------------------------
  if (loading) {
    return (
      <section className="pageWrapper hasHeader">
        <div className="pageContainer">
        </div>
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="pageWrapper hasHeader">
        <div className="pageContainer">
          <h2 className="text-center mt-10 text-red-500">
            {error || "Order not found or deleted."}
          </h2>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* BODY */}
      <section className="pageWrapper">
        <div className="pageContainer vMiddle">
          <div className={styles.successWrapper}>
            <div className={styles.successIcon}>
              <Image src={statusImg} alt="Order status" fill />
            </div>

            <h4 className="text-center mb-2">
              {getStatusMessage(squareStatus)}
            </h4>

            <p className="text-center">
              <strong>Reason:</strong> One or more ingredients<br/>missing. You will not be charged for<br/>your order.
            </p>

            <button 
              type="button"
              onClick={handleOrderAnother}
              className="mt-6 px-6 py-3 rounded-lg w-full text-white bg-primary transition-all hover:bg-primary/90 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Order Again
            </button>

            {/* <button 
              type="button"
              onClick={handleViewTab}
              className="mt-3 px-6 py-3 rounded-lg w-full text-white bg-gray-600 hover:bg-gray-700 transition-all hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Receipt
            </button> */}
          </div>
        </div>
      </section>
    </>
  );
}
