"use client";

import React, { useEffect, useMemo, useState } from "react";
import Header from "@/components/common/Header/Header";
import BottomNavigation from "@/components/common/BottomNavigation/BottomNavigation";
import styles from "./vault-outlet-category.module.scss";

type VaultCategory = {
  id: string;
  name: string;
  is_active: string;
  is_deleted: string;
};

type VaultShop = {
  id: string;
  vault_category_id: string;
  name: string;
  image: string;
  address: string;
  email?: string;
  phone?: string;
  rating: string;
  review?: string;
  main_shop_id?: string;
  is_active: string;
  is_deleted: string;
};

export default function VaultOutletCategoryPage() {
  const [categories, setCategories] = useState<VaultCategory[]>([]);
  const [shops, setShops] = useState<VaultShop[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingShops, setLoadingShops] = useState(false);
  const [error, setError] = useState("");

  const activeCategoryId = useMemo(() => {
    return selectedCategoryId || categories[0]?.id || "";
  }, [selectedCategoryId, categories]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        setError("");

        const res = await fetch(
          "https://dev2024.co.in/web/liquidity-india-backend/admin/api/fetchVaultCategories"
        );
        const data = await res.json();

        if (data?.status === "1" && Array.isArray(data?.vault_categories)) {
          const activeCategories = data.vault_categories.filter(
            (item: VaultCategory) => item.is_active === "1" && item.is_deleted === "0"
          );

          setCategories(activeCategories);

          if (activeCategories.length > 0) {
            setSelectedCategoryId(activeCategories[0].id);
          }
        } else {
          setError(data?.message || "Failed to load categories");
        }
      } catch (err) {
        setError("Something went wrong while loading categories");
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchShops = async () => {
      if (!activeCategoryId) return;

      try {
        setLoadingShops(true);
        setError("");

        const res = await fetch(
          `https://dev2024.co.in/web/liquidity-india-backend/admin/api/categoryWiseVaultShops/${activeCategoryId}`
        );
        const data = await res.json();

        if (data?.status === "1" && Array.isArray(data?.vault_shops)) {
          setShops(data.vault_shops);
        } else {
          setShops([]);
          setError(data?.message || "Failed to load outlets");
        }
      } catch (err) {
        setShops([]);
        setError("Something went wrong while loading outlets");
      } finally {
        setLoadingShops(false);
      }
    };

    fetchShops();
  }, [activeCategoryId]);

  return (
    <>
      <Header title="CATEGORY OUTLETS" />

      <section className={`pageWrapper hasHeader hasFooter ${styles.page}`}>
        <div className={styles.inner}>
          <div className={styles.tabs} role="tablist" aria-label="Vault categories">
            {loadingCategories
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={`${styles.tab} ${styles.skeletonTab}`} />
                ))
              : categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`${styles.tab} ${
                      activeCategoryId === cat.id ? styles.activeTab : ""
                    }`}
                    onClick={() => setSelectedCategoryId(cat.id)}
                  >
                    {cat.name}
                  </button>
                ))}
          </div>

          {error ? <p className={styles.error}>{error}</p> : null}

          <div className={styles.grid}>
            {loadingShops
              ? Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className={styles.card}>
                    <div className={styles.imageSkeleton} />
                    <div className={styles.metaSkeleton}>
                      <div className={styles.lineShort} />
                      <div className={styles.lineLong} />
                      <div className={styles.lineLonger} />
                    </div>
                  </div>
                ))
              : shops.map((shop) => (
                  <article key={shop.id} className={styles.card}>
                    <div className={styles.imageWrap}>
                      {shop.image && !shop.image.includes("placeholder.png") ? (
                        <img
                          src={shop.image}
                          alt={shop.name}
                          className={styles.image}
                          loading="lazy"
                        />
                      ) : (
                        <div className={styles.placeholder}>
                          <span>600 x 600</span>
                        </div>
                      )}
                    </div>

                    <div className={styles.meta}>
                      <div className={styles.nameRow}>
                        <h3 className={styles.name}>{shop.name}</h3>
                        <div className={styles.rating}>
                          <span className={styles.star}>★</span>
                          <span>{shop.rating || "0"}</span>
                        </div>
                      </div>

                      <p className={styles.address}>{shop.address}</p>
                    </div>
                  </article>
                ))}

            {!loadingShops && shops.length === 0 && !error ? (
              <p className={styles.empty}>No outlets found in this category.</p>
            ) : null}
          </div>
        </div>
      </section>

      <BottomNavigation />
    </>
  );
}
