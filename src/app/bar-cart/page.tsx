"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, FormEvent } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
  PaymentRequestButtonElement,
} from "@stripe/react-stripe-js";

import dynamic from "next/dynamic";
import styles from "./bar-cart.module.scss";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

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

type PayMode = "new_card" | "apple_pay";

/* ---------- Stripe Payment Request Apple Pay / GPay ---------- */
function StripeApplePayWrapper({
  payMode,
  remainingAmount,
  createLiquidityOrder,
}: {
  payMode: PayMode;
  remainingAmount: number;
  createLiquidityOrder: (
    id: string,
    walletUsed: number,
    paymentType: string
  ) => Promise<void>;
}) {
  const stripe = useStripe();

  if (payMode !== "apple_pay") return null;
  if (!stripe) return null;
  if (remainingAmount <= 0) return null;

  return (
    <div className="mt-4">
      <StripeApplePayButton
        stripe={stripe}
        amount={remainingAmount}
        onSuccess={(paymentIntentId) =>
          createLiquidityOrder(paymentIntentId, 0, "1")
        }
      />
    </div>
  );
}

function StripeApplePayButton({
  stripe,
  amount,
  onSuccess,
}: {
  stripe: any;
  amount: number;
  onSuccess: (id: string) => Promise<void>;
}) {
  const [paymentRequest, setPaymentRequest] = useState<any>(null);

  useEffect(() => {
    if (!stripe || amount <= 0) return;

    const pr = stripe.paymentRequest({
      country: "CA",
      currency: "cad",
      total: {
        label: "Liquidity Bars Order",
        amount: Math.round(amount * 100),
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    pr.canMakePayment().then((result: any) => {
      console.log("canMakePayment", result);
      if (result) setPaymentRequest(pr);
    });

    pr.on("paymentmethod", async (ev: any) => {
      try {
        const res = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Math.round(amount * 100),
            currency: "cad",
          }),
        });

        const data = await res.json();

        const { paymentIntent, error } = await stripe.confirmCardPayment(
          data.client_secret,
          { payment_method: ev.paymentMethod.id },
          { handleActions: false }
        );

        if (error) {
          ev.complete("fail");
          return;
        }

        ev.complete("success");

        if (paymentIntent.status === "requires_action") {
          await stripe.confirmCardPayment(data.client_secret);
        }

        await onSuccess(paymentIntent.id);
      } catch (err) {
        console.error("Stripe Apple Pay error:", err);
        ev.complete("fail");
      }
    });
  }, [stripe, amount, onSuccess]);

  if (!paymentRequest) return (
    <div className="mt-4 p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl text-center text-sm text-gray-400">
      Apple Pay / GPay not available in this browser
    </div>
  );

  return (
    <PaymentRequestButtonElement
      options={{ paymentRequest }}
    />
  );
}

/* ---------- New card (Stripe Elements) ---------- */
function NewCardPaymentForm({
  clientSecret,
  amountLabel,
  onSuccess,
}: {
  clientSecret: string | null;
  amountLabel: string;
  onSuccess: (paymentIntentId: string) => Promise<void>;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    
    if (!stripe || !elements || !clientSecret || processing) return;

    setProcessing(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setProcessing(false);
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: localStorage.getItem("user_name") || "",
            email: localStorage.getItem("user_email") || "",
          },
        },
      }
    );

    if (error) {
      setProcessing(false);
      alert(error.message || "Payment failed");
      return;
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      await onSuccess(paymentIntent.id);
    } else {
      setProcessing(false);
      alert("Payment did not complete.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="p-3 bg-gray-50 border rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#1f2933",
                "::placeholder": { color: "#9ca3af" },
              },
            },
          }}
        />
      </div>

      <button
        type="submit"
        disabled={!stripe || !clientSecret || processing}
        className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all relative overflow-hidden group ${
          !stripe || !clientSecret || processing
            ? "bg-gray-400 text-gray-200 cursor-not-allowed opacity-50"
            : "bg-primary text-white hover:bg-primary/90 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
        }`}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-r from-primary/95 via-primary to-primary/95 backdrop-blur-sm flex items-center justify-center z-20 transition-all duration-200 ${
            processing ? "scale-100 opacity-100" : "scale-0 opacity-0"
          }`}
        >
          <div className="text-center text-white px-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
            <div className="text-sm font-medium">
              Processing Payment...
            </div>
            <div className="text-xs mt-1 opacity-90">Please wait</div>
          </div>
        </div>

        <span
          className={`flex items-center justify-center w-full h-full relative z-30 transition-all duration-200 ${
            processing
              ? "opacity-0 scale-95 pointer-events-none"
              : "opacity-100 scale-100"
          }`}
        >
          Pay {amountLabel}
        </span>
      </button>
    </form>
  );
}

/* ---------- Apple Pay JS (FIXED VERSION) ---------- */

declare global {
  interface Window {
    ApplePaySession?: any;
  }
}

function ApplePayButton({
  amountCents,
  onSuccess,
}: {
  amountCents: number;
  onSuccess: (transactionId: string) => Promise<void>;
}) {
  const [supported, setSupported] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [session, setSession] = useState<any>(null);

  // Cleanup previous session on unmount
  useEffect(() => {
    return () => {
      if (session) {
        session.abort();
      }
    };
  }, [session]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.ApplePaySession) return;
    
    const canPay = window.ApplePaySession.canMakePayments();
    if (canPay) setSupported(true);
  }, []);

  const startApplePay = useCallback(async () => {
    // Prevent multiple calls

    let isSessionActive = true;

    if (processing || !window.ApplePaySession || session) {
      console.log("Apple Pay blocked: already processing or session active");
      return;
    }

    console.log("Starting Apple Pay session");
    console.log("Apple Pay Debug:", {
  amountCents,
  displayAmount: (amountCents / 100).toFixed(2),
  });
    setProcessing(true);

    const request: any = {
      countryCode: "CA",
      currencyCode: "CAD",
      total: {
        label: "Liquidity Bars Order",
        amount: (amountCents / 100).toFixed(2),
      },
      merchantCapabilities: ["supports3DS"],
      supportedNetworks: ["visa", "masterCard", "amex"],
    };

    const newSession = new window.ApplePaySession(3, request);
    setSession(newSession);

    newSession.onvalidatemerchant = async (event: any) => {
      console.log("Apple Pay: validating merchant");
      try {
        const res = await fetch("/api/apple-pay/validate-merchant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ validationURL: event.validationURL }),
        });
        
        if (!res.ok) {
          console.error("Merchant validation failed, HTTP", res.status);
          newSession.abort();
          setProcessing(false);
          setSession(null);
          return;
        }
        
        const merchantSession = await res.json();
        newSession.completeMerchantValidation(merchantSession);
      } catch (err) {
        console.error("Apple Pay merchant validation error:", err);
        newSession.abort();
        setProcessing(false);
        setSession(null);
      }
    };

    newSession.onpaymentauthorized = async (event: any) => {
  console.log("Apple Pay: processing payment");

  if (!isSessionActive) return;

  try {
    const token = event.payment.token?.paymentData;

    if (!token) {
      console.error("No Apple Pay token");

      if (isSessionActive) {
        try {
          newSession.completePayment(window.ApplePaySession.STATUS_FAILURE);
        } catch (e) {
          console.log("Session already closed (token missing)");
        }
      }

      if (isSessionActive) {
        setProcessing(false);
        setSession(null);
      }

      return;
    }

    const res = await fetch("/api/apple-pay/charge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        amount: amountCents,
      }),
    });

    if (!isSessionActive) return;

    const data = await res.json();
    console.log("Apple Pay charge response:", data);

    if (data.status === "success" && data.transaction_id) {

      if (isSessionActive) {
        try {
          newSession.completePayment(window.ApplePaySession.STATUS_SUCCESS);
        } catch (e) {
          console.log("Session already closed (success)");
        }
      }

      if (isSessionActive) {
        setProcessing(false);
        setSession(null);
      }

      await onSuccess(data.transaction_id);

    } else {

      if (isSessionActive) {
        try {
          newSession.completePayment(window.ApplePaySession.STATUS_FAILURE);
        } catch (e) {
          console.log("Session already closed (failure)");
        }
      }

      if (isSessionActive) {
        setProcessing(false);
        setSession(null);
      }

      alert(data.message || "Apple Pay payment failed.");
    }

  } catch (err) {
    console.error("Apple Pay charge error:", err);

    if (isSessionActive) {
      try {
        newSession.completePayment(window.ApplePaySession.STATUS_FAILURE);
      } catch (e) {
        console.log("Session already closed (exception)");
      }
    }

    if (isSessionActive) {
      setProcessing(false);
      setSession(null);
    }

    alert("Apple Pay payment failed.");
    }
  };
    newSession.oncancel = () => {
      console.log("Apple Pay: cancelled by user");
      isSessionActive = false;
      setProcessing(false);
      setSession(null);
    };

    newSession.begin();
  }, [amountCents, onSuccess, processing, session]);

  if (!supported) {
    return (
      <button
        type="button"
        disabled
        className="py-3 px-4 rounded-lg font-medium border bg-gray-200 text-gray-500 w-full"
      >
        Apple Pay not available on this device
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={startApplePay}
      disabled={processing}
      className={`py-3 px-4 rounded-lg font-medium border flex items-center justify-center w-full ${
        processing
          ? "bg-gray-400 text-gray-200 cursor-not-allowed"
          : "bg-black text-white border-black shadow-lg hover:bg-gray-900"
      }`}
    >
      {processing ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Processing Apple Pay…
        </>
      ) : (
        <> Pay with Apple Pay Now</>
      )}
    </button>
  );
}

const TipsSelector = dynamic(
  () => import("@/components/common/TipsSelector/TipsSelector"),
  { ssr: false }
);
const Header = dynamic(
  () => import("@/components/common/Header/Header"),
  { ssr: false }
);
const QuantityButton = dynamic(
  () => import("@/components/common/QuantityButton/QuantityButton"),
  { ssr: false }
);

export default function RestaurantBarCart() {
  const router = useRouter();

  const [deviceId, setDeviceId] = useState<string>("");
  const [tableNo, setTableNo] = useState<string>("");
  const [shopId, setShopId] = useState<string>("");
  const [shopName, setShopName] = useState<string>("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState<number>(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
  const [matchedOrders, setMatchedOrders] = useState<Order[]>([]);

  const [payMode, setPayMode] = useState<PayMode>("new_card");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [initializingPayment, setInitializingPayment] = useState(false);
  const [remainingAmount, setRemainingAmount] = useState(0);

  const [tipPercent, setTipPercent] = useState<number>(20);
  const [tipIsAmount, setTipIsAmount] = useState<boolean>(false);
  const [tipAmount, setTipAmount] = useState<number>(0);

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

  const getTodayDate = (): string => {
    return new Date().toISOString().split("T")[0];
  };

  useEffect(() => {
    const storedDevice = getLocalStorage("device_id");
    const storedTable =
      getLocalStorage("table_number") || getLocalStorage("table_no");
    const storedShop = getLocalStorage("selected_shop");
    const storedShopParsed = storedShop ? JSON.parse(storedShop) : {};
    const storedShopId = storedShopParsed?.id || getLocalStorage("shop_id");
    const storedShopName = storedShopParsed?.name || "";

    if (!getLocalStorage("user_email")) {
      if (typeof window !== "undefined") {
        localStorage.setItem("user_email", "user@liquiditybars.com");
      }
    }
    if (!getLocalStorage("user_mobile")) {
      if (typeof window !== "undefined") {
        localStorage.setItem("user_mobile", "+10000000000");
      }
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
        "https://admin.liquiditybars.com/admin/api/fetchDashboardDataForTempUsers"
      );
      const data = await res.json();

      if (data.status === "1" && Array.isArray(data.shops)) {
        const shop = data.shops.find((s: any) => String(s.id) === shopId);
        if (shop) {
          const isOpen = Number(shop.is_open ?? 0);
          setShopIsOpen(isOpen);
          setShopName(shop.name || "Restaurant");

          // 👇 AUTO-REDIRECT if shop CLOSED
          if (isOpen === 0) {
            console.log("🛑 Shop closed! Redirecting to closed page...");
            const redirectUrl = `/restaurant-closed/${shopId}${tableNo ? `?table=${tableNo}` : ''}`;
            router.replace(redirectUrl);
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

  // 👇 NEW: Check shop status on load (before anything else)
  useEffect(() => {
    if (shopId) {
      checkShopStatus();
    }
  }, [shopId, checkShopStatus]);

  const filterOrdersByTable = useCallback(
    (allOrders: Order[]) => {
      const hasTableNumber = !!getLocalStorage("table_number");
      const currentTableNo =
        getLocalStorage("table_number") || tableNo;
      const currentShopId = getShopId();
      const todayDate = getTodayDate();

      return allOrders.filter((order) => {
        if (order.order_date !== todayDate) return false;
        if (currentShopId && order.shop_id !== currentShopId) return false;

        if (hasTableNumber && currentTableNo) {
          return (
            order.table_no === currentTableNo && order.order_type === "2"
          );
        } else {
          return order.order_type === "1";
        }
      });
    },
    [tableNo]
  );

  const fetchOrders = useCallback(async () => {
    if (!deviceId) return;
    setLoadingOrders(true);
    try {
      const res = await fetch(
        `https://admin.liquiditybars.com/admin/api/tblOrderList/${deviceId}`
      );
      const data = await res.json();

      if (data.status === "1") {
        const filteredOrders = (data.orders || [])
          .filter(
            (order: Order) =>
              order.products && order.products.length > 0
          )
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
    } catch (err) {
      console.error("Delete error:", err);
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
        "https://admin.liquiditybars.com/admin/api/updateTempCartData",
        { method: "POST", body: formData }
      );
      const data = await res.json();
      if (data.status === "1" || data.status === 1) {
        await fetchCart();
      } else {
        alert(data.message || "Could not update quantity.");
      }
    } catch (err) {
      console.error("Cart update error:", err);
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

  const tipValue = tipIsAmount
    ? tipAmount
    : (cartTotal * tipPercent) / 100;
  const taxes = cartTotal * 0.13;
  const totalAmount = cartTotal + taxes + tipValue;
  const finalTotalAmount = totalAmount.toFixed(2);

  useEffect(() => {
    setRemainingAmount(totalAmount);
  }, [totalAmount, tipPercent, tipAmount, tipIsAmount, cartTotal]);

  const getOrderType = (): string => {
    return getLocalStorage("table_number") ? "2" : "1";
  };

  const getUserInfo = () => {
    return {
      user_name: getLocalStorage("user_name") || "Guest",
      user_email:
        getLocalStorage("user_email") || "user@liquiditybars.com",
      user_mobile:
        getLocalStorage("user_mobile") || "+10000000000",
    };
  };

  const initStripePayment = async () => {
    if (!deviceId) {
      alert("Missing device ID.");
      return false;
    }

    setInitializingPayment(true);

    try {
      const amount = Math.round(totalAmount * 100);
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          currency: "cad",
          device_id: deviceId,
        }),
      });

      const data = await res.json();
      if (!data.client_secret) {
        alert(data.error || "Failed to start payment.");
        setInitializingPayment(false);
        return false;
      }

      setClientSecret(data.client_secret);
      return true;
    } catch (err) {
      console.error(err);
      alert("Failed to start payment.");
      return false;
    } finally {
      setInitializingPayment(false);
    }
  };

  const createLiquidityOrder = async (
    transactionId: string,
    walletUsed: number = 0,
    paymentType: string = "1"
  ) => {
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
    formData.append("payment_type", paymentType);
    formData.append("transaction_id", transactionId);
    formData.append("order_time", new Date().toISOString());
    formData.append("table_no", tableNo);
    formData.append("order_date", getTodayDate());
    formData.append("shop_id", currentShopId);
    formData.append("wallet_amount", walletUsed.toFixed(2));
    formData.append("online_amount", totalAmount.toFixed(2));
    formData.append("order_type", orderType);
    formData.append("tips", Number(tipValue).toFixed(2));

    try {
      const res = await fetch(
        "https://admin.liquiditybars.com/admin/api/createTblOrder",
        { method: "POST", body: formData }
      );
      const data = await res.json();

      if (data.status === 1 || data.status === "1") {
        if (orderType === "1") {
          router.push(`/bar-order-success/${data.order_id}`);
        } else {
          router.push(`/table-order-success/${data.order_id}`);
        }
      } else {
        alert(data.message || "Order failed");
      }
    } catch {
      alert("Something went wrong while creating order.");
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    await createLiquidityOrder(paymentIntentId);
  };

  const handleCheckout = async (e: FormEvent) => {
    e.preventDefault();

    // 🚨 CHECK SHOP STATUS BEFORE PAYMENT
  const isShopOpen = await checkShopStatusBeforePayment();
  if (!isShopOpen) {
    // 🆕 REDIRECT TO CLOSED PAGE INSTEAD OF ALERT
    const redirectUrl = `/restaurant-closed/${shopId}${tableNo ? `?table=${tableNo}` : ''}`;
    router.replace(redirectUrl);
    return;
  }

    if (payMode === "apple_pay") return;

    if (payMode === "new_card" && !clientSecret) {
      await initStripePayment();
    }
  };

  // 🆕 NEW: Single check before payment
const checkShopStatusBeforePayment = async (): Promise<boolean> => {
  try {
    const res = await fetch(
      "https://admin.liquiditybars.com/admin/api/fetchDashboardDataForTempUsers"
    );
    const data = await res.json();

    if (data.status === "1" && Array.isArray(data.shops)) {
      const shop = data.shops.find((s: any) => String(s.id) === shopId);
      if (shop) {
        const isOpen = Number(shop.is_open ?? 0);
        setShopIsOpen(isOpen); // Update UI state too
        return isOpen === 1;
      }
    }
    return false;
  } catch (error) {
    console.error("Shop status check failed:", error);
    return false;
  }
};

  const hasTableNumber = !!getLocalStorage("table_number");
  const currentShopId = getShopId();
  const restaurantLink = hasTableNumber
    ? `/restaurant/${currentShopId}?table=${tableNo}`
    : `/restaurant/${currentShopId}`;

  const handleBack = () => {
    const shopId = getShopId();
    const tableNoLocal =
      getLocalStorage("table_no") || getLocalStorage("table_number");

    if (shopId && tableNoLocal) {
      router.push(`/restaurant/${shopId}?table=${tableNoLocal}`);
    } else if (shopId) {
      router.push(`/restaurant/${shopId}`);
    } else {
      router.push("/restaurant");
    }
  };

  // 👇 Show loader until shop status confirmed
  if (checkingShopStatus || shopIsOpen === null) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="text-center">
          {/* <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Checking restaurant status...</p> */}
        </div>
      </div>
    );
  }

  // 👇 Early return if shop closed (safety net)
  if (shopIsOpen === 0) {
    return null; // Won't reach here due to redirect, but safety
  }

  return (
    <>
      <header className="header">
        <button type="button" className="icon_only" onClick={handleBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 6L9 12L15 18"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div className="pageTitle">{shopName || "Menu"}</div>
        <button type="button" className="icon_only"></button>
      </header>

      <section className="pageWrapper hasHeader">
        <div className="pageContainer">
          {/* Cart Items */}
          {loading ? (
            <p className="p-4 text-center text-gray-500">
              Loading cart...
            </p>
          ) : cartItems.length === 0 ? (
            <p className="p-4 text-center text-gray-500">
              Cart is empty
            </p>
          ) : (
            <>
              {cartItems.map((item) => (
                <div key={item.id} className={styles.itemCard}>
                  <div className={styles.itemleft}>
                    <h4>
                      {item.product_name} <span>(1oz)</span>
                    </h4>
                    {item.choice_of_mixer_name && (
                      <p>
                        <strong>Choice of mixer:</strong>{" "}
                        {item.choice_of_mixer_name}
                      </p>
                    )}
                    {item.is_double_shot && (
                      <p>
                        <strong>Additional shots:</strong>{" "}
                        {item.shot_count}
                      </p>
                    )}
                    {item.special_instruction && (
                      <p>
                        <strong>Special Instruction:</strong>{" "}
                        {item.special_instruction}
                      </p>
                    )}
                  </div>
                  <div className={styles.itemRight}>
                    <h4>
                      ₹
                      {(
                        Number(item.price) * Number(item.quantity)
                      ).toFixed(2)}
                    </h4>
                    <QuantityButton
                      min={0}
                      max={10}
                      initialValue={Number(item.quantity)}
                      onChange={(val) =>
                        updateQuantity(item.id, val)
                      }
                      onDelete={() => removeItem(item.id)}
                    />
                  </div>
                </div>
              ))}
              <div className={styles.itemCard}>
                <Link href={restaurantLink} className={styles.addItemButton}>
                  + Add Items
                </Link>
              </div>
            </>
          )}

          {/* Billing Summary + Payment */}
          <Elements
            stripe={stripePromise}
            options={clientSecret ? { clientSecret } : undefined}
          >
            <div className={styles.billingArea}>
              <h4 className="text-lg font-semibold mb-4">
                Billing Summary
              </h4>

              {loading ? (
                <p className="p-2 text-center text-gray-500 text-sm">
                  Loading...
                </p>
              ) : cartItems.length === 0 ? (
                <p className="p-2 text-center text-gray-500 text-sm">
                  No items
                </p>
              ) : (
                <div>
                  {cartItems.map((item) => (
                    <div key={item.id} className={styles.billingItem}>
                      <div className={styles.itemleft}>
                        <p>
                          {item.product_name}{" "}
                          <span className="text-xs">(1oz)</span>
                        </p>
                      </div>
                      <div className={styles.itemRight}>
                        <p>
                          ₹
                          {(
                            Number(item.price) *
                            Number(item.quantity)
                          ).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.billingItem}>
                <p>Subtotal</p>
                <p>₹{cartTotal.toFixed(2)}</p>
              </div>

              <div className={styles.billingItem}>
                <p>Taxes &amp; Other Fees</p>
                <p>₹{taxes.toFixed(2)}</p>
              </div>

              <div className={styles.billingItem}>
                <p>Tips</p>
                <p>₹{tipValue.toFixed(2)}</p>
              </div>

              <div className={styles.billingItem}>
                <h4>Total</h4>
                <h4>₹{finalTotalAmount}</h4>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => setPayMode("new_card")}
                  className={`py-3 px-4 rounded-lg font-medium border ${
                    payMode === "new_card"
                      ? "bg-primary text-white border-primary shadow-lg"
                      : "bg-white text-gray-700 border-gray-300 hover:border-primary hover:bg-primary/5"
                  }`}
                >
                  Pay ₹{finalTotalAmount} with Card
                </button>

                <button
                  type="button"
                  onClick={() => setPayMode("apple_pay")}
                  className={`py-3 px-4 rounded-lg font-medium border flex items-center justify-center ${
                    payMode === "apple_pay"
                      ? "bg-black text-white border-black shadow-lg hover:bg-gray-900"
                      : "bg-white text-gray-700 border-gray-300 hover:border-black hover:bg-gray-50"
                  }`}
                >
                 Pay ₹{finalTotalAmount} with Apple Pay
                </button>
              </div>

              {payMode === "new_card" && clientSecret && (
                <NewCardPaymentForm
                  clientSecret={clientSecret}
                  amountLabel={`₹${finalTotalAmount}`}
                  onSuccess={handlePaymentSuccess}
                />
              )}

              <StripeApplePayWrapper
                payMode={payMode}
                remainingAmount={remainingAmount}
                createLiquidityOrder={createLiquidityOrder}
              />
            </div>
          </Elements>

          <TipsSelector
            value={tipPercent}
            onChange={(val: number, isAmount: boolean) => {
              if (isAmount) setTipAmount(val);
              else setTipPercent(val);
              setTipIsAmount(isAmount);
            }}
          />{/* MAIN CHECKOUT BUTTON (card only) */}

          {payMode === "new_card" && !clientSecret && (
          
          <div className={styles.bottomArea}>
            <form onSubmit={handleCheckout}>
              <button
                type="submit"
                disabled={
                  cartItems.length === 0 || initializingPayment || loading
                }
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all relative overflow-hidden group ${
                  cartItems.length === 0 ||
                  initializingPayment ||
                  loading
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed opacity-50"
                    : "bg-primary text-white hover:bg-primary/90 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
                }`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-primary/95 via-primary to-primary/95 backdrop-blur-sm flex items-center justify-center z-20 transition-all duration-200 ${
                    initializingPayment
                      ? "scale-100 opacity-100"
                      : "scale-0 opacity-0"
                  }`}
                >
                  {initializingPayment && (
                    <div className="text-center text-white px-4">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                      <div className="text-sm font-medium">
                        {clientSecret
                          ? "Starting Payment..."
                          : "Initializing Payment..."}
                      </div>
                      <div className="text-xs mt-1 opacity-90">
                        Please wait
                      </div>
                    </div>
                  )}
                </div>

                <span
                  className={`flex items-center justify-center w-full h-full relative z-30 transition-all duration-200 ${
                    initializingPayment
                      ? "opacity-0 scale-95 pointer-events-none"
                      : "opacity-100 scale-100"
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : cartItems.length === 0 ? (
                    "Empty Cart"
                  ) : !clientSecret ? (
                    `Pay ₹${finalTotalAmount}`
                  ) : (
                    "Confirm Payment"
                  )}
                </span>
              </button>
            </form>
          </div>
)}

        </div>
      </section>
    </>
  );
}
