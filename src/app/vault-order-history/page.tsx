"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/common/Header/Header";
import BottomNavigation from "@/components/common/BottomNavigation/BottomNavigation";
import styles from "./vault-order-history.module.scss";
import { AlertTriangle, X, Trash2 } from "lucide-react";

interface RedeemHistory {
  shop_name?: string;
  redeem_date?: string;
  quantiy?: string | number;
}

interface VaultShop {
  id?: string;
  name?: string;
  image?: string;
  address?: string;
}

interface VaultItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  unique_id: string;
  category_name: string;
  total_amount: string | number;
  order_date: string;
  end_date: string;
  quantity: string | number;
  total_quantity_used: string | number;
  balance_quantity: string | number;
  vault_shops?: VaultShop[];
  redeems?: RedeemHistory[];
}

export default function VaultOrderHistoryPage() {
  const [orders, setOrders] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderIdToDelete, setOrderIdToDelete] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null); // 👈 FIXED: Missing state added

  useEffect(() => {
    const fetchVaultItems = async () => {
      try {
        const userId = localStorage.getItem("user_id");

        if (!userId) {
          setLoading(false);
          return;
        }

        const res = await fetch(
          `https://dev2024.co.in/web/liquidity-india-backend/admin/api/fetchUserVaultItems/${userId}`
        );
        const data = await res.json();

        if (data?.status === "1" && Array.isArray(data?.products)) {
          setOrders(data.products);
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.error("Error fetching vault items:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVaultItems();
  }, []);

  const isExpired = (endDate: string) => {
    if (!endDate) return false;

    const today = new Date();
    const end = new Date(endDate.replace(" ", "T"));

    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    return today > end;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString.replace(" ", "T"));
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  const openDeleteModal = (id: string) => {
    setOrderIdToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setOrderIdToDelete(null);
  };

  const handleDeleteOrder = async () => {
    if (!orderIdToDelete) return;

    try {
      setDeletingId(orderIdToDelete);

      const res = await fetch(
        `https://dev2024.co.in/web/liquidity-india-backend/admin/api/deleteVaultHistory/${orderIdToDelete}` // 👈 FIXED: Using india-backend
      );

      const data = await res.json();

      if (data?.status === "1") {
        setOrders((prev) => prev.filter((item) => item.id !== orderIdToDelete));
        setShowDeleteModal(false);
        setOrderIdToDelete(null);
      } else {
        alert(data?.message || "Failed to delete order");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Something went wrong while deleting the order");
    } finally {
      setDeletingId(null);
    }
  };

  // Add this handler near your other functions
const handleOrderDetails = (item: VaultItem) => {
  localStorage.setItem('VaultOrderDetails', JSON.stringify(item));
  localStorage.setItem("order_id", item.id);
  // Navigate forward - use your preferred routing method
  window.location.href = '/vault-order-details'; // or router.push if using next/router
};



  return (
    <>
      <Header title="Vault Order History" />

      <section className="pageWrapper hasHeader hasFooter vaultHistoryPage">
        <div className="pageContainer py-4">
          {loading ? (
            <div className="emptyState text-center">Loading vault orders...</div>
          ) : orders.length === 0 ? (
            <div className="emptyState text-center">No vault orders found</div>
          ) : (
            <div className="px-4 flex flex-col gap-4">
              {orders.map((order) => {
                const expired = isExpired(order.end_date);
                const noBalance = Number(order.balance_quantity) <= 0;
                const disableDetails = expired;

                return (
                  <div className={styles.orderCard} key={order.id}>
                    <div className="flex gap-4 p-4 items-center">
                      <figure className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={order.product_image || "/images/bar.jpg"}
                          alt={order.product_name || "Product"}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </figure>

                      <div className="historyContent">
                        <h5 className="productName">{order.product_name}</h5>

                        <p className="metaText">
                          Order ID: <span>{order.unique_id || order.order_id}</span>
                        </p>

                        <p className="metaText">
                          Order Date: <span>{formatDate(order.order_date)}</span>
                        </p>

                        {expired && (
                          <p className="statusText errorText">
                            Your vault has expired
                          </p>
                        )}

                        {!expired && noBalance && (
                          <p className="statusText warningText">
                            No balance left in this vault.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className={styles.orderBottom}>
<button
  type="button"
  onClick={() => handleOrderDetails(order)}
  className={`actionBtn outlineBtn ${
    disableDetails ? "disabledBtn" : ""
  }`}
  disabled={disableDetails}
>
  Order Details
</button>
                      <button
                        type="button"
                        onClick={() => openDeleteModal(order.id)}
                        className="actionBtn text-danger filledBtn"
                      >
                        Delete Order
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Delete Order Confirmation Modal */}
      {showDeleteModal && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={handleDeleteCancel}
          >
            <div
              className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Delete Order?</h3>
                  <p className="text-sm text-gray-500">
                    This action <span className="font-semibold text-red-600">cannot be undone</span>. 
                    This vault order will be permanently removed from your history.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <X size={18} />
                  Cancel
                </button>
                <button
                  onClick={handleDeleteOrder}
                  disabled={deletingId === orderIdToDelete}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-red-400 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {deletingId === orderIdToDelete ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Delete Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <BottomNavigation />
    </>
  );
}