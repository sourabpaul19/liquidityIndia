"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import React from "react";
import Image from "next/image";
import logo from "../../../public/images/logo.png";
import google from "../../../public/images/google.png";
import styles from "./login.module.scss";
import Link from "next/link";
import toast from "react-hot-toast";

export default function Login() {
  const router = useRouter();
  const [mobile, setMobile] = useState(""); 
  const [loading, setLoading] = useState(false);

  const handleButtonClick = () => {
    router.back();
  };

  // Auto-add "1" prefix for USA number format
  const handleMobileChange = (e: { target: { value: string } }) => {
    let input = e.target.value.replace(/\D/g, "");

    if (!input.startsWith("91")) {
      input = "91" + input;
    }

    input = input.slice(0, 12);
    setMobile(input);
  };

  // ➤ Get local cart items
  const getLocalCart = () => {
    try {
      return JSON.parse(localStorage.getItem("cart") || "[]");
    } catch {
      return [];
    }
  };

  // ➤ Clear local cart
  const clearLocalCart = () => {
    localStorage.removeItem("cart");
  };

  // LOGIN + TRANSFER CART ITEMS + REDIRECT TO CHECKOUT
  const handleVerify = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (mobile.length !== 12) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    const fullMobile = mobile;

    setLoading(true);

    try {
      const response = await fetch("/api/loginWithOtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: fullMobile }),
      });

      const data = await response.json();
      console.log("API Response:", data);

      if (data.status === "1" || data.status === 1) {
        localStorage.setItem("user_mobile", fullMobile);

        toast.success(data.message || "OTP sent successfully!");

        // ➤ Save user ID (if API returns it)
        if (data.user_id) {
          localStorage.setItem("user_id", data.user_id);
        }

        // ----------------------------------------------
        // ➤ STEP 1: Check if localStorage has cart items
        // ----------------------------------------------
        const localCart = getLocalCart();

        if (localCart.length > 0) {
          console.log("Local Cart Items:", localCart);
          toast.loading("Creating your order...");

          // ➤ STEP 2: Call backend to create order
          const orderRes = await fetch("/api/createOrderFromLocal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mobile: fullMobile,
              items: localCart,
            }),
          });

          const orderData = await orderRes.json();
          console.log("Order Response:", orderData);

          if (orderData.success) {
            toast.success("Order created!");

            // ➤ STEP 3: clear local cart
            clearLocalCart();

            // ➤ STEP 4: go to checkout
            router.push(`/checkout?order_id=${orderData.order_id}`);
            return;
          } else {
            toast.error("Failed to create order. Continue manually.");
          }
        }

        // If no cart → go to OTP Verify page (normal flow)
        router.push("/otp-verify");

      } else {
        toast.error(data.message || "Failed to send OTP. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="header">
        <button type="button" className="icon_only" onClick={handleButtonClick}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path d="M15 6L9 12L15 18"
              stroke="black" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </header>

      <section className="pageWrapper">
        <div className={styles.loginWrapper}>
          <div className={styles.loginForm}>
            <h3>Sign In</h3>

            <div className="grid grid-cols-1 mt-7 gap-4">
              <form onSubmit={handleVerify} className="space-y-4">

                <div className="relative">
                  <input
                    type="text"
                    className={`${styles.textbox} rounded-lg pl-12`}
                    placeholder="Enter Mobile Number"
                    value={mobile ? `+${mobile}` : ""}
                    onChange={handleMobileChange}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary px-3 py-3 rounded-lg w-full text-white"
                >
                  {loading ? "Sending OTP..." : "Push Code"}
                </button>
              </form>

              <p className="text-center">or</p>

              <button
                type="button"
                className={`${styles.loginButton} border flex items-center gap-6 border-gray-900 px-3 py-3 rounded-lg w-full text-gray-900`}
              >
                <Image src={google} alt="Google" width={20} height={20} />
                <span>Sign in with Google</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
