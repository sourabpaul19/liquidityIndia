"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/common/Header/Header";
import BottomNavigation from "@/components/common/BottomNavigation/BottomNavigation";
import styles from "./vault-selected.module.scss";

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
  id?: string | number;
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
  const router = useRouter();

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
  const [loadingCart, setLoadingCart] = useState(true);
  const [addingToCart, setAddingToCart] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    initPage();
  }, []);

  const getDeviceId = () => {
    return (
      localStorage.getItem("uniqueDeviceID") ||
      localStorage.getItem("device_id") ||
      localStorage.getItem("vault_device_id") ||
      ""
    );
  };

  const fetchExistingCart = async () => {
    try {
      setLoadingCart(true);

      const device_id = getDeviceId();

      if (!device_id) {
        setCartItems([]);
        return;
      }

      const response = await fetch("/api/vault/fetch-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id }),
      });

      const res = await response.json();

      if (res?.status === "1" || res?.status === 1) {
        const items = Array.isArray(res?.cartItems) ? res.cartItems : [];
        const normalizedCartItems: CartItem[] = items.map((item: any) => ({
          id: item.id,
          productId: String(item.product_id || ""),
          productName: item.product_name || "",
          quantity: String(item.quantity || ""),
          price: Number(item.price || 0),
          vaultCategoryId: String(item.vault_category_id || ""),
          vaultCategoryName: item.vault_category_name || "",
        }));

        setCartItems(normalizedCartItems);

        const units: Record<string, string> = {};
        const vaultCategories: Record<string, string> = {};

        normalizedCartItems.forEach((item) => {
          if (item.productId) {
            units[item.productId] = String(item.quantity);
            vaultCategories[item.productId] = String(item.vaultCategoryId);
          }
        });

        setSelectedUnits(units);
        setSelectedVaultCategory(vaultCategories);
      } else {
        setCartItems([]);
      }
    } catch (err) {
      console.error("Failed to fetch existing cart:", err);
      setCartItems([]);
    } finally {
      setLoadingCart(false);
    }
  };

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

    await fetchExistingCart();
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
        updated[index] = {
          ...updated[index],
          ...item,
        };
        return updated;
      }

      return [...prev, item];
    });
  };

  const addToVaultCartApi = async ({
    productId,
    productName,
    quantity,
    price,
    deviceId,
    vaultCategoryId,
  }: {
    productId: string;
    productName: string;
    quantity: string;
    price: number;
    deviceId: string;
    vaultCategoryId: string;
  }) => {
    const formData = new FormData();
    formData.append("product_id", productId);
    formData.append("product_name", productName);
    formData.append("quantity", quantity);
    formData.append("price", String(price));
    formData.append("vault_category_id", vaultCategoryId);
    formData.append("device_id", deviceId);

    const response = await fetch(`${API_BASE}/addToVaultCart/`, {
      method: "POST",
      body: formData,
    });

    const text = await response.text();

    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = { status: 0, message: text || "Invalid server response" };
    }

    if (!response.ok) {
      throw new Error(data?.message || `HTTP error ${response.status}`);
    }

    return data;
  };

  const selectVaultCategory = async (
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

    const deviceId = getDeviceId();

    if (!deviceId) {
      alert("Device ID not found");
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

    try {
      setAddingToCart((prev) => ({
        ...prev,
        [product.id]: true,
      }));

      const data = await addToVaultCartApi({
        productId: product.id,
        productName: product.name,
        quantity: selectedUnit,
        price: finalPrice,
        deviceId,
        vaultCategoryId: matchedVaultCategory.vault_category_id,
      });

      if (data?.status == 1 || data?.status == "1") {
        addOrUpdateCart(cartItem);
        alert(data?.message || "Item has been added to cart successfully");
      } else {
        alert(data?.message || "Failed to add item to cart");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to add item to cart");
    } finally {
      setAddingToCart((prev) => ({
        ...prev,
        [product.id]: false,
      }));
    }
  };

  const totalItems = cartItems.length;

  const totalPrices = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + Number(item.price || 0), 0);
  }, [cartItems]);

  const compareNDreview = () => {
    if (cartItems.length === 0) {
      alert("Please select one item and click cart icon for add to cart");
      return;
    }

    const outletCategories = [
      ...new Set(
        cartItems
          .map((item) => item.vaultCategoryId)
          .filter(Boolean)
          .map(String)
      ),
    ];

    localStorage.setItem("outletCategory", JSON.stringify(outletCategories));
    router.push("/vaultcompare");
  };

  return (
    <>
      <Header title="LIQUIDITY" />

      <section
        className={`pageWrapper hasHeader hasFooter hasMenu ${styles.page}`}
      >
        <div className={styles.inner}>
          <div
            className={`${styles.categoryTabs} bg-white border-b-4 border-gray-200 overflow-x-auto no-scrollbar w-full z-40`}
          >
            <div className="flex">
              {loadingCategories ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={styles.categorySkeleton} />
                ))
              ) : (
                liquorCategory.map((categoryMain, i) => (
                  <button
                    key={categoryMain.id}
                    type="button"
                    className={`whitespace-nowrap px-5 py-3 font-medium ${
                      i === selectIndex
                        ? "bg-gray-200 text-black"
                        : "text-gray-600"
                    }`}
                    onClick={() => getCategoryItem(categoryMain.id, i)}
                  >
                    {categoryMain.name}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className={styles.note}>
            <p>
              <span>*</span>You can order only 1 transaction
            </p>
          </div>

          {error ? <p className={styles.error}>{error}</p> : null}

          <div
  className={`${styles.productList} ${
    cartItems.length > 0 ? styles.cart : ""
  }`}
>
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
                          disabled={
                            addingToCart[categoryItem.id] || loadingCart
                          }
                        >
                          <option value="">
                            {addingToCart[categoryItem.id]
                              ? "Adding..."
                              : loadingCart
                              ? "Loading cart..."
                              : "Add to Reserve"}
                          </option>
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
            {!loadingCart && totalItems > 0 ? (
        <div className={styles.bottomBar}>
          <div className="flex gap-3">
            <button
              onClick={compareNDreview}
              disabled={loadingCart}
              className={`px-4 py-3 rounded-lg w-full text-white flex justify-between items-center ${
                loadingCart
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-primary"
              }`}
            >
              <span>
                {loadingCart
                  ? "Loading cart..."
                  : totalItems === 0
                  ? "0 Item in cart"
                  : `${totalItems} Item in cart`}{" "}
                |{" "}
                {totalPrices > 0 ? (
                  <span>₹ {totalPrices.toFixed(2)}</span>
                ) : null}
              </span>
              <span>{loadingCart ? "..." : "Reserve"}</span>
            </button>
          </div>
        </div>
        ) : null}
      </section>

      <BottomNavigation />
    </>
  );
}