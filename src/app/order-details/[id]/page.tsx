"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "../order-details.module.scss";
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
  const status = order?.square_status?.toUpperCase();
  const referrer = document.referrer || '';
  
  console.log('🔍 DEBUG - square_status:', status);
  console.log('🔍 DEBUG - referrer:', referrer);
  
  if (status === 'COMPLETED') {
    if (referrer.includes('/order-success/')) {
      console.log('🚀 COMPLETED + /order-success/orderid → /home');
      router.push('/home');
    } else if (referrer.includes('/order-status/')) {
      console.log('🚀 COMPLETED + /order-status/orderid → /ongoing-orders');
      router.push('/ongoing-orders');
    } else {
      console.log('🚀 COMPLETED + other → /ongoing-orders');
      router.push('/ongoing-orders');
    }
  } else {
    console.log('🔙 NOT COMPLETED → normal back');
    router.back();
  }
}, [order?.square_status, router]);



  // Fetch initial order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const res = await fetch(
          `https://dev2024.co.in/web/liquidity-backend/admin/api/orderDetails/${id}`,
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
          <Link href='/search' className='icon_only'>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_10_112)">
                <mask
                  id="mask0_10_112"
                  maskUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="24"
                  height="24"
                >
                  <path d="M24 0H0V24H24V0Z" fill="white" />
                </mask>
                <g mask="url(#mask0_10_112)">
                  <path
                    d="M10.5691 0C4.74145 0 0 4.74145 0 10.5691C0 16.3971 4.74145 21.1382 10.5691 21.1382C16.3971 21.1382 21.1382 16.3971 21.1382 10.5691C21.1382 4.74145 16.3971 0 10.5691 0ZM10.5691 19.187C5.81723 19.187 1.95122 15.321 1.95122 10.5691C1.95122 5.81728 5.81723 1.95122 10.5691 1.95122C15.321 1.95122 19.187 5.81723 19.187 10.5691C19.187 15.321 15.321 19.187 10.5691 19.187Z"
                    fill="#28303F"
                  />
                  <path
                    d="M23.714 22.3347L18.1205 16.7412C17.7393 16.36 17.1221 16.36 16.7409 16.7412C16.3598 17.122 16.3598 17.7399 16.7409 18.1207L22.3344 23.7142C22.4249 23.805 22.5324 23.8769 22.6508 23.926C22.7692 23.975 22.8961 24.0002 23.0242 24.0001C23.1523 24.0002 23.2792 23.975 23.3976 23.9259C23.516 23.8769 23.6235 23.8049 23.714 23.7142C24.0951 23.3334 24.0951 22.7155 23.714 22.3347Z"
                    fill="#28303F"
                  />
                </g>
              </g>
              <defs>
                <clipPath id="clip0_10_112">
                  <rect width="24" height="24" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </Link>
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
          <Link href='/search' className='icon_only'>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_10_112)">
                <mask
                  id="mask0_10_112"
                  maskUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width="24"
                  height="24"
                >
                  <path d="M24 0H0V24H24V0Z" fill="white" />
                </mask>
                <g mask="url(#mask0_10_112)">
                  <path
                    d="M10.5691 0C4.74145 0 0 4.74145 0 10.5691C0 16.3971 4.74145 21.1382 10.5691 21.1382C16.3971 21.1382 21.1382 16.3971 21.1382 10.5691C21.1382 4.74145 16.3971 0 10.5691 0ZM10.5691 19.187C5.81723 19.187 1.95122 15.321 1.95122 10.5691C1.95122 5.81728 5.81723 1.95122 10.5691 1.95122C15.321 1.95122 19.187 5.81723 19.187 10.5691C19.187 15.321 15.321 19.187 10.5691 19.187Z"
                    fill="#28303F"
                  />
                  <path
                    d="M23.714 22.3347L18.1205 16.7412C17.7393 16.36 17.1221 16.36 16.7409 16.7412C16.3598 17.122 16.3598 17.7399 16.7409 18.1207L22.3344 23.7142C22.4249 23.805 22.5324 23.8769 22.6508 23.926C22.7692 23.975 22.8961 24.0002 23.0242 24.0001C23.1523 24.0002 23.2792 23.975 23.3976 23.9259C23.516 23.8769 23.6235 23.8049 23.714 23.7142C24.0951 23.3334 24.0951 22.7155 23.714 22.3347Z"
                    fill="#28303F"
                  />
                </g>
              </g>
              <defs>
                <clipPath id="clip0_10_112">
                  <rect width="24" height="24" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </Link>
        </header>
        <section className="pageWrapper hasHeader hasFooter">
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
        return "1st Floor\nLounge";
      case "2":
        return "2nd Floor\nDance Floor";
      case "3":
        return "Basement\nNightclub";
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

        <h2 className='pageTitle'>My Orders</h2>

        <Link href='/search' className='icon_only'>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_10_112)">
              <mask
                id="mask0_10_112"
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="24"
                height="24"
              >
                <path d="M24 0H0V24H24V0Z" fill="white" />
              </mask>
              <g mask="url(#mask0_10_112)">
                <path
                  d="M10.5691 0C4.74145 0 0 4.74145 0 10.5691C0 16.3971 4.74145 21.1382 10.5691 21.1382C16.3971 21.1382 21.1382 16.3971 21.1382 10.5691C21.1382 4.74145 16.3971 0 10.5691 0ZM10.5691 19.187C5.81723 19.187 1.95122 15.321 1.95122 10.5691C1.95122 5.81728 5.81723 1.95122 10.5691 1.95122C15.321 1.95122 19.187 5.81723 19.187 10.5691C19.187 15.321 15.321 19.187 10.5691 19.187Z"
                  fill="#28303F"
                />
                <path
                  d="M23.714 22.3347L18.1205 16.7412C17.7393 16.36 17.1221 16.36 16.7409 16.7412C16.3598 17.122 16.3598 17.7399 16.7409 18.1207L22.3344 23.7142C22.4249 23.805 22.5324 23.8769 22.6508 23.926C22.7692 23.975 22.8961 24.0002 23.0242 24.0001C23.1523 24.0002 23.2792 23.975 23.3976 23.9259C23.516 23.8769 23.6235 23.8049 23.714 23.7142C24.0951 23.3334 24.0951 22.7155 23.714 22.3347Z"
                  fill="#28303F"
                />
              </g>
            </g>
            <defs>
              <clipPath id="clip0_10_112">
                <rect width="24" height="24" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </Link>
      </header>

      <section className="pageWrapper hasHeader hasFooter">
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
      <BottomNavigation />
    </>
  );
}
