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

  const getFormattedDate = (date: string) => {
    if (!date) return "N/A";

    const parsedDate = new Date(date.replace(" ", "T"));
    if (isNaN(parsedDate.getTime())) return date;

    return parsedDate.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  return (
    <>
      <Header title="Redeem and Balance" />

      <section className="pageWrapper hasHeader hasFooter">
        <div className="pageContainer py-4">


          {loading ? (
            <div className="text-center py-10 text-gray-500">Loading vault items...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10 text-gray-500">No vault orders found</div>
          ) : (
            <div className="px-4 flex flex-col gap-4">
              {orders.map((order) => {
                const expired = isExpired(order.end_date);
                const noBalance = Number(order.balance_quantity) <= 0;

                return (
                  <div key={order.id} className={styles.vaultCard}>
                    <div className="flex gap-3">
                      <figure className="relative w-[72px] h-[110px] rounded overflow-hidden flex-shrink-0 bg-[#f7f1e8]">
                        <Image
                          src={order.product_image || "/images/bar.jpg"}
                          alt={order.product_name || "Product"}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </figure>

                      <div className="flex-1 min-w-0">
                        <h5 className={styles.title}>{order.product_name}</h5>

                        <p className={styles.metaText}>
                          Order ID: <span>{order.unique_id}</span>
                        </p>

                        <p className={styles.metaText}>
                          Category: <span>{order.category_name}</span>
                        </p>

                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className={styles.metaText}>
                            Price: <span>${order.total_amount}</span>
                          </p>

                          <p className={styles.dateText}>
                            DATE: {getFormattedDate(order.order_date)}
                          </p>
                        </div>

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

                        <div className="flex gap-2 mt-3">
                          <Link
  href={!expired && !noBalance ? `/vault-redeem/${order.id}` : "#"}
  className={`${styles.actionBtn} ${expired || noBalance ? styles.disabledBtn : ""}`}
>
  Redeem
</Link>

                          <Link
                            href={!expired ? `/viewbalance/${order.id}` : "#"}
                            className={`${styles.actionBtn} ${
                              expired ? styles.disabledBtn : ""
                            }`}
                          >
                            View Balance
                          </Link>
                        </div>
                      </div>
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