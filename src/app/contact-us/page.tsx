"use client";

import React, { useState } from "react";
import Header from "@/components/common/Header/Header";
import BottomNavigation from "@/components/common/BottomNavigation/BottomNavigation";
import Button from "@/components/common/Button/Button";
import styles from "./contact-us.module.scss";

export default function ContactUs() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Simple validation
    if (!form.name || !form.email || !form.message) {
      alert("Please fill all required fields.");
      return;
    }

    alert("Your message has been sent successfully!");
    setForm({ name: "", email: "", phone: "", message: "" }); // Reset form
  };

  return (
    <>
      <Header title="Contact Us" />
      <section className='pageWrapper hasHeader hasFooter'>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4 px-4"
        >
          <input
            type="text"
            className={`${styles.textbox} rounded-lg`}
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <input
            type="email"
            className={`${styles.textbox} rounded-lg`}
            placeholder="Email Address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          <input
            type="tel"
            className={`${styles.textbox} rounded-lg`}
            placeholder="Phone Number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <textarea
            className={`${styles.textarea} rounded-lg col-span-full min-h-[120px]`}
            placeholder="Write your message..."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            required
          ></textarea>

          <div className={`${styles.fixedbottom} bottomButton left-0 fixed`}>
            <button type="submit" className="bg-primary px-3 py-3 rounded-lg w-full text-white text-center">Send Message</button>
          </div>
        </form>
      </section>
      <BottomNavigation />
    </>
  );
}
