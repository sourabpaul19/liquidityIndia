"use client";

import React, { useEffect } from "react";
import styles from "./order-choose.module.scss";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Choose() {
  const router = useRouter();

  // Check login + routing on page load
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) return;

    const shopId = localStorage.getItem("shop_id");
    const tableNumber = localStorage.getItem("table_number");
    const orderType = localStorage.getItem("order_type");

    if (shopId && tableNumber) {
      // ex: /restaurant/33?table=4
      router.replace(`/restaurant/${shopId}?table=${tableNumber}`);
    } else if (shopId && orderType === "bar") {
      // ex: /restaurant/33
      router.replace(`/restaurant/${shopId}`);
    } else {
      // default logged‑in route
      router.replace("/my-table");
    }
  }, [router]);

  const handleBack = () => {
    router.back();
  };

  return (
    <>
      <header className="header">
        <button type="button" className="icon_only" onClick={handleBack}>
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
      </header>

      <section className="pageWrapper">
        <div className={styles.choose_wrapper}>
          <div className={styles.welcomeForm}>
            <h3>Sign In</h3>

            <div className="grid grid-cols-1 mt-7 gap-4">
              <Link
                href="/order-login"
                className="border-primary border px-3 py-3 rounded-lg w-full color-primary text-center"
              >
                Login
              </Link>

              <p className="text-center">or</p>

              <Link
                href="/order-login"
                className="bg-primary px-3 py-3 rounded-lg w-full text-white text-center"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
