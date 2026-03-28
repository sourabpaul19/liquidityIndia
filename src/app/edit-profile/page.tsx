"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/common/Header/Header";
import BottomNavigation from "@/components/common/BottomNavigation/BottomNavigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from "./edit-profile.module.scss";

export default function EditProfile() {
  const today = new Date();
  const minAgeDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());

  const [form, setForm] = useState({
    user_id: "",
    name: "",
    email: "",
    mobile: "",
    dob: null as Date | null,
  });

  const [loading, setLoading] = useState(false);

  // Load user data from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("userData");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setForm({
        user_id: user.id || "",
        name: user.name || "",
        email: user.email || "",
        mobile: user.mobile || "",
        dob: user.dob ? new Date(user.dob) : null,
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!form.name || !form.email || !form.dob) {
    alert("Please fill all fields including date of birth");
    return;
  }

  setLoading(true);
  try {
    const formattedDob = form.dob.toISOString().split("T")[0];

    // Call proxy API
    const response = await fetch("/api/updateProfile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

      // ✅ Update localStorage keys individually
      localStorage.setItem("user_email", form.email);
      localStorage.setItem("user_id", form.user_id);
      localStorage.setItem("user_mobile", form.mobile);
      localStorage.setItem("user_name", form.name);
      localStorage.setItem("user_dob", formattedDob);

      // ✅ Update combined userData object
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

  return (
    <>
      <Header title="Edit Profile" />
      <section className="pageWrapper hasHeader hasFooter">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 px-4 pt-4 gap-4"
        >
          {/* Name */}
          <input
            type="text"
            className={`${styles.textbox} rounded-lg`}
            placeholder="Enter Your Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          {/* Mobile Number (readonly) */}
          <input
            type="tel"
            className={`${styles.textbox} rounded-lg bg-gray-100`}
            placeholder="Mobile Number"
            value={form.mobile}
            readOnly
          />

          {/* Email */}
          <input
            type="email"
            className={`${styles.textbox} rounded-lg`}
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          {/* Date of Birth */}
          <DatePicker
            selected={form.dob}
            onChange={(date: Date | null) => setForm({ ...form, dob: date })}
            dateFormat="dd/MM/yyyy"
            placeholderText="Select Date of Birth"
            maxDate={minAgeDate}
            showYearDropdown
            scrollableYearDropdown
            className={`${styles.textbox} rounded-lg w-full`}
          />

          {/* Submit button */}
          <div className={`${styles.fixedbottom} pt-4 left-0 bottomButton fixed col-span-full`}>
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
