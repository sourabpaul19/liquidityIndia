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
  const [minTime, setMinTime] = useState("");

  const getCurrentDateTimeParts = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");

    return {
      currentDate: `${yyyy}-${mm}-${dd}`,
      currentTime: `${hh}:${min}`,
    };
  };

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const userId = localStorage.getItem("user_id");

        const { currentDate, currentTime } = getCurrentDateTimeParts();
        setTodayDate(currentDate);
        setSelectedDate(currentDate);
        setSelectedTime(currentTime);
        setMinTime(currentTime);

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

            const remainingQty = Math.max(
              0,
              Number(selectedOrder.quantity || 0) -
                Number(selectedOrder.total_quantity_used || 0)
            );

            const initialCount = remainingQty > 0 ? 1 : 0;
            setItemCount(initialCount);
          }
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId]);

  useEffect(() => {
    const { currentDate, currentTime } = getCurrentDateTimeParts();

    setTodayDate(currentDate);

    if (selectedDate === currentDate) {
      setMinTime(currentTime);

      if (selectedTime && selectedTime < currentTime) {
        setSelectedTime(currentTime);
      }
    } else {
      setMinTime("00:00");
    }
  }, [selectedDate, selectedTime]);

  const totalUnits = useMemo(() => {
    if (!orderDetails) return 0;
    return Math.max(0, Number(orderDetails.quantity || 0));
  }, [orderDetails]);

  const alreadyUsedUnits = useMemo(() => {
    if (!orderDetails) return 0;
    return Math.max(0, Number(orderDetails.total_quantity_used || 0));
  }, [orderDetails]);

  const availableUnits = useMemo(() => {
    return Math.max(0, totalUnits - alreadyUsedUnits);
  }, [totalUnits, alreadyUsedUnits]);

  const remainingAfterRedeem = useMemo(() => {
    return Math.max(0, availableUnits - itemCount);
  }, [availableUnits, itemCount]);

  const bottleFillPercent = useMemo(() => {
    if (!totalUnits) return 0;
    return (remainingAfterRedeem / totalUnits) * 100;
  }, [remainingAfterRedeem, totalUnits]);

  const formattedExpiryDate = useMemo(() => {
    if (!orderDetails?.end_date) return "";
    return new Date(orderDetails.end_date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
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
    setItemCount((prev) => Math.min(availableUnits, prev + 1));
  };

  const handleConfirm = async () => {
    if (!itemCount || !selectedShopId || !selectedDate || !selectedTime) {
      alert("Please fill all required fields");
      return;
    }

    if (!orderDetails) return;

    const now = new Date();
    const selectedDateTime = new Date(`${selectedDate}T${selectedTime}`);

    if (selectedDateTime <= now) {
      alert("Past date and time are not allowed");
      return;
    }

    if (maxDateForInput && selectedDate > maxDateForInput) {
      alert("Selected date is beyond expiry date");
      return;
    }

    if (itemCount > availableUnits) {
      alert("Selected quantity exceeds remaining units");
      return;
    }

    setSubmitting(true);

    try {
      const payload = new URLSearchParams({
        order_id: String(orderDetails.id),
        quantiy: String(itemCount),
        shop_id: String(selectedShopId),
        user_id: String(localStorage.getItem("user_id") || ""),
        redeem_date: String(selectedDate),
        redeem_time: String(selectedTime),
      });

      const res = await fetch("/api/vault/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        body: payload.toString(),
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

      <section className="pageWrapper hasHeader hasFooter">
        <div className="pageContainer">
          <section className={styles.heroCard}>
            <div className={styles.heroBg}></div>
            <div className={styles.heroOverlay}></div>

            <div className={styles.heroContent}>
              <div className={styles.heroLeft}>
                <h1 className={styles.productTitle}>
                  {orderDetails.product_name}
                </h1>

                <div className={styles.metaList}>
                  <div className={styles.infoBlock}>
                    <span className={styles.infoLabel}>Order id</span>
                    <span className={styles.infoValue}>{orderDetails.unique_id}</span>
                  </div>

                  

                  <div className={styles.infoBlock}>
                    <span className={styles.infoLabel}>Valid upto</span>
                    <span className={styles.infoValue}>{formattedExpiryDate}</span>
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

                  <span className={styles.qtyValue}>{itemCount}</span>

                  <button
                    type="button"
                    className={styles.qtyBtn}
                    onClick={handlePlus}
                    disabled={itemCount >= availableUnits}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className={styles.heroRight}>
                <div className={styles.bottleWrap}>
                  <div className={styles.bottleNeck}></div>

                  <div className={styles.bottleBody}>
                    <div
                      className={styles.bottleLiquid}
                      style={{ height: `${bottleFillPercent}%` }}
                    />
                    <div className={styles.bottleGlass}></div>
                  </div>

                  <div className={styles.bottleBottom}></div>
                </div>
              </div>

              <div className="text-right">
                <div className={styles.metaList}>
                <div className={styles.infoBlock}>
                    <span className={styles.infoLabel}>Selected Units</span>
                    <span className={styles.infoValue}>{itemCount}</span>
                  </div>

                  <div className={styles.infoBlock}>
                    <span className={styles.infoLabel}>Total Units</span>
                    <span className={styles.infoValue}>{totalUnits}</span>
                  </div>

                  <div className={styles.infoBlock}>
                    <span className={styles.infoLabel}>Used Units</span>
                    <span className={styles.infoValue}>{alreadyUsedUnits}</span>
                  </div>

                  <div className={styles.infoBlock}>
                    <span className={styles.infoLabel}>Remaining Units</span>
                    <span className={styles.infoValue}>{remainingAfterRedeem}</span>
                  </div>
                  </div>
              </div>
            </div>
          </section>

          <section className={styles.sectionCard}>
            <h5 className='mb-4'>Select the outlet to redeem</h5>

            <div className={styles.outletList}>
              {orderDetails.vault_shops.map((shop) => (
                <label
                  key={shop.id}
                  className={`${styles.outletCard} ${
                    selectedShopId === String(shop.id)
                      ? styles.outletCardActive
                      : ""
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
                      sizes="100vw"
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

          <section className={`mb-[86px] ${styles.sectionCard}`}>
            <h5 className="mb-4">BOOKING DETAILS</h5>

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
                  min={selectedDate === todayDate ? minTime : "00:00"}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className={styles.inputField}
                />
              </div>
            </div>
          </section>
        </div>
      </section>

      <div className={styles.bottomButton}>
        <button className="px-4 py-3 rounded-lg w-full text-white flex justify-between items-center bg-primary" onClick={handleConfirm}
          disabled={!itemCount || !selectedShopId || submitting}>
          <div className="min-w-0 text-left">
            <p className="text-[10px] leading-tight text-white">
                  {itemCount} item in cart
                </p>

                <p className="text-sm leading-tight text-white">
                  30 ounce per unit
                </p>
          </div>
          <span>
                {submitting ? "Processing..." : "Confirm Booking"}
              </span>
        </button>
      </div>



      <BottomNavigation />
    </>
  );
}