"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import logo from "../../../public/images/logo.png";
import styles from "./choose.module.scss";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Choose() {
  const router = useRouter();

  // Check login status on page load
  useEffect(() => {
    const isLoggedIn =
      typeof window !== "undefined"
        ? localStorage.getItem("isLoggedIn") === "true"
        : false;

    if (isLoggedIn) {
      router.replace("/home"); // logged in → go to home
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
                href="/login"
                className="border-primary border px-3 py-3 rounded-lg w-full color-primary text-center"
              >
                Login
              </Link>

              <p className="text-center">or</p>

              <Link
                href="/login"
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
