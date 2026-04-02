"use client";

import React, { useEffect, useMemo, useState } from "react";
import Header from "@/components/common/Header/Header";
import BottomNavigation from "@/components/common/BottomNavigation/BottomNavigation";
import styles from "./vault-selected.module.scss";
import Image from "next/image";
import bannerImage from '../../../public/images/login_bg.jpg';
type SubCategory = {
  id: string;
  name: string;
};

type VaultProductPrice = {
  id: string;
  product_id: string;
  vault_category_id: string;
  price: string;
  is_active: string;
  is_deleted: string;
  vault_category_name: string;
};

type VaultProduct = {
  id: string;
  name: string;
  image: string;
  category_id: string;
  sub_category_id: string;
  is_active: string;
  is_deleted: string;
  vault_product_prices: VaultProductPrice[];
};

type CartItem = {
  productId: string;
  productName: string;
  quantity: string;
  price: number;
  vaultCategoryId: string;
  vaultCategoryName: string;
};

const API_BASE =
  "https://dev2024.co.in/web/liquidity-india-backend/admin/api";

export default function VaultSelectedPage() {
  const [liquorCategory, setLiquorCategory] = useState<SubCategory[]>([]);
  const [categoryItems, setCategoryItems] = useState<VaultProduct[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<Record<string, string>>({});
  const [selectedVaultCategory, setSelectedVaultCategory] = useState<
    Record<string, string>
  >({});
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectIndex, setSelectIndex] = useState(0);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    initPage();
  }, []);

  const initPage = async () => {
    try {
      setLoadingCategories(true);
      setError("");

      const res = await fetch(`${API_BASE}/fetchSubCategories/1`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (data?.status == 1 && Array.isArray(data?.sub_categories)) {
        const reversedCategories = [...data.sub_categories].reverse();
        setLiquorCategory(reversedCategories);

        if (reversedCategories.length > 0) {
          await getCategoryItem(reversedCategories[0].id, 0);
        } else {
          setCategoryItems([]);
        }
      } else {
        setLiquorCategory([]);
        setCategoryItems([]);
        setError(data?.message || "No categories found");
      }
    } catch (err) {
      setLiquorCategory([]);
      setCategoryItems([]);
      setError("Failed to load categories");
    } finally {
      setLoadingCategories(false);
    }
  };

  const getCategoryItem = async (id: string, i: number) => {
    try {
      setSelectIndex(i);
      setLoadingProducts(true);
      setError("");

      const res = await fetch(`${API_BASE}/fetchVaultProducts/${id}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (data?.status == 1 && Array.isArray(data?.vault_products)) {
        setCategoryItems(data.vault_products);
      } else {
        setCategoryItems([]);
        setError(data?.message || "No products found");
      }
    } catch (err) {
      setCategoryItems([]);
      setError("Failed to load vault products");
    } finally {
      setLoadingProducts(false);
    }
  };

  const radioButtonSelect = (productId: string, valueSelected: string) => {
    setSelectedUnits((prev) => ({
      ...prev,
      [productId]: valueSelected,
    }));
  };

  const addOrUpdateCart = (item: CartItem) => {
    setCartItems((prev) => {
      const index = prev.findIndex(
        (cart) =>
          cart.productId === item.productId &&
          cart.vaultCategoryId === item.vaultCategoryId
      );

      if (index !== -1) {
        const updated = [...prev];
        updated[index] = item;
        return updated;
      }

      return [...prev, item];
    });
  };

  const selectVaultCategory = (
    vaultCategoryId: string,
    product: VaultProduct
  ) => {
    setSelectedVaultCategory((prev) => ({
      ...prev,
      [product.id]: vaultCategoryId,
    }));

    if (!vaultCategoryId) return;

    const selectedUnit = selectedUnits[product.id];

    if (!selectedUnit) {
      alert("Sorry you did not select the quantity");
      return;
    }

    const matchedVaultCategory = product.vault_product_prices?.find(
      (item) => item.vault_category_id === vaultCategoryId
    );

    if (!matchedVaultCategory) {
      alert("Sorry you did not select the vault category");
      return;
    }

    const finalPrice =
      Number(matchedVaultCategory.price || 0) * Number(selectedUnit || 0);

    const cartItem: CartItem = {
      productId: product.id,
      productName: product.name,
      quantity: selectedUnit,
      price: finalPrice,
      vaultCategoryId: matchedVaultCategory.vault_category_id,
      vaultCategoryName: matchedVaultCategory.vault_category_name,
    };

    addOrUpdateCart(cartItem);
  };

  const totalItems = cartItems.length;

  const totalPrices = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price, 0);
  }, [cartItems]);

  const compareNDreview = () => {
    if (cartItems.length === 0) {
      alert("Please select one item and click cart icon for add to cart");
      return;
    }

    // replace with next/navigation router push if needed
    window.location.href = "/vaultcompare";
  };

  return (
    <>
      <Header title="LIQUIDITY" />

      <section className={`pageWrapper hasHeader hasFooter ${styles.page}`}>
        <div className={styles.inner}>
          <div className={styles.bannerWrapper}>
            <div className={styles.bannerScroller}>
              <div className={styles.bannerSlide}>
                <Image src={bannerImage} alt="" />
              </div>
              <div className={styles.bannerSlide}>
                <Image src={bannerImage} alt="" />
              </div>
            </div>
          </div>

          <div className={styles.categoryTabs}>
            {loadingCategories ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={styles.categorySkeleton} />
              ))
            ) : (
              liquorCategory.map((categoryMain, i) => (
                <button
                  key={categoryMain.id}
                  type="button"
                  className={`${styles.categoryButton} ${
                    i === selectIndex ? styles.activeCategory : ""
                  }`}
                  onClick={() => getCategoryItem(categoryMain.id, i)}
                >
                  {categoryMain.name}
                </button>
              ))
            )}
          </div>

          <div className={styles.note}>
            <p>
              <span>*</span>You can order only 1 transaction
            </p>
          </div>

          {error ? <p className={styles.error}>{error}</p> : null}

          <div className={styles.productList}>
            {loadingProducts ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div className={styles.productCard} key={i}>
                  <div className={styles.imageSkeleton} />
                  <div className={styles.productContent}>
                    <div className={styles.lineLg} />
                    <div className={styles.lineSm} />
                    <div className={styles.unitRow}>
                      <div className={styles.chipSkeleton} />
                      <div className={styles.chipSkeleton} />
                    </div>
                    <div className={styles.selectSkeleton} />
                  </div>
                </div>
              ))
            ) : categoryItems.length > 0 ? (
              categoryItems.map((categoryItem) => (
                <article key={categoryItem.id} className={styles.productCard}>
                  <div className={styles.productImageWrap}>
                    <img
                      src={categoryItem.image}
                      alt={categoryItem.name}
                      className={styles.productImage}
                    />
                  </div>

                  <div className={styles.productContent}>
                    <h3 className={styles.productName}>{categoryItem.name}</h3>

                    <div className={styles.selectArea}>
                      <div className={styles.unitBox}>
                        <label className={styles.selectLabel}>Select Unit</label>
                        <div className={styles.unitRow}>
                          {["25", "50"].map((unit) => (
                            <button
                              key={unit}
                              type="button"
                              className={`${styles.unitChip} ${
                                selectedUnits[categoryItem.id] === unit
                                  ? styles.unitChipActive
                                  : ""
                              }`}
                              onClick={() =>
                                radioButtonSelect(categoryItem.id, unit)
                              }
                            >
                              {unit} <span>UNITS</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className={styles.reserveBox}>
                        <select
                          className={styles.reserveSelect}
                          value={selectedVaultCategory[categoryItem.id] || ""}
                          onChange={(e) =>
                            selectVaultCategory(e.target.value, categoryItem)
                          }
                        >
                          <option value="">Add to Reserve</option>
                          {categoryItem.vault_product_prices?.map((item) => (
                            <option
                              key={item.id}
                              value={item.vault_category_id}
                            >
                              {item.vault_category_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <p className={styles.empty}>No products found.</p>
            )}
          </div>

          <div className={styles.noteBottom}>
            <p>
              <span>*</span>30ounce per unit
            </p>
          </div>
        </div>

        <div className={styles.bottomBar}>
          <div className={styles.cartInfo}>
            <p className={styles.cartCount}>
              <small>
                {totalItems === 0
                  ? "0 ITEM IN CART"
                  : `${totalItems} ITEM IN CART`}
              </small>
            </p>
            {totalPrices > 0 ? (
              <p className={styles.cartPrice}>$ {totalPrices.toFixed(2)}</p>
            ) : null}
          </div>

          <div className={styles.reserveAction}>
            <button
              type="button"
              className={styles.reserveButton}
              onClick={compareNDreview}
            >
              <span>Reserve</span>
              <span className={styles.arrow}>›</span>
            </button>
          </div>
        </div>
      </section>

      <BottomNavigation />
    </>
  );
}