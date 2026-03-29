"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import styles from "./account.module.scss";
import Image from "next/image";
import logo from "../../../public/images/logo.png";
import google from "../../../public/images/google.png";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function NewAccount() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: null as Date | null,
    password: "",
    confirmPassword: "",
  });

  // Get stored user_id and phone from localStorage
  useEffect(() => {
    const storedId = localStorage.getItem("user_id");
    const storedMobile = localStorage.getItem("user_mobile");
    if (storedId) setUserId(storedId);
    if (storedMobile) {
      setForm((prev) => ({ ...prev, phone: storedMobile }));
    }
  }, []);

  // Calculate minimum allowed date (must be at least 18 years old)
  const today = new Date();
  const minAgeDate = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate()
  );

  const handleButtonClick = () => router.back();

  // Handle form submission
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.firstName || !form.lastName || !form.email || !form.dob) {
      alert("Please fill in all required fields.");
      return;
    }

    if (form.dob > minAgeDate) {
      alert("You must be at least 18 years old to sign up.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const payload = new URLSearchParams({
        id: userId,
        name: `${form.firstName} ${form.lastName}`,
        email: form.email,
        dob: form.dob.toISOString().split("T")[0],
        password: form.password,
      });

      const response = await fetch(
        "https://dev2024.co.in/web/liquidity-backend/admin/api/updateProfile/",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: payload.toString(),
        }
      );

      const data = await response.json();
      console.log("Update Profile Response:", data);

      const ok =
        data.status === "1" || data.status === 1 || data.status === true;

      if (ok) {
        alert("✅ Account created successfully!");

        // Update local storage
        localStorage.setItem(
          "user_name",
          `${form.firstName} ${form.lastName}`
        );
        localStorage.setItem("user_email", form.email);
        localStorage.setItem("isLoggedIn", "true");

        // Decide where to go next: /checkout if coming from OTP+cart flow, else /home
        const next = searchParams.get("next") || "/home";
        router.push(next);
      } else {
        alert(data.message || "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Profile Update Error:", error);
      alert("Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="header">
        <button type="button" className="icon_only" onClick={handleButtonClick}>
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

      {/* Page Wrapper */}
      <section className="pageWrapper hasHeader">
        <div className="pageContainer">
          <div className={styles.loginWrapper}>
            <div className="logoArea mb-auto">
              <Image alt="Liquidity Logo" src={logo} />
            </div>

            <div className={styles.loginForm}>
              <h3>Create Account</h3>
              <p>Help us get to know you better</p>

              <form onSubmit={handleVerify} className="space-y-4 mt-7">
                <input
                  type="text"
                  className={`${styles.textbox} rounded-lg`}
                  placeholder="First Name"
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
                  }
                  required
                />
                <input
                  type="text"
                  className={`${styles.textbox} rounded-lg`}
                  placeholder="Last Name"
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({ ...form, lastName: e.target.value })
                  }
                  required
                />
                <DatePicker
                  selected={form.dob}
                  onChange={(date) =>
                    setForm({ ...form, dob: date as Date | null })
                  }
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Date of Birth"
                  maxDate={minAgeDate}
                  showYearDropdown
                  scrollableYearDropdown
                  className={`${styles.textbox} rounded-lg`}
                />
                <input
                  type="email"
                  className={`${styles.textbox} rounded-lg`}
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  required
                />
                <input
                  type="tel"
                  className={`${styles.textbox} rounded-lg`}
                  placeholder="Phone Number"
                  value={form.phone}
                  readOnly
                />
                <input
                  type="password"
                  className={`${styles.textbox} rounded-lg`}
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                />
                <input
                  type="password"
                  className={`${styles.textbox} rounded-lg`}
                  placeholder="Confirm Password"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm({ ...form, confirmPassword: e.target.value })
                  }
                  required
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary px-3 py-3 rounded-lg w-full text-white"
                >
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </form>

              <p className="text-center">or</p>

              <button
                type="button"
                className={`${styles.loginButton} border flex items-center gap-6 border-gray-900 px-3 py-3 rounded-lg w-full text-gray-900`}
              >
                <Image src={google} alt="" width={20} height={20} />
                <span>Sign in with Google</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
