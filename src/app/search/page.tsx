"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/common/Header/Header";
import BottomNavigation from "@/components/common/BottomNavigation/BottomNavigation";
import styles from "./search.module.scss";

export default function Search() {
  const [shops, setShops] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSearchData();
  }, []);

  const fetchSearchData = async () => {
    try {
      const res = await fetch(
        "https://dev2024.co.in/web/liquidity-backend/admin/api/getAllDataForSearch",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await res.json();

      if (data?.status === "1") {
        setShops(data.shops || []);
      }
    } catch (error) {
      console.error("Error fetching shops:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter shops when typing
  const filteredShops = searchTerm
    ? shops.filter((shop) =>
        shop.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <>
      <Header title="Search" />

      <section className="pageWrapper hasHeader">
        {/* Search Bar */}
        <div className="bg-white px-4 py-2 sticky top-0">
          <div className={styles.searchBar}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M11 0.25C5.61522 0.25 1.25 4.61522 1.25 10C1.25 15.3848 5.61522 19.75 11 19.75C16.3848 19.75 20.75 15.3848 20.75 10C20.75 4.61522 16.3848 0.25 11 0.25ZM2.75 10C2.75 5.44365 6.44365 1.75 11 1.75C15.5563 1.75 19.25 5.44365 19.25 10C19.25 14.5563 15.5563 18.25 11 18.25C6.44365 18.25 2.75 14.5563 2.75 10Z"
                fill="currentColor"
              />
              <path
                d="M19.5304 17.4698C19.2375 17.1769 18.7626 17.1769 18.4697 17.4698C18.1768 17.7626 18.1768 18.2375 18.4697 18.5304L22.4696 22.5304C22.7625 22.8233 23.2374 22.8233 23.5303 22.5304C23.8232 22.2375 23.8232 21.7626 23.5303 21.4697L19.5304 17.4698Z"
                fill="currentColor"
              />
            </svg>

            <input
              type="search"
              placeholder="Search for shops"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* 🔍 Search Results (only when typing) */}
        {searchTerm && (
          <div className={styles.storeList}>
            <h4>Search Results</h4>

            {loading ? (
              <p className="text-center py-4">Loading...</p>
            ) : (
              <ul className={styles.searchList}>
                {filteredShops.length > 0 ? (
                  filteredShops.map((shop) => (
                    <li key={shop.id}>
                      <Link href={`/bars/${shop.id}`}>
                        {shop.name}
                      </Link>
                    </li>
                  ))
                ) : (
                  <li>No shops found</li>
                )}
              </ul>
            )}
          </div>
        )}

        {/* ⭐ Top Shops (always visible) */}
        {!searchTerm && (
          <div className={styles.storeList}>
            <h4>Top Shops</h4>

            {loading ? (
              <p className="text-center py-4">Loading...</p>
            ) : (
              <ul className={styles.searchList}>
                {shops.length > 0 ? (
                  shops.map((shop) => (
                    <li key={shop.id}>
                      <Link href={`/bars/${shop.id}`}>
                        {shop.name}
                      </Link>
                    </li>
                  ))
                ) : (
                  <li>No shops found</li>
                )}
              </ul>
            )}
          </div>
        )}
      </section>

      <BottomNavigation />
    </>
  );
}
