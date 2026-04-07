"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./viewbalance.module.scss";
import Header from "@/components/common/Header/Header";
import BottomNavigation from "@/components/common/BottomNavigation/BottomNavigation";

interface RedeemHistory {
  quantiy: number;
  shop_name?: string;
  redeem_date?: string;
  quantity?: string | number;
}

interface VaultItem {
  id: string;
  product_name: string;
  product_image: string;
  total_amount?: string | number;
  order_date: string;
  end_date: string;
  quantity: string | number;
  total_quantity_used: string | number;
  balance_quantity: string | number;
  redeems?: RedeemHistory[];
}

export default function ViewBalancePage() {
  const router = useRouter();
  const [item, setItem] = useState<VaultItem | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("balance");
    if (stored) {
      setItem(JSON.parse(stored));
    }
  }, []);

  const getFormattedDate = (created_at: string) => {
    if (!created_at || created_at === "N/A") return "N/A";

    const date = new Date(created_at.replace(" ", "T"));
    if (isNaN(date.getTime())) return "N/A";

    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const isExpired = item ? new Date(item.end_date) < new Date() : false;
  const noBalance = item ? Number(item.balance_quantity) <= 0 : true;

  const handleRedeem = () => {
    if (!item || isExpired || noBalance) return;
    router.push(`/vault-redeem/${item.id}`);
  };

  if (!item) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <>
      <Header title="View Balance" />

      <section className="pageWrapper hasHeader hasFooter">
        <div className="pageContainer">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4">
            <div className={styles.productBox}>
              <figure className="relative w-full h-48 rounded overflow-hidden">
                <Image
                  src={item.product_image || "/images/bar.jpg"}
                  alt={item.product_name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </figure>

              <figcaption>
                <h4>{item.product_name}</h4>
                <p>
                  <strong>Total Unit</strong>
                  <span>{item.quantity}</span>
                </p>
                <p>
                  <strong>Total Unit Used</strong>
                  <span>{item.total_quantity_used}</span>
                </p>
                <p>
                  <strong>Remaining Unit</strong>
                  <span>{item.balance_quantity}</span>
                </p>
                <p>
                  <strong>Valid up to</strong>
                  <span>{getFormattedDate(item.end_date)}</span>
                </p>
              </figcaption>
            </div>

            <div>
              <h5 className="mb-4">Redeem History</h5>

              {!item.redeems || item.redeems.length === 0 ? (
                <p className={styles.emptyText}>There is no redeem history</p>
              ) : (
                <div className={`${styles.redeemTable} relative overflow-x-auto`}>
                  <table className="w-full text-sm text-left rtl:text-right text-body">
                    <thead className="text-sm text-body bg-neutral-secondary-medium border-default-medium">
                      <tr>
                        <th scope="col" className="py-2 font-medium">
                          Outlet Name
                        </th>
                        <th scope="col" className="py-2 font-medium text-center">
                          Redeem Date
                        </th>
                        <th scope="col" className="py-2 font-medium text-center">
                          Redeem Unit
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.redeems.map((redeem, index) => (
                        <tr key={index}>
                          <th className="py-2 font-medium text-heading">
                            {redeem.shop_name || "Shop"}
                          </th>
                          <td className="py-2 text-center">
                            {getFormattedDate(redeem.redeem_date || "N/A")}
                          </td>
                          <td className="py-2 text-center">
                            {redeem.quantiy || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.bottomBar}>
          <div className="flex gap-3">
            <button
              className={`bg-green-600 px-4 py-3 rounded-lg w-full text-white ${styles.actionBtn}`}
            >
              Renew Item
            </button>

            <button
              type="button"
              onClick={handleRedeem}
              disabled={isExpired || noBalance}
              className={`bg-primary px-4 py-3 rounded-lg w-full text-white ${styles.actionBtn} ${
                isExpired || noBalance ? styles.disabledBtn : ""
              }`}
            >
              Redeem Item
            </button>
          </div>
        </div>
      </section>

      <BottomNavigation />
    </>
  );
}