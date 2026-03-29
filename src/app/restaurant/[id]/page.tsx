"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  useRouter,
  usePathname,
  useParams,
  useSearchParams,
} from "next/navigation";
import Image from "next/image";
import { LogOut, Plus, Trash2, AlertTriangle, X, Receipt } from "lucide-react";
import toast from "react-hot-toast";

import styles from "../outlet.module.scss";
import Header from "@/components/common/Header/Header";
import Modal from "@/components/common/Modal/Modal";
import QuantityButton from "@/components/common/QuantityButton/QuantityButton";

interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  image: string;
  is_double_shot?: number;
  double_shot_price?: number;
  is_add_mixture?: number;
  price_display?: number;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  is_double_shot?: boolean;
  double_shot_price?: number;
  extraShotQty?: number;
  specialInstructions?: string;
  selectedMixer?: MenuItem | null;
  choice_of_mixer_name?: string;
}

interface ApiProduct {
  id: string | number;
  name: string;
  description?: string;
  current_price?: number;
  price?: number;
  image?: string;
  is_double_shot?: number;
  double_shot_price?: number;
  is_add_mixture?: number;
}

interface Category {
  id: string;
  name: string;
  items: MenuItem[];
}

interface StoreData {
  name: string;
  image: string | null;
  is_open?: number; // add
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

export default function Restaurant() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();
  // const [shopId, setShopId] = useState<string>("");
  // const shopId = params?.id ? String(params.id) : "25";

  const [shopId, setShopId] = useState<string>(() => {
  return params?.id ? String(params.id) : "25";
});
  const initialTable =
    typeof window !== "undefined" ? searchParams.get("table") : null;

  // Core state
  const [tableNumber, setTableNumber] = useState<string>("");
  const [deviceId, setDeviceId] = useState("");
  const [userId, setUserId] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Menu state
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [mixers, setMixers] = useState<MenuItem[]>([]);

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
      const [tableNo, setTableNo] = useState<string>("");
      const [shopName, setShopName] = useState<string>("");
      const [loading, setLoading] = useState<boolean>(true);
      const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
      const [matchedOrders, setMatchedOrders] = useState<Order[]>([]);


 const [shopIsOpen, setShopIsOpen] = useState<number | null>(null);
  const [checkingShopStatus, setCheckingShopStatus] = useState(true);
  // Store state
  const [storeData, setStoreData] = useState<StoreData>({
    name: "Vertige Investment Group Annual Summit",
    image: null,
    is_open: 1,
  });

  // Modal state
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [modalQty, setModalQty] = useState(1);
  const [extraShotQty, setExtraShotQty] = useState(0);
  const [showMixerModal, setShowMixerModal] = useState(false);
  const [selectedMixer, setSelectedMixer] = useState<MenuItem | null>(null);
  const [tempSelectedMixer, setTempSelectedMixer] = useState<MenuItem | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [showBillWarning, setShowBillWarning] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false); // NEW: Loading state
  
  // Logout modal state
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Refs
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const categoryButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // ✅ Safe localStorage helper
  const getLocalStorage = (key: string): string => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(key) || "";
  };

  // ---------- CART NORMALIZER ----------
  const normalizeCartItem = useCallback((row: any): CartItem => {
    return {
      id: String(row.id ?? row.cart_id ?? ""),
      name: row.name ?? row.cartProductsNames ?? "",
      price: Number(row.price ?? row.cartProductPrices ?? 0),
      quantity: Number(row.quantity ?? row.cartQuantities ?? 1),
      is_double_shot: Boolean(row.is_double_shot ?? row.is_double_shots),
      double_shot_price: Number(row.double_shot_price ?? row.double_shot_prices ?? 0),
      extraShotQty: Number(row.shot_count ?? row.extraShotQty ?? 0),
      specialInstructions:
        row.special_instruction ??
        row.special_instructions ??
        row.specialInstructions ??
        "",
      choice_of_mixer_name:
        row.choice_of_mixer_name ?? row.choice_of_mixer_names ?? "",
      selectedMixer:
        row.choice_of_mixer_name && mixers.length
          ? mixers.find((m) => m.name === row.choice_of_mixer_name) || null
          : null,
    };
  }, [mixers]);

  // ---------- LOGOUT FUNCTIONS ----------
  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    
    // Check order_type before logout
    const orderType = typeof window !== "undefined" ? localStorage.getItem('order_type') : null;
    const hasBarOrder = orderType === 'bar';
    
    // Clear all storage
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
    }
    
    // Clear cart state
    setCartItems([]);
    setCartTotal(0);
    setCartCount(0);
    setUserId("");
    setIsLoggedIn(false);
    
    toast.success('Logged out successfully', {
      duration: 3000,
      position: 'top-right'
    });
    
    // Redirect based on order_type using router.push
    const redirectUrl = hasBarOrder 
      ? `/bar-order?shop=${shopId}`
      : `/table?shop=${shopId}`;
    
    router.push(redirectUrl);
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  // ---------- FETCH CART ----------
  const fetchCart = useCallback(async (signal?: AbortSignal) => {
    console.log("🚀 fetchCart START", { deviceId, userId });

    if (!deviceId) {
      console.log("⏳ fetchCart SKIP - no deviceId");
      setCartLoaded(true);
      return;
    }

    try {
      setCartLoaded(false);

      const payload = {
        user_id: userId || "",
        device_id: deviceId,
      };
      console.log("📤 GETCART payload =>", payload);

      const res = await fetch("/api/tableGetCart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      console.log("✅ GETCART response =>", data);

      const backendItems = data.cartItems ?? data.cart_items ?? data.data ?? [];
      const items: CartItem[] = backendItems.map((r: any) => normalizeCartItem(r));

      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const count = items.reduce((sum, item) => sum + item.quantity, 0);

      setCartItems(items);
      setCartTotal(total);
      setCartCount(count);

      console.log("📊 PARSED cart:", { items: items.length, count, total });
    } catch (e: any) {
      console.error("💥 fetchCart ERROR:", e.message);
      setCartItems([]);
      setCartTotal(0);
      setCartCount(0);
    } finally {
      setCartLoaded(true);
    }
  }, [deviceId, userId, normalizeCartItem]);
  
  // ---------- CHECK LOGIN STATUS ----------
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const isLoggedInStorage = localStorage.getItem('isLoggedIn');
    const userIdStorage = localStorage.getItem('user_id');
    
    const loggedIn = isLoggedInStorage === 'true' && !!userIdStorage;
    setIsLoggedIn(loggedIn);
    setUserId(userIdStorage || "");
    
    console.log("🔐 LOGIN STATUS:", loggedIn ? "LOGGED IN" : "GUEST");
  }, [isClient]);

  useEffect(() => {
    setShowBillWarning(true);
  }, []);

  // ---------- INITIALIZE IDS + TABLE ----------
  useEffect(() => {
    if (typeof window === "undefined") return;

    console.log("🔧 INITIALIZE START");

    const fromQuery = initialTable || "";
    const storedTable = localStorage.getItem("table_number") || "";
    const finalTable = fromQuery || storedTable || "";
    if (finalTable) {
      localStorage.setItem("table_number", finalTable);
    }
    setTableNumber(finalTable);

    let storedDevice = localStorage.getItem("device_id");
    if (!storedDevice) {
      storedDevice = `device_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 10)}`;
      localStorage.setItem("device_id", storedDevice);
    }
    setDeviceId(storedDevice);
    console.log("🆔 DEVICE_ID SET:", storedDevice.slice(0, 12) + "...");
  }, [initialTable]);

  // ---------- SHOP VALIDATION ON LOAD ----------
  useEffect(() => {
    if (typeof window === "undefined" || !deviceId) return;

    const validateShop = async () => {
      try {
        const cartShopId = localStorage.getItem("cart_shop_id");
        
        // If no cart_shop_id, nothing to do
        if (!cartShopId) {
          console.log("✅ No cart_shop_id found - skipping validation");
          return;
        }

        // If same shop, nothing to do
        if (cartShopId === shopId) {
          console.log("✅ cart_shop_id matches current shop - nothing to do");
          return;
        }

        // Different shop - clear cart via API
        console.log("🧹 Different shop detected - clearing cart");
        console.log("Current shop:", shopId, "Cart shop:", cartShopId);

        const res = await fetch(
          `https://dev2024.co.in/web/liquidity-backend/admin/api/clearTempCart/${deviceId}`,
          { method: "POST" }
        );

        if (res.ok) {
          console.log("✅ Cart cleared successfully via API");
          localStorage.removeItem("cart_shop_id");
          setCartItems([]);
          setCartTotal(0);
          setCartCount(0);
          toast.success("Cart cleared - now shopping from current store");
        } else {
          console.error("💥 Failed to clear cart via API");
          // Fallback: clear local storage anyway
          localStorage.removeItem("cart_shop_id");
          setCartItems([]);
          setCartTotal(0);
          setCartCount(0);
        }
      } catch (error) {
        console.error("💥 Shop validation error:", error);
        // Fallback cleanup
        localStorage.removeItem("cart_shop_id");
        setCartItems([]);
        setCartTotal(0);
        setCartCount(0);
      }
    };

    validateShop();
  }, [deviceId, shopId]);

  // ---------- AUTO FETCH CART ----------
  useEffect(() => {
    console.log("🎯 AUTO-FETCH CHECK:", { deviceId: !!deviceId, userId: !!userId });
    if (deviceId) {
      fetchCart();
    }
  }, [deviceId, fetchCart]);

  // ---------- STORE DATA ----------
  // useEffect(() => {
  //   const fetchStoreData = async () => {
  //     try {
  //       const res = await fetch(
  //         "https://dev2024.co.in/web/liquidity-backend/admin/api/fetchDashboardDataForTempUsers"
  //       );
  //       const data = await res.json();

  //       if (data.status === "1" && Array.isArray(data.shops)) {
  //         const shop = data.shops.find(
  //           (s: { id: string }) => String(s.id) === String(shopId)
  //         );
  //         if (shop) {
  //           const selectedShop = {
  //             id: shop.id,
  //             name: shop.name || "Vertige Investment Group Annual Summit",
  //             image: shop.image || null,
  //           };
  //           localStorage.setItem("selected_shop", JSON.stringify(selectedShop));
  //           setStoreData({
  //             name: selectedShop.name,
  //             image: selectedShop.image,
  //           });
  //           return;
  //         }
  //       }

  //       const fallback = {
  //         id: shopId,
  //         name: "Vertige Investment Group Annual Summit",
  //         image: null,
  //       };
  //       localStorage.setItem("selected_shop", JSON.stringify(fallback));
  //       setStoreData({ name: fallback.name, image: fallback.image });
  //     } catch (e) {
  //       console.error("fetchStoreData error", e);
  //     }
  //   };

  //   fetchStoreData();
  // }, [shopId]);

  useEffect(() => {
  const fetchStoreData = async () => {
    try {
      const res = await fetch(
        "https://dev2024.co.in/web/liquidity-backend/admin/api/fetchDashboardDataForTempUsers"
      );
      const data = await res.json();

      if (data.status === "1" && Array.isArray(data.shops)) {
        const shop = data.shops.find(
          (s: { id: string }) => String(s.id) === String(shopId)
        );

        if (shop) {
          // IMPORTANT: if closed, go to restaurant-closed page
          const isOpen = Number(shop.is_open ?? 1);
          if (isOpen === 0) {
            // replace is better for guard-style redirects
            // router.replace(`/restaurant-closed?shop=${shopId}`);
            // return;
            router.replace(`/restaurant-closed/${shopId}${initialTable ? `?table=${initialTable}` : ''}`);
  return;
          }

          const selectedShop = {
            id: shop.id,
            name: shop.name || "Vertige Investment Group Annual Summit",
            image: shop.image || null,
            is_open: isOpen,
          };

          localStorage.setItem("selected_shop", JSON.stringify(selectedShop));
          setStoreData({
            name: selectedShop.name,
            image: selectedShop.image,
            is_open: selectedShop.is_open,
          });
          return;
        }
      }

      // fallback (treat as open or decide your default)
      const fallback = { id: shopId, name: "Vertige Investment Group Annual Summit", image: null, is_open: 1 };
      localStorage.setItem("selected_shop", JSON.stringify(fallback));
      setStoreData({ name: fallback.name, image: fallback.image, is_open: fallback.is_open });
    } catch (e) {
      console.error("fetchStoreData error", e);
    }
  };

  fetchStoreData();
}, [shopId, router]);

  // ---------- CATEGORIES / MIXERS ----------
  useEffect(() => {
    let cancelled = false;

    fetch(
      `https://dev2024.co.in/web/liquidity-backend/admin/api/fetchCategoriesByShop/${shopId}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data && (data.status === "1" || data.status === 1)) {
          const mapped: Category[] = (data.categories || []).map(
            (cat: { id: string | number; name: string; products: ApiProduct[] }) => ({
              id: String(cat.id),
              name: cat.name,
              items: Array.isArray(cat.products)
                ? cat.products.map((p) => ({
                    id: Number(p.id),
                    name: p.name,
                    description: p.description || "",
                    price: Number(p.current_price ?? p.price ?? 0),
                    image: `https://admin.liquiditybars.com/assets/upload/sub_categories/${encodeURIComponent(
                      p.image || ""
                    )}`,
                    is_double_shot: Number(p.is_double_shot || 0),
                    double_shot_price: Number(p.double_shot_price || 0),
                    is_add_mixture: Number(p.is_add_mixture || 0),
                    price_display: Number(p.current_price ?? p.price ?? 0),
                  }))
                : [],
            })
          );
          const reversed = mapped.reverse();
          setCategories(reversed);
          if (reversed.length > 0) setActiveCategory(reversed[0].id);
        }
      })
      .catch((e) => console.error("fetchCategories error", e));

    return () => {
      cancelled = true;
    };
  }, [shopId]);

  useEffect(() => {
    if (!categories.length) return;
    const mixerCat = categories.find((c) => c.id === "12");
    if (mixerCat) setMixers(mixerCat.items);
  }, [categories]);

  // ---------- CLEAR CART ----------
  const clearCart = useCallback(async () => {
    try {
      await fetch("/api/deleteAllCartItems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId || "", device_id: deviceId }),
      });
    } catch (e) {
      console.error("deleteAllCartItems error", e);
    }
    setCartItems([]);
    setCartTotal(0);
    setCartCount(0);
  }, [deviceId, userId]);

  // ---------- SHOP CHECK ----------
  const checkShopBeforeAdd = async (item: MenuItem | null, qty: number) => {
    if (!item || isAddingToCart) return; // UPDATED: Check loading state

    // 🚨 NEW: CHECK SHOP STATUS FIRST
  const isShopOpen = await checkShopStatusBeforeAdd();
  if (!isShopOpen) {
    // 🆕 REDIRECT TO CLOSED PAGE
    const redirectUrl = `/restaurant-closed/${shopId}${tableNumber ? `?table=${tableNumber}` : ''}`;
    router.replace(redirectUrl);
    return;
  }

    const cartShop =
      typeof window !== "undefined" ? localStorage.getItem("cart_shop_id") : null;

    if (!cartShop || cartShop === shopId) {
      await addToCart(item, qty);
      return;
    }

    const confirmed = window.confirm(
      "Your cart has items from another store. Clear cart and continue?"
    );
    if (!confirmed) return;

    await clearCart();
    await addToCart(item, qty);
  };

  const checkShopStatusBeforeAdd = async (): Promise<boolean> => {
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
  } catch (error) {
    console.error("Shop status check failed:", error);
    return false;
  }
};

  // ---------- ADD TO CART (UPDATED WITH LOADING STATE) ----------
  const addToCart = async (item: MenuItem, qty: number) => {
    if (qty <= 0) {
      toast.error("Please choose a quantity");
      return;
    }

    // Prevent multiple clicks
    if (isAddingToCart) return;

    const controller = new AbortController();

    try {
      setIsAddingToCart(true); // Show loader

      const userIdLocal =
        typeof window !== "undefined" ? localStorage.getItem("user_id") || "" : "";
      const deviceIdLocal =
        typeof window !== "undefined" ? localStorage.getItem("device_id") || "" : deviceId;

      const isDouble = extraShotQty > 0 ? 1 : 0;
      const doublePrice = extraShotQty > 0 ? item.double_shot_price || 0 : 0;
      const linePrice =
        extraShotQty > 0 ? item.price + doublePrice * extraShotQty : item.price;

      const data: Record<string, string> = {
        device_id: deviceIdLocal,
        user_id: userIdLocal,
        cartProductIds: String(item.id),
        cartProductsNames: item.name,
        cartProductPrices: linePrice.toString(),
        cartQuantities: String(qty),
        cartIsLiquors: item.is_double_shot ? "1" : "0",
        units: "1oz",
        is_double_shots: String(isDouble),
        double_shot_prices: String(doublePrice * extraShotQty),
        shot_count: String(extraShotQty),
        choice_of_mixer_names: selectedMixer?.name || "",
        special_instructions: specialInstructions || "",
      };

      console.log("🛒 ADD TO CART payload =>", data);

      const body = new URLSearchParams(data).toString();

      const res = await fetch("/api/tableAddToCart", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: controller.signal,
      });

      const result = await res.json();
      console.log("✅ ADD response =>", result);

      if (result.status === "1" || result.status === 1) {
        if (typeof window !== "undefined") {
          localStorage.setItem("cart_shop_id", shopId);
        }

        await fetchCart(new AbortController().signal);
        toast.success(result.message || "Item added to cart");

        setSelectedItem(null);
        setModalQty(1);
        setExtraShotQty(0);
        setSelectedMixer(null);
        setTempSelectedMixer(null);
        setSpecialInstructions("");
      } else {
        toast.error(result.message || "Failed to add to cart");
      }
    } catch (e: any) {
      console.error("💥 addToCart ERROR:", e.message);
      toast.error("Network error");
    } finally {
      setIsAddingToCart(false); // Re-enable button
    }
  };

  // ---------- SCROLL ----------
  const setSectionRef = (id: string, el: HTMLDivElement | null) => {
    sectionRefs.current[id] = el;
  };

  const scrollToSection = (id: string) => {
    const section = sectionRefs.current[id];
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveCategory(id);
    }
  };
  const getShopId = (): string => {
    const selected_shop = getLocalStorage("selected_shop");
    return selected_shop
      ? JSON.parse(selected_shop)?.id || getLocalStorage("shop_id")
      : getLocalStorage("shop_id");
  };

  // ✅ Get today's date
  const getTodayDate = (): string => {
    return new Date().toISOString().split("T")[0];
  };

  // ✅ Load from localStorage
  useEffect(() => {
    const storedDevice = getLocalStorage("device_id");
    const storedTable = getLocalStorage("table_number") || getLocalStorage("table_no");
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
  
        const url = `https://dev2024.co.in/web/liquidity-backend/admin/api/tblOrderList/${deviceId}/${orderDate}/${tableNoFromStorage}`;
  
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

    useEffect(() => {
    if (deviceId) {
      fetchCart();
      fetchOrders();
    }
  }, [deviceId, fetchCart, fetchOrders]);


  // const handleViewTab = useCallback(() => {
  //   router.push("/my-table");
  // }, [router]);

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
      `https://dev2024.co.in/web/liquidity-backend/admin/api/getSquareOrderStatus/${squareOrderId}`
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


  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY + 150;
      for (const cat of categories) {
        const sec = sectionRefs.current[cat.id];
        if (!sec) continue;
        if (scrollY >= sec.offsetTop && scrollY < sec.offsetTop + sec.offsetHeight) {
          setActiveCategory(cat.id);
          break;
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [categories]);

  useEffect(() => {
    const btn = categoryButtonRefs.current[activeCategory];
    if (btn) btn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeCategory]);

  

  // Debug info
  console.log("🔍 RENDER DEBUG =>", {
    cartLoaded,
    cartCount,
    deviceId: deviceId ? deviceId.slice(0, 8) + "..." : "EMPTY",
    userId: userId ? userId.slice(0, 8) + "..." : "EMPTY",
    isLoggedIn,
    tableNumber,
  });

  if (!isClient) {
    return <div className="text-center py-10">Loading...</div>;
  }

  return (
    <>
      <header className="header">
        <button type="button" className="icon_only"></button>
        <div className="pageTitle">Menu</div>
        {isLoggedIn && (
  <button 
    type="button" 
    className="icon_only"
    onClick={() => setShowLogoutModal(true)}
    title="Log out"
  >
    <LogOut size={20} />
  </button>
)}
        {!loadingOrders ? (
  matchedOrders.length > 0 ? (
    <button type="button" className="icon_only" onClick={handleViewTab}>
      <Receipt size={20} />
    </button>
  ) : (
    <button type="button" className="icon_only"></button>
  )
) : (
  <button type="button" className="icon_only"></button>
)}
      </header>

      <section className="pageWrapper hasHeader hasMenu">
        {/* Category bar */}
        <div
          className={`${styles.catMenu} bg-white border-b-4 border-gray-200 overflow-x-auto no-scrollbar w-full z-40`}
        >
          <div className="flex">
            {categories.map((cat) => (
              <button
                key={cat.id}
                ref={(el) => {
                  categoryButtonRefs.current[cat.id] = el;
                }}
                onClick={() => scrollToSection(cat.id)}
                className={`whitespace-nowrap px-5 py-3 font-medium ${
                  activeCategory === cat.id ? "bg-gray-200 text-black" : "text-gray-600"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu list */}
        <div className="px-4 pb-24">
          {categories.map((cat) => (
            <div
              key={cat.id}
              ref={(el) => setSectionRef(cat.id, el)}
              className="pt-4 scroll-mt-24"
            >
              <h2 className="text-xl mb-4">{cat.name}</h2>
              <div className="space-y-4">
                {cat.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between w-full">
                    <div
                      className={styles.itemCard}
                      onClick={() => setSelectedItem(item)}
                    >
                      <figure className="relative h-28 w-28">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </figure>
                      <div className={styles.itemContent}>
                        <h3>{item.name}</h3>
                        <p>{item.description}</p>
                        <div className="flex items-center justify-between">
                          <p className={styles.price}>₹{item.price.toFixed(2)}</p>
                          <button className={styles.addButton}>
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Sticky cart */}
        {cartLoaded && cartCount > 0 && (
          <div className={styles.bottomButton}>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const orderType = typeof window !== "undefined" ? localStorage.getItem('order_type') : null;
                  const cartPage = orderType === 'bar' ? '/bar-cart' : '/restaurant-cart';
                  router.push(cartPage);
                }}
                className="bg-primary px-4 py-3 rounded-lg w-full text-white flex justify-between items-center"
              >
                <span>({cartCount} items | ₹{cartTotal.toFixed(2)})</span>
                <span>View Cart</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Item customization modal */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title="Customization"
        >
          <div className="flex items-center justify-between mb-4">
            <h3>{selectedItem.name}</h3>
            <h3 className={styles.itemPrice}>₹{selectedItem.price.toFixed(2)}</h3>
          </div>

          {selectedItem.is_double_shot ? (
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-blue-200">
              <div>
                <h4>Add Extra Shots</h4>
                <p>₹{(selectedItem.double_shot_price || 0).toFixed(2)}/additional shot</p>
              </div>
              <QuantityButton
                min={0}
                max={5}
                initialValue={extraShotQty}
                onChange={setExtraShotQty}
              />
            </div>
          ) : null}

          {selectedItem.is_add_mixture ? (
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-blue-200">
              <p>Add Mixer (Non-Alcoholic)</p>
              {selectedMixer ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-700">{selectedMixer.name}</span>
                  <button
                    className="flex items-center justify-center p-2 rounded-full bg-red-100"
                    onClick={() => setSelectedMixer(null)}
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              ) : (
                <button
                  className={styles.mixerButton}
                  onClick={() => setShowMixerModal(true)}
                >
                  <Plus size={16} />
                </button>
              )}
            </div>
          ) : null}

          <h5 className="mb-2">Special Instructions</h5>
          <textarea
            placeholder="Enter your special instructions here"
            className={styles.textarea}
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
          />

          <div className="flex items-center justify-center mb-3">
            <QuantityButton
              min={1}
              max={10}
              initialValue={modalQty}
              onChange={setModalQty}
            />
          </div>

          {/* UPDATED: Add to cart button with loading state */}
          <button
            className="w-full bg-primary text-white py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => checkShopBeforeAdd(selectedItem!, modalQty)}
            disabled={isAddingToCart}
          >
            {isAddingToCart ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Adding...
              </>
            ) : (
              "Add to cart"
            )}
          </button>
        </Modal>
      )}

      {/* Bill splitting warning modal */}
      <Modal
        isOpen={showBillWarning}
        onClose={() => setShowBillWarning(false)}
        title="Warning"
      >
        <div className="space-y-4 text-center px-2">
          <p className="text-sm text-gray-800">
            Each party can only order for themselves as Liquidity{" "}
            <span className="font-semibold">does not allow for bill splitting</span>.
            If you add drinks intended for someone else to your tab, you will have
            to pay for them.
          </p>

          <button
            className="w-full bg-primary text-white py-2 rounded-lg font-medium"
            onClick={() => setShowBillWarning(false)}
          >
            I Understand
          </button>
        </div>
      </Modal>

      {/* Mixer selection modal */}
      <Modal
        isOpen={showMixerModal}
        onClose={() => {
          setShowMixerModal(false);
          setTempSelectedMixer(null);
        }}
        title="Choose a Mixer"
      >
        <div className="grid grid-cols-1 gap-4">
          {mixers.map((mixer) => (
            <label
              key={mixer.id}
              className={`cursor-pointer border rounded-lg p-3 flex items-center justify-between transition ${
                tempSelectedMixer?.id === mixer.id
                  ? "border-primary bg-blue-50"
                  : "border-gray-200"
              }`}
            >
              <span className="text-sm mr-auto text-center">{mixer.name}</span>
              <input
                type="radio"
                name="mixer"
                value={mixer.id}
                checked={tempSelectedMixer?.id === mixer.id}
                onChange={() => setTempSelectedMixer(mixer)}
              />
            </label>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg"
            onClick={() => {
              setShowMixerModal(false);
              setTempSelectedMixer(null);
            }}
          >
            Cancel
          </button>

          <button
            className="bg-primary text-white px-4 py-2 rounded-lg"
            onClick={() => {
              if (tempSelectedMixer) setSelectedMixer(tempSelectedMixer);
              setTempSelectedMixer(null);
              setShowMixerModal(false);
            }}
          >
            Apply
          </button>
        </div>
      </Modal>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <>
          <div 
            className="fixed inset-0 bg-black-50 bg-opacity-50 z-100 flex items-center justify-center p-4" 
            onClick={handleLogoutCancel}
          >
            <div 
              className="bg-white rounded-2xl p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto shadow-2xl" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Log Out?</h3>
                  <p className="text-sm text-gray-500">
                    This will clear your cart and log you out. You will need to log in again.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleLogoutCancel}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <X size={18} />
                  Cancel
                </button>
                <button
                  onClick={handleLogoutConfirm}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut size={18} />
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
