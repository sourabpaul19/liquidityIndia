"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, FormEvent } from "react";
import Link from "next/link";
import { Loader2, Receipt } from "lucide-react";
import styles from "./restaurant-cart.module.scss";
import dynamic from "next/dynamic";
import QuantityButton from "@/components/common/QuantityButton/QuantityButton";

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
  sqaure_order_id: any;
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

export default function RestaurantCart() {
  const router = useRouter();

  const [deviceId, setDeviceId] = useState<string>("");
  const [tableNo, setTableNo] = useState<string>("");
  const [shopId, setShopId] = useState<string>("");
  const [shopName, setShopName] = useState<string>("");

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState<number>(0);

  const [orders, setOrders] = useState<Order[]>([]);
  const [matchedOrders, setMatchedOrders] = useState<Order[]>([]);

  // cart loading only
  const [cartLoading, setCartLoading] = useState<boolean>(true);
  // orders loading
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);

  // checkout / order creation states
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);
  const [orderProcessing, setOrderProcessing] = useState<boolean>(false);
  const [redirecting, setRedirecting] = useState<boolean>(false);

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
        }
      }
    } catch (e) {
      console.error("Shop status check error:", e);
    } finally {
      setCheckingShopStatus(false);
    }
  }, [shopId]);

  useEffect(() => {
    if (shopIsOpen === 0) {
      const redirectUrl = `/restaurant-closed/${shopId}${
        tableNo ? `?table=${tableNo}` : ""
      }`;
      router.replace(redirectUrl);
    }
  }, [shopIsOpen, shopId, tableNo, router]);

  useEffect(() => {
    if (shopId) {
      checkShopStatus();
    }
  }, [shopId, checkShopStatus]);

  const filterOrdersByTable = useCallback(
    (allOrders: Order[]) => {
      const currentTableNo = getLocalStorage("table_number") || tableNo;
      const currentShopId = getShopId();
      const todayDate = getTodayDate();
      const hasTableNumber = !!currentTableNo;

      return allOrders.filter((order) => {
        if (order.order_date !== todayDate) return false;
        if (currentShopId && order.shop_id !== currentShopId) return false;
        if (hasTableNumber) {
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
      const today = new Date();
      const orderDate = today.toISOString().split("T")[0];

      const tableNoFromStorage =
        getLocalStorage("table_number") || tableNo || "";

      const url = `https://admin.liquiditybars.com/admin/api/tblOrderList/${deviceId}/${orderDate}/${tableNoFromStorage}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.status === "1") {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error("Orders fetch error:", err);
    } finally {
      setLoadingOrders(false);
    }
  }, [deviceId, tableNo]);

  useEffect(() => {
    const matched = filterOrdersByTable(orders);
    setMatchedOrders(matched);
  }, [orders, tableNo, filterOrdersByTable]);

  const fetchCart = useCallback(async () => {
    if (!deviceId) return;
    setCartLoading(true);
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
      setCartLoading(false);
    }
  }, [deviceId]);

  const removeItem = async (itemId: string) => {
    if (!deviceId || !itemId) return;
    setCartLoading(true);
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
      setCartLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQty: number) => {
    if (newQty === 0) return removeItem(itemId);
    setCartLoading(true);
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
      setCartLoading(false);
    }
  };

  useEffect(() => {
    if (deviceId) {
      fetchCart();
      fetchOrders();
    }
  }, [deviceId, fetchCart, fetchOrders]);

  const taxes = cartTotal * 0.13;
  const totalAmount = cartTotal + taxes;
  const finalTotalAmount = totalAmount.toFixed(2);

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

  const createLiquidityOrder = async () => {
    const { user_name, user_email, user_mobile } = getUserInfo();
    const currentShopId = getShopId();

    if (!deviceId || cartItems.length === 0) {
      alert("Missing device ID or empty cart.");
      return null;
    }

    const transactionId = `LIQUIDITY_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const orderType = getOrderType();

    const formData = new FormData();
    formData.append("name", user_name);
    formData.append("email", user_email);
    formData.append("mobile", user_mobile);
    formData.append("device_id", deviceId);
    formData.append("payment_type", "1");
    formData.append("transaction_id", transactionId);
    formData.append("order_time", new Date().toISOString());
    formData.append("table_no", tableNo);
    formData.append("order_date", getTodayDate());
    formData.append("shop_id", currentShopId);
    formData.append("wallet_amount", "0.00");
    formData.append("online_amount", totalAmount.toFixed(2));
    formData.append("order_type", orderType);
    formData.append("tips", "0.00");

    try {
      setOrderProcessing(true);
      const res = await fetch(
        "https://admin.liquiditybars.com/admin/api/createTblOrder",
        { method: "POST", body: formData }
      );
      const data = await res.json();

      if (data.status === 1 || data.status === "1") {
        return { success: true, orderId: data.order_id, orderType };
      } else {
        alert(data.message || "Order failed");
        return { success: false };
      }
    } catch (error) {
      console.error("Order creation error:", error);
      alert("Something went wrong while creating order.");
      return { success: false };
    } finally {
      setOrderProcessing(false);
    }
  };

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
          return isOpen === 1;
        }
      }

      return false;
    } catch (error) {
      console.error("Shop status check failed:", error);
      return false;
    }
  };

  const handleCheckout = async (e: FormEvent) => {
    e.preventDefault();

    if (cartItems.length === 0 || checkoutLoading) return;

    setCheckoutLoading(true);

    try {
      const isShopOpen = await checkShopStatusBeforePayment();

      if (!isShopOpen) {
        const redirectUrl = `/restaurant-closed/${shopId}${
          tableNo ? `?table=${tableNo}` : ""
        }`;
        router.replace(redirectUrl);
        return;
      }

      const orderResult = await createLiquidityOrder();

      if (orderResult?.success && orderResult.orderId) {
        setRedirecting(true);

        await new Promise((resolve) => setTimeout(resolve, 400));

        if (orderResult.orderType === "1") {
          router.push(`/bar-order-success/${orderResult.orderId}`);
        } else {
          router.push(`/table-order-success/${orderResult.orderId}`);
        }

        return;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Order processing failed. Please try again.");
    } finally {
      if (!redirecting) {
        setCheckoutLoading(false);
      }
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

  const handleViewTab = useCallback(() => {
    if (!matchedOrders || matchedOrders.length === 0) {
      router.push("/my-table");
      return;
    }
  
    const orderResult = matchedOrders[0]; // or find a specific one
  
    // If status === "5" go to bill success
    if (orderResult.status === "5" && orderResult.sqaure_order_id) {
      router.push(`/bill-success/${orderResult.sqaure_order_id}`);
      return;
    }
  
    // Otherwise branch by order type
    if (orderResult.order_type === "1") {
      router.push(`/bar-order-status/${orderResult.id}`);
    } else {
      router.push(`/table-order-success/${orderResult.id}`);
    }
  }, [matchedOrders, router]);

  const checkSquareOrderStatus = useCallback(async (squareOrderId: string) => {
    try {
      const res = await fetch(
        `https://admin.liquiditybars.com/admin/api/getSquareOrderStatus/${squareOrderId}`
      );
      const data = await res.json();
  
      return data; // adjust based on API response
    } catch (err) {
      console.error("Square status error:", err);
      return null;
    }
  }, []);
  
  useEffect(() => {
    if (!matchedOrders || matchedOrders.length === 0) return;
  
    const latestOrder = matchedOrders[0];
  
    if (!latestOrder?.sqaure_order_id) return;
  
    const interval = setInterval(async () => {
      const statusRes = await checkSquareOrderStatus(
        latestOrder.sqaure_order_id
      );
  
      if (!statusRes) return;
  
      console.log("Square Status:", statusRes);
  
      // 🔥 Example condition (adjust based on API)
      if (statusRes.status === "COMPLETED") {
        // Optionally refresh orders
        fetchOrders();
  
        // Or redirect immediately
        //router.push(`/bill-success/${latestOrder.sqaure_order_id}`);
      }
    }, 10000); // 10 seconds
  
    return () => clearInterval(interval); // cleanup
  }, [matchedOrders, checkSquareOrderStatus, fetchOrders, router]);

  if (checkingShopStatus || shopIsOpen === null) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="text-center"></div>
      </div>
    );
  }

  if (shopIsOpen === 0) {
    return null;
  }

  const getSectionTitle = () => {
    const hasTableNumber = !!getLocalStorage("table_number");
    const currentTableNo =
      getLocalStorage("table_number") || tableNo;
    return hasTableNumber && currentTableNo
      ? `Today's tab (Table #${currentTableNo})`
      : "Today's Bar Tab";
  };

  const Header = dynamic(
    () => import("@/components/common/Header/Header"),
    { ssr: false }
  );
  // const QuantityButton = dynamic(
  //   () => import("@/components/common/QuantityButton/QuantityButton"),
  //   { ssr: false }
  // );

  const isAnyLoading =
    checkoutLoading || orderProcessing || redirecting || loadingOrders;

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
        {!loadingOrders ? (
          matchedOrders.length > 0 ? (
            <button
              type="button"
              className="icon_only"
              onClick={handleViewTab}
            >
              <Receipt size={20} />
            </button>
          ) : (
            <button type="button" className="icon_only"></button>
          )
        ) : (
          <button type="button" className="icon_only"></button>
        )}
      </header>

      <section className="pageWrapper hasHeader hasFooter">
        <div className="pageContainer">
          {/* Cart Items */}
          {cartLoading ? (
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
                      onChange={(val: number) =>
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

          {/* Billing Summary */}
          <div className={styles.billingArea}>
            <h4 className="text-lg font-semibold mb-4">
              Billing Summary
            </h4>

            <h5 className="text-lg font-semibold mb-3">
              {getSectionTitle()}
            </h5>

            {loadingOrders ? (
              <p className="p-2 text-center text-gray-500 text-sm">
                Loading previous orders...
              </p>
            ) : matchedOrders.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">
                <p className="italic">
                  {getLocalStorage("table_number")
                    ? `No previous orders for Table #${getLocalStorage(
                        "table_number"
                      )} today`
                    : "No previous bar orders today"}
                </p>
              </div>
            ) : (
              <div>
                {matchedOrders.map((order) => (
                  <div key={order.id}>
                    {order.products.map((product) => (
                      <div
                        key={product.id}
                        className={styles.billingItem}
                      >
                        <div className={styles.itemleft}>
                          <p>
                            {product.product_name}
                            {product.unit && ` (${product.unit})`}
                            {parseInt(product.quantity || "1") > 1 &&
                              ` x${product.quantity}`}
                          </p>
                        </div>
                        <div className={styles.itemRight}>
                          <p>
                            {(
                              parseFloat(product.price || "0") *
                              parseFloat(product.quantity || "1")
                            ).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            <h5 className="text-lg font-semibold mb-3">Latest Cart</h5>
            {cartLoading ? (
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
                  <div
                    key={item.id}
                    className={styles.billingItem}
                  >
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
                          Number(item.price) * Number(item.quantity)
                        ).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.billingItem}>
              <p>Taxes & Other Fees</p>
              <p>₹{taxes.toFixed(2)}</p>
            </div>
            <div className={styles.billingItem}>
              <h4>Total</h4>
              <h4>₹{finalTotalAmount}</h4>
            </div>
          </div>

          {/* Pay button */}
          <div className={styles.bottomArea}>
            <form onSubmit={handleCheckout}>
              <button
                type="submit"
                disabled={cartItems.length === 0 || isAnyLoading}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all relative overflow-hidden group ${
                  cartItems.length === 0 || isAnyLoading
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed opacity-50"
                    : "bg-primary text-white hover:bg-primary/90 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
                }`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-primary/95 via-primary to-primary/95 backdrop-blur-sm flex items-center justify-center z-20 transition-all duration-200 ${
                    checkoutLoading
                      ? "scale-100 opacity-100"
                      : "scale-0 opacity-0"
                  }`}
                >
                  {orderProcessing && !redirecting && (
                    <div className="text-center text-white px-4">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                    </div>
                  )}

                  {redirecting && (
                    <div className="text-center text-white px-4">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                    </div>
                  )}

                  {checkoutLoading &&
                    !orderProcessing &&
                    !redirecting && (
                      <Loader2 className="w-8 h-8 animate-spin text-white" />
                    )}
                </div>

                <span
                  className={`flex items-center justify-center w-full h-full relative z-30 transition-all duration-200 ${
                    checkoutLoading
                      ? "opacity-0 scale-95 pointer-events-none"
                      : "opacity-100 scale-100"
                  }`}
                >
                  {cartLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  ) : cartItems.length === 0 ? (
                    "Empty Cart"
                  ) : (
                    `Place Order ₹${finalTotalAmount}`
                  )}
                </span>
              </button>
            </form>
          </div>
        </div>

        <div className={styles.cartFooter}>
          <p>
            To close your bill, or for any questions regarding
            <br />
            your bill, please speak to your server
          </p>
        </div>
      </section>
    </>
  );
}
