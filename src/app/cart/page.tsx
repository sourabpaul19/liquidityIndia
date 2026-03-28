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
  PaymentRequestButtonElement,
} from "@stripe/react-stripe-js";

import styles from "./cart.module.scss";
import Header from "@/components/common/Header/Header";
import BottomNavigation from "@/components/common/BottomNavigation/BottomNavigation";
import QuantityButton from "@/components/common/QuantityButton/QuantityButton";
import TipsSelector from "@/components/common/TipsSelector/TipsSelector";
import stripe from "stripe";

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


//type PayMode = "wallet" | "new_card" | "apple_pay";
type PayMode =
  | "wallet"
  | "new_card"
  | "apple_pay"
  | "split_card"
  | "split_apple";

/* ---------- Saved cards ---------- */
function StripeApplePayWrapper({
  payMode,
  remainingAmount,
  walletAmountToUse,
  createLiquidityOrder,
}: any) {
  const stripe = useStripe();

  // ✅ Allow both normal & split Apple Pay
  if (payMode !== "apple_pay" && payMode !== "split_apple") return null;
  if (!stripe) return null;
  if (remainingAmount <= 0) return null;

  return (
    <div className="mt-4">
      <StripeApplePayButton
        stripe={stripe}
        amount={remainingAmount}
        onSuccess={(paymentIntentId) =>
          createLiquidityOrder(
            paymentIntentId,
            walletAmountToUse,
            "1"
          )
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

    // pr.canMakePayment().then((result: any) => {
    //   if (result) setPaymentRequest(pr);
    // });
    pr.canMakePayment().then((result: any) => {
      console.log("PR canMakePayment result:", result);
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

  if (!paymentRequest) return null;

  return <PaymentRequestButtonElement options={{ paymentRequest }} />;
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

/* ---------- Main Cart (FIXED VERSION) ---------- */

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


  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletLoading, setWalletLoading] = useState(true);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [initializingPayment, setInitializingPayment] = useState(false);

  // NEW: Apple Pay stabilization
  const [applePayReady, setApplePayReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedUser = localStorage.getItem("user_id");
    if (storedUser) setUserId(storedUser);
    const storedDevice = localStorage.getItem("device_id");
    if (storedDevice) setDeviceId(storedDevice);
  }, []);

  // Apple Pay ready state management
  useEffect(() => {
    if (payMode === "apple_pay") {
      const timer = setTimeout(() => setApplePayReady(true), 100);
      return () => clearTimeout(timer);
    } else {
      setApplePayReady(false);
    }
  }, [payMode]);

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
        `https://admin.liquiditybars.com/admin/api/orderList/${userId}`
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
        `https://admin.liquiditybars.com/admin/api/fetch_wallet_balance/${userId}`
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



  useEffect(() => {
    if (!userId) return;
    fetchCart();
    fetchOldOrders();
    fetchWalletBalance();
  }, [userId, fetchCart, fetchOldOrders, fetchWalletBalance,]);

  const tipValue = tipIsAmount ? tipAmount : (cartTotal * tipPercent) / 100;
  const taxes = cartTotal * 0.13;
  const baseTotal = cartTotal + taxes + tipValue;
  //const walletAmountToUse = Math.min(walletBalance, baseTotal);
  //const remainingAmount = Math.max(0, baseTotal - walletBalance);
  
  let walletAmountToUse = 0;
  let remainingAmount = baseTotal;

  if (payMode === "wallet") {
    walletAmountToUse = baseTotal;
    remainingAmount = 0;
  }
  else if (payMode === "split_card" || payMode === "split_apple") {
    walletAmountToUse = Math.min(walletBalance, baseTotal);
    remainingAmount = baseTotal - walletAmountToUse;
  }
  else {
    // full card or full apple pay
    walletAmountToUse = 0;
    remainingAmount = baseTotal;
  }
  
  const finalTotalAmount = baseTotal.toFixed(2);

  const isCartValid = cartItems.length > 0;
  const isPickupSelected = !!activePickup;
  const canUseWalletFull = walletBalance >= baseTotal;
  const canUseSplit = walletBalance > 0 && walletBalance < baseTotal;

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
        "https://admin.liquiditybars.com/admin/api/updateCartData",
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
        "https://admin.liquiditybars.com/admin/api/createOrder",
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

  // FIXED: Skip Apple Pay from main checkout (uses own button)
  // const handleCheckout = async (e: FormEvent) => {
  //   e.preventDefault();
    
  //   // Apple Pay uses its own button - don't process here
  //   if (payMode === "apple_pay") return;

  //   const skip = localStorage.getItem("ack_skip_popup");
  //   if (!skip) {
  //     setShowAcknowledgement(true);
  //     return;
  //   }

  //   if (payMode === "wallet") {
  //     await payWithWallet();
  //   } else if (payMode === "new_card") {
  //     await initStripePaymentIntent();
  //   }
  // };

  const handleCheckout = async (e: FormEvent) => {
  e.preventDefault();

  if (!isCartValid) {
    alert("Your cart is empty.");
    return;
  }

  if (!isPickupSelected) {
    alert("Please select pickup location.");
    return;
  }

  if (payMode === "wallet" && !canUseWalletFull) {
    alert("Insufficient wallet balance.");
    return;
  }

  if (payMode === "wallet") {
    await payWithWallet();
  } 
  else {
    await initStripePaymentIntent();
  }
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

              <div className="mt-6 grid grid-cols-1 gap-3">

                {/* FULL WALLET */}
                <button
                  type="button"
                  onClick={() => setPayMode("wallet")}
                  disabled={!canUseWalletFull}
                  className={`py-3 px-4 rounded-lg font-medium border transition ${
                    payMode === "wallet"
                      ? "bg-green-600 text-white border-green-600 shadow-lg"
                      : canUseWalletFull
                      ? "bg-white border-gray-300 hover:bg-green-50"
                      : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  }`}
                >
                  {canUseWalletFull
                    ? `Pay $${finalTotalAmount} with Wallet`
                    : `Wallet Balance $${walletBalance.toFixed(2)} (Insufficient)`}
                </button>

                {/* FULL CARD */}
                <button
                  type="button"
                  onClick={() => setPayMode("new_card")}
                  disabled={!isCartValid}
                  className={`py-3 px-4 rounded-lg font-medium border transition ${
                    payMode === "new_card"
                      ? "bg-primary text-white border-primary shadow-lg"
                      : "bg-white border-gray-300 hover:bg-primary/5"
                  }`}
                >
                  Pay ${finalTotalAmount} with Card
                </button>

                {/* FULL APPLE PAY */}
                <button
                  type="button"
                  onClick={() => setPayMode("apple_pay")}
                  disabled={!isCartValid}
                  className={`py-3 px-4 rounded-lg font-medium border transition ${
                    payMode === "apple_pay"
                      ? "bg-black text-white border-black shadow-lg"
                      : "bg-white border-gray-300 hover:bg-gray-50"
                  }`}
                >
                   Pay ${finalTotalAmount} with Apple Pay
                </button>

                {/* SPLIT CARD */}
                <button
                  type="button"
                  onClick={() => setPayMode("split_card")}
                  disabled={!canUseSplit}
                  className={`py-3 px-4 rounded-lg font-medium border transition ${
                    payMode === "split_card"
                      ? "bg-purple-600 text-white border-purple-600 shadow-lg"
                      : canUseSplit
                      ? "bg-white border-gray-300 hover:bg-purple-50"
                      : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  }`}
                >
                  {canUseSplit
                    ? `Wallet $${walletAmountToUse.toFixed(
                        2
                      )} + Card $${remainingAmount.toFixed(2)}`
                    : "Split not available"}
                </button>

                {/* SPLIT APPLE PAY */}
                <button
                  type="button"
                  onClick={() => setPayMode("split_apple")}
                  disabled={!canUseSplit}
                  className={`py-3 px-4 rounded-lg font-medium border transition ${
                    payMode === "split_apple"
                      ? "bg-purple-600 text-white border-purple-600 shadow-lg"
                      : canUseSplit
                      ? "bg-white border-gray-300 hover:bg-purple-50"
                      : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  }`}
                >
                  {canUseSplit
                    ? `Wallet $${walletAmountToUse.toFixed(
                        2
                      )} + Apple Pay  $${remainingAmount.toFixed(2)}`
                    : "Split not available"}
                </button>

              </div>

              {/* Payment Mode */}
              {/* <div className="mt-6 grid grid-cols-1 gap-3">
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
              </div> */}


              {(payMode === "new_card" || payMode === "split_card") && clientSecret && (
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

              {/* {(payMode === "apple_pay" || payMode === "split_apple") &&
  remainingAmount > 0 && (
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
                )} */}


              
              {/* New Card Form */}
              {/* {payMode === "new_card" && clientSecret && (
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
              )} */}

              {/* FIXED Apple Pay - Only render when ready + stable */}
              {/* {payMode === "apple_pay" && remainingAmount > 0 && applePayReady && (
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
              )} */}

              <StripeApplePayWrapper
  payMode={payMode}
  remainingAmount={remainingAmount}
  walletAmountToUse={walletAmountToUse}
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

              {(payMode === "new_card" || payMode === "split_card") && !clientSecret && (
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

              

              {/* No checkout button for Apple Pay - uses its own */}
            </form>
          </div>
        </div>
      </section>

      <BottomNavigation />
    </>
  );
}
