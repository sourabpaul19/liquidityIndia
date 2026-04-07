"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/common/Header/Header";
import BottomNavigation from "@/components/common/BottomNavigation/BottomNavigation";
import styles from "./redeem.module.scss";

interface RedeemHistory {
  shop_name?: string;
  redeem_date?: string;
  quantiy?: string | number;
}

interface VaultShop {
  id?: string;
  name?: string;
  image?: string;
  address?: string;
}

interface VaultItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  unique_id: string;
  category_name: string;
  total_amount: string | number;
  order_date: string;
  end_date: string;
  quantity: string | number;
  total_quantity_used: string | number;
  balance_quantity: string | number;
  vault_shops?: VaultShop[];
  redeems?: RedeemHistory[];
}

export default function VaultPage() {
  const [orders, setOrders] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVaultItems = async () => {
      try {
        const userId = localStorage.getItem("user_id");

        if (!userId) {
          console.error("No user ID found");
          setLoading(false);
          return;
        }

        const res = await fetch(
          `https://dev2024.co.in/web/liquidity-india-backend/admin/api/fetchUserVaultItems/${userId}`
        );

        const data = await res.json();
        console.log("vault api response", data);

        if (data.status === "1" && data.products) {
          setOrders(data.products);
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.error("Error fetching vault items:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVaultItems();
  }, []);

  const isExpired = (endDate: string) => {
    if (!endDate) return false;

    const today = new Date();
    const end = new Date(endDate);

    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    return today > end;
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

  const handleViewBalance = (
    e: React.MouseEvent<HTMLAnchorElement>,
    order: VaultItem
  ) => {
    if (isExpired(order.end_date)) {
      e.preventDefault();
      alert("Your vault has expired");
      return;
    }

    localStorage.setItem("balance", JSON.stringify(order));
  };

  return (
    <>
      <Header title="Redeem and Balance" />

      <section className="pageWrapper hasHeader hasFooter">
        <div className="pageContainer py-4">
          {loading ? (
            <div className="text-center py-10 text-gray-500">
              Loading vault items...
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No vault orders found
            </div>
          ) : (
            <div className="px-4 flex flex-col gap-4">
              {orders.map((order) => {
                const expired = isExpired(order.end_date);
                const noBalance = Number(order.balance_quantity) <= 0;

                return (
                  <div key={order.id} className={styles.orderCard}>
                    <div className="flex gap-4 p-4 justify-between items-center">
                      <figure className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={order.product_image || "/images/bar.jpg"}
                          alt={order.product_name || "Product"}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </figure>

                      <div className={styles.orderText + " flex-1"}>
                        <h5>{order.product_name}</h5>
                        <p>{order.category_name}</p>
                        <p>{getFormattedDate(order.order_date)}</p>

                        {expired && (
                          <p className="text-red-600 text-xs mt-2 font-medium">
                            Your vault has expired
                          </p>
                        )}

                        {!expired && noBalance && (
                          <p className="text-amber-700 text-xs mt-2 font-medium">
                            You do not have enough unit left in your vault to continue.
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <h5>₹{order.total_amount}</h5>
                      </div>
                    </div>

                    <div className={styles.orderBottom}>
                      <Link
                        href={!expired && !noBalance ? `/vault-redeem/${order.id}` : "#"}
                        className={`text-primary font-medium ${
                          expired || noBalance ? styles.disabledBtn : ""
                        }`}
                      >
                        Redeem
                      </Link>

                      <Link
                        href={`/viewbalance/${order.id}`}
                        onClick={(e) => handleViewBalance(e, order)}
                        className={`text-primary font-medium ${
                          expired ? styles.disabledBtn : ""
                        }`}
                      >
                        View Balance
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <BottomNavigation />
    </>
  );
}