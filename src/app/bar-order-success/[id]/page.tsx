"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { EllipsisVertical, ClockFading } from "lucide-react";
import BottomNavigation from "@/components/common/BottomNavigation/BottomNavigation";
import styles from "../bar-order-success.module.scss";
import statusImg from "../../../../public/images/status.png";

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
  PROPOSED: "The Bar Has Received Your Order",
  RESERVED: "The Bar Is Preparing Your Order",
  PREPARED: "Your Order Is Ready For Pickup",
  COMPLETED: "Your Order Has Been Collected",
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
export default function OrderSuccess() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [squareStatus, setSquareStatus] = useState<SquareStatus>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasRedirected, setHasRedirected] = useState(false);

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
  // API HELPERS
  // -----------------------------
  const fetchOrderDetails = useCallback(async (): Promise<Order | null> => {
    try {
      const res = await fetch(
        `https://admin.liquiditybars.com/admin/api/tblOrderDetails/${id}`,
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
  }, [id]);

  const fetchSquareStatus = useCallback(
    async (squareOrderId: string): Promise<SquareStatus> => {
      try {
        const res = await fetch(
          `https://admin.liquiditybars.com/admin/api/getSquareOrderStatus/${squareOrderId}`,
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
    []
  );

  // -----------------------------
  // EFFECT: STATUS-BASED REDIRECTS
  // -----------------------------
  useEffect(() => {
    if (hasRedirected || !order?.id) return;

    if (squareStatus === "CANCELED") {
      setHasRedirected(true);
      clearPolling();
      router.push(`/bar-order-cancel/${order.id}`);
    } else if (squareStatus === "COMPLETED") {
      setHasRedirected(true);
      clearPolling();
      router.push(`/bar-order-status/${order.id}`);
    }
  }, [squareStatus, order?.id, router, clearPolling, hasRedirected]);

  // -----------------------------
  // EFFECT: INITIAL LOAD + POLLING
  // -----------------------------
  useEffect(() => {
    if (!id || hasRedirected) return;

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

      // Update order status (redirect handled by other effect)
      if (sq === "RESERVED") {
        const updated = { ...orderData, status: "2", is_ready: "0" };
        setOrder(updated);
      } else if (sq === "PREPARED") {
        const updated = { ...orderData, status: "2", is_ready: "1" };
        setOrder(updated);
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
  }, [id, fetchOrderDetails, fetchSquareStatus, clearPolling, hasRedirected]);

  // -----------------------------
  // RENDER
  // -----------------------------
  if (loading) {
    return (
      <section className="pageWrapper hasHeader">
        <div className="pageContainer">
          {/* <p className="text-center mt-10">Loading order...</p> */}
        </div>
      </section>
    );
  }

  if (hasRedirected) {
    return (
      <section className="pageWrapper hasHeader">
        <div className="pageContainer">
          {/* <p className="text-center mt-10">Redirecting...</p> */}
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
      <section className="pageWrapper hasHeader">
        <div className="pageContainer">
          <div className={styles.successWrapper}>
            <h4 className="text-center mb-2">
              {getStatusMessage(squareStatus)}
            </h4>

            <h5 className="text-center">
              {squareStatus === "PREPARED"
                ? "Please pick it up at the bar"
                : "Please wait near the bar"}
            </h5>

            <div className={styles.progress}>
              {/* 1. PROPOSED */}
              <div
                className={`${styles.progressLayer} ${
                  squareStatus === "PROPOSED"
                    ? styles.animated
                    : squareStatus === "RESERVED" ||
                      squareStatus === "PREPARED" ||
                      squareStatus === "COMPLETED" ||
                      squareStatus === "CANCELED"
                    ? styles.completed
                    : ""
                }`}
              >
                <div className={styles.progressBar}></div>
              </div>

              {/* 2. RESERVED */}
              <div
                className={`${styles.progressLayer} ${
                  squareStatus === "RESERVED"
                    ? styles.animated
                    : squareStatus === "PREPARED" || 
                      squareStatus === "COMPLETED" ||
                      squareStatus === "CANCELED"
                    ? styles.completed
                    : ""
                }`}
              >
                <div className={styles.progressBar}></div>
              </div>

              {/* 3. PREPARED */}
              <div
                className={`${styles.progressLayer} ${
                  (squareStatus === "PREPARED" || 
                    squareStatus === "COMPLETED" ||
                    squareStatus === "CANCELED")
                    ? styles.animated
                    : ""
                }`}
              >
                <div className={styles.progressBar}></div>
              </div>
            </div>

            <div className={styles.successIcon}>
              <Image src={statusImg} alt="Order status" fill />
            </div>

            <div className={styles.orderDetails}>
              <h4 className="mb-2">Estimated order completion time</h4>
              <p className="flex gap-3">
                <ClockFading /> 3 - 7 minutes
              </p>

              <h4 className="mt-4 mb-2">Order Details</h4>

              {order.products && order.products.length > 0 ? (
                order.products.map((p) => (
                  <div
                    key={p.id}
                    className="py-4 border-b border-gray-200"
                  >
                    <h5>
                      {p.quantity} × {p.product_name}{" "}
                      <span>({p.unit || "1oz"})</span>
                    </h5>
                    <p>
                      Mixer Name:{" "}
                      <span>{p.choice_of_mixer_name || "N/A"}</span>
                      <br />
                      Additional Shots: <span>{p.shot_count ?? 0}</span>
                      <br />
                      Special Instruction:{" "}
                      <span>{p.special_instruction || "—"}</span>
                    </p>
                  </div>
                ))
              ) : (
                <p>No items found for this order.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
