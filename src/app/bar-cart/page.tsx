"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, FormEvent } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import Script from "next/script";
import styles from "./bar-cart.module.scss";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

type PayMode = "razorpay";

interface CartItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
  choice_of_mixer_name?: string;
  is_double_shot?: boolean;
  shot_count?: number;
  special_instruction?: string;
}

interface OrderProduct {
  id: string;
  product_name: string;
  quantity: string;
  price: string;
  choice_of_mixer_name?: string;
  is_double_shot: string;
  shot_count: string;
  special_instruction?: string;
  unit: string;
}

interface Order {
  id: string;
  unique_id: string;
  amount: string;
  tax_amount: string;
  total_amount: string;
  tips: string;
  order_date: string;
  order_time: string;
  created_at?: string;
  table_no: string;
  status: string;
  order_type?: string;
  shop_id?: string;
  products: OrderProduct[];
}

const TipsSelector = dynamic(
  () => import("@/components/common/TipsSelector/TipsSelector"),
  { ssr: false }
);
const QuantityButton = dynamic(
  () => import("@/components/common/QuantityButton/QuantityButton"),
  { ssr: false }
);

export default function RestaurantBarCart() {
  const router = useRouter();

  const [deviceId, setDeviceId] = useState("");
  const [tableNo, setTableNo] = useState("");
  const [shopId, setShopId] = useState("");
  const [shopName, setShopName] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [matchedOrders, setMatchedOrders] = useState<Order[]>([]);

  const [payMode, setPayMode] = useState<PayMode>("razorpay");
  const [initializingPayment, setInitializingPayment] = useState(false);

  const [tipPercent, setTipPercent] = useState(20);
  const [tipIsAmount, setTipIsAmount] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);

  const [shopIsOpen, setShopIsOpen] = useState<number | null>(null);
  const [checkingShopStatus, setCheckingShopStatus] = useState(true);

  const getLocalStorage = (key: string): string => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(key) || "";
  };

  const getShopId = (): string => {
    const selected_shop = getLocalStorage("selected_shop");
    return selected_shop
      ? JSON.parse(selected_shop)?.id || getLocalStorage("shop_id")
      : getLocalStorage("shop_id");
  };

  const getTodayDate = (): string => new Date().toISOString().split("T")[0];

  useEffect(() => {
    const storedDevice = getLocalStorage("device_id");
    const storedTable =
      getLocalStorage("table_number") || getLocalStorage("table_no");
    const storedShop = getLocalStorage("selected_shop");
    const storedShopParsed = storedShop ? JSON.parse(storedShop) : {};
    const storedShopId = storedShopParsed?.id || getLocalStorage("shop_id");
    const storedShopName = storedShopParsed?.name || "";

    if (!getLocalStorage("user_email")) {
      localStorage.setItem("user_email", "user@liquiditybars.com");
    }
    if (!getLocalStorage("user_mobile")) {
      localStorage.setItem("user_mobile", "+10000000000");
    }

    setDeviceId(storedDevice);
    setTableNo(storedTable);
    setShopId(storedShopId);
    setShopName(storedShopName);
  }, []);

  const checkShopStatus = useCallback(async () => {
    if (!shopId) return;
    try {
      setCheckingShopStatus(true);
      const res = await fetch(
        "https://dev2024.co.in/web/liquidity-backend/admin/api/fetchDashboardDataForTempUsers"
      );
      const data = await res.json();

      if (data.status === "1" && Array.isArray(data.shops)) {
        const shop = data.shops.find((s: any) => String(s.id) === shopId);
        if (shop) {
          const isOpen = Number(shop.is_open ?? 0);
          setShopIsOpen(isOpen);
          setShopName(shop.name || "Restaurant");
          if (isOpen === 0) {
            router.replace(
              `/restaurant-closed/${shopId}${tableNo ? `?table=${tableNo}` : ""}`
            );
            return;
          }
        }
      }
    } catch (e) {
      console.error("Shop status check error:", e);
    } finally {
      setCheckingShopStatus(false);
    }
  }, [shopId, tableNo, router]);

  useEffect(() => {
    if (shopId) checkShopStatus();
  }, [shopId, checkShopStatus]);

  const filterOrdersByTable = useCallback(
    (allOrders: Order[]) => {
      const hasTableNumber = !!getLocalStorage("table_number");
      const currentTableNo = getLocalStorage("table_number") || tableNo;
      const currentShopId = getShopId();
      const todayDate = getTodayDate();

      return allOrders.filter((order) => {
        if (order.order_date !== todayDate) return false;
        if (currentShopId && order.shop_id !== currentShopId) return false;
        if (hasTableNumber && currentTableNo) {
          return order.table_no === currentTableNo && order.order_type === "2";
        }
        return order.order_type === "1";
      });
    },
    [tableNo]
  );

  const fetchOrders = useCallback(async () => {
    if (!deviceId) return;
    setLoadingOrders(true);
    try {
      const res = await fetch(
        `https://dev2024.co.in/web/liquidity-backend/admin/api/tblOrderList/${deviceId}`
      );
      const data = await res.json();
      if (data.status === "1") {
        const filteredOrders = (data.orders || [])
          .filter((order: Order) => order.products && order.products.length > 0)
          .sort((a: Order, b: Order) => {
            const dateA = a.created_at
              ? new Date(a.created_at).getTime()
              : new Date(a.order_time).getTime();
            const dateB = b.created_at
              ? new Date(b.created_at).getTime()
              : new Date(b.order_time).getTime();
            return dateB - dateA;
          });
        setOrders(filteredOrders);
      }
    } catch (err) {
      console.error("Orders fetch error:", err);
    } finally {
      setLoadingOrders(false);
    }
  }, [deviceId]);

  useEffect(() => {
    const matched = filterOrdersByTable(orders);
    setMatchedOrders(matched);
  }, [orders, tableNo, filterOrdersByTable]);

  const fetchCart = useCallback(async () => {
    if (!deviceId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tableGetCart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: deviceId }),
      });
      const data = await res.json();
      if (data.status === "1" || data.status === 1) {
        setCartItems(data.cartItems || []);
        setCartTotal(Number(data.total_price || 0));
      } else {
        setCartItems([]);
        setCartTotal(0);
      }
    } catch (err) {
      console.error("Cart fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  const removeItem = async (itemId: string) => {
    if (!deviceId || !itemId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/deleteFromTempCart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId }),
      });
      const data = await res.json();
      if (data.status === "1" || data.status === 1) {
        await fetchCart();
      } else {
        alert(data.message || "Could not remove item");
      }
    } catch {
      alert("Failed to remove item");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQty: number) => {
    if (newQty === 0) return removeItem(itemId);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("device_id", deviceId);
      formData.append("id", itemId);
      formData.append("quantity", String(newQty));

      const res = await fetch(
        "https://dev2024.co.in/web/liquidity-backend/admin/api/updateTempCartData",
        { method: "POST", body: formData }
      );
      const data = await res.json();
      if (data.status === "1" || data.status === 1) {
        await fetchCart();
      } else {
        alert(data.message || "Could not update quantity.");
      }
    } catch {
      alert("Failed to update cart.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (deviceId) {
      fetchCart();
      fetchOrders();
    }
  }, [deviceId, fetchCart, fetchOrders]);

  const tipValue = tipIsAmount ? tipAmount : (cartTotal * tipPercent) / 100;
  const taxes = cartTotal * 0.13;
  const totalAmount = cartTotal + taxes + tipValue;
  const finalTotalAmount = totalAmount.toFixed(2);

  const getOrderType = (): string => (getLocalStorage("table_number") ? "2" : "1");

  const getUserInfo = () => ({
    user_name: getLocalStorage("user_name") || "Guest",
    user_email: getLocalStorage("user_email") || "user@liquiditybars.com",
    user_mobile: getLocalStorage("user_mobile") || "+10000000000",
  });

  const checkShopStatusBeforePayment = async (): Promise<boolean> => {
    try {
      const res = await fetch(
        "https://dev2024.co.in/web/liquidity-backend/admin/api/fetchDashboardDataForTempUsers"
      );
      const data = await res.json();
      if (data.status === "1" && Array.isArray(data.shops)) {
        const shop = data.shops.find((s: any) => String(s.id) === shopId);
        if (shop) {
          const isOpen = Number(shop.is_open ?? 0);
          setShopIsOpen(isOpen);
          return isOpen === 1;
        }
      }
      return false;
    } catch {
      return false;
    }
  };

  const createLiquidityOrder = async (paymentId: string) => {
    const { user_name, user_email, user_mobile } = getUserInfo();
    const currentShopId = getShopId();

    if (!deviceId || cartItems.length === 0) {
      alert("Missing device ID or empty cart.");
      return;
    }

    const orderType = getOrderType();

    const formData = new FormData();
    formData.append("name", user_name);
    formData.append("email", user_email);
    formData.append("mobile", user_mobile);
    formData.append("device_id", deviceId);
    formData.append("payment_type", "razorpay");
    formData.append("transaction_id", paymentId);
    formData.append("order_time", new Date().toISOString());
    formData.append("table_no", tableNo);
    formData.append("order_date", getTodayDate());
    formData.append("shop_id", currentShopId);
    formData.append("wallet_amount", "0.00");
    formData.append("online_amount", totalAmount.toFixed(2));
    formData.append("order_type", orderType);
    formData.append("tips", Number(tipValue).toFixed(2));

    const res = await fetch(
      "https://dev2024.co.in/web/liquidity-backend/admin/api/createTblOrder",
      { method: "POST", body: formData }
    );
    const data = await res.json();

    if (data.status === 1 || data.status === "1") {
      router.push(
        orderType === "1"
          ? `/bar-order-success/${data.order_id}`
          : `/table-order-success/${data.order_id}`
      );
    } else {
      alert(data.message || "Order failed");
    }
  };

  const handleRazorpayPayment = async () => {
    const ok = await checkShopStatusBeforePayment();
    if (!ok) {
      router.replace(`/restaurant-closed/${shopId}${tableNo ? `?table=${tableNo}` : ""}`);
      return;
    }

    if (!deviceId || cartItems.length === 0) return;

    setInitializingPayment(true);
    try {
      const amountPaise = Math.round(totalAmount * 100);

      const receipt = `rcpt_${deviceId?.substring(0, 20)}_${Date.now().toString().slice(-6)}`;

      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountPaise,
          currency: "INR",
          receipt,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderData?.id) {
        alert(orderData?.error || "Failed to create Razorpay order");
        return;
      }

      const { user_name, user_email, user_mobile } = getUserInfo();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amountPaise,
        currency: "INR",
        name: shopName || "Restaurant",
        description: "Food / Bar Order",
        order_id: orderData.id,
        prefill: {
          name: user_name,
          email: user_email,
          contact: user_mobile,
        },
        theme: {
          color: "#000000",
        },
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              await createLiquidityOrder(response.razorpay_payment_id);
            } else {
              alert("Payment verification failed");
            }
          } catch {
            alert("Payment verification failed");
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function () {
        alert("Payment failed");
      });
      rzp.open();
    } finally {
      setInitializingPayment(false);
    }
  };

  if (checkingShopStatus || shopIsOpen === null) {
    return <div className="flex items-center justify-center min-h-screen p-8" />;
  }

  if (shopIsOpen === 0) return null;

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      <header className="header">
        <button type="button" className="icon_only" onClick={() => router.back()}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 6L9 12L15 18" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="pageTitle">{shopName || "Menu"}</div>
        <button type="button" className="icon_only"></button>
      </header>

      <section className="pageWrapper hasHeader">
        <div className="pageContainer">
          {loading ? (
            <p className="p-4 text-center text-gray-500">Loading cart...</p>
          ) : cartItems.length === 0 ? (
            <p className="p-4 text-center text-gray-500">Cart is empty</p>
          ) : (
            <>
              {cartItems.map((item) => (
                <div key={item.id} className={styles.itemCard}>
                  <div className={styles.itemleft}>
                    <h4>
                      {item.product_name} <span>(1oz)</span>
                    </h4>
                    {item.choice_of_mixer_name && (
                      <p><strong>Choice of mixer:</strong> {item.choice_of_mixer_name}</p>
                    )}
                    {item.is_double_shot && (
                      <p><strong>Additional shots:</strong> {item.shot_count}</p>
                    )}
                    {item.special_instruction && (
                      <p><strong>Special Instruction:</strong> {item.special_instruction}</p>
                    )}
                  </div>
                  <div className={styles.itemRight}>
                    <h4>₹{(Number(item.price) * Number(item.quantity)).toFixed(2)}</h4>
                    <QuantityButton
                      min={0}
                      max={10}
                      initialValue={Number(item.quantity)}
                      onChange={(val: number) => updateQuantity(item.id, val)}
                      onDelete={() => removeItem(item.id)}
                    />
                  </div>
                </div>
              ))}
              <div className={styles.itemCard}>
                <Link href={`/restaurant/${getShopId()}${tableNo ? `?table=${tableNo}` : ""}`} className={styles.addItemButton}>
                  + Add Items
                </Link>
              </div>
            </>
          )}

          <div className={styles.billingArea}>
            <h4 className="text-lg font-semibold mb-4">Billing Summary</h4>
            <div className={styles.billingItem}><p>Subtotal</p><p>₹{cartTotal.toFixed(2)}</p></div>
            <div className={styles.billingItem}><p>Taxes &amp; Other Fees</p><p>₹{taxes.toFixed(2)}</p></div>
            <div className={styles.billingItem}><p>Tips</p><p>₹{tipValue.toFixed(2)}</p></div>
            <div className={styles.billingItem}><h4>Total</h4><h4>₹{finalTotalAmount}</h4></div>

            <button
              type="button"
              onClick={handleRazorpayPayment}
              disabled={cartItems.length === 0 || initializingPayment || loading}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
                cartItems.length === 0 || initializingPayment || loading
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed opacity-50"
                  : "bg-black text-white hover:bg-gray-900 shadow-xl"
              }`}
            >
              {initializingPayment ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin inline mr-2" />
                  Processing...
                </>
              ) : (
                `Pay ₹${finalTotalAmount} with Razorpay`
              )}
            </button>
          </div>

          <TipsSelector
            value={tipPercent}
            onChange={(val: number, isAmount: boolean) => {
              if (isAmount) setTipAmount(val);
              else setTipPercent(val);
              setTipIsAmount(isAmount);
            }}
          />
        </div>
      </section>
    </>
  );
}
