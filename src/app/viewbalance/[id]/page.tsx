"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./viewbalance.module.scss";
import Header from "@/components/common/Header/Header";
import BottomNavigation from "@/components/common/BottomNavigation/BottomNavigation";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

interface RedeemHistory {
  quantiy: number;
  shop_name?: string;
  redeem_date?: string;
  quantity?: string | number;
}

interface VaultItem {
  id: string; // must be vault_orders.id
  vault_order_id?: string;
  product_id?: string;
  product_name: string;
  product_image: string;
  total_amount?: string | number;
  order_date: string;
  end_date: string;
  quantity: string | number;
  total_quantity_used: string | number;
  balance_quantity: string | number;
  has_renewed?: string;
  order_id?: string;
  price?: string | number;
  redeems?: RedeemHistory[];
}

export default function ViewBalancePage() {
  const router = useRouter();
  const [item, setItem] = useState<VaultItem | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("balance");
    if (stored) {
      const parsed = JSON.parse(stored);

      setItem({
        ...parsed,
        vault_order_id: parsed.vault_order_id || parsed.id,
      });
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.Razorpay) return;

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
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

  const canRenewVault = () => {
    if (!item) return false;

    if (item.has_renewed === "1") {
      alert("You have already renewed your vault");
      return false;
    }

    const today = new Date();
    const endDate = new Date(item.end_date);

    if (endDate >= today) {
      const timeDiff = Math.abs(endDate.getTime() - today.getTime());
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (daysDiff <= 5) return true;

      alert("You can't renew your vault");
      return false;
    }

    return true;
  };

  const handleRenew = async () => {
    if (!item || isRenewing) return;

    const allowed = canRenewVault();
    if (!allowed) return;

    if (typeof window === "undefined" || !window.Razorpay) {
      alert("Razorpay not loaded. Please refresh and try again.");
      return;
    }

    setIsRenewing(true);

    try {
      const vaultOrderId = item.order_id || item.id;
      const amount = (Number(item.total_amount || 0) * 10) / 100;
      const amountInPaise = Math.round(amount * 100);

      console.log("Renew using vault_order_id:", vaultOrderId);

      const orderRes = await fetch("/api/razorpay/renew-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountInPaise,
          receipt: `vault_renew_${vaultOrderId}_${Date.now()}`,
          notes: {
            vault_order_id: vaultOrderId,
            type: "vault_renewal",
          },
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData?.success) {
        alert(orderData?.message || "Unable to create payment order");
        setIsRenewing(false);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amountInPaise,
        currency: "INR",
        name: "Liquidity India",
        description: `Renew ${item.product_name}`,
        order_id: orderData.order.id,
        handler: async function (response: any) {
          console.log("Razorpay success response:", response);

          try {
            const verifyRes = await fetch("/api/razorpay/renew-verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
              alert(verifyData?.message || "Payment verification failed");
              setIsRenewing(false);
              return;
            }

            const renewPayload = {
              id: vaultOrderId,
              amount: amount,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
            };

            console.log("Renew payload:", renewPayload);

            const renewRes = await fetch("/api/renew-vault", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(renewPayload),
            });

            const renewData = await renewRes.json();
            console.log("Renew API response:", renewData);

            if (renewData.status === "1") {
              alert(renewData.message || "Vault renewed successfully");
              localStorage.removeItem("balance");
              router.back();
            } else {
              alert(renewData.message || "Payment done but renewal failed");
            }
          } catch (error) {
            console.error("Renew after payment error:", error);
            alert("Payment succeeded, but renewal failed. Please contact support.");
          } finally {
            setIsRenewing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsRenewing(false);
          },
        },
        theme: {
          color: "#16a34a",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Razorpay renew error:", error);
      alert("Something went wrong while starting payment");
      setIsRenewing(false);
    }
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
                <p><strong>Total Unit</strong><span>{item.quantity}</span></p>
                <p><strong>Total Unit Used</strong><span>{item.total_quantity_used}</span></p>
                <p><strong>Remaining Unit</strong><span>{item.balance_quantity}</span></p>
                <p><strong>Valid up to</strong><span>{getFormattedDate(item.end_date)}</span></p>
                {item.has_renewed === "1" && (
                  <p className="text-green-600"><strong>Status:</strong> Already Renewed</p>
                )}
              </figcaption>
            </div>

            <div>
              <h5 className="mb-4">Redeem History</h5>
              {!item.redeems || item.redeems.length === 0 ? (
                <p className={styles.emptyText}>There is no redeem history</p>
              ) : (
                <div className={`${styles.redeemTable} relative overflow-x-auto`}>
                  <table className="w-full text-sm text-left">
                    <thead className="text-sm bg-neutral-secondary-medium">
                      <tr>
                        <th className="py-2 font-medium">Outlet Name</th>
                        <th className="py-2 font-medium text-center">Redeem Date</th>
                        <th className="py-2 font-medium text-center">Redeem Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.redeems.map((redeem, index) => (
                        <tr key={index}>
                          <th className="py-2 font-medium">{redeem.shop_name || "Shop"}</th>
                          <td className="py-2 text-center">{getFormattedDate(redeem.redeem_date || "N/A")}</td>
                          <td className="py-2 text-center">{redeem.quantiy || 0}</td>
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
              type="button"
              onClick={handleRenew}
              disabled={isRenewing || item.has_renewed === "1"}
              className={`bg-green-600 px-4 py-3 rounded-lg w-full text-white ${
                isRenewing || item.has_renewed === "1" ? styles.disabledBtn : ""
              }`}
            >
              {isRenewing ? "Processing..." : "Renew Item"}
            </button>

            <button
              type="button"
              onClick={handleRedeem}
              disabled={isExpired || noBalance}
              className={`bg-primary px-4 py-3 rounded-lg w-full text-white ${
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