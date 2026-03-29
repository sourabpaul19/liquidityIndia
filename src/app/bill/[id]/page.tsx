"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface LineItem {
  uid: string;
  name: string;
  quantity: string;
  base_price_money: {
    amount: number;
    currency: string;
  };
}

interface Order {
  id: string;
  line_items: LineItem[];
  total_money: {
    amount: number;
  };
  total_tax_money?: {
    amount: number;
  };
}

export default function BillPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [outlet, setOutlet] = useState<any>(null);
  const [tableNo, setTableNo] = useState("");

  /* ------------------ Fetch Outlet + Table ------------------ */

  useEffect(() => {
    const shop = localStorage.getItem("selected_shop");
    const table = localStorage.getItem("table_number");

    if (shop) {
      setOutlet(JSON.parse(shop));
    }

    if (table) {
      setTableNo(table);
    }
  }, []);

  /* ------------------ Fetch Square Order ------------------ */

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;

    try {
      const res = await fetch(
        `https://dev2024.co.in/web/liquidity-backend/admin/api/getSquareOrder/${orderId}`
      );

      const data = await res.json();

      if (data.order) {
        setOrder(data.order);
      } else {
        setOrder(null);
      }
    } catch (err) {
      console.error(err);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  /* ------------------ Download PDF ------------------ */

  const handleDownload = async () => {
    const element = document.getElementById("receipt");

    if (!element) return;

    const canvas = await html2canvas(element);

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
    pdf.save(`bill-${orderId}.pdf`);
  };

  // const handleBack = () => {
  //   router.push("/my-table");
  // };

  const handleBack = () => {
    router.back();
  };

  if (loading) return <p style={{ padding: 20 }}></p>;
  if (!order) return <p style={{ padding: 20 }}>Order not found</p>;

  /* ------------------ Calculations ------------------ */

  const subtotal =
    order.line_items?.reduce((sum, item) => {
      const price = item.base_price_money.amount / 100;
      return sum + price * Number(item.quantity);
    }, 0) || 0;

  const tax = (order.total_tax_money?.amount || 0) / 100;

  const total = subtotal + tax;

  return (
    <>
      {/* Header */}
      <header className="header">
        <button type="button" className="icon_only" onClick={handleBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 6L9 12L15 18"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="pageTitle">View Bill</div>
        <button type="button" className="icon_only"></button>
      </header>

      {/* Receipt */}
        <section className="pageWrapper hasHeader">
      <div
        id="receipt"
        style={{
          padding: 20,
          maxWidth: 500,
          margin: "auto",
          background: "#fff"
        }}
      >
        {/* Outlet */}

        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <h2 style={{ fontWeight: "bold" }}>{outlet?.name}</h2>
          <p>Table No: {tableNo}</p>
          <p>Order ID: {orderId}</p>
          <p>{new Date().toLocaleString()}</p>
        </div>

        <hr />

        {/* Items */}

        <div style={{ marginTop: 15 }}>
          {order.line_items?.map((item) => {
            const price = item.base_price_money.amount / 100;
            const lineTotal = price * Number(item.quantity);

            return (
              <div
                key={item.uid}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6
                }}
              >
                <span>
                  {item.name} x {item.quantity}
                </span>
                <span>₹{lineTotal.toFixed(2)}</span>
              </div>
            );
          })}
        </div>

        <hr style={{ margin: "12px 0" }} />

        {/* Subtotal */}

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <strong>Subtotal</strong>
          <strong>₹{subtotal.toFixed(2)}</strong>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Tax</span>
          <span>₹{tax.toFixed(2)}</span>
        </div>

        <hr style={{ margin: "12px 0" }} />

        {/* Total */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 18,
            fontWeight: "bold"
          }}
        >
          <span>Total</span>
          <span>₹{total.toFixed(2)}</span>
        </div>

        <hr style={{ margin: "12px 0" }} />

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <p>Thank you for visiting!</p>
        </div>
      </div>

      {/* Download Button */}

      <div style={{ padding: 20 }}>
        <button
          onClick={handleDownload}
          className="mt-6 bg-primary text-white px-6 py-3 rounded-lg w-full max-w-sm"
        >
          Download Receipt
        </button>
      </div>
      </section>
    </>
  );
}