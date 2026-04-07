"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, AlertTriangle } from "lucide-react";
import Header from "@/components/common/Header/Header";
import BottomNavigation from "@/components/common/BottomNavigation/BottomNavigation";
import styles from "./vault-order-details.module.scss";

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
}

export default function VaultOrderDetailsPage() {
  const [order, setOrder] = useState<VaultItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const detailsStr = localStorage.getItem('VaultOrderDetails');
    const orderId = localStorage.getItem("order_id");

    if (detailsStr) {
      try {
        const orderData = JSON.parse(detailsStr) as VaultItem;
        setOrder(orderData);
      } catch (error) {
        console.error("Failed to parse order details:", error);
      }
    }

    setLoading(false);
  }, [mounted]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString.replace(" ", "T"));
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const isExpired = (endDate: string) => {
    if (!endDate) return false;
    const today = new Date();
    const end = new Date(endDate.replace(" ", "T"));
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return today > end;
  };


  if (!mounted || loading) {
    return (
      <>
        <Header title="ORDER DETAILS" />
        <section className="pageWrapper hasHeader hasFooter">
          <div className="pageContainer py-8">
            <div className="text-center text-gray-500">Loading order details...</div>
          </div>
        </section>
        <BottomNavigation />
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Header title="ORDER DETAILS" />
        <section className="pageWrapper hasHeader hasFooter">
          <div className="pageContainer py-8">
            <div className="text-center text-red-500 flex flex-col items-center gap-4">
              <AlertTriangle className="w-12 h-12" />
              <div>
                <h3 className="text-lg font-bold">Order not found</h3>
                <p className="text-sm">Please go back and try again</p>
              </div>
            </div>
          </div>
        </section>
        <BottomNavigation />
      </>
    );
  }

  const expired = isExpired(order.end_date);
  const balanceQty = Number(order.balance_quantity || 0);
  const totalQty = Number(order.quantity || 0);
  const usedQty = Number(order.total_quantity_used || 0);

  return (
    <>
      <Header title="Order Summary" />

      <section className="pageWrapper hasHeader hasFooter">
        <div className="pageContainer py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 px-4">
            
            {/* Left Column - Product & Metrics */}
            <div>
              <div className="productSection mb-6">
            
                <h5 className="mb-4">Order Details</h5>

                <div className={styles.metricsGrid}>
                <div className={styles.metricItem}>
                    <span className={styles.metricLabel}>Product Name</span>
                    <span className="metricValue">{order.product_name}</span>
                  </div>
                  <div className={styles.metricItem}>
                    <span className={styles.metricLabel}>Total Quantity</span>
                    <span className="metricValue">{totalQty} units</span>
                  </div>
                  <div className={styles.metricItem}>
                    <span className={styles.metricLabel}>Total Quantity Used</span>
                    <span className="metricValue">{usedQty} units</span>
                  </div>
                  <div className={styles.metricItem}>
                    <span className={styles.metricLabel}>Remaining Quantity</span>
                    <span className={styles.metricValue + (expired ? " text-red-600" : "")}>
                      {balanceQty} units
                    </span>
                  </div>
                  <div className={styles.metricItem}>
                    <span className={styles.metricLabel}>Total Amount</span>
                    <span className="metricValue">₹{order.total_amount}</span>
                  </div>
                </div>

                {expired && (
                  <div className={styles.expiredWarning}>
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span>Vault has expired on {formatDate(order.end_date)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div>
              <h4 className="summaryTitle mb-6">Order Summary</h4>
              
              <div className={styles.summaryList}>
                <div className={styles.summaryItem}>
                  <span>Order Date:</span>
                  <span>{formatDate(order.order_date)}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span>Order End Date:</span>
                  <span>{formatDate(order.end_date)}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span>Liquidity Order Code:</span>
                  <span>{order.unique_id}</span>
                </div>
                {order.category_name && (
                  <div className={styles.summaryItem}>
                    <span>Category:</span>
                    <span>{order.category_name}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      <BottomNavigation />

      
    </>
  );
}