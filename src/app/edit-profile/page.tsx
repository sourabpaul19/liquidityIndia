"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/common/Header/Header";
import BottomNavigation from "@/components/common/BottomNavigation/BottomNavigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from "./edit-profile.module.scss";

type FormState = {
  user_id: string;
  name: string;
  email: string;
  mobile: string;
  dob: Date | null;
};

function parseDOB(dobString?: string | null): Date | null {
  if (!dobString || typeof dobString !== "string") return null;

  const value = dobString.trim();

  if (!value) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(year, month - 1, day);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function formatDOB(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function EditProfile() {
  const today = new Date();
  const minAgeDate = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate()
  );

  const [form, setForm] = useState<FormState>({
    user_id: "",
    name: "",
    email: "",
    mobile: "",
    dob: null,
  });

  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    try {
      const storedUser = localStorage.getItem("userData");
      const storedDob = localStorage.getItem("user_dob");

      let user: any = {};

      if (storedUser) {
        user = JSON.parse(storedUser);
      }

      const finalDob = parseDOB(user?.dob || storedDob);

      setForm({
        user_id: user?.id || localStorage.getItem("user_id") || "",
        name: user?.name || localStorage.getItem("user_name") || "",
        email: user?.email || localStorage.getItem("user_email") || "",
        mobile: user?.mobile || localStorage.getItem("user_mobile") || "",
        dob: finalDob,
      });

      console.log("stored userData:", storedUser);
      console.log("stored user_dob:", storedDob);
      console.log("parsed finalDob:", finalDob);
    } catch (error) {
      console.error("Failed to load profile data:", error);
    }
  }, []);

  const handleChange = (field: keyof FormState, value: string | Date | null) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.dob) {
      alert("Please fill all fields including date of birth");
      return;
    }

    setLoading(true);

    try {
      const formattedDob = formatDOB(form.dob);

      const response = await fetch("/api/updateProfile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: form.user_id,
          name: form.name,
          email: form.email,
          mobile: form.mobile,
          dob: formattedDob,
        }),
      });

      const data = await response.json();
      console.log("UpdateProfile API Response:", data);

      if (data.status === "1" || data.status === 1) {
        alert("✅ Profile updated successfully!");

        localStorage.setItem("user_id", form.user_id);
        localStorage.setItem("user_name", form.name);
        localStorage.setItem("user_email", form.email);
        localStorage.setItem("user_mobile", form.mobile);
        localStorage.setItem("user_dob", formattedDob);

        const updatedUser = {
          id: form.user_id,
          name: form.name,
          email: form.email,
          mobile: form.mobile,
          dob: formattedDob,
        };

        localStorage.setItem("userData", JSON.stringify(updatedUser));
      } else {
        alert(data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Update Profile Error:", error);
      alert("Something went wrong while updating your profile");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <>
      <Header title="Edit Profile" />

      <section className="pageWrapper hasHeader hasFooter">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 px-4 pt-4 gap-4"
        >
          <input
            type="text"
            className={`${styles.textbox} rounded-lg`}
            placeholder="Enter Your Name"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />

          <input
            type="tel"
            className={`${styles.textbox} rounded-lg bg-gray-100`}
            placeholder="Mobile Number"
            value={form.mobile}
            readOnly
          />

          <input
            type="email"
            className={`${styles.textbox} rounded-lg`}
            placeholder="Email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
          />

          <DatePicker
            key={form.dob ? form.dob.toDateString() : "empty-dob"}
            selected={form.dob}
            onChange={(date: Date | null) => handleChange("dob", date)}
            dateFormat="dd/MM/yyyy"
            placeholderText="Select Date of Birth"
            maxDate={minAgeDate}
            showYearDropdown
            scrollableYearDropdown
            yearDropdownItemNumber={100}
            isClearable
            className={`${styles.textbox} rounded-lg w-full`}
          />

          <div
            className={`${styles.fixedbottom} pt-4 left-0 bottomButton fixed col-span-full`}
          >
            <button
              type="submit"
              disabled={loading}
              className="bg-primary px-3 py-3 rounded-lg w-full text-white text-center"
            >
              {loading ? "Updating..." : "Update Profile"}
            </button>
          </div>
        </form>
      </section>

      <BottomNavigation />
    </>
  );
}