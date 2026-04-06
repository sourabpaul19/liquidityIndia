"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/common/Header/Header";
import BottomNavigation from "@/components/common/BottomNavigation/BottomNavigation";
import styles from "../vault-redeem.module.scss";

interface VaultShop {
  id: string;
  name: string;
  image: string;
  address: string;
  email?: string;
  phone?: string;
}

interface VaultItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  unique_id: string;
  vault_category_id: string;
  price: string;
  quantity: string;
  total_amount: string;
  order_date: string;
  end_date: string;
  category_name: string;
  total_quantity_used: number;
  balance_quantity: number;
  vault_shops: VaultShop[];
  redeems: any[];
}

export default function VaultRedeemPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const orderId = params?.id || "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderDetails, setOrderDetails] = useState<VaultItem | null>(null);
  const [itemCount, setItemCount] = useState(1);
  const [selectedShopId, setSelectedShopId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [todayDate, setTodayDate] = useState("");

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const userId = localStorage.getItem("user_id");

        if (!userId || !orderId) {
          setLoading(false);
          return;
        }

        const res = await fetch(
          `https://dev2024.co.in/web/liquidity-india-backend/admin/api/fetchUserVaultItems/${userId}`
        );
        const data = await res.json();

        if (data?.status === "1" && Array.isArray(data?.products)) {
          const selectedOrder = data.products.find(
            (item: VaultItem) => String(item.id) === String(orderId)
          );

          if (selectedOrder) {
            setOrderDetails(selectedOrder);

            if (selectedOrder.vault_shops?.length > 0) {
              setSelectedShopId(String(selectedOrder.vault_shops[0].id));
            }

            const initialCount =
              Number(selectedOrder.balance_quantity) > 0 ? 1 : 0;
            setItemCount(initialCount);
          }
        }

        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const hh = String(now.getHours()).padStart(2, "0");
        const min = String(now.getMinutes()).padStart(2, "0");

        const currentDate = `${yyyy}-${mm}-${dd}`;
        setTodayDate(currentDate);
        setSelectedDate(currentDate);
        setSelectedTime(`${hh}:${min}`);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId]);

  const maxUnits = useMemo(() => {
    if (!orderDetails) return 0;
    return Math.min(10, Number(orderDetails.balance_quantity || 0));
  }, [orderDetails]);

  const fillPercent = useMemo(() => {
    if (!maxUnits || itemCount <= 0) return 0;
    return Math.min(88, Math.max(10, (itemCount / maxUnits) * 88));
  }, [itemCount, maxUnits]);

  const formattedExpiryDate = useMemo(() => {
    if (!orderDetails?.end_date) return "";
    return new Date(orderDetails.end_date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [orderDetails]);

  const maxDateForInput = useMemo(() => {
    if (!orderDetails?.end_date) return "";
    return orderDetails.end_date.split(" ")[0];
  }, [orderDetails]);

  const handleMinus = () => {
    setItemCount((prev) => Math.max(0, prev - 1));
  };

  const handlePlus = () => {
    setItemCount((prev) => Math.min(maxUnits, prev + 1));
  };

  const handleConfirm = async () => {
  if (!itemCount || !selectedShopId || !selectedDate || !selectedTime) {
    alert("Please fill all required fields");
    return;
  }

  if (!orderDetails) return;

  setSubmitting(true);

  try {
    const payload = {
      order_id: orderDetails.id,
      quantiy: itemCount,
      shop_id: selectedShopId,
      user_id: localStorage.getItem("user_id"),
      redeem_date: selectedDate,
      redeem_time: selectedTime,
    };

    const res = await fetch("/api/vault/redeem", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (result?.status === "1") {
      alert(result.message || "Redeem successful!");
      router.push("/vault");
    } else {
      alert(result.message || "Redeem failed");
    }
  } catch (error) {
    console.error("Redeem error:", error);
    alert("Network error. Please try again.");
  } finally {
    setSubmitting(false);
  }
};

  if (loading) {
    return (
      <>
        <Header title="Redeem" />
        <div className={styles.loaderWrap}>
          <div className={styles.loader}></div>
          <p>Loading order details...</p>
        </div>
      </>
    );
  }

  if (!orderDetails) {
    return (
      <>
        <Header title="Redeem" />
        <div className={styles.emptyState}>
          <p>No order found with ID: {orderId}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Redeem" />
      <section className={`pageWrapper hasHeader hasFooter`}>
      <main className={styles.page}>
        <section className={styles.heroCard}>
          <div className={styles.heroLeft}>
            <div className={styles.productText}>
              <h1 className={styles.productTitle}>{orderDetails.product_name}</h1>

              <div className={styles.metaList}>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Order id</span>
                  <span className={styles.value}>{orderDetails.unique_id}</span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.label}>Selected units</span>
                  <span className={styles.value}>{itemCount}</span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.label}>Remaining units</span>
                  <span className={styles.value}>
                    {orderDetails.balance_quantity} units
                  </span>
                </div>

                <div className={styles.infoRow}>
                  <span className={styles.label}>Valid until</span>
                  <span className={styles.value}>{formattedExpiryDate}</span>
                </div>
              </div>

              <div className={styles.quantityControl}>
                <button
                  type="button"
                  className={styles.qtyBtn}
                  onClick={handleMinus}
                  disabled={itemCount <= 0}
                >
                  -
                </button>

                <span key={itemCount} className={styles.qtyValue}>
                  {itemCount}
                </span>

                <button
                  type="button"
                  className={styles.qtyBtn}
                  onClick={handlePlus}
                  disabled={itemCount >= maxUnits}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.bottleWrap}>
              <div className={styles.bottleVisual}>
                <div
                  className={styles.liquidFill}
                  style={{ height: `${fillPercent}%` }}
                />
                <div className={styles.bottleGlow}></div>
                {/* <Image
                  src={orderDetails.product_image}
                  alt={orderDetails.product_name}
                  fill
                  className={styles.bottleImage}
                  sizes="140px"
                  unoptimized
                /> */}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.sectionBlock}>
          <h2 className={styles.sectionTitle}>Select outlet to redeem</h2>

          <div className={styles.outletList}>
            {orderDetails.vault_shops.map((shop) => (
              <label
                key={shop.id}
                className={`${styles.outletCard} ${
                  selectedShopId === String(shop.id) ? styles.outletCardActive : ""
                }`}
              >
                <input
                  type="radio"
                  name="outlet"
                  value={shop.id}
                  checked={selectedShopId === String(shop.id)}
                  onChange={() => setSelectedShopId(String(shop.id))}
                  className={styles.hiddenRadio}
                />

                <div className={styles.outletImageWrap}>
                  <Image
                    src={shop.image}
                    alt={shop.name}
                    fill
                    className={styles.outletImage}
                    unoptimized
                  />
                </div>

                <div className={styles.outletText}>
                  <div className={styles.outletName}>{shop.name}</div>
                  <div className={styles.outletAddress}>{shop.address}</div>
                </div>
              </label>
            ))}
          </div>
        </section>

        <section className={styles.sectionBlock}>
          <h2 className={styles.sectionTitle}>Booking details</h2>

          <div className={styles.dateTimeRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Date</label>
              <input
                type="date"
                value={selectedDate}
                min={todayDate}
                max={maxDateForInput}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={styles.inputField}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Time</label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className={styles.inputField}
              />
            </div>
          </div>
        </section>
      </main>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInfo}>
          <div className={styles.footerCount}>{itemCount} item in cart</div>
          <div className={styles.footerSub}>30 ounce per unit</div>
        </div>

        <button
          type="button"
          className={styles.confirmBtn}
          onClick={handleConfirm}
          disabled={!itemCount || !selectedShopId || submitting}
        >
          {submitting ? "Processing..." : "Confirm Booking"}
          <span className={styles.arrow}>→</span>
        </button>
      </footer>
        
      <BottomNavigation />
    </>
  );
}