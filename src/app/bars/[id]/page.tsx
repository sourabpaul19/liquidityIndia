"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import BottomNavigation from "@/components/common/BottomNavigation/BottomNavigation";
import Header from "@/components/common/Header/Header";
import Image from "next/image";
import Modal from "@/components/common/Modal/Modal";
import QuantityButton from "@/components/common/QuantityButton/QuantityButton";
import Link from "next/link";
import { Plus } from "lucide-react";
import styles from "../bars.module.scss";

const BACKEND_ADD_CART_URL =
  "https://dev2024.co.in/web/liquidity-backend/admin/api/addMultipleCartItems";

// ----------------------------
// 📌 TypeScript Interfaces
// ----------------------------
interface OrderProduct {
  id: string;
  product_name: string;
  price: string;
  quantity: string;
  size?: string;

  // Optional mixer / addons
  is_double_shot?: boolean;
  extraShotQty?: number;
  double_shot_price?: number;
  selectedMixer?: {
    name: string;
    price: number;
  } | null;
  specialInstructions?: string;
}

interface RecentOrder {
  id: string;
  total_amount?: number;
  amount?: number;
  products: OrderProduct[];
}

interface ShopItem {
  id: string;
  name: string;
  image?: string;
  address?: string;
}

interface DashboardShop {
  orders: { shop: ShopItem }[];
  status: string;
}

interface RecentOrdersApiResponse {
  status: string;
  message?: string;
  orders?: RecentOrder[];
}

export default function Bars() {
  const router = useRouter();
  const pathname = usePathname();

  // Extract shopId from route
  const shopIdFromUrl = pathname.split("/").pop() || "";

  // ----------------------------
  // 🔹 State Hooks (no conditional hooks)
  // ----------------------------
  const [open, setOpen] = useState(false);
  const [shop, setShop] = useState<ShopItem | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<RecentOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const userId =
    typeof window !== "undefined"
      ? localStorage.getItem("user_id") || "951"
      : "951";

  const deviceId =
    typeof window !== "undefined"
      ? localStorage.getItem("device_id") || "web"
      : "web";

  // ----------------------------
  // 🔹 Fetch Shop + Recent Orders
  // ----------------------------
  useEffect(() => {
    if (!shopIdFromUrl) {
      setError("Invalid Shop ID");
      setLoading(false);
      return;
    }

    const fetchShopData = async () => {
      try {
        let shopData: ShopItem | null = null;
        const storedShop = localStorage.getItem("selected_shop");

        if (storedShop) {
          shopData = JSON.parse(storedShop);
        } else {
          const response = await fetch(
            `https://dev2024.co.in/web/liquidity-backend/admin/api/fetchDashboardDataForUsers/${userId}`
          );
          const data: DashboardShop = await response.json();

          if (data.status === "1") {
            shopData =
              data.orders
                .map((o) => o.shop)
                .find((s) => s.id === shopIdFromUrl) || null;

            if (shopData) {
              localStorage.setItem("selected_shop", JSON.stringify(shopData));
            }
          }
        }

        if (!shopData) {
          setError("Shop not found.");
          setLoading(false);
          return;
        }

        setShop(shopData);
        await fetchRecentOrders(shopIdFromUrl);
      } catch (err) {
        setError("Failed to fetch shop data.");
      }
    };

    const fetchRecentOrders = async (shopId: string) => {
      try {
        const response = await fetch(
          `https://dev2024.co.in/web/liquidity-backend/admin/api/myRecenntOrdersShopWise/${userId}/${shopId}`
        );

        const data: RecentOrdersApiResponse = await response.json();

        if (data.status === "1") {
          setRecentOrders(data.orders || []);
        } else {
          setError(data.message || "Failed to fetch recent orders");
        }
      } catch (err) {
        setError("Something went wrong while fetching orders");
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [shopIdFromUrl, userId]);

  // ----------------------------
  // 🔹 Calculate Order Total
  // ----------------------------
  const calculateTotal = () => {
    if (!selectedOrder) return 0;

    return selectedOrder.products.reduce((sum, p) => {
      return sum + Number(p.price) * Number(p.quantity);
    }, 0);
  };

  // ----------------------------
  // 🔹 Add Entire Order to Cart
  // ----------------------------
  const handleAddToCart = async () => {
    if (!selectedOrder) return;

    const invalidItem = selectedOrder.products.find(
      (p) => Number(p.quantity) <= 0
    );

    if (invalidItem) {
      alert("Please select quantity for all items");
      return;
    }

    for (const product of selectedOrder.products) {
      const params = new URLSearchParams();
      params.append("device_id", deviceId);
      params.append("user_id", userId);
      params.append("cartProductIds", product.id);
      params.append("cartProductsNames", product.product_name);
      params.append("cartProductPrices", product.price);
      params.append("cartQuantities", product.quantity);
      params.append("cartIsLiquors", "1");
      params.append("units", product.size || "1oz");

      // Double Shot
      const isDouble =
        product.is_double_shot && product.extraShotQty && product.extraShotQty > 0
          ? "1"
          : "0";

      params.append("is_double_shot", isDouble);
      params.append(
        "double_shot_price",
        isDouble === "1" ? String(product.double_shot_price || 0) : "0"
      );
      params.append(
        "shot_count",
        isDouble === "1" ? String(product.extraShotQty || 0) : "0"
      );

      // Mixer
      params.append("choice_of_mixer_name", product.selectedMixer?.name || "");
      params.append(
        "choice_of_mixer_price",
        product.selectedMixer?.price
          ? String(product.selectedMixer.price)
          : "0"
      );

      params.append("special_instruction", product.specialInstructions || "");

      // Add-ons (blank)
      params.append("add_on_id", "0");
      params.append("add_on_name1", "");
      params.append("add_on_name2", "");
      params.append("add_on_price1", "0");
      params.append("add_on_price2", "0");
      params.append("add_on_quantity", "0");
      params.append("add_on_unit", "0");

      params.append("is_active", "1");
      params.append("is_deleted", "0");
      params.append("is_liquor", "1");
      params.append("choice_of_alcohol_name", "");

      try {
        const res = await fetch(BACKEND_ADD_CART_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body: params.toString(),
        });

        const raw = await res.text();
        const jsonMatch = raw.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
          alert("Server returned invalid response.");
          return;
        }

        const data = JSON.parse(jsonMatch[0]);

        if (!(data.status === "1" || data.status === 1)) {
          alert(data.message || "Failed to add item");
          return;
        }
      } catch (err) {
        alert("Network error while adding to cart");
        return;
      }
    }

    localStorage.setItem("cart_shop_id", shopIdFromUrl);
    alert("Items added to cart!");
    setSelectedOrder(null);
    setOpen(false);
  };

  // ----------------------------
  // 🔹 UI Render
  // ----------------------------
  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (error) return <p className="text-red-600 text-center mt-10">{error}</p>;

  return (
    <>
      <Header title={shop?.name || "Bar"} />

      <section className="pageWrapper hasHeader hasFooter">
        <div className="pageContainer">
          <div className="container-fluid px-4">
            {shop?.image && (
              <figure className={styles.barBanner}>
                <Image src={shop.image} fill alt={shop.name} />
              </figure>
            )}

            <figcaption>
              <h2 className={styles.barTitle}>{shop?.name}</h2>
              <div className={styles.barAddress}>
                <span>{shop?.address}</span>
              </div>
            </figcaption>

            <h3 className="sectionHead">Order Again</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order.id}>
                    <div className={styles.repeatOrderCard}>
                      {order.products.map((product) => (
                        <div key={product.id} className={styles.orderItem}>
                          <span>{product.product_name}</span>
                          <span>x{product.quantity}</span>
                        </div>
                      ))}

                      <div className={styles.orderTotal}>
                        <span>
                          Order Amount - $
                          {order.total_amount || order.amount}
                        </span>

                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setOpen(true);
                          }}
                          className={styles.add_btn}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p>No recent orders</p>
              )}
            </div>
          </div>

          <div className="container-fluid pt-4 px-4 bottomButton">
            <Link
              href="/outlet-menu"
              onClick={() =>
                shop?.id && localStorage.setItem("shop_id", shop.id)
              }
              className="bg-primary px-3 py-3 rounded-lg w-full text-white block text-center"
            >
              View Menu
            </Link>

            <Modal
              isOpen={open}
              onClose={() => setOpen(false)}
              title="Order Again!"
            >
              {selectedOrder ? (
                <div className={styles.itemWrapper}>
                  {selectedOrder.products.map((product) => (
                    <div key={product.id} className={styles.itemCard}>
                      <div className={styles.itemDetails}>
                        <h4>{product.product_name}</h4>
                        <p>({product.size || "1oz"})</p>
                      </div>

                      <div className={styles.itemMeta}>
                        <p className={styles.itemPrice}>$ {product.price}</p>

                        <QuantityButton
                          min={1}
                          max={10}
                          initialValue={Number(product.quantity)}
                          onChange={(qty) => {
                            setSelectedOrder((prev) => {
                              if (!prev) return prev;

                              return {
                                ...prev,
                                products: prev.products.map((p) =>
                                  p.id === product.id
                                    ? { ...p, quantity: String(qty) }
                                    : p
                                ),
                              };
                            });
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  <div className="text-right font-semibold mt-2">
                    Total: $ {calculateTotal().toFixed(2)}
                  </div>

                  <button
                    className="bg-primary text-white w-full py-3 mt-4 rounded-lg"
                    onClick={handleAddToCart}
                  >
                    Add to Cart
                  </button>
                </div>
              ) : (
                <p>No items to show</p>
              )}
            </Modal>
          </div>
        </div>
      </section>

      <BottomNavigation />
    </>
  );
}
