"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronRight, Loader2, Wallet } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

import styles from "./checkout.module.scss";
import Header from "@/components/common/Header/Header";
import Image from "next/image";
import user from "../../../public/images/3177440.png";
import QuantityButton from "@/components/common/QuantityButton/QuantityButton";
import TipsSelector from "@/components/common/TipsSelector/TipsSelector";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

interface CartItem {
  id: string;
  product_id?: string;
  name: string;
  price: number;
  quantity: number;
  choice_of_mixer_name?: string;
  extraShotQty?: number;
  specialInstructions?: string;
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

type PayMode = "wallet" | "new_card" | "saved_card";

// ---------- SMALL COMPONENTS ----------

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

  const handleSubmit = async (e: React.FormEvent) => {
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

// ---------- MAIN CHECKOUT PAGE ----------

function CheckoutInner() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState("web");

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

  // payment modes
  const [payMode, setPayMode] = useState<PayMode>("wallet");
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [selectedSavedCard, setSelectedSavedCard] =
    useState<SavedCard | null>(null);

  // wallet
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletLoading, setWalletLoading] = useState(true);

  // stripe
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [initializingPayment, setInitializingPayment] = useState(false);

  // load base ids
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedUser = localStorage.getItem("user_id");
    if (storedUser) setUserId(storedUser);
    const storedDevice = localStorage.getItem("device_id");
    if (storedDevice) setDeviceId(storedDevice);
  }, []);

  // fetch checkout cart (backend temp cart)
  const fetchCart = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    try {
      const res = await fetch("/api/getBackendCart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, device_id: deviceId }),
      });

      const data = await res.json();
      if (data.status === "1" || data.status === 1) {
        setCartItems(data.cartItems || []);
        const total = (data.cartItems || []).reduce(
          (sum: number, item: CartItem) => sum + item.price * item.quantity,
          0
        );
        setCartTotal(total);
      } else {
        setCartItems([]);
        setCartTotal(0);
      }
    } catch (err) {
      console.error("Backend cart fetch error:", err);
      setCartItems([]);
      setCartTotal(0);
    } finally {
      setLoading(false);
    }
  }, [userId, deviceId]);

  // fetch old orders
  const fetchOldOrders = useCallback(async () => {
    if (!userId) return;
    setLoadingOrders(true);

    try {
      const res = await fetch(
        `https://dev2024.co.in/web/liquidity-backend/admin/api/orderList/${userId}`
      );
      const data = await res.json();

      if ((data.status === "1" || data.status === 1) && Array.isArray(data.orders)) {
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

  // fetch wallet (liquidity cash)
  const fetchWalletBalance = useCallback(async () => {
    if (!userId) return;
    setWalletLoading(true);

    try {
      const res = await fetch(
        `https://dev2024.co.in/web/liquidity-backend/admin/api/fetch_wallet_balance/${userId}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (data.status === "1" || data.status === 1) {
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

  // fetch saved cards
  const fetchSavedCards = useCallback(async () => {
    if (!userId) return;

    try {
      const res = await fetch("/api/savecard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });

      const data = await res.json();
      if ((data.status === "1" || data.status === 1) && Array.isArray(data.cards)) {
        setSavedCards(data.cards);
      } else {
        setSavedCards([]);
      }
    } catch (err) {
      console.error("Saved card fetch error:", err);
      setSavedCards([]);
    }
  }, [userId]);

  // load everything
  useEffect(() => {
    if (!userId) return;
    fetchCart();
    fetchOldOrders();
    fetchWalletBalance();
    fetchSavedCards();
  }, [userId, fetchCart, fetchOldOrders, fetchWalletBalance, fetchSavedCards]);

  // totals
  const tipValue = tipIsAmount ? tipAmount : (cartTotal * tipPercent) / 100;
  const taxes = cartTotal * 0.13;
  const baseTotal = cartTotal + taxes + tipValue;
  const walletAmountToUse = Math.min(walletBalance, baseTotal);
  const remainingAmount = Math.max(0, baseTotal - walletBalance);
  const finalTotalAmount = baseTotal.toFixed(2);

  // NEW: Cart actions using updateTempCartData API
  const updateCartItem = useCallback(async (itemId: string, quantity: number) => {
    if (!userId || !itemId) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("user_id", userId);
      formData.append("id", itemId);
      formData.append("quantity", quantity.toString());

      const res = await fetch(
        "https://dev2024.co.in/web/liquidity-backend/admin/api/updateTempCartData",
        { method: "POST", body: formData }
      );

      const data = await res.json();
      if (data.status === "1" || data.status === 1) {
        await fetchCart();
      } else {
        alert(data.message || "Could not update cart item");
      }
    } catch (err) {
      console.error("Cart update error:", err);
      alert("Failed to update cart");
    } finally {
      setLoading(false);
    }
  }, [userId, fetchCart]);

  const removeItem = (itemId: string) => {
    updateCartItem(itemId, 0);
  };

  const updateQuantity = (itemId: string, newQty: number) => {
    updateCartItem(itemId, newQty);
  };

  const getOrderType = () => {
    if (activePickup === "lounge") return "1";
    if (activePickup === "dance") return "2";
    if (activePickup === "nightclub") return "3";
    return "1";
  };

  // shared createOrder
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

  // pure wallet
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

    const transactionId = `LIQUIDITY_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    await createLiquidityOrder(transactionId, baseTotal, "2");
  };

  // init Stripe payment (new card)
  const initNewCardPayment = async () => {
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

  // saved card
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

  // acknowledgement popup
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
              if (payMode === "wallet") await payWithWallet();
              else if (payMode === "saved_card") await payWithSavedCard();
              else await initNewCardPayment();
            }}
          >
            I Understand
          </button>

          <button
            className="bg-green-600 text-white p-3 rounded-lg"
            onClick={async () => {
              localStorage.setItem("ack_skip_popup", "1");
              setShowAcknowledgement(false);
              if (payMode === "wallet") await payWithWallet();
              else if (payMode === "saved_card") await payWithSavedCard();
              else await initNewCardPayment();
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

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    const skip = localStorage.getItem("ack_skip_popup");
    if (!skip) {
      setShowAcknowledgement(true);
      return;
    }

    if (payMode === "wallet") await payWithWallet();
    else if (payMode === "saved_card") await payWithSavedCard();
    else await initNewCardPayment();
  };

  const canUseWallet = walletBalance > 0;
  const handleButtonClick = () => {
    router.push("/home");
  };

  return (
    <>
      {showAcknowledgement && <AcknowledgementPopup />}

      <header className="header">
        <button
          type="button"
          className={styles.icon_only}
          onClick={handleButtonClick}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#000000"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <Link href="" className={styles.user}>
          <Image alt="User" src={user} />
        </Link>
      </header>

      <section className="pageWrapper hasHeader hasFooter">
        <div className="pageContainer">
          {/* Checkout Items */}
          {loading ? (
            <p className="p-4 text-center text-gray-500">Loading cart...</p>
          ) : cartItems.length === 0 ? (
            <p className="p-4 text-center text-gray-500">
              No items to checkout
            </p>
          ) : (
            <>
              {cartItems.map((item) => (
                <div key={item.id} className={styles.itemCard}>
                  <div className={styles.itemleft}>
                    <h4>
                      {item.name} <span>(1oz)</span>
                    </h4>
                    {item.choice_of_mixer_name && (
                      <p>
                        <strong>Choice of mixer:</strong>{" "}
                        {item.choice_of_mixer_name}
                      </p>
                    )}
                    {item.extraShotQty ? (
                      <p>
                        <strong>Additional shots:</strong> {item.extraShotQty}
                      </p>
                    ) : null}
                    {item.specialInstructions && (
                      <p>
                        <strong>Special Instruction:</strong>{" "}
                        {item.specialInstructions}
                      </p>
                    )}
                  </div>

                  <div className={styles.itemRight}>
                    <h4>
                      {(Number(item.price) * Number(item.quantity)).toFixed(2)}
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

          {/* Pickup Location */}
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

              {/* Liquidity Cash */}
              {walletLoading ? (
                <div className={styles.billingItem}>
                  <p>Liquidity Cash</p>
                  <p>Loading...</p>
                </div>
              ) : walletBalance > 0 ? (
                <div className={styles.billingItem}>
                  <p>Liquidity Cash</p>
                  <p className="text-green-600 font-semibold">
                    -${walletAmountToUse.toFixed(2)}{" "}
                    <span className="text-xs text-gray-500 ml-1">
                      (${walletBalance.toFixed(2)} available)
                    </span>
                  </p>
                </div>
              ) : (
                <div className={styles.billingItem}>
                  <p>Liquidity Cash</p>
                  <p className="text-gray-500">$0.00</p>
                </div>
              )}

              <div className={styles.billingItem}>
                <p>Taxes & Other Fees</p>
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

              {/* Payment Mode Toggle */}
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
                    : `Liquidity Cash ($${walletBalance.toFixed(2)} available)`}
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
              </div>

              {/* Saved Cards */}
              {payMode === "saved_card" && (
                <SavedCardSelector
                  cards={savedCards}
                  selectedId={selectedSavedCard?.id || null}
                  onSelect={(card) => setSelectedSavedCard(card)}
                />
              )}

              {/* New Card Form */}
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
            </div>
          </Elements>

          {/* Tips Selector */}
          <TipsSelector
            value={tipPercent}
            onChange={(val: number, isAmount: boolean) => {
              if (isAmount) setTipAmount(val);
              else setTipPercent(val);
              setTipIsAmount(isAmount);
            }}
          />

          {/* Checkout Buttons */}
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
                  disabled={initializingPayment || !activePickup || cartItems.length === 0}
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
    </>
  );
}

export default function Checkout() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutInner />
    </Elements>
  );
}
