"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, FormEvent } from "react";
import styles from "./order-otp-verify.module.scss";
import toast from "react-hot-toast";

interface UserData {
  id: string;
  name: string;
  email: string;
  mobile: string;
  dob?: string;
}

interface OTPResponse {
  status: string | number | boolean;
  message?: string;
  user?: UserData;
}

export default function OTPVerify() {
  const router = useRouter();
  const params = useSearchParams();

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  // Prefill mobile from query or localStorage
  useEffect(() => {
    const phoneParam = params.get("phone");
    const savedMobile =
      typeof window !== "undefined"
        ? localStorage.getItem("user_mobile")
        : null;

    if (phoneParam) setMobile(phoneParam);
    else if (savedMobile) setMobile(savedMobile || "");
  }, [params]);

  const handleBack = () => router.back();

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();

    if (!mobile || !otp) {
      toast.error("Please enter both mobile number and OTP.");
      return;
    }

    setLoading(true);

    try {
      // 1. Verify OTP
      const formData = new URLSearchParams();
      formData.append("mobile", mobile.startsWith("+") ? mobile : mobile);
      formData.append("otp", otp);

      const response = await fetch(
        "https://dev2024.co.in/web/liquidity-backend/admin/api/otpVerification/",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData.toString(),
        }
      );

      const data: OTPResponse = await response.json();
      console.log("otpVerification RESPONSE:", data);

      const ok =
        data.status === "1" || data.status === 1 || data.status === true;

      if (!ok) {
        toast.error(data.message || "Invalid OTP, please try again.");
        return;
      }

      if (!data.user) {
        toast.error("User details missing in response.");
        return;
      }

      toast.success("OTP verified successfully!");
      const user = data.user;

      // 2. Save session in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("user_id", user.id || "");
        localStorage.setItem("user_name", user.name || "");
        localStorage.setItem("user_email", user.email || "");
        localStorage.setItem("user_mobile", user.mobile || mobile);
        localStorage.setItem("user_dob", user.dob || "");
        localStorage.setItem("userData", JSON.stringify(user));
      }

      // 3. Set auth cookie for middleware
      try {
        await fetch("/api/set-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: user.id }),
        });
      } catch (err) {
        console.error("set-session error:", err);
      }

      // 4. ✅ CLEAN NAVIGATION LOGIC
      const profileIncomplete =
        !user.name?.trim() || !user.email?.trim() || !user.dob?.trim();

      if (profileIncomplete) {
        // NEW USER: Complete profile first
        console.log("🆕 NEW USER → /new-account");
        router.push("/order-new-account");
      } else {
        // RETURNING USER: Smart restaurant flow
        if (typeof window !== "undefined") {
          // Get shop context (shop_id OR selected_shop.id)
          const shopRaw = localStorage.getItem("selected_shop");
          const shopId = 
            localStorage.getItem("shop_id") || 
            (shopRaw ? JSON.parse(shopRaw)?.id : null);

          // Get table context (table_number OR table_no)
          const tableNumber = 
            localStorage.getItem("table_number") || 
            localStorage.getItem("table_no") || null;

          if (shopId) {
            if (tableNumber) {
              // Table flow
              console.log(`✅ Profile complete + Table ${tableNumber} → /restaurant/${shopId}?table=${tableNumber}`);
              router.push(`/restaurant/${shopId}?table=${tableNumber}`);
            } else {
              // Bar flow  
              console.log(`✅ Profile complete + Bar flow → /restaurant/${shopId}`);
              router.push(`/restaurant/${shopId}`);
            }
          } else {
            // No restaurant context
            console.log("✅ Profile complete + No shop → /home");
            router.push("/home");
          }
        } else {
          router.push("/home");
        }
      }
    } catch (error) {
      console.error("OTP Verify Error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
      </header>

      <section className="pageWrapper hasHeader">
        <div className={styles.otpWrapper}>
          <div className={styles.otpForm}>
            <h3>Verify OTP</h3>

            <form onSubmit={handleVerify} className="space-y-4 mt-6">
              <input
                type="text"
                className={`${styles.textbox} rounded-lg`}
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="bg-primary px-3 py-3 rounded-lg w-full text-white disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Confirm"}
              </button>
            </form>
          </div>
        </div>

        <div className={styles.otpFooter}>
          <p className="text-center">Didn't receive a code? Resend</p>
        </div>
      </section>
    </>
  );
}
