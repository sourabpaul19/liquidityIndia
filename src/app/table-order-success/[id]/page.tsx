"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { AlertTriangle, X } from "lucide-react";
import styles from "../table-order-success.module.scss";
import statusImg from "../../../../public/images/cheers.png";

// -----------------------------------------
// TYPES
// -----------------------------------------
interface OrderProduct {
  id: string;
  product_name: string;
  quantity: string;
  unit: string;
  choice_of_mixer_name?: string;
  shot_count?: string;
  special_instruction?: string;
  price: string;
}

interface Order {
  id: string;
  outlet_slug?: string;
  status?: string;
  is_ready?: string;
  sqaure_order_id?: string;
  table_no: string;
  order_date: string;
  shop_id?: string;
  order_type?: string;
  tax_amount?: string;
  products?: OrderProduct[];
  is_cancelled?: boolean;
  is_refunded?: boolean;
  square_order_status?: string;
}

type SquareStatus = "PROPOSED" | "RESERVED" | "PREPARED" | "COMPLETED" | null;
interface SquareApiResponse {
  status: SquareStatus;
  is_refunded?: boolean;
}

// -----------------------------------------
// STATUS TEXT
// -----------------------------------------
const STATUS_MESSAGES: Record<string, string> = {
  PROPOSED: "Your order has been placed, and will be with you shortly",
  RESERVED: "The Bar Is Preparing Your Order",
  PREPARED: "Your Order Is Ready For Pickup",
  COMPLETED: "Your Order Has Been Collected",
  null: "Your order has been placed, and will be with you shortly",
};

const getStatusMessage = (status: SquareStatus) => {
  const key = status ?? "null";
  return STATUS_MESSAGES[key] ?? STATUS_MESSAGES.null;
};

const getLocalStorage = (key: string): string => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(key) || "";
};

const getShopId = (): string => {
  const selected_shop = getLocalStorage("selected_shop");
  return selected_shop
    ? JSON.parse(selected_shop)?.id || getLocalStorage("shop_id")
    : getLocalStorage("shop_id");
};

const getTodayDate = (): string => {
  return new Date().toISOString().split("T")[0];
};

// -----------------------------------------
// COMPONENT
// -----------------------------------------
export default function OrderSuccess() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [squareStatus, setSquareStatus] = useState<SquareStatus>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCount = useRef(0);

  const clearPolling = useCallback(() => {
    if (intervalRef.current) {
      console.log("🛑 Clearing polling interval");
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // ✅ FIXED: /table-order-cancel/${order.id}
  const handleCancelledRedirect = useCallback((orderId?: string) => {
    console.log("🚫 REDIRECTING TO:", `/table-order-cancel/${orderId || id}`);
    clearPolling();
    router.push(`/table-order-cancel/${orderId || id}`);
  }, [router, clearPolling, id]);

  const handleBack = useCallback(() => {
    clearPolling();
    if (order?.outlet_slug) {
      router.push(`/outlet-menu/${order.outlet_slug}`);
    } else {
      router.push("/outlet-menu");
    }
  }, [order?.outlet_slug, router, clearPolling]);

  const getLocalStorageValues = useCallback(() => {
    if (typeof window === "undefined") return { shopId: "", tableNo: "" };
    return {
      shopId: localStorage.getItem("shop_id") || "",
      tableNo: localStorage.getItem("table_number") || localStorage.getItem("table_no") || ""
    };
  }, []);

  const handleOrderAnother = useCallback(() => {
    clearPolling();
    const { shopId, tableNo } = getLocalStorageValues();
    router.push(`/restaurant/${shopId}?table=${tableNo}`);
  }, [router, clearPolling, getLocalStorageValues]);

  const handleViewTab = useCallback(() => {
    clearPolling();
    router.push("/my-table");
  }, [router, clearPolling]);

  const filterOrders = (allOrders: Order[]): Order[] => {
    const hasTableNumber = !!getLocalStorage("table_number");
    const currentTableNo = getLocalStorage("table_number") || "";
    const currentShopId = getShopId();
    const todayDate = getTodayDate();
    
    return allOrders.filter((order) => {
      if (order.order_date !== todayDate) return false;
      if (currentShopId && order.shop_id !== currentShopId) return false;
      if (hasTableNumber && currentTableNo) {
        return order.table_no === currentTableNo && order.order_type === "2";
      }
      return order.order_type === "1";
    });
  };

  const handleCancel = () => setShowConfirmModal(false);

  const handleConfirm = async () => {
    setShowConfirmModal(false);
    const orderIds = filteredOrders.map(o => o.id);
    try {
      const res = await fetch("/api/merge-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_ids: orderIds })
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/bill-success/${data.square_order_id}`);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong while merging orders.");
    }
  };

  // -----------------------------
  // API HELPERS
  // -----------------------------
  const fetchOrderDetails = useCallback(async (): Promise<Order | null> => {
    try {
      console.log(`📋 Fetching order details: ${id}`);
      const res = await fetch(
        `https://dev2024.co.in/web/liquidity-india-backend/admin/api/tblOrderDetails/${id}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      console.log("📋 Order response:", { id: data.order?.id, refunded: data.order?.is_refunded });

      if (data.status === "1" && data.order) {
        const safeOrder: Order = {
          ...data.order,
          products: Array.isArray(data.order.products) ? data.order.products : [],
        };
        return safeOrder;
      }
      return null;
    } catch (e) {
      console.error("❌ fetchOrderDetails error:", e);
      return null;
    }
  }, [id]);

  const fetchSquareStatus = useCallback(async (squareOrderId: string): Promise<SquareApiResponse> => {
    try {
      console.log(`📡 Square API: ${squareOrderId}`);
      const res = await fetch(
        `https://dev2024.co.in/web/liquidity-india-backend/admin/api/getSquareOrderStatus/${squareOrderId}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      console.log("📡 Square response:", { status: data.square_order_status, refunded: data.is_refunded });

      if (data.status === "1") {
        const rawStatus = data.square_order_status as string;
        let squareStatus: SquareStatus = null;

        if (["PROPOSED", "RESERVED", "PREPARED", "COMPLETED"].includes(rawStatus)) {
          squareStatus = rawStatus as SquareStatus;
        }

        const isRefunded = data.is_refunded === true || 
                          data.is_refunded === "1" || 
                          data.is_refunded === "true" ||
                          data.is_refunded === 1;

        return { status: squareStatus, is_refunded: isRefunded };
      }
      return { status: null };
    } catch (e) {
      console.error("❌ fetchSquareStatus error:", e);
      return { status: null };
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const deviceId = getLocalStorage("device_id") || getLocalStorage("deviceId");
      if (!deviceId) return;

      const tableNo = getLocalStorage("table_number") || "";
      const todayDate = getTodayDate();
      const url = `https://dev2024.co.in/web/liquidity-india-backend/admin/api/tblOrderList/${deviceId}/${todayDate}/${tableNo}`;
      
      const res = await fetch(url);
      if (!res.ok) return;

      const data = await res.json();
      const list: Order[] = Array.isArray(data) ? data : data.orders || [];
      const filteredList = filterOrders(list);
      setOrders(filteredList);
    } catch (e) {
      console.error("fetchOrders error:", e);
    }
  }, []);

  // ✅ MAIN EFFECT WITH 10s POLLING
  useEffect(() => {
    console.log("🚀 Component mounted - Order ID:", id);
    
    if (!id) {
      setError("No order ID provided");
      setLoading(false);
      return;
    }

    let mounted = true;
    pollCount.current = 0;

    const initialize = async () => {
      console.log("🔄 === INITIAL LOAD ===");
      setLoading(true);
      setError(null);

      try {
        const orderData = await fetchOrderDetails();
        if (!mounted) return;

        if (!orderData) {
          setError("Order not found or deleted.");
          setOrder(null);
          setLoading(false);
          return;
        }

        // ✅ CHECK 1: Order API refunded
        if (orderData.is_refunded) {
          console.log("🔴 ORDER REFUNDED DETECTED:", orderData.id);
          handleCancelledRedirect(orderData.id);
          return;
        }

        setOrder(orderData);
        await fetchOrders();

        // ✅ CHECK 2: Square API initial
        if (orderData.sqaure_order_id) {
          const squareData = await fetchSquareStatus(orderData.sqaure_order_id);
          if (squareData.is_refunded) {
            console.log("🔴 SQUARE INITIAL REFUNDED:", orderData.id);
            handleCancelledRedirect(orderData.id);
            return;
          }
          setSquareStatus(squareData.status);
        }

        console.log("✅ Initial load complete");
      } catch (e) {
        console.error("❌ Init error:", e);
        if (mounted) setError("Failed to load order.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initialize();

    // ✅ 10-SECOND ROBUST POLLING
    console.log("⏰ Starting 10s polling loop...");
    intervalRef.current = setInterval(async () => {
      pollCount.current += 1;
      console.log(`\n🔄 === POLL #${pollCount.current} (10s) === ID: ${id}`);

      try {
        // CHECK 1: Fresh order details
        const freshOrder = await fetchOrderDetails();
        if (freshOrder?.is_refunded) {
          console.log("🔴 POLL: ORDER REFUNDED:", freshOrder.id);
          handleCancelledRedirect(freshOrder.id);
          return;
        }

        // CHECK 2: Square API
        if (freshOrder?.sqaure_order_id) {
          const squareData = await fetchSquareStatus(freshOrder.sqaure_order_id);
          if (squareData.is_refunded) {
            console.log("🔴 POLL: SQUARE REFUNDED:", freshOrder.id);
            handleCancelledRedirect(freshOrder.id);
            return;
          }
          setSquareStatus(squareData.status);
        }

        console.log("✅ Poll OK - no refund");
      } catch (e) {
        console.error("❌ Poll error:", e);
      }
      
      console.log(`🔄 === POLL END ===\n`);
    }, 10000);

    return () => {
      console.log("🧹 Unmounting - clearing poll");
      mounted = false;
      clearPolling();
    };
  }, [id, fetchOrderDetails, fetchSquareStatus, fetchOrders, handleCancelledRedirect]);

  useEffect(() => {
    const filtered = filterOrders(orders);
    setFilteredOrders(filtered);
  }, [orders]);

  const lastOrder = filteredOrders[0];
  const lastOrderStatus = lastOrder?.status;

  const allProducts: OrderProduct[] = filteredOrders.flatMap((order) => order.products || []);
  const grandSubtotal = allProducts.reduce((sum, product) => {
    return sum + (parseFloat(product.price || "0") * parseFloat(product.quantity || "0"));
  }, 0);
  const grandTax = filteredOrders.reduce((sum, order) => {
    return sum + (order.tax_amount ? parseFloat(order.tax_amount) : grandSubtotal * 0.13);
  }, 0);
  const grandTotal = grandSubtotal + grandTax;

  // -----------------------------
  // RENDER
  // -----------------------------
  if (loading) {
    return (
      <section className="pageWrapper hasHeader">
        <div className="pageContainer">
          <div className="text-center mt-10">
          </div>
        </div>
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="pageWrapper hasHeader">
        <div className="pageContainer">
          <h2 className="text-center mt-10 text-red-500 text-xl font-bold">
            {error || "Order not found or deleted."}
          </h2>
          <button 
            onClick={handleBack}
            className="mt-6 px-6 py-3 rounded-lg w-full text-white bg-primary transition-all hover:bg-primary/90 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
          >
            Go Back
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
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
              To close your bill, or for any questions<br/>
              regarding your bill, please speak to<br/>
              your server
            </p>

            <button 
              type="button"
              onClick={handleOrderAnother}
              className="mt-6 px-6 py-3 rounded-lg w-full text-white bg-primary transition-all hover:bg-primary/90 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
            >
              Order Another Item
            </button>

            <button 
              type="button"
              onClick={handleViewTab}
              className="mt-3 px-6 py-3 rounded-lg w-full text-white bg-gray-600 hover:bg-gray-700 transition-all hover:shadow-lg transform hover:-translate-y-0.5 font-medium"
            >
              View Tab
            </button>
            
            {filteredOrders.length > 0 && lastOrderStatus !== "5" && (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="mt-3 px-6 py-3 rounded-lg w-full text-white bg-black transition-all hover:bg-black/90 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
              >
                Get My Bill
              </button>
            )}
          </div>
        </div>
        
        {showConfirmModal && (
          <div
            className="fixed inset-0 bg-black/60 z-100 flex items-center justify-center p-4"
            onClick={handleCancel}
          >
            <div
              className="bg-white rounded-2xl p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center flex-col gap-3 mb-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900">Get My Bill</h3>
                  <p className="text-sm text-gray-500">
                    Warning: Once you request your bill, you cannot place any more orders. Are you sure you want to do this?
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <X size={18} />
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  Get Bill
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
