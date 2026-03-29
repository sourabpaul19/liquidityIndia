'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import styles from './ongoing-orders.module.scss';
import Header from '@/components/common/Header/Header';
import BottomNavigation from '@/components/common/BottomNavigation/BottomNavigation';

interface Order {
  id: string;
  total_amount: string;
  order_date: string;
  created_at: string;
  square_status?: string;
  sqaure_order_id?: string;
  shop: {
    name: string;
    image: string;
  };
}

export default function OngoingOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Square status for a specific Square order id
  const fetchSquareStatus = async (
    squareOrderId: string
  ): Promise<string | null> => {
    try {
      const url = `https://dev2024.co.in/web/liquidity-backend/admin/api/getSquareOrderStatus/${squareOrderId}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`Square status HTTP ${res.status} for ${squareOrderId}`);
        return null;
      }
      
      const data = await res.json();
      console.log(`Square status for ${squareOrderId}:`, data);

      if (data.status === "1" && data.square_order_status) {
        return data.square_order_status as string;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching Square status for ${squareOrderId}:`, error);
      return null;
    }
  };

  const fetchOngoingOrders = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setRefreshing(true);
    setError(null);
    
    try {
      const userId = localStorage.getItem("user_id");
      console.log('🔄 Fetching orders for user:', userId);
      
      if (!userId) {
        setError("No user ID found. Please login again.");
        if (isInitial) setLoading(false);
        else setRefreshing(false);
        return;
      }

      const res = await fetch(
        `https://dev2024.co.in/web/liquidity-backend/admin/api/orderList/${userId}`,
        { 
          cache: 'no-store',
          next: { revalidate: 0 }
        }
      );
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('📋 Order list response:', data);

      if (data.status === "1" && data.orders && data.orders.length > 0) {
        console.log(`✅ Found ${data.orders.length} orders`);

        // Filter for ongoing orders only (not COMPLETED)
        const ongoingOrders = data.orders.filter((order: any) => {
          const status = order.square_status || 'PENDING';
          const isOngoing = status.toUpperCase() !== 'COMPLETED';
          console.log(`Order ${order.id}: ${status} → ${isOngoing ? 'SHOW' : 'HIDE'}`);
          return isOngoing;
        });

        console.log(`🎯 ${ongoingOrders.length} ongoing orders after filter`);

        // ALWAYS fetch fresh Square status for accurate first load
        const ordersWithSquareStatus = await Promise.all(
          ongoingOrders.map(async (order: Order) => {
            console.log(`🔍 Checking Square status for ${order.id} (${order.sqaure_order_id})`);
            
            let finalStatus = order.square_status || 'PENDING';
            const squareOrderId = order.sqaure_order_id;
            
            if (squareOrderId) {
              const squareStatus = await fetchSquareStatus(squareOrderId);
              if (squareStatus) {
                finalStatus = squareStatus;
                console.log(`✅ Updated ${order.id} to Square status: ${squareStatus}`);
              }
            }
            
            return {
              ...order,
              square_status: finalStatus,
            };
          })
        );

        console.log('🎉 Final orders with status:', ordersWithSquareStatus);
        setOrders(ordersWithSquareStatus);
      } else {
        console.log('❌ No orders found:', data.message || data);
        setOrders([]);
      }
    } catch (error) {
      console.error("❌ Error fetching ongoing orders:", error);
      setError(`Failed to load orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load + fetch Square status immediately
  useEffect(() => {
    fetchOngoingOrders(true);
  }, [fetchOngoingOrders]);

  // 10 second refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOngoingOrders(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchOngoingOrders]);

  const getOrderStatus = (square_status?: string) => {
    const status = (square_status || 'PENDING').toUpperCase();
    switch (status) {
      case "PROPOSED":
        return "Received";
      case "RESERVED":
        return "Preparing";
      case "PREPARED":
        return "Ready";
      case "COMPLETED":
        return "Completed";
      default:
        return "Received";
    }
  };

  const getFormattedDateTime = (created_at: string) => {
    if (!created_at) return "N/A";
    const date = new Date(created_at.replace(" ", "T"));
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) + " | " + date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper to determine correct href based on status
  const getOrderLinkHref = (orderId: string, square_status?: string) => {
    const status = (square_status || 'PENDING').toUpperCase();
    return status === 'COMPLETED' ? `/order-details/${orderId}` : `/order-status/${orderId}`;
  };

  const handleButtonClick = () => {
    router.push("/home");
  };

  if (loading) {
    return (
      <>
        <Header title="Ongoing Orders" />
        <section className="pageWrapper hasHeader">
          <div className='pageContainer'>
            <div className="flex flex-col gap-4 p-4">
              <div className="text-center py-10 text-gray-500">
                Loading ongoing orders...
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <header className='header'>
          <button className='icon_only' onClick={handleButtonClick}>
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
          <h2 className='pageTitle'>Ongoing Orders</h2>
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
      <section className="pageWrapper hasHeader">
        <div className='pageContainer'>
          <div className="flex flex-col gap-4 p-4">
            {/* Error display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                {error}
                <button 
                  onClick={() => fetchOngoingOrders(false)}
                  className="ml-2 underline hover:no-underline"
                >
                  Retry
                </button>
              </div>
            )}

            {orders.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                No ongoing orders
                {refreshing && (
                  <div className="text-xs mt-2 opacity-75">
                    Auto-refreshing every 10 seconds...
                  </div>
                )}
              </div>
            ) : (
              <>
                {orders.map((order) => {
                  const isCompleted = (order.square_status || 'PENDING').toUpperCase() === 'COMPLETED';
                  const href = getOrderLinkHref(order.id, order.square_status);
                  
                  return (
                    <Link 
                      key={order.id} 
                      href={href}
                      className={`${styles.orderCard} flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <figure className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                          <Image
                            src={order.shop?.image || "/images/bar.jpg"}
                            alt={order.shop?.name || "Shop"}
                            fill
                            className="object-cover"
                          />
                        </figure>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-lg truncate">
                            LIQ-{order.id.slice(-6)} - {order.shop?.name || 'Unknown'}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">
                            {getFormattedDateTime(order.created_at)} -{' '}
                            <span className={`font-medium ${isCompleted ? 'text-green-600' : 'text-primary'}`}>
                              {getOrderStatus(order.square_status)}
                            </span>
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={22} color="gray" />
                    </Link>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </section>
      <BottomNavigation />
    </>
  );
}
