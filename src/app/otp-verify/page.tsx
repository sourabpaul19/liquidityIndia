"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, FormEvent } from "react";
import styles from "./otp.module.scss";
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

interface TempCartResponse {
  status: string | number | boolean;
  message?: string;
  cartItems?: unknown[];
  data?: unknown[];
  [key: string]: unknown;
}

interface TransferCartResponse {
  status: string | number | boolean;
  message?: string;
  [key: string]: unknown;
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

  // ---------- API helpers ----------

  const fetchTempCart = async (
    userId: string,
    deviceId: string
  ): Promise<TempCartResponse | null> => {
    try {
      const body = new URLSearchParams();
      body.append("device_id", deviceId);
      body.append("user_id", userId);

      const res = await fetch(
        "https://dev2024.co.in/web/liquidity-backend/admin/api/getTempCartDetailsForUser/",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString(),
        }
      );

      const data: TempCartResponse = await res.json();
      console.log("getTempCartDetailsForUser RESPONSE:", data);
      return data;
    } catch (err) {
      console.error("getTempCartDetailsForUser error:", err);
      return null;
    }
  };

  const transferFromTempCart = async (
    userId: string,
    deviceId: string
  ): Promise<TransferCartResponse | null> => {
    try {
      const body = new URLSearchParams();
      body.append("device_id", deviceId);
      body.append("user_id", userId);

      const res = await fetch(
        "https://dev2024.co.in/web/liquidity-backend/admin/api/transferFromTempCart",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString(),
        }
      );

      const data: TransferCartResponse = await res.json();
      console.log("transferFromTempCart RESPONSE:", data);
      return data;
    } catch (err) {
      console.error("transferFromTempCart error:", err);
      return null;
    }
  };

  // Clear existing logged‑in cart BEFORE transfer
  const clearUserCart = async (userId: string): Promise<boolean> => {
    try {
      const url = `https://dev2024.co.in/web/liquidity-backend/admin/api/clearCartForUser/${userId}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const data = await res.json();
      console.log("clearCartForUser RESPONSE:", data);

      return data.status === "1" || data.status === 1 || data.status === true;
    } catch (err) {
      console.error("clearCartForUser error:", err);
      return false;
    }
  };

  // ---------- OTP handler ----------

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

      const deviceId =
        typeof window !== "undefined"
          ? localStorage.getItem("device_id") || ""
          : "";

      // consider user "new / incomplete" if any required field is missing
      const profileIncomplete =
        !user.name?.trim() || !user.email?.trim() || !user.dob?.trim();

      let hasTempCart = false;

      // 4. If temp cart exists: clear old cart → transfer
      if (deviceId) {
        console.log("Checking temp cart for device:", deviceId);

        const tempCartRes = await fetchTempCart(user.id, deviceId);

        hasTempCart =
          !!tempCartRes &&
          (tempCartRes.status === "1" ||
            tempCartRes.status === 1 ||
            tempCartRes.status === true) &&
          ((Array.isArray(tempCartRes.cartItems) &&
            tempCartRes.cartItems.length > 0) ||
            (Array.isArray(tempCartRes.data) &&
              tempCartRes.data.length > 0));

        console.log("Has temp cart:", hasTempCart);

        if (hasTempCart) {
          const cleared = await clearUserCart(user.id);
          if (!cleared) {
            toast.error("Could not clear old cart. Continuing with transfer.");
          }

          console.log("Transferring temp cart to user cart...");
          const transferRes = await transferFromTempCart(user.id, deviceId);

          const transferOk =
            !!transferRes &&
            (transferRes.status === "1" ||
              transferRes.status === 1 ||
              transferRes.status === true);

          if (transferOk) {
            toast.success("Cart transferred successfully!");
          } else {
            toast.error("Cart transfer failed. You can add items again.");
          }
        }
      }

      // 5. Final navigation:
      // - profileIncomplete + temp cart ⇒ /new-account?next=/cart
      // - profileIncomplete + no temp cart ⇒ /new-account
      // - complete profile + temp cart ⇒ /cart
      // - complete profile + no temp cart ⇒ /home
      if (profileIncomplete) {
        if (hasTempCart) {
          router.push("/new-account?next=/cart");
        } else {
          router.push("/new-account");
        }
      } else if (hasTempCart) {
        router.push("/cart");
      } else {
        router.push("/home");
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
