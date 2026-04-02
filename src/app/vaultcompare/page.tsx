"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import styles from "./vaultcompare.module.scss";

type CartItem = {
  id: string;
  product_id?: string;
  product_name: string;
  quantity: string;
  price: string | number;
  vault_category_id?: string;
};

type OutletItem = {
  id: string;
  name: string;
  image: string;
  address: string;
  rating: string | number;
};

type UserDetails = {
  name?: string;
  email?: string;
  mobile?: string;
};

const SHOP_IMAGE_BASE =
  "https://dev2024.co.in/web/liquidity-backend/assets/upload/shops";

const buildShopImage = (fileName?: string | null) => {
  if (!fileName) return "/assets/placeholder-product.png";
  if (fileName.startsWith("http://") || fileName.startsWith("https://")) {
    return fileName;
  }
  return `${SHOP_IMAGE_BASE}/${encodeURIComponent(fileName)}`;
};

export default function VaultComparePage() {
  const router = useRouter();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartPrice, setCartPrice] = useState<number>(0);
  const [cartItemCount, setCartItemCount] = useState<number>(0);
  const [outletDetails, setOutletDetails] = useState<OutletItem[]>([]);
  const [selectedRadioGroup, setSelectedRadioGroup] = useState<
    "wallet" | "online" | ""
  >("");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletStatus, setWalletStatus] = useState<number>(0);
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [paying, setPaying] = useState<boolean>(false);

  const deviceId =
    typeof window !== "undefined"
      ? localStorage.getItem("uniqueDeviceID") || "12345678"
      : "12345678";

  const userId =
    typeof window !== "undefined" ? localStorage.getItem("user_id") || "" : "";

  const outletCategory =
    typeof window !== "undefined"
      ? localStorage.getItem("outletCategory") || ""
      : "";

  const loadCartDetails = useCallback(async () => {
    try {
      const res = await fetch("/api/vault-cart-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          device_id: deviceId,
        }),
      });

      const data = await res.json();

      if (data?.status === "1") {
        const items = Array.isArray(data?.cartItems) ? data.cartItems : [];
        const total = Number(data?.total_price || 0);

        setCartItems(items);
        setCartPrice(total);
        setCartItemCount(items.length);

        localStorage.setItem("cartsPrice", String(total));

        const wallet = Number(localStorage.getItem("wallet_balance") || 0);
        setWalletBalance(wallet);

        if (total > wallet) {
          setWalletStatus(1);
          setSelectedRadioGroup("online");
        } else if (total < wallet || total === wallet) {
          setWalletStatus(2);
        } else {
          setWalletStatus(0);
        }
      } else {
        setCartItems([]);
        setCartPrice(0);
        setCartItemCount(0);
      }
    } catch (error) {
      setCartItems([]);
      setCartPrice(0);
      setCartItemCount(0);
    }
  }, [deviceId]);

  const loadVaultShops = useCallback(async () => {
    if (!outletCategory) {
      setOutletDetails([]);
      return;
    }

    try {
      const res = await fetch(`/api/vault-shops/${outletCategory}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (data?.status === 1 && Array.isArray(data?.vault_shops)) {
        const shops = data.vault_shops.map((shop: any) => ({
          ...shop,
          image: buildShopImage(shop.image),
        }));
        setOutletDetails(shops);
      } else {
        setOutletDetails([]);
      }
    } catch (error) {
      setOutletDetails([]);
    }
  }, [outletCategory]);

  useEffect(() => {
    const userDetails = localStorage.getItem("userDetails");
    if (userDetails) {
      try {
        setUser(JSON.parse(userDetails));
      } catch {
        setUser(null);
      }
    }

    const init = async () => {
      setLoading(true);
      await Promise.all([loadCartDetails(), loadVaultShops()]);
      setLoading(false);
    };

    init();
  }, [loadCartDetails, loadVaultShops]);

  const grandTotal = useMemo(() => Number(cartPrice || 0), [cartPrice]);

  const radioGroupChange = (value: "wallet" | "online") => {
    setSelectedRadioGroup(value);
  };

  const removeItem = async (index: number, item: CartItem) => {
    const updatedItems = [...cartItems];
    updatedItems.splice(index, 1);
    setCartItems(updatedItems);

    try {
      const res = await fetch("/api/delete-vault-cart-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: item.id,
        }),
      });

      const data = await res.json();

      if (data?.status == 1 || data?.status == "1") {
        await loadCartDetails();
      } else {
        await loadCartDetails();
      }
    } catch (error) {
      await loadCartDetails();
    }
  };

  const transaction = async () => {
    if (!user) {
      alert("User details not found");
      return;
    }

    setPaying(true);

    const payload = {
      customer_name: user.name || "",
      customer_email: user.email || "",
      customer_mobile: user.mobile || "",
      user_id: userId,
      transaction_id: "123456",
      device_id: deviceId,
      payment_type: "2",
    };

    try {
      const res = await fetch("/api/create-vault-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data?.status === "1") {
        localStorage.setItem("vault_orderrr_id", data.order_id);
        router.push("/vault-order-success");
      } else {
        alert(data?.message || "Unable to create order");
      }
    } catch (error) {
      alert("Invalid Data");
    } finally {
      setPaying(false);
    }
  };

  const payment = async () => {
    if (!user) {
      alert("User details not found");
      return;
    }

    const RazorpayConstructor = (window as any).Razorpay;

    if (!RazorpayConstructor) {
      alert("Razorpay is not loaded yet");
      return;
    }

    const amountInSubunits = Math.round(Number(cartPrice || 0) * 100);

    const options = {
      description: "Liquidity",
      image:
        "https://firebasestorage.googleapis.com/v0/b/liquidity-app-6d8cb.appspot.com/o/Liquidity_Logo.png?alt=media&token=9b6b5894-0176-4755-aeba-66d1aa7722b6",
      currency: "C$",
      key: "rzp_test_1DP5mmOlF5G5ag",
      amount: amountInSubunits,
      name: "Liquidity",
      prefill: {
        email: user.email || "",
        contact: user.mobile || "",
        name: user.name || "",
      },
      theme: {
        color: "#DCC88D",
      },
      modal: {
        ondismiss: function () {
          alert("dismissed");
        },
      },
      handler: async (response: any) => {
        const paymentId = response?.razorpay_payment_id || "";

        const payload = {
          customer_name: user.name || "",
          customer_email: user.email || "",
          customer_mobile: user.mobile || "",
          user_id: userId,
          transaction_id: paymentId,
          device_id: deviceId,
          payment_type: "1",
        };

        try {
          const res = await fetch("/api/create-vault-order", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          const data = await res.json();

          if (data?.status === "1") {
            localStorage.setItem("vault_orderrr_id", data.order_id);
            localStorage.setItem("vault", "1");
            router.push("/vault-order-success");
          } else {
            alert(data?.message || "Unable to create order");
          }
        } catch (error) {
          alert("Invalid Data");
        }
      },
    };

    const razorpay = new RazorpayConstructor(options);

    razorpay.on("payment.failed", function (response: any) {
      const desc = response?.error?.description || "Payment failed";
      const code = response?.error?.code || "";
      alert(`${desc} (Error ${code})`);
    });

    razorpay.open();
  };

  const pay = async () => {
    if (cartItems.length <= 0) {
      alert("Please select any Order");
      return;
    }

    if (!selectedRadioGroup) {
      alert("Please choose payment mode");
      return;
    }

    if (selectedRadioGroup === "wallet") {
      await transaction();
      return;
    }

    if (selectedRadioGroup === "online") {
      await payment();
    }
  };

  return (
    <>
      <Script
        id="razorpay-checkout"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <section className={styles.page}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => router.back()}>
            ‹
          </button>
          <h1>Compare & Reserve</h1>
          <div className={styles.headerSpace} />
        </header>

        <main className={styles.content}>
          <div className={styles.segmentWrap}>
            <div className={styles.drinkUnit}>
              <div className={styles.listHeader}>
                <span>ITEMS</span>
                <span>UNITS</span>
              </div>

              {loading ? (
                <div className={styles.loadingBox}>Loading cart...</div>
              ) : (
                <>
                  {cartItems.map((cartItem, i) => (
                    <div className={styles.listRow} key={`${cartItem.id}-${i}`}>
                      <div className={styles.itemName}>{cartItem.product_name}</div>

                      <div className={styles.unitNote}>
                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={() => removeItem(i, cartItem)}
                        >
                          ×
                        </button>
                        <p className={styles.qty}>{cartItem.quantity}</p>
                      </div>
                    </div>
                  ))}

                  <div className={styles.totalRow}>
                    <h3>Grand Total for the Category</h3>
                    <h3>$ {grandTotal.toFixed(2)}</h3>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className={styles.selectForm}>
            <div className={styles.paymentGrid}>
              {walletStatus === 2 && (
                <label className={styles.radioItem}>
                  <input
                    type="radio"
                    name="paymentMode"
                    value="wallet"
                    checked={selectedRadioGroup === "wallet"}
                    onChange={() => radioGroupChange("wallet")}
                  />
                  <span>Test Funds</span>
                </label>
              )}

              <label className={styles.radioItem}>
                <input
                  type="radio"
                  name="paymentMode"
                  value="online"
                  checked={selectedRadioGroup === "online"}
                  onChange={() => radioGroupChange("online")}
                />
                <span>Online Payment</span>
              </label>
            </div>
          </div>

          {walletStatus === 1 && (
            <h4 className={styles.noteText}>
              Your test fund balance is low.Please use online payment to complete
              the transactions
            </h4>
          )}

          <div className={styles.sectionDivider}>
            Outlets in the selected category
          </div>

          <div className={styles.storeList}>
            {outletDetails.map((outlet, index) => (
              <div className={styles.storeItem} key={outlet.id || index}>
                <figure className={styles.storeFigure}>
                  <img
                    src={outlet.image}
                    alt={outlet.name}
                    className={styles.storeImage}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "/assets/placeholder-product.png";
                    }}
                  />
                </figure>

                <figcaption className={styles.storeCaption}>
                  <div className={styles.outletDistance}>
                    <h4 className={styles.shopTitle}>
                      <strong>{outlet.name}</strong>
                    </h4>
                    <p>{outlet.address}</p>
                  </div>
                  <div className={styles.distanceSec}>
                    <small>★ {outlet.rating}</small>
                  </div>
                </figcaption>
              </div>
            ))}
          </div>
        </main>

        <footer className={styles.footer}>
          <div className={styles.footerStart}>
            <img
              src="/assets/whiskey_peg.svg"
              alt="Whiskey Peg"
              className={styles.footerIcon}
            />
            <div className={styles.itemTotal}>
              <p>
                <small>{cartItemCount} ITEM IN CART</small>
              </p>
              <p className={styles.priceEnd}>
                $ {grandTotal.toFixed(2)} <small>plus taxes*</small>
              </p>
            </div>
          </div>

          <div className={styles.footerEnd}>
            <button
              type="button"
              className={styles.checkoutBtn}
              onClick={pay}
              disabled={paying}
            >
              <span>{paying ? "Processing..." : "Checkout"}</span>
              <span>›</span>
            </button>
          </div>
        </footer>
      </section>
    </>
  );
}