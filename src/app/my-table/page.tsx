"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./my-table.module.scss";
import BottomNavigation from "@/components/common/BottomNavigation/BottomNavigation";
import { X, LogOut, AlertTriangle } from "lucide-react";
import statusImg from "../../../public/images/cancel.png";
interface OrderProduct {
  id: string;
  product_name: string;
  price: string;
  quantity: string;
  unit: string;
}

interface Order {
  sqaure_order_id: any;
  id: string;
  unique_id: string;
  total_amount: string;
  tax_amount?: string;
  order_date: string;
  shop_id?: string;
  table_no: string;
  order_type?: string;
  status?: string;   // ✅ add this
  products: OrderProduct[];
}

const getLocalStorage = (key: string): string => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(key) || "";
};

// ✅ Get current shop ID helper
const getShopId = (): string => {
  const selected_shop = getLocalStorage("selected_shop");
  return selected_shop
    ? JSON.parse(selected_shop)?.id || getLocalStorage("shop_id")
    : getLocalStorage("shop_id");
};

// ✅ Get today's date in YYYY-MM-DD format
const getTodayDate = (): string => {
  return new Date().toISOString().split("T")[0];
};

export default function MyTable() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleCancel = () => setShowConfirmModal(false);

  const handleConfirm = async () => {
    setShowConfirmModal(false);

    // Run the merge-orders API call
    const orderIds = filteredOrders.map(o => o.id);

    try {
      const res = await fetch("/api/merge-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ order_ids: orderIds })
      });

      const data = await res.json();

      if (data.success) {
        //router.push(`/bill/${data.square_order_id}`);
        router.push(`/bill-success/${data.square_order_id}`);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong while merging orders.");
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleOrderAnother = () => {
    const shopId = getShopId();
    const tableNo = getLocalStorage("table_no") || getLocalStorage("table_number");

    if (shopId && tableNo) {
      router.push(`/restaurant/${shopId}?table=${tableNo}`);
    } else if (shopId) {
      router.push(`/restaurant/${shopId}`);
    } else {
      router.push("/restaurant");
    }
  };

  // ✅ Filter orders by shop_id, table, order_type, AND TODAY'S DATE ONLY
  const filterOrders = (allOrders: Order[]): Order[] => {
    const hasTableNumber = !!getLocalStorage("table_number");
    const currentTableNo = getLocalStorage("table_number") || "";
    const currentShopId = getShopId();
    const todayDate = getTodayDate();

    console.log("🔍 MyTable Filtering:", { 
      allOrders: allOrders.length, 
      tableNo: currentTableNo, 
      hasTableNumber,
      currentShopId,
      todayDate
    });

    return allOrders.filter((order) => {
      // ✅ Must match today's date ONLY
      if (order.order_date !== todayDate) return false;

      // ✅ Must match shop_id
      if (currentShopId && order.shop_id !== currentShopId) return false;

      if (hasTableNumber && currentTableNo) {
        // Table mode: table_no MATCH + order_type = "2"
        return order.table_no === currentTableNo && order.order_type === "2";
      } else {
        // Bar mode: order_type = "1" ONLY
        return order.order_type === "1";
      }
    });
  };

  const lastOrder = filteredOrders[0];
  console.log(lastOrder?.sqaure_order_id);
  const lastOrderStatus = lastOrder?.status;

  useEffect(() => {
  const fetchOrders = async () => {
    try {
      setLoading(true);

      const deviceId = getLocalStorage("device_id") || getLocalStorage("deviceId");
      const tableNo = getLocalStorage("table_number") || ""; // ✅ Table number
      const todayDate = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

      if (!deviceId) {
        setLoading(false);
        return;
      }

      // ✅ Include deviceId, todayDate, and tableNo in URL
      const url = `https://dev2024.co.in/web/liquidity-backend/admin/api/tblOrderList/${deviceId}/${todayDate}/${tableNo}`;

      const res = await fetch(url);
      if (!res.ok) {
        setLoading(false);
        return;
      }

      const data = await res.json();
      const list: Order[] = Array.isArray(data) ? data : data.orders || [];

      // Optional: filter client-side by shop_id and order_type
      const currentShopId = getShopId();
      const filteredList = list.filter((order: Order) => {
        if (currentShopId && order.shop_id !== currentShopId) return false;

        if (tableNo) {
          return order.table_no === tableNo && order.order_type === "2";
        } else {
          return order.order_type === "1";
        }
      });

      setOrders(filteredList);
    } catch (e) {
      console.error("Orders fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  fetchOrders();
}, []);

  // ✅ Filter orders whenever orders or localStorage changes
  useEffect(() => {
    const filtered = filterOrders(orders);
    setFilteredOrders(filtered);
  }, [orders]);

  // Flatten all products from FILTERED orders only
  const allProducts: OrderProduct[] = filteredOrders.flatMap((order) => order.products || []);

  // Grand subtotal across FILTERED orders: sum(price * quantity) for every product
  const grandSubtotal = allProducts.reduce((sum, product) => {
    const lineTotal = parseFloat(product.price || "0") * parseFloat(product.quantity || "0");
    return sum + lineTotal;
  }, 0);

  // Sum all tax_amount from FILTERED orders (API field) or calculate 13% of subtotal
  const grandTax = filteredOrders.reduce((sum, order) => {
    if (order.tax_amount) {
      return sum + parseFloat(order.tax_amount || "0");
    }
    // Fallback: 13% tax rate if no tax_amount provided
    return sum + grandSubtotal * 0.13;
  }, 0);

  // Grand total = subtotal + tax
  const grandTotal = grandSubtotal + grandTax;

  const renderBody = () => {
    if (loading) {
      return (
        <div className="pageContainer py-4">
          <div className={styles.billCard}>
            {/* <p className="text-sm text-gray-500 text-center">Loading...</p> */}
          </div>
        </div>
      );
    }

    if (allProducts.length === 0) {
      return (
        <div className="pageContainer py-4">
          <div className={styles.billingArea}>
            <div className={styles.successIcon}>
              <Image src={statusImg} alt="Order status" fill />
            </div>


            {/* <div className={styles.subtotalRow}>
              <p className={styles.subtotalLabel}>Subtotal</p>
              <p className={styles.subtotalValue}>$0.00</p>
            </div> */}
            <h3 className="text-center mb-2">
              {getLocalStorage("table_number") ? (
                <>
                  No items on <br />
                  Table #{getLocalStorage("table_number")} tab today
                </>
              ) : (
                "No items on this bar tab today"
              )}
            </h3>

            <button
              type="button"
              onClick={handleOrderAnother}
              className='mt-6 px-6 py-3 rounded-lg w-full text-white bg-primary transition-all hover:bg-primary/90 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed font-medium'
          
            >
              Order Now
            </button>
          </div>

          <div className={styles.footerNote}>
            <p>To close your bill, or for any questions about your order,
            please speak to your server.</p>
          </div>
        </div>
      );
    }

    return (
      <>
      <div className="pageContainer py-4">
        <div className={styles.billingArea}>
          {/* Items heading */}
          <h4 className={styles.sectionTitle}>Items</h4>

          {/* Every product from every FILTERED order */}
          {allProducts.map((product) => {
            const lineTotal = parseFloat(product.price || "0") * parseFloat(product.quantity || "0");

            return (
              <div key={product.id + product.product_name} className={styles.billingItem}>
                <p className={styles.itemName}>
                  {product.product_name}
                  {product.unit && ` (${product.unit})`}
                  {parseInt(product.quantity) > 1 && ` x${product.quantity}`}
                </p>
                <p className={styles.itemPrice}>₹{lineTotal.toFixed(2)}</p>
              </div>
            );
          })}

          {/* Tax row */}
          <div className={styles.billingItem}>
            <p className={styles.subtotalLabel}>Taxes &amp; Other Fees</p>
            <p className={styles.subtotalValue}>₹{grandTax.toFixed(2)}</p>
          </div>

          {/* Subtotal row */}
          <div className={styles.billingItem}>
            <h4 className={styles.subtotalLabel}>Subtotal</h4>
            <h4 className={styles.subtotalValue}>₹{grandSubtotal.toFixed(2)}</h4>
          </div>

          {/* TOTAL row - NEW & MOST PROMINENT */}
          <div className={styles.billingItem}>
            <h4 className={styles.totalLabel}>Total</h4>
            <h4 className={styles.totalValue}>₹{grandTotal.toFixed(2)}</h4>
          </div>

          {/* Primary CTA */}
          <button
            type="button"
            onClick={handleOrderAnother}
            className='mt-6 px-6 py-3 rounded-lg w-full text-white bg-primary transition-all hover:bg-primary/90 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed font-medium'
          >
            Order Another Item
          </button>
          {filteredOrders.length > 0 && lastOrderStatus !== "5" && (
  <button
    onClick={() => setShowConfirmModal(true)}
    className="mt-3 px-6 py-3 rounded-lg w-full text-white bg-black transition-all hover:bg-black/90 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
  >
    Get My Bill
  </button>
)}

        </div>

        <div className={styles.footerNote}>
          <p>To close your bill, or for any questions about your order,
          please speak to your server.</p>
        </div>

        
      </div>
{showConfirmModal && (
        <div
          className="fixed inset-0 bg-black/60 bg-opacity-50 z-100 flex items-center justify-center p-4"
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
      </>
    );
  };

  return (
    <>
      <header className="header">
        <button type="button" className="icon_only" onClick={handleBack}>
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
        <div className="pageTitle">My Table</div>
        <button type="button" className="icon_only"></button>
      </header>

      <section className="pageWrapper hasHeader">
        {renderBody()}
      </section>
    </>
  );
}