"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, FormEvent } from "react";
import Link from "next/link";
import { Loader2, Wallet } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

import styles from "./cart.module.scss";
import Header from "@/components/common/Header/Header";
import BottomNavigation from "@/components/common/BottomNavigation/BottomNavigation";
import QuantityButton from "@/components/common/QuantityButton/QuantityButton";
import TipsSelector from "@/components/common/TipsSelector/TipsSelector";

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

interface OldOrder {
  id: string;
  unique_id: string;
  order_date: string;
  status: string;
}

interface SavedCard {
  id: string;
  stripe_payment_method_id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

type PayMode = "wallet" | "new_card" | "saved_card" | "apple_pay";

/* ---------- Saved cards ---------- */

function SavedCardSelector({
  cards,
  selectedId,
  onSelect,
}: {
  cards: SavedCard[];
  selectedId: string | null;
  onSelect: (card: SavedCard) => void;
}) {
  if (!cards.length) {
    return (
      <p className="text-sm text-gray-500 mt-2">
        No saved cards found. Use a new card to save one.
      </p>
    );
  }

  return (
    <div className="space-y-2 mt-3">
      <h4 className="text-sm font-semibold">Saved cards</h4>
      {cards.map((card) => (
        <button
          key={card.id}
          type="button"
          onClick={() => onSelect(card)}
          className={`w-full flex items-center justify-between border rounded-lg px-3 py-2 text-left ${
            selectedId === card.id
              ? "border-primary bg-primary/5"
              : "border-gray-200"
          }`}
        >
          <div>
            <p className="text-sm font-medium capitalize">
              {card.brand} •••• {card.last4}
            </p>
            <p className="text-xs text-gray-500">
              Expires {card.exp_month}/{card.exp_year}
            </p>
          </div>
        </button>
      ))}
    </div>
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
    if (!stripe || !elements || !clientSecret) return;

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

    setProcessing(false);

    if (error) {
      console.error("Stripe card error:", error);
      alert(error.message || "Payment failed");
      return;
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      await onSuccess(paymentIntent.id);
    } else {
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
        className={`w-full py-3 px-4 rounded-lg font-medium transition ${
          !stripe || !clientSecret || processing
            ? "bg-gray-400 text-gray-200 cursor-not-allowed"
            : "bg-primary text-white hover:bg-primary/90"
        }`}
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing…
          </span>
        ) : (
          `Pay ${amountLabel}`
        )}
      </button>
    </form>
  );
}

/* ---------- Apple Pay JS ---------- */

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

  useEffect(() => {
    if (typeof window === "undefined") {
      console.log("Apple Pay: no window");
      return;
    }
    if (!window.ApplePaySession) {
      console.log("Apple Pay: ApplePaySession is undefined (not Safari / no Apple Pay)");
      return;
    }
    const canPay = window.ApplePaySession.canMakePayments();
    console.log("Apple Pay: canMakePayments =", canPay);
    if (canPay) setSupported(true);
  }, []);

  const startApplePay = async () => {
    if (typeof window === "undefined" || !window.ApplePaySession) {
      alert("Apple Pay is not supported in this browser/device.");
      return;
    }

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

    const session = new window.ApplePaySession(3, request);

    session.onvalidatemerchant = async (event: any) => {
      console.log("Apple Pay: onvalidatemerchant", event.validationURL);
      try {
        const res = await fetch("/api/apple-pay/validate-merchant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ validationURL: event.validationURL }),
        });
        if (!res.ok) {
          console.error("Merchant validation failed, HTTP", res.status);
          session.abort();
          setProcessing(false);
          return;
        }
        const merchantSession = await res.json();
        session.completeMerchantValidation(merchantSession);
      } catch (err) {
        console.error("Apple Pay merchant validation error:", err);
        session.abort();
        setProcessing(false);
      }
    };

    session.onpaymentauthorized = async (event: any) => {
      console.log("Apple Pay: onpaymentauthorized");
      try {
        const token = event.payment.token?.paymentData;
        if (!token) {
          console.error("No Apple Pay token in paymentData");
          session.completePayment(window.ApplePaySession.STATUS_FAILURE);
          setProcessing(false);
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

        const data = await res.json();
        console.log("Apple Pay charge response:", data);

        if (data.status === "success" && data.transaction_id) {
          session.completePayment(window.ApplePaySession.STATUS_SUCCESS);
          setProcessing(false);
          await onSuccess(data.transaction_id);
        } else {
          session.completePayment(window.ApplePaySession.STATUS_FAILURE);
          setProcessing(false);
          alert(data.message || "Apple Pay payment failed.");
        }
      } catch (err) {
        console.error("Apple Pay charge error:", err);
        session.completePayment(window.ApplePaySession.STATUS_FAILURE);
        setProcessing(false);
        alert("Apple Pay payment failed.");
      }
    };

    session.oncancel = () => {
      console.log("Apple Pay: user cancelled");
      setProcessing(false);
    };

    session.begin();
  };

  if (!supported) {
    // Optional: during debug, show disabled button instead of nothing
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
        <> Pay with Apple Pay</>
      )}
    </button>
  );
}

/* ---------- Main Cart ---------- */

export default function Cart() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const [activePickup, setActivePickup] = useState<string | null>(null);
  const [oldOrders, setOldOrders] = useState<OldOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);

  const [showAcknowledgement, setShowAcknowledgement] = useState(false);
  const [tipPercent, setTipPercent] = useState<number>(20);
  const [tipIsAmount, setTipIsAmount] = useState<boolean>(false);
  const [tipAmount, setTipAmount] = useState<number>(0);

  const [deviceId, setDeviceId] = useState("web");

  const [payMode, setPayMode] = useState<PayMode>("wallet");
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [selectedSavedCard, setSelectedSavedCard] =
    useState<SavedCard | null>(null);

  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletLoading, setWalletLoading] = useState(true);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [initializingPayment, setInitializingPayment] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedUser = localStorage.getItem("user_id");
    if (storedUser) setUserId(storedUser);
    const storedDevice = localStorage.getItem("device_id");
    if (storedDevice) setDeviceId(storedDevice);
  }, []);

  const fetchCart = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/getCart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, device_id: deviceId }),
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
  }, [userId, deviceId]);

  const fetchOldOrders = useCallback(async () => {
    if (!userId) return;
    setLoadingOrders(true);
    try {
      const res = await fetch(
        `https://dev2024.co.in/web/liquidity-backend/admin/api/orderList/${userId}`
      );
      const data = await res.json();
      if (
        (data.status === "1" || data.status === 1) &&
        Array.isArray(data.orders)
      ) {
        const filtered = data.orders.filter(
          (order: OldOrder) =>
            order.status === "0" ||
            order.status === "1" ||
            order.status === "2"
        );
        setOldOrders(filtered);
      } else {
        setOldOrders([]);
      }
    } catch (err) {
      console.error("Order fetch error:", err);
      setOldOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, [userId]);

  const fetchWalletBalance = useCallback(async () => {
    if (!userId) return;
    setWalletLoading(true);
    try {
      const res = await fetch(
        `https://dev2024.co.in/web/liquidity-backend/admin/api/fetch_wallet_balance/${userId}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.status === "1") {
        setWalletBalance(Number(data.wallet_balance) || 0);
      } else {
        setWalletBalance(0);
      }
    } catch (err) {
      console.error("Wallet fetch error:", err);
      setWalletBalance(0);
    } finally {
      setWalletLoading(false);
    }
  }, [userId]);

  const fetchSavedCards = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch("/api/savecard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (
        (data.status === "1" || data.status === 1) &&
        Array.isArray(data.cards)
      ) {
        setSavedCards(data.cards);
      } else {
        setSavedCards([]);
      }
    } catch (err) {
      console.error("Saved card fetch error:", err);
      setSavedCards([]);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchCart();
    fetchOldOrders();
    fetchWalletBalance();
    fetchSavedCards();
  }, [userId, fetchCart, fetchOldOrders, fetchWalletBalance, fetchSavedCards]);

  const tipValue = tipIsAmount ? tipAmount : (cartTotal * tipPercent) / 100;
  const taxes = cartTotal * 0.13;
  const baseTotal = cartTotal + taxes + tipValue;
  const walletAmountToUse = Math.min(walletBalance, baseTotal);
  const remainingAmount = Math.max(0, baseTotal - walletBalance);
  const finalTotalAmount = baseTotal.toFixed(2);

  const removeItem = async (itemId: string) => {
    if (!userId || !itemId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("user_id", userId);
      params.append("item_id", itemId);
      const res = await fetch("/api/deleteCartItem", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      });
      const data = await res.json();
      if (data.status === "1" || data.status === 1) {
        await fetchCart();
      } else {
        alert(data.message || "Could not remove item");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQty: number) => {
    const item = cartItems.find((i) => i.id === itemId);
    if (!item) return;
    if (newQty === 0) return removeItem(itemId);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("id", itemId);
      formData.append("quantity", String(newQty));
      const res = await fetch(
        "https://dev2024.co.in/web/liquidity-backend/admin/api/updateCartData",
        {
          method: "POST",
          body: formData,
        }
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

  const getOrderType = () => {
    if (activePickup === "lounge") return "1";
    if (activePickup === "dance") return "2";
    if (activePickup === "nightclub") return "3";
    return "1";
  };

  const createLiquidityOrder = async (
    transactionId: string,
    walletUsed: number = 0,
    paymentType: "1" | "2" = "1"
  ) => {
    const user_name = localStorage.getItem("user_name") || "";
    const user_email = localStorage.getItem("user_email") || "";
    const user_mobile = localStorage.getItem("user_mobile") || "";

    const selected_shop = JSON.parse(
      localStorage.getItem("selected_shop") || "{}"
    );
    const shop_id = selected_shop?.id || "";

    if (!userId || !user_name || !user_email || !user_mobile) {
      alert("User information missing.");
      return;
    }
    if (!activePickup) {
      alert("Please select pickup location.");
      return;
    }
    if (cartItems.length === 0) {
      alert("Cart is empty.");
      return;
    }

    const onlineAmount = baseTotal - walletUsed;

    const formData = new FormData();
    formData.append("name", user_name);
    formData.append("email", user_email);
    formData.append("mobile", user_mobile);
    formData.append("user_id", userId);
    formData.append("payment_type", paymentType);
    formData.append("transaction_id", transactionId);
    formData.append("order_time", new Date().toISOString());
    formData.append("table_no", "");
    formData.append("device_id", deviceId);
    formData.append("order_date", new Date().toISOString().split("T")[0]);
    formData.append("shop_id", shop_id);
    formData.append("wallet_amount", walletUsed.toFixed(2));
    formData.append("online_amount", onlineAmount.toFixed(2));
    formData.append("order_type", getOrderType());
    formData.append("tips", Number(tipValue).toFixed(2));

    try {
      const res = await fetch(
        "https://dev2024.co.in/web/liquidity-backend/admin/api/createOrder",
        { method: "POST", body: formData }
      );
      const data = await res.json();
      if (data.status === 1 || data.status === "1") {
        router.push(`/order-success/${data.order_id}`);
        await fetchWalletBalance();
      } else {
        alert(data.message || "Order failed");
      }
    } catch {
      alert("Something went wrong while creating order.");
    }
  };

  const payWithWallet = async () => {
    if (!userId || !activePickup) {
      alert("Missing required information.");
      return;
    }
    if (walletBalance < baseTotal) {
      alert(
        `Insufficient Liquidity Cash. Need $${baseTotal.toFixed(
          2
        )}, have $${walletBalance.toFixed(2)}`
      );
      return;
    }
    try {
      const transactionId = `LIQUIDITY_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      await createLiquidityOrder(transactionId, baseTotal, "2");
    } catch (err) {
      console.error(err);
      alert("Wallet payment failed.");
    }
  };

  const initStripePaymentIntent = async () => {
    if (!userId || !activePickup) {
      alert("Missing required information.");
      return false;
    }
    if (remainingAmount <= 0) {
      await payWithWallet();
      return true;
    }
    setInitializingPayment(true);
    try {
      const amount = Math.round(remainingAmount * 100);
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          currency: "cad",
          user_id: userId,
          wallet_used: walletAmountToUse,
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

  const payWithSavedCard = async () => {
    if (!selectedSavedCard || !userId || !activePickup) {
      alert("Please select a saved card and pickup location.");
      return;
    }
    if (remainingAmount <= 0) {
      await payWithWallet();
      return;
    }

    const customerId = localStorage.getItem("stripe_customer_id") || "";
    if (!customerId) {
      alert("Stripe customer not found.");
      return;
    }

    const amount = Math.round(remainingAmount * 100);

    try {
      const res = await fetch("/api/pay-with-saved-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          currency: "cad",
          customerId,
          paymentMethodId: selectedSavedCard.stripe_payment_method_id,
          wallet_used: walletAmountToUse,
        }),
      });
      const data = await res.json();
      if (data.status === "success" && data.payment_intent_id) {
        await createLiquidityOrder(
          data.payment_intent_id,
          walletAmountToUse,
          "1"
        );
      } else {
        alert(data.message || "Payment failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Payment failed.");
    }
  };

  const AcknowledgementPopup = () => (
    <div className="fixed top-0 left-0 w-full h-full bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white w-11/12 max-w-md p-5 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Acknowledgement</h2>
        <p className="text-gray-700 mb-5">
          I understand that it is my responsibility to pick up my drink when it
          is ready, and that failure to do so in a timely manner means my drink
          could get stolen or disposed of by the bar.
        </p>
        <div className="flex flex-col gap-3">
          <button
            className="bg-primary text-white p-3 rounded-lg"
            onClick={async () => {
              setShowAcknowledgement(false);
              if (payMode === "wallet") {
                await payWithWallet();
              } else if (payMode === "saved_card") {
                await payWithSavedCard();
              } else if (payMode === "new_card") {
                await initStripePaymentIntent();
              }
            }}
          >
            I Understand
          </button>
          <button
            className="bg-green-600 text-white p-3 rounded-lg"
            onClick={async () => {
              localStorage.setItem("ack_skip_popup", "1");
              setShowAcknowledgement(false);
              if (payMode === "wallet") {
                await payWithWallet();
              } else if (payMode === "saved_card") {
                await payWithSavedCard();
              } else if (payMode === "new_card") {
                await initStripePaymentIntent();
              }
            }}
          >
            Yes, Don't Show Again
          </button>
          <button
            className="bg-gray-300 text-black p-3 rounded-lg"
            onClick={() => setShowAcknowledgement(false)}
          >
            No, Cancel
          </button>
        </div>
      </div>
    </div>
  );

  const handleCheckout = async (e: FormEvent) => {
    e.preventDefault();
    const skip =
      typeof window !== "undefined"
        ? localStorage.getItem("ack_skip_popup")
        : null;
    if (!skip) {
      setShowAcknowledgement(true);
      return;
    }
    if (payMode === "wallet") {
      await payWithWallet();
    } else if (payMode === "saved_card") {
      await payWithSavedCard();
    } else if (payMode === "new_card") {
      await initStripePaymentIntent();
    }
    // Apple Pay is fired by its own button
  };

  const canUseWallet = walletBalance > 0;

  return (
    <>
      {showAcknowledgement && <AcknowledgementPopup />}

      <Header title="Casa Mezcal" />

      <section className="pageWrapper hasHeader hasFooter">
        <div className="pageContainer">
          {/* Cart */}
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
                      <p>
                        <strong>Choice of mixer:</strong>{" "}
                        {item.choice_of_mixer_name}
                      </p>
                    )}
                    {item.is_double_shot && (
                      <p>
                        <strong>Additional shots:</strong> {item.shot_count}
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
                      {(
                        Number(item.price) * Number(item.quantity)
                      ).toFixed(2)}
                    </h4>
                    <QuantityButton
                      min={0}
                      max={10}
                      initialValue={Number(item.quantity)}
                      onChange={(val) => updateQuantity(item.id, val)}
                      onDelete={() => removeItem(item.id)}
                    />
                  </div>
                </div>
              ))}
              <div className={styles.itemCard}>
                <Link href="/outlet-menu" className={styles.addItemButton}>
                  + Add Items
                </Link>
              </div>
            </>
          )}

          {/* Pickup */}
          <div className={styles.pickupArea}>
            <h4 className="text-lg font-semibold mb-3">Pickup Location</h4>
            <div className={`${styles.pickupBlock} flex gap-3`}>
              {[
                { id: "lounge", label: "1st Floor\nLounge" },
                { id: "dance", label: "2nd Floor\nDance Floor" },
                { id: "nightclub", label: "Basement\nNightclub" },
              ].map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => setActivePickup(loc.id)}
                  className={`${styles.pickupItem} ${
                    activePickup === loc.id ? "bg-primary text-white" : ""
                  }`}
                >
                  {loc.label.split("\n").map((line, i) => (
                    <span key={i} className="block">
                      {line}
                    </span>
                  ))}
                </button>
              ))}
            </div>
          </div>

          {/* Billing + Payment */}
          <Elements
            stripe={stripePromise}
            options={clientSecret ? { clientSecret } : undefined}
          >
            <div className={styles.billingArea}>
              <h4 className="text-lg font-semibold mb-3">Billing Summary</h4>

              <div className={styles.billingItem}>
                <p>Subtotal</p>
                <p>${cartTotal.toFixed(2)}</p>
              </div>

              {walletLoading ? (
                <div className={styles.billingItem}>
                  <p>Liquidity Cash</p>
                  <p>Loading...</p>
                </div>
              ) : walletBalance > 0 ? (
                <div className={styles.billingItem}>
                  <p>Liquidity Cash</p>
                  <p className="text-green-600 font-semibold">
                    -${walletAmountToUse.toFixed(2)}
                  </p>
                </div>
              ) : (
                <div className={styles.billingItem}>
                  <p>Liquidity Cash</p>
                  <p className="text-gray-500">$0.00</p>
                </div>
              )}

              <div className={styles.billingItem}>
                <p>Taxes &amp; Other Fees</p>
                <p>${taxes.toFixed(2)}</p>
              </div>

              <div className={styles.billingItem}>
                <p>Tips</p>
                <p>${tipValue.toFixed(2)}</p>
              </div>

              <div className={styles.billingItem}>
                <h4>Total</h4>
                <h4>${finalTotalAmount}</h4>
              </div>

              {/* Payment Mode */}
              <div className="mt-6 grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => setPayMode("wallet")}
                  disabled={!canUseWallet || walletBalance < baseTotal}
                  className={`flex items-center gap-2 py-3 px-4 rounded-lg font-medium border transition-all ${
                    payMode === "wallet"
                      ? "bg-green-600 text-white border-green-600 shadow-lg"
                      : !canUseWallet || walletBalance < baseTotal
                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                      : "bg-white text-gray-700 border-gray-300 hover:border-green-400 hover:bg-green-50"
                  }`}
                >
                  <Wallet className="w-5 h-5" />
                  {walletBalance >= baseTotal
                    ? `Liquidity Cash (Full Coverage $${finalTotalAmount})`
                    : `Liquidity Cash ($${walletBalance.toFixed(
                        2
                      )} available)`}
                </button>

                <button
                  type="button"
                  onClick={() => setPayMode("new_card")}
                  className={`py-3 px-4 rounded-lg font-medium border ${
                    payMode === "new_card"
                      ? "bg-primary text-white border-primary shadow-lg"
                      : "bg-white text-gray-700 border-gray-300 hover:border-primary hover:bg-primary/5"
                  }`}
                >
                  {remainingAmount > 0
                    ? `Card ($${remainingAmount.toFixed(2)} + Cash)`
                    : "Card"}
                </button>

                <button
                  type="button"
                  onClick={() => setPayMode("apple_pay")}
                  className={`py-3 px-4 rounded-lg font-medium border flex items-center justify-center ${
                    payMode === "apple_pay"
                      ? "bg-black text-white border-black shadow-lg"
                      : "bg-white text-gray-700 border-gray-300 hover:border-black hover:bg-gray-50"
                  }`}
                >
                   Apple Pay
                </button>
              </div>

              {payMode === "saved_card" && (
                <SavedCardSelector
                  cards={savedCards}
                  selectedId={selectedSavedCard?.id || null}
                  onSelect={(card) => setSelectedSavedCard(card)}
                />
              )}

              {payMode === "new_card" && clientSecret && (
                <NewCardPaymentForm
                  clientSecret={clientSecret}
                  amountLabel={`$${remainingAmount.toFixed(2)}`}
                  onSuccess={(paymentIntentId) =>
                    createLiquidityOrder(
                      paymentIntentId,
                      walletAmountToUse,
                      "1"
                    )
                  }
                />
              )}

              {payMode === "apple_pay" && remainingAmount > 0 && (
                <div className="mt-4">
                  <ApplePayButton
                    amountCents={Math.round(remainingAmount * 100)}
                    onSuccess={(transactionId) =>
                      createLiquidityOrder(
                        transactionId,
                        walletAmountToUse,
                        "1"
                      )
                    }
                  />
                </div>
              )}
            </div>
          </Elements>

          <TipsSelector
            value={tipPercent}
            onChange={(val: number, isAmount: boolean) => {
              if (isAmount) setTipAmount(val);
              else setTipPercent(val);
              setTipIsAmount(isAmount);
            }}
          />

          <div className={styles.bottomArea}>
            <form onSubmit={handleCheckout}>
              {payMode === "wallet" && (
                <button
                  type="submit"
                  disabled={
                    !activePickup ||
                    cartItems.length === 0 ||
                    walletLoading ||
                    walletBalance < baseTotal
                  }
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
                    !activePickup ||
                    cartItems.length === 0 ||
                    walletLoading ||
                    walletBalance < baseTotal
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
                  }`}
                >
                  {walletLoading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin inline mr-2" />
                      Loading...
                    </>
                  ) : (
                    `Pay Full $${finalTotalAmount} with Liquidity Cash`
                  )}
                </button>
              )}

              {payMode === "new_card" && !clientSecret && (
                <button
                  type="submit"
                  disabled={
                    initializingPayment ||
                    !activePickup ||
                    cartItems.length === 0
                  }
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
                    initializingPayment ||
                    !activePickup ||
                    cartItems.length === 0
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-primary text-white hover:bg-primary/90 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
                  }`}
                >
                  {initializingPayment ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin inline mr-2" />
                      Starting payment...
                    </>
                  ) : remainingAmount > 0 ? (
                    `Pay $${remainingAmount.toFixed(2)} (Cash + Card)`
                  ) : (
                    `Pay Full $${finalTotalAmount} with Liquidity Cash`
                  )}
                </button>
              )}

              {payMode === "saved_card" && (
                <button
                  type="submit"
                  disabled={
                    !selectedSavedCard ||
                    !activePickup ||
                    cartItems.length === 0
                  }
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
                    !selectedSavedCard ||
                    !activePickup ||
                    cartItems.length === 0
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-primary text-white hover:bg-primary/90 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
                  }`}
                >
                  {remainingAmount > 0
                    ? `Pay $${remainingAmount.toFixed(
                        2
                      )} with Saved Card (Cash applied)`
                    : `Pay Full $${finalTotalAmount} with Liquidity Cash`}
                </button>
              )}
            </form>
          </div>
        </div>
      </section>

      <BottomNavigation />
    </>
  );
}
