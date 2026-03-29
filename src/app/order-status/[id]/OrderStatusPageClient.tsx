"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { EllipsisVertical, ClockFading } from "lucide-react";
import BottomNavigation from "@/components/common/BottomNavigation/BottomNavigation";
import styles from "../order-status.module.scss";
import statusImg from "../../../../public/images/status.png";

// ------------------------------------------
// TYPES
// ------------------------------------------
interface OrderProduct {
  id: string;
  quantity: string;
  product_name: string;
  unit: string;
  choice_of_mixer_name?: string;
  shot_count?: string;
  special_instruction?: string;
}

interface OrderData {
  status: string;        // "1" | "2"
  is_ready: string;      // "0" | "1"
  sqaure_order_id?: string;
  products?: OrderProduct[];
}

type SquareStatus = "PROPOSED" | "RESERVED" | "PREPARED" | "COMPLETED" | null;

// ------------------------------------------
// STATUS MESSAGE (SQUARE)
// ------------------------------------------
const getStatusMessage = (status: SquareStatus) => {
  switch (status) {
    case "PROPOSED":
      return "The Bar Has Received Your Order";
    case "RESERVED":
      return "The Bar Is Preparing Your Order";
    case "PREPARED":
      return "Your Order Is Ready For Pickup";
    case "COMPLETED":
      return "Your Order Has Been Collected";
    default:
      return "Your order is being processed";
  }
};

interface Props {
  id: string;
}

export default function OrderStatusPageClient({ id }: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [squareStatus, setSquareStatus] = useState<SquareStatus>(null);
  const [error, setError] = useState<string | null>(null);

  // single interval ref so it can be cleared safely
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const backClick = useCallback(() => {
    clearPolling();
    router.back();
  }, [clearPolling, router]);

  // ------------------------------------------
  // API HELPERS
  // ------------------------------------------
  const fetchOrderDetails = useCallback(async (): Promise<OrderData | null> => {
    try {
      const res = await fetch(
        `https://dev2024.co.in/web/liquidity-backend/admin/api/orderDetails/${id}`,
        { cache: "no-store" }
      );
      const data = await res.json();

      console.log("orderDetails API =>", data);

      if (data.status === "1" && data.order) {
        const safeOrder: OrderData = {
          ...data.order,
          products: Array.isArray(data.order.products)
            ? data.order.products
            : [],
        };
        return safeOrder;
      }
      return null;
    } catch (err) {
      console.error("Order fetch error", err);
      return null;
    }
  }, [id]);

  const fetchSquareOrderStatus = useCallback(
    async (squareOrderId: string): Promise<SquareStatus> => {
      try {
        const res = await fetch(
          `https://dev2024.co.in/web/liquidity-backend/admin/api/getSquareOrderStatus/${squareOrderId}`,
          { cache: "no-store" }
        );
        const data = await res.json();

        console.log("Square status API =>", data);

        if (data.status === "1" && typeof data.square_order_status === "string") {
          const raw = data.square_order_status as string;
          if (
            raw === "PROPOSED" ||
            raw === "RESERVED" ||
            raw === "PREPARED" ||
            raw === "COMPLETED"
          ) {
            return raw as SquareStatus;
          }
        }
        return null;
      } catch (err) {
        console.error("Square status fetch error", err);
        return null;
      }
    },
    []
  );

  // ------------------------------------------
  // POLLING
  // ------------------------------------------
  const pollOnce = useCallback(async () => {
    const orderData = await fetchOrderDetails();

    if (!orderData) {
      setOrder(null);
      setError("Order not found or deleted");
      return;
    }

    setError(null);
    setOrder(orderData);

    if (!orderData.sqaure_order_id) {
      // no Square order, keep generic text
      setSquareStatus(null);
      return;
    }

    const sq = await fetchSquareOrderStatus(orderData.sqaure_order_id);
    setSquareStatus(sq);

    if (sq === "RESERVED") {
      setOrder({ ...orderData, status: "2", is_ready: "0" });
    } else if (sq === "PREPARED") {
      setOrder({ ...orderData, status: "2", is_ready: "1" });
      // keep polling so we can catch COMPLETED
    } else if (sq === "COMPLETED") {
      setOrder({ ...orderData, status: "2", is_ready: "1" });

      clearPolling();
      // redirect to order details page (adjust route as needed)
      router.push(`/order-details/${id}`);
    }
  }, [fetchOrderDetails, fetchSquareOrderStatus, clearPolling, router, id]);

  useEffect(() => {
    let mounted = true;

    const start = async () => {
      setLoading(true);
      await pollOnce();
      if (!mounted) return;
      setLoading(false);

      if (!intervalRef.current) {
        intervalRef.current = setInterval(pollOnce, 10000);
      }
    };

    start();

    return () => {
      mounted = false;
      clearPolling();
    };
  }, [pollOnce, clearPolling]);

  // ------------------------------------------
  // RENDER
  // ------------------------------------------
  if (loading) {
    return (
      <section className="pageWrapper hasHeader">
        <div className="pageContainer">
          <p className="text-center mt-10">Loading order…</p>
        </div>
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="pageWrapper hasHeader">
        <div className="pageContainer">
          <h2 className="text-center mt-10 text-red-500">
            {error || "Order not found or deleted"}
          </h2>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* HEADER */}
      <header className="header">
        <button className="icon_only" onClick={backClick}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 6L9 12L15 18"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <Link
          href="https://liquiditybars.com/faq.html"
          className="icon_only ml-auto"
        >
          <EllipsisVertical />
        </Link>
      </header>

      {/* PAGE */}
      <section className="pageWrapper hasHeader hasFooter">
        <div className="pageContainer">
          <div className={styles.successWrapper}>
            {/* STATUS TITLE */}
            <h4 className="text-center mb-2">
              {getStatusMessage(squareStatus)}
            </h4>

            <h5 className="text-center">Please wait near the bar</h5>

            {/* PROGRESS BAR: driven only by squareStatus */}
            <div className={styles.progress}>
              {/* 1. PROPOSED */}
              <div
                className={`${styles.progressLayer} ${
                  squareStatus === "PROPOSED"
                    ? styles.animated
                    : squareStatus === "RESERVED" ||
                      squareStatus === "PREPARED" ||
                      squareStatus === "COMPLETED"
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
                      squareStatus === "COMPLETED"
                    ? styles.completed
                    : ""
                }`}
              >
                <div className={styles.progressBar}></div>
              </div>

              {/* 3. PREPARED */}
              <div
                className={`${styles.progressLayer} ${
                  squareStatus === "PREPARED" || squareStatus === "COMPLETED"
                    ? styles.animated
                    : ""
                }`}
              >
                <div className={styles.progressBar}></div>
              </div>
            </div>

            {/* STATUS IMAGE */}
            <div className={styles.successIcon}>
              <Image src={statusImg} alt="Order status" fill />
            </div>

            {/* ORDER DETAILS */}
            <div className={styles.orderDetails}>
              <h4 className="mb-2">Estimated order completion time</h4>
              <p className="flex gap-3">
                <ClockFading /> 3 - 7 minutes
              </p>

              <h4 className="mt-4">Order Details</h4>

              {order.products?.map((p) => (
                <div key={p.id} className="py-4 border-b border-gray-200">
                  <h5>
                    {p.quantity} × {p.product_name}{" "}
                    <span>({p.unit})</span>
                  </h5>
                  <p>
                    Mixer Name:{" "}
                    <span>{p.choice_of_mixer_name || "N/A"}</span>
                    <br />
                    Additional Shots: <span>{p.shot_count || 0}</span>
                    <br />
                    Special Instruction:{" "}
                    <span>{p.special_instruction || "—"}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <BottomNavigation />
    </>
  );
}
