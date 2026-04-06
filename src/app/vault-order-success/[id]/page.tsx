"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import BottomNavigation from "@/components/common/BottomNavigation/BottomNavigation";
import styles from "./VaultOrderSuccess.module.css";
import Image from "next/image";
import done from "../../../../public/images/done.png";

type VaultShop = {
  id: string;
  name: string;
  vault_category_id: string | number;
};

type OrderProduct = {
  id?: string;
  product_name: string;
  quantity: string | number;
  price: string | number;
  vault_category_id?: string | number;
  vault_shops?: VaultShop[];
};

type VaultOrder = {
  mobile: string;
  name: string;
  unique_id: string;
  payment_type: string | number;
  created_at: string;
  validTill?: string;
  Outlet_name?: string;
  total_amount: string | number;
  tax_amount: string | number;
  products: OrderProduct[];
};

type UserDetails = {
  name?: string;
  email?: string;
  mobile?: string;
};

function formatDate(dateInput?: string) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatTime(dateInput?: string) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function addDays(dateInput?: string, days = 30) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function formatAmount(value: string | number | undefined) {
  return Number(value || 0).toFixed(2);
}

export default function VaultOrderSuccessPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const orderId = params?.id;

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserDetails>({});
  const [orderDetails, setOrderDetails] = useState<VaultOrder | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);

    const userData = JSON.parse(localStorage.getItem("userDetails") || "{}");
    setUser(userData);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!orderId) {
      setLoading(false);
      setError("Order ID not found");
      return;
    }

    fetchVaultOrderHistoryDetails(orderId);
  }, [mounted, orderId]);

  const fetchVaultOrderHistoryDetails = async (id: string) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/vault/vault-order-details/${id}`, {
        method: "GET",
        cache: "no-store",
      });

      const res = await response.json();

      if (res?.status === 1 && res?.vault_order) {
        const order = res.vault_order as VaultOrder;

        order.validTill = addDays(order.created_at, 30);

        const firstProduct = order.products?.[0];
        const matchedShop = firstProduct?.vault_shops?.find(
          (shop) =>
            String(shop.vault_category_id) ===
            String(firstProduct?.vault_category_id || "")
        );

        order.Outlet_name = matchedShop?.name || "";
        setOrderDetails(order);
      } else {
        setOrderDetails(null);
        setError(res?.message || "Unable to fetch order details");
      }
    } catch (error) {
      setOrderDetails(null);
      setError("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const paymentLabel = useMemo(() => {
    if (!orderDetails) return "";
    return String(orderDetails.payment_type) === "1" ? "Online" : "Wallet";
  }, [orderDetails]);

  const handleBackClick = () => {
    router.back();
  };

  const gotoVaultHome = () => {
    router.push("/vault");
  };

  if (!mounted) return null;

  return (
    <>
      <header className="header">
        <button className="icon_only" onClick={handleBackClick} aria-label="Go back">
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

        <h2 className="pageTitle">Order Success</h2>

        <button className="icon_only" onClick={gotoVaultHome} aria-label="Go to vault">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 10.5L12 3L21 10.5V21H14.25V15H9.75V21H3V10.5Z"
              stroke="black"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </header>

      <section className="pageWrapper hasHeader hasFooter">
        <div className="pageContainer">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4">
            <div>
              <div className={styles.successHero}>
                <Image src={done} alt="Order placed successfully"
                  className={styles.successIcon} width={60} height={60} />
                <h2>Hurrah!</h2>
                <p>Your Order has been Successfully Placed</p>
              </div>

              <h5 className="mb-4">Order Details</h5>
              <div className={styles.historyBlock}>
                <div className={styles.faqItem}>
                  <p>Date</p>
                  <h5>{formatDate(orderDetails?.created_at)}</h5>
                </div>

                <div className={styles.faqItem}>
                  <p>Time</p>
                  <h5>{formatTime(orderDetails?.created_at)}</h5>
                </div>

                <div className={styles.faqItem}>
                  <p>Payment Mode</p>
                  <h5>{paymentLabel}</h5>
                </div>

                <div className={styles.faqItem}>
                  <p>Order ID</p>
                  <h5>{orderDetails?.unique_id}</h5>
                </div>

                <div className={styles.faqItem}>
                  <p>Valid Till</p>
                  <h5>{formatDate(orderDetails?.validTill)}</h5>
                </div>

                <div className={styles.faqItem}>
                  <p>Category Outlet</p>
                  <h5>{orderDetails?.Outlet_name || "-"}</h5>
                </div>

                <div className={styles.faqItem}>
                  <p>Status</p>
                  <h5>Confirmed</h5>
                </div>
              </div>

              <h5 className="mb-4">Items</h5>
              <div className={styles.historyBlock}>
                {Array.isArray(orderDetails?.products) &&
                orderDetails.products.length > 0 ? (
                  orderDetails.products.map((item, index) => (
                    <div key={item.id || `${item.product_name}-${index}`} className={styles.orderItem}>
                      <div>
                        <h5>
                          {item.quantity} × {item.product_name}
                        </h5>
                      </div>
                      <div>
                        <h5>₹{formatAmount(item.price)}</h5>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={styles.emptyText}>No items found for this order.</p>
                )}
              </div>
            </div>

            <div>
              <h5 className="mb-4">Order Summary</h5>
              <div className={styles.historyBlock}>
                <div className={styles.faqItem}>
                  <p>Subtotal</p>
                  <h5>₹{formatAmount(orderDetails?.total_amount)}</h5>
                </div>

                <div className={styles.faqItem}>
                  <p>Taxes & Charges</p>
                  <h5>₹{formatAmount(orderDetails?.tax_amount)}</h5>
                </div>

                <div className={styles.faqItem}>
                  <p>Total and Paid</p>
                  <h5>₹{formatAmount(orderDetails?.total_amount)}</h5>
                </div>

                <div className={styles.row}>
                  <div className={styles.totalItem}>
                    <h5>Liquidity Order Code</h5>
                    <h5>{orderDetails?.unique_id}</h5>
                  </div>
                </div>
              </div>

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

              <button className={styles.primaryButton} onClick={gotoVaultHome}>
                Place a new order
              </button>
            </div>
          </div>
        </div>
      </section>

      <BottomNavigation />
    </>
  );
}