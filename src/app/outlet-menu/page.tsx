
"use client";

import { useRouter, usePathname } from "next/navigation";
import Header from "@/components/common/Header/Header";
import BottomNavigation from "@/components/common/BottomNavigation/BottomNavigation";
import Modal from "@/components/common/Modal/Modal";
import QuantityButton from "@/components/common/QuantityButton/QuantityButton";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import styles from "./outlet-menu.module.scss";
import toast from "react-hot-toast";

/* -------------------------
   Types
------------------------- */
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
  addOns?: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    unit: string;
  }[];
}

interface Category {
  id: string;
  name: string;
  items: MenuItem[];
}

// API Product returned from backend
interface ProductAPI {
  id: string | number;
  name: string;
  description?: string;
  current_price?: number | string;
  price?: number | string;
  image?: string;
  is_double_shot?: number | string;
  double_shot_price?: number | string;
  is_add_mixture?: number | string;
}

// API Category returned from backend
interface CategoryAPI {
  id: string | number;
  name: string;
  products?: ProductAPI[];
}

// API response type
interface FetchCategoriesResponse {
  status: string | number;
  categories: CategoryAPI[];
}


/*---- Component ----*/
export default function OutletMenu() {
  const router = useRouter();
  const pathname = usePathname();

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const categoryButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState<number>(0);
  const [cartCount, setCartCount] = useState<number>(0);

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [modalQty, setModalQty] = useState<number>(1);
  const [extraShotQty, setExtraShotQty] = useState<number>(0);

  const [showMixerModal, setShowMixerModal] = useState(false);
  const [mixers, setMixers] = useState<MenuItem[]>([]);
  const [selectedMixer, setSelectedMixer] = useState<MenuItem | null>(null);
  const [tempSelectedMixer, setTempSelectedMixer] = useState<MenuItem | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState<string>("");

  const [deviceId, setDeviceId] = useState("web");

  /* IDs from localStorage with fallback */
  const shopId =
    typeof window !== "undefined"
      ? localStorage.getItem("shop_id") ||
        (localStorage.getItem("selected_shop")
          ? (() => {
              try {
                const ss = JSON.parse(localStorage.getItem("selected_shop") || "null");
                return ss?.id ? String(ss.id) : "25";
              } catch {
                return "25";
              }
            })()
          : "25")
      : "25";

  const userId = (typeof window !== "undefined" ? localStorage.getItem("user_id") : null) || "951";

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedId = localStorage.getItem("device_id");

    if (storedId) {
      setDeviceId(storedId);
    }
  }, []);

  /* Utility: Normalize Cart */
  const normalizeCartItem = (item: Record<string, unknown>): CartItem => {
    const isDoubleShot = Boolean(item["is_double_shot"]);

    const choiceMixerName =
      typeof item["choice_of_mixer_name"] === "string"
        ? item["choice_of_mixer_name"]
        : "";

    const extraShots =
      typeof item["shot_count"] === "number"
        ? (item["shot_count"] as number)
        : Number(item["shot_count"] as unknown) || 0;

    const specialInstr =
      typeof item["special_instruction"] === "string"
        ? (item["special_instruction"] as string)
        : "";

    return {
      ...(item as unknown as CartItem),
      is_double_shot: isDoubleShot,
      selectedMixer:
        choiceMixerName && mixers.length > 0
          ? mixers.find((mix) => mix.name === choiceMixerName) || null
          : null,
      extraShotQty: extraShots,
      specialInstructions: specialInstr,
    };
  };

  /* Local Cart Hydration */
  useEffect(() => {
    try {
      const itemsRaw = typeof window !== "undefined" ? localStorage.getItem("liquidity_cart_cache") : null;
      const totalRaw = typeof window !== "undefined" ? localStorage.getItem("liquidity_cart_total") : null;
      const countRaw = typeof window !== "undefined" ? localStorage.getItem("liquidity_cart_count") : null;
      setCartItems(itemsRaw ? JSON.parse(itemsRaw) : []);
      setCartTotal(totalRaw ? Number(totalRaw) : 0);
      setCartCount(countRaw ? Number(countRaw) : 0);
    } catch {
      // ignore hydration errors
    }
  }, []);

  const persistCart = (items: CartItem[], total: number, count: number) => {
    try {
      localStorage.setItem("liquidity_cart_cache", JSON.stringify(items));
      localStorage.setItem("liquidity_cart_total", String(total));
      localStorage.setItem("liquidity_cart_count", String(count));
    } catch {
      // ignore
    }
  };

  /* FETCH CATEGORIES for current shop */
  useEffect(() => {
  let cancelled = false;
  fetch(`https://dev2024.co.in/web/liquidity-backend/admin/api/fetchCategoriesByShop/${shopId}`)
    .then((res) => res.json())
    .then((data: FetchCategoriesResponse) => {
      if (cancelled) return;

      if (data && (data.status === "1" || data.status === 1) && Array.isArray(data.categories)) {
        const mapped: Category[] = data.categories.map((cat) => ({
          id: String(cat.id),
          name: cat.name,
          items: Array.isArray(cat.products)
            ? cat.products.map((p) => ({
                id: Number(p.id),
                name: p.name,
                description: p.description || "",
                price: Number(p.current_price ?? p.price ?? 0) || 0,
                image: `https://dev2024.co.in/web/liquidity-backend/assets/upload/sub_categories/${encodeURIComponent(
                  p.image || ""
                )}`,
                is_double_shot: Number(p.is_double_shot) || 0,
                double_shot_price: Number(p.double_shot_price || 0),
                is_add_mixture: Number(p.is_add_mixture) || 0,
                price_display: Number(p.current_price ?? p.price ?? 0) || 0,
              }))
            : [],
        }));

        const reversed = mapped.reverse();
        setCategories(reversed);
        if (reversed.length > 0) setActiveCategory(reversed[0].id);
      } else {
        setCategories([]);
      }
    })
    .catch((err) => {
      console.error("Error fetching categories:", err);
    });

  return () => {
    cancelled = true;
  };
}, [shopId]);



  /* EXTRACT MIXERS */
  useEffect(() => {
    if (categories.length > 0) {
      const mixerCategory = categories.find((c) => c.id === "12");
      if (mixerCategory) setMixers(mixerCategory.items);
    }
  }, [categories]);

  /* CATEGORY UI SCROLLING */
  const setCategoryButtonRef = (id: string, el: HTMLButtonElement | null) => {
    categoryButtonRefs.current[id] = el;
  };
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
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY + 150;
      for (const cat of categories) {
        const section = sectionRefs.current[cat.id];
        if (section) {
          const { offsetTop, offsetHeight } = section;
          if (scrollY >= offsetTop && scrollY < offsetTop + offsetHeight) {
            setActiveCategory(cat.id);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [categories]);
  useEffect(() => {
    const activeBtn = categoryButtonRefs.current[activeCategory];
    if (activeBtn) {
      try {
        activeBtn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      } catch {
        // ignore
      }
    }
  }, [activeCategory]);

  /* FETCH CART FROM BACKEND (NO array in deps!) */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchCartFromBackend();
  }, [pathname]);

  useEffect(() => {
    const handleFocus = () => fetchCartFromBackend();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchCartFromBackend();
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  /*--- Backend Cart Fetch ---*/
  const fetchCartFromBackend = async () => {
    try {
      const res = await fetch("/api/getCart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, device_id: deviceId }),
      });
      const data = await res.json();

      console.log("get cart" , data);
      // Normalize, ensure mixer mapping uses the latest mixers state
      const itemsBackend = data.cartItems ?? data.cart_items ?? data.data ?? [];
      const items = Array.isArray(itemsBackend)
        ? itemsBackend.map((item: Record<string, unknown>) => normalizeCartItem(item))
        : [];
      const total = Number(data.total_price ?? data.totalPrice ?? 0);
      const count = Number(data.total_quantity ?? data.total_qty ?? data.totalQuantity ?? 0);
      setCartItems(items);
      setCartTotal(total);
      setCartCount(count);
      persistCart(items, total, count);
    } catch (err) {
      console.error("fetchCartFromBackend error:", err);
    }
  };

  /* CLEAR CART FROM BACKEND + LOCAL */
  const clearCartFromBackend = async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/deleteAllCartItems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, device_id: deviceId }),
      });
      const data = await res.json();
      return data && (data.status === "1" || data.status === 1);
    } catch (err) {
      console.error("clearCartFromBackend error:", err);
      return false;
    }
  };
  const clearLocalCart = async () => {
    await clearCartFromBackend();
    try {
      localStorage.removeItem("liquidity_cart_cache");
      localStorage.removeItem("liquidity_cart_total");
      localStorage.removeItem("liquidity_cart_count");
      localStorage.removeItem("cart_shop_id");
    } catch {
      // ignore
    }
    setCartItems([]);
    setCartCount(0);
    setCartTotal(0);
  };

  /* SHOP VALIDATION BEFORE ADDING ITEM */
  const checkShopBeforeAdd = async (item: MenuItem | null, qty: number) => {
    if (!item) return;

    const currentShop = shopId;
    const cartShop = typeof window !== "undefined" ? localStorage.getItem("cart_shop_id") : null;

    // No previous shop → directly add
    if (!cartShop) {
      await addToCart(item, qty);
      return;
    }

    // Different shop → confirm
    if (cartShop !== currentShop) {
      const confirmed = confirm("Your cart has items from another store. Clear cart and continue?");
      if (!confirmed) return;

      await clearLocalCart();
      await fetchCartFromBackend();
      await addToCart(item, qty);
      return;
    }

    await addToCart(item, qty);
  };


  /* ADD TO CART */
  const addToCart = async (item: MenuItem, qty: number) => {
  if (!item || qty <= 0) {
   // alert("Please choose a quantity");
    toast.success("Please choose a quantity");
    return;
  }

  // double shot logic
  const isDouble = extraShotQty > 0 ? 1 : 0;
  const doubleShotPrice = extraShotQty > 0 ? item.double_shot_price || 0 : 0;

  // base price + double shot charges
  const price =
    extraShotQty > 0
      ? item.price + doubleShotPrice * extraShotQty
      : item.price;

  const data: Record<string, string | number> = {
    device_id: deviceId || "",
    user_id: userId,
    cartProductIds: String(item.id),
    cartProductsNames: item.name,
    cartProductPrices: price,
    cartQuantities: qty,

    cartIsLiquors: item.is_double_shot ? "1" : "0",
    units: "1oz",

    // main fields
    is_double_shots: isDouble,
    double_shot_prices: doubleShotPrice * extraShotQty, // ✅ FIXED
    shot_count: extraShotQty,

    choice_of_mixer_names: selectedMixer?.name || "",
    special_instructions: specialInstructions || "",
  };

  const paramsObj = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, String(v)])
  );
  const formBody = new URLSearchParams(paramsObj).toString();

  console.log(data);

  try {
    const res = await fetch("/api/addToCart", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody,
    });

    const result = await res.json();

    if (result.status === "1" || result.status === 1) {
      try {
        localStorage.setItem("cart_shop_id", shopId);
      } catch {
        // ignore
      }

      await fetchCartFromBackend();

      
      toast.success(result.message || "Item added to cart");

      // reset modal states
      setSelectedItem(null);
      setModalQty(1);
      setExtraShotQty(0);
      setSelectedMixer(null);
      setTempSelectedMixer(null);
      setSpecialInstructions("");
    } else {
      alert(result.message || "Failed to add to cart");
    }
  } catch (err) {
    console.error("addToCart network error:", err);
    alert("Network error while adding to cart");
  }
};


  /* RENDER */
  return (
    <>
      <Header title="Menu" />
      <section className="pageWrapper hasHeader hasMenu hasFooter">
        {/* Category scroller */}
        <div className={`${styles.catMenu} bg-white border-b-4 border-gray-200 overflow-x-auto no-scrollbar w-full z-40`}>
          <div className="flex">
            {categories.map((cat) => (
              <button
                key={cat.id}
                ref={(el) => setCategoryButtonRef(cat.id, el)}
                onClick={() => scrollToSection(cat.id)}
                className={`whitespace-nowrap px-5 py-3 font-medium ${activeCategory === cat.id ? "bg-gray-200 text-black" : "text-gray-600"}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Sections */}
        <div className="px-4 pb-20">
          {categories.map((cat) => (
            <div key={cat.id} ref={(el) => setSectionRef(cat.id, el)} className="pt-4 scroll-mt-24">
              <h2 className="text-xl mb-4">{cat.name}</h2>
              <div className="space-y-4">
                {cat.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between w-full">
                    <div className={styles.itemCard} onClick={() => setSelectedItem(item)}>
                      <figure className="relative h-28 w-28">
                        <Image src={item.image} alt={item.name} fill className="object-cover rounded-lg" />
                      </figure>
                      <div className={styles.itemContent}>
                        <h3>{item.name}</h3>
                        <p>{item.description}</p>
                        <div className="flex items-center justify-between">
                          <p className={styles.price}>₹{item.price.toFixed(2)}</p>
                          <button className={styles.addButton} onClick={() => setSelectedItem(item)}>
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

        {/* Sticky Cart */}
        {cartCount > 0 && (
          <div className={styles.bottomButton}>
            <div className="flex gap-3">
              <button onClick={() => router.push("/cart")} className="bg-primary px-4 py-3 rounded-lg w-full text-white flex justify-between items-center">
                <span>({cartCount} items | ₹{cartTotal.toFixed(2)})</span>
                <span>View Cart</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Item Modal */}
      {selectedItem && (
        <Modal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title="Customization">
          <div className="flex items-center justify-between mb-4">
            <h3>{selectedItem.name}</h3>
            <h3 className={styles.itemPrice}>₹{selectedItem.price.toFixed(2)}</h3>
          </div>
          {/* Extra Shots */}
          {selectedItem?.is_double_shot ? (
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-blue-200">
              <div>
                <h4>Add Extra Shots</h4>
                <p>₹{(selectedItem.double_shot_price || 0).toFixed(2)}/additional shot</p>
              </div>
              <QuantityButton min={0} max={5} initialValue={extraShotQty} onChange={setExtraShotQty} />
            </div>
          ) : null}
          {/* Mixer */}
          {selectedItem?.is_add_mixture ? (
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-blue-200">
              <p>Add Mixer (Non-Alcoholic)</p>
              {selectedMixer ? (
                <div className="flex items-center gap-3">
                  {/* <span className="text-sm text-gray-700">{selectedMixer.name} - ${selectedMixer.price}</span> */}
                  <span className="text-sm text-gray-700">{selectedMixer.name}</span>
                  <button className="flex items-center justify-center p-2 rounded-full bg-red-100" onClick={() => setSelectedMixer(null)}>
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              ) : (
                <button className={styles.mixerButton} onClick={() => setShowMixerModal(true)}>
                  <Plus size={16} />
                </button>
              )}
            </div>
          ) : null}
          <h5 className="mb-2">Special Instructions</h5>
          <textarea placeholder="Enter your special instructions here" className={styles.textarea} value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} />
          <div className="flex items-center justify-center mb-3">
            <QuantityButton min={1} max={10} initialValue={modalQty} onChange={setModalQty} />
          </div>
          <button className="w-full bg-primary text-white py-2 rounded-lg" onClick={() => checkShopBeforeAdd(selectedItem!, modalQty)}>
            Add to cart
          </button>
        </Modal>
      )}
      {/* Mixer Modal */}
      <Modal isOpen={showMixerModal} onClose={() => { setShowMixerModal(false); setTempSelectedMixer(null); }} title="Choose a Mixer">
        <div className="grid grid-cols-1 gap-4">
          {mixers.map((mixer) => (
            <label key={mixer.id} className={`cursor-pointer border rounded-lg p-3 flex items-center justify-between transition ${tempSelectedMixer?.id === mixer.id ? "border-primary bg-blue-50" : "border-gray-200"}`}>
              {/* <span className="text-sm mr-auto text-center">{mixer.name} - ${mixer.price_display ?? mixer.price}</span> */}
              <span className="text-sm mr-auto text-center">{mixer.name}</span>
              <input type="radio" name="mixer" value={String(mixer.id)} checked={tempSelectedMixer?.id === mixer.id} onChange={() => setTempSelectedMixer(mixer)} />
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg" onClick={() => { setShowMixerModal(false); setTempSelectedMixer(null); }}>Cancel</button>
          <button className="bg-primary text-white px-4 py-2 rounded-lg" onClick={() => {
            if (tempSelectedMixer) setSelectedMixer(tempSelectedMixer);
            setTempSelectedMixer(null);
            setShowMixerModal(false);
          }}>Apply</button>
        </div>
      </Modal>
      <BottomNavigation />
    </>
  );
}
