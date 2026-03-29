"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "../bar-order-details.module.scss";
import Header from "@/components/common/Header/Header";
import BottomNavigation from "@/components/common/BottomNavigation/BottomNavigation";
import Link from "next/link";
import { ChevronRight, MapPin, PhoneCall, Mail } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";

interface Shop {
  name: string;
  address: string;
  phone: string;
  email: string;
  image: string;
}

interface Product {
  product_name: string;
  quantity: string;
  price: string;
  unit: string;
  choice_of_mixer_name?: string;
  is_double_shot?: string;
  double_shot_price?: string;
  special_instruction?: string;
}

interface Order {
  id: string;
  unique_id: string;
  created_at: string;
  order_type: string;
  payment_type: string;
  amount: string;
  tax_amount: string;
  tips: string;
  total_amount: string;
  products: Product[];
  shop: Shop;
  sqaure_order_id?: string;
  square_status?: string;
}

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ PERFECT BACK LOGIC - Covers ALL 6 scenarios
  // const handleBackClick = useCallback(() => {
  //   const status = order?.square_status?.toUpperCase();
    
  //   if (status === 'COMPLETED') {
  //     // Check if came from order-success
  //     const fromPage = searchParams.get('from');
  //     const referrer = document.referrer || '';
      
  //     if (fromPage === 'order-success' || referrer.includes('/order-success/')) {
  //       // Case 5: order-success → order-details (COMPLETED) → home
  //       router.push('/home');
  //     } else {
  //       // Cases 1, 4: from order-status → order-details (COMPLETED) → ongoing-orders
  //       router.push('/ongoing-orders');
  //     }
  //   } else {
  //     // Cases 1(NOT COMPLETED), 2, 3, 6: normal back navigation
  //     router.back();
  //   }
  // }, [order?.square_status, searchParams, router]);


  // Add this console.log inside handleBackClick to debug fromPage
const handleBackClick = useCallback(() => {
  console.log('🔙 BACK → router.back()');
  router.back();
}, [router]);




  // Fetch initial order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const res = await fetch(
          `https://dev2024.co.in/web/liquidity-backend/admin/api/tblOrderDetails/${id}`,
          { cache: "no-store" }
        );
        const data = await res.json();

        if (data.status === "1" && data.order) {
          setOrder(data.order);
        } else {
          setOrder(null);
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id]);

  // Fetch and poll Square order status
  useEffect(() => {
    if (!order?.sqaure_order_id) return;

    let interval: NodeJS.Timeout | undefined;

    const fetchSquareStatus = async () => {
      if (!order?.sqaure_order_id) return;

      try {
        const res = await fetch(
          `https://dev2024.co.in/web/liquidity-backend/admin/api/getSquareOrderStatus/${order.sqaure_order_id}`,
          { cache: "no-store" }
        );
        const data = await res.json();

        if (data.status === "1" && data.square_order_status) {
          const status = String(data.square_order_status).toUpperCase();
          setOrder((prev) =>
            prev ? { ...prev, square_status: status } : null
          );

          // Stop polling when Square state is final
          if (status === "COMPLETED" || status === "CANCELED" || status === "FAILED") {
            if (interval) {
              clearInterval(interval);
              interval = undefined;
            }
          }
        }
      } catch (error) {
        console.error("Square status fetch failed:", error);
      }
    };

    // Initial fetch
    fetchSquareStatus();
    // Poll every 10 seconds until final state
    interval = setInterval(fetchSquareStatus, 10000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [order?.sqaure_order_id]);

  if (loading) {
    return (
      <>
        <header className='header'>
          <button className='icon_only' onClick={() => router.back()}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 6L9 12L15 18"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h2 className='pageTitle'>My Orders</h2>
          <button className='icon_only'></button>
        </header>
        <section className="pageWrapper hasHeader hasFooter">
          <div className="pageContainer">
            <div className="text-center py-10 text-gray-500">
              Loading order details...
            </div>
          </div>
        </section>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <header className='header'>
          <button className='icon_only' onClick={() => router.back()}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 6L9 12L15 18"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h2 className='pageTitle'>My Orders</h2>
          <button className='icon_only'></button>
        </header>
        <section className="pageWrapper hasHeader">
          <div className="pageContainer">
            <div className="text-center py-10 text-gray-500">Order not found</div>
          </div>
        </section>
      </>
    );
  }

  // Helper functions
  const getSquareStatusLabel = (squareStatus?: string) => {
    if (!squareStatus) return "🕒 Checking Square status...";

    switch (squareStatus.toUpperCase()) {
      case "PROPOSED":
        return "Received";
      case "RESERVED":
        return "Preparing";
      case "PREPARED":
        return "Ready";
      case "COMPLETED":
        return "Completed";
      case "CANCELED":
        return "Canceled";
      case "FAILED":
        return "Failed";
      default:
        return `Square: ${squareStatus}`;
    }
  };

  const getOrderTypeLabel = (type: string) => {
    switch (type) {
      case "1":
        return "Bar Order";
      case "2":
        return "Table Order";
      default:
        return "N/A";
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case "1":
        return "💳 Online";
      case "2":
        return "👛 Wallet";
      default:
        return "N/A";
    }
  };

  const getFormattedDate = (created_at: string) => {
    if (!created_at) return "N/A";
    const date = new Date(created_at.replace(" ", "T"));
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getFormattedTime = (created_at: string) => {
    if (!created_at) return "N/A";
    const date = new Date(created_at.replace(" ", "T"));
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <>
      <header className='header'>
        {/* ✅ SMART BACK BUTTON - Handles ALL 6 scenarios perfectly */}
        <button className='icon_only' onClick={handleBackClick}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 6L9 12L15 18"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <h2 className='pageTitle'>Order Receipt</h2>

        <button className='icon_only'></button>
      </header>

      <section className="pageWrapper hasHeader">
        <div className="pageContainer">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4">
            {/* SHOP INFO */}
            <div>
              <div className={styles.barWrapper}>
                <figure className="relative w-full h-48 rounded overflow-hidden">
                  <Image
                    src={order.shop?.image || "/images/bar.jpg"}
                    alt={order.shop?.name || "Shop"}
                    fill
                    className="object-cover"
                  />
                </figure>
                <figcaption>
                  <h4>{order.shop?.name}</h4>
                  <p>
                    <MapPin size={14} /> <span>{order.shop?.address}</span>
                  </p>
                  <p>
                    <PhoneCall size={14} /> <span>{order.shop?.phone}</span>
                  </p>
                  <p>
                    <Mail size={14} /> <span>{order.shop?.email}</span>
                  </p>
                </figcaption>
              </div>

              {/* ORDER DETAILS */}
              <h5 className="mb-4">Order Details</h5>
              <div className={styles.historyBlock}>
                <div className={styles.faqItem}>
                  <p>Date</p>
                  <h5>{getFormattedDate(order.created_at)}</h5>
                </div>
                <div className={styles.faqItem}>
                  <p>Time</p>
                  <h5>{getFormattedTime(order.created_at)}</h5>
                </div>
                <div className={styles.faqItem}>
                  <p>Order Type</p>
                  <h5>{getOrderTypeLabel(order.order_type)}</h5>
                </div>
                <div className={styles.faqItem}>
                  <p>Payment Mode</p>
                  <h5>{getPaymentTypeLabel(order.payment_type)}</h5>
                </div>
                <div className={styles.faqItem}>
                  <p>Order ID</p>
                  <h5>{order.unique_id}</h5>
                </div>
                <div className={styles.faqItem}>
                  <p>Status</p>
                  <h5>{getSquareStatusLabel(order.square_status)}</h5>
                </div>
              </div>

              {/* ITEMS */}
              <h5 className="mb-4">Items</h5>
              <div className={styles.historyBlock}>
                {Array.isArray(order.products) && order.products.length > 0 ? (
                  order.products.map((item, index) => (
                    <div key={index} className={styles.orderItem}>
                      <div>
                        <h5>
                          {item.quantity} × {item.product_name}{" "}
                          {item.unit && <span>({item.unit})</span>}
                        </h5>
                        {item.choice_of_mixer_name && (
                          <p>Mixer: {item.choice_of_mixer_name}</p>
                        )}
                        {item.is_double_shot === "1" && (
                          <p>Double Shot (+${item.double_shot_price})</p>
                        )}
                        {item.special_instruction &&
                          item.special_instruction !== "undefined" && (
                            <p>Instruction: {item.special_instruction}</p>
                          )}
                      </div>
                      <div>
                        <h5>${item.price}</h5>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">
                    No items found for this order.
                  </p>
                )}
              </div>
            </div>

            {/* ORDER SUMMARY */}
            <div>
              <h5 className="mb-4">Order Summary</h5>
              <div className={styles.historyBlock}>
                <div className={styles.faqItem}>
                  <p>Subtotal</p>
                  <h5>${order.amount}</h5>
                </div>
                <div className={styles.faqItem}>
                  <p>Taxes & Charges</p>
                  <h5>${order.tax_amount}</h5>
                </div>
                <div className={styles.faqItem}>
                  <p>Tips</p>
                  <h5>${order.tips}</h5>
                </div>
                <div className={styles.row}>
                  <div className={styles.totalItem}>
                    <h5>Grand Total</h5>
                    <h5>${order.total_amount}</h5>
                  </div>
                </div>
              </div>

              {/* HELP SECTION */}
              <h5 className="mb-4">Help</h5>
              <div className={styles.historyBlock}>
                <Link href="#" className={styles.faqItem}>
                  <h5>My order is taking too long</h5>
                  <ChevronRight size={16} />
                </Link>
                <Link href="#" className={styles.faqItem}>
                  <h5>My order is incorrect</h5>
                  <ChevronRight size={16} />
                </Link>
                <Link href="#" className={styles.faqItem}>
                  <h5>There is something wrong with my order</h5>
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
