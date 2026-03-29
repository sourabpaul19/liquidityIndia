"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./my-orders.module.scss";
import Header from "@/components/common/Header/Header";
import BottomNavigation from "@/components/common/BottomNavigation/BottomNavigation";
import Link from "next/link";

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

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Square status for a specific Square order id
  const fetchSquareStatus = async (
    squareOrderId: string
  ): Promise<string | null> => {
    try {
      const url = `https://dev2024.co.in/web/liquidity-backend/admin/api/getSquareOrderStatus/${squareOrderId}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === "1" && data.square_order_status) {
        return data.square_order_status as string;
      }
      return null;
    } catch (error) {
      console.error(
        `Error fetching Square status for order ${squareOrderId}:`,
        error
      );
      return null;
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const userId = localStorage.getItem("user_id");
        if (!userId) {
          console.error("No user ID found");
          setLoading(false);
          return;
        }

        const res = await fetch(
          `https://dev2024.co.in/web/liquidity-backend/admin/api/orderList/${userId}`
        );
        const data = await res.json();

        if (data.status === "1" && data.orders) {
          const ordersWithSquareStatus = await Promise.all(
            data.orders.map(async (order: Order) => {
              const squareOrderId = order.sqaure_order_id;
              if (!squareOrderId) return order;

              const squareStatus = await fetchSquareStatus(squareOrderId);
              return {
                ...order,
                square_status: squareStatus || order.square_status,
              };
            })
          );

          setOrders(ordersWithSquareStatus);
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Only Square → UI text mapping
  const getOrderStatus = (square_status?: string) => {
    switch (square_status) {
      case "PROPOSED":
        return "Received";
      case "RESERVED":
        return "Preparing";
      case "PREPARED":
        return "Ready";
      case "COMPLETED":
        return "Completed";
      default:
        return "Pending";
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

  return (
    <>
      <Header title="My Orders" />
      <section className="pageWrapper hasHeader hasFooter">
        <div className="pageContainer py-4">
          {loading ? (
            <div className="text-center py-10 text-gray-500">
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No orders found
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
              {orders.map((order) => (
                <div key={order.id} className={styles.orderCard}>
                  <div className="flex gap-4 p-4 justify-between items-center">
                    <figure className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                      <Image
                        src={order.shop?.image || "/images/bar.jpg"}
                        alt={order.shop?.name || "Shop"}
                        fill
                        className="object-cover"
                      />
                    </figure>

                    <div className={styles.orderText + " flex-1"}>
                      <h5>{order.shop?.name}</h5>
                      <p>{getFormattedDate(order.created_at)}</p>
                    </div>

                    <div className="text-right">
                      <h5>${order.total_amount}</h5>
                    </div>
                  </div>

                  <div className={styles.orderBottom}>
                    <div className="text-primary font-medium">
                      {getOrderStatus(order.square_status)}
                    </div>
                    <Link
                      href={`/order-details/${order.id}`}
                      className="text-primary font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      <BottomNavigation />
    </>
  );
}
