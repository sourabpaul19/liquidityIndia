"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import statusImg from "../../../../public/images/bill.png";
import styles from "../bill-success.module.scss";

type ParamsType = Promise<{ id: string }>;

export default function BillSuccess({ params }: { params: ParamsType }) {
  const router = useRouter();
  const { id } = use(params);
  const orderId = id;

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

  const handleOrderAnother = () => {
    const shopId = getShopId();
    const tableNo =
      getLocalStorage("table_no") || getLocalStorage("table_number");

    if (shopId && tableNo) {
      router.push(`/restaurant/${shopId}?table=${tableNo}`);
    } else if (shopId) {
      router.push(`/restaurant/${shopId}`);
    } else {
      router.push("/restaurant");
    }
  };

  // Intercept browser back on this page
  useEffect(() => {
    // push a dummy state so back triggers popstate here
    window.history.pushState(null, "", window.location.href);

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      handleOrderAnother(); // go to restaurant menu instead of previous page
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []); // no deps: same behaviour for this page only

  return (
    <section className="pageWrapper">
      <div className="pageContainer vMiddle">
        <div className={styles.successWrapper}>
          <div className={styles.successIcon}>
            <Image src={statusImg} alt="Order status" fill />
          </div>

          <h4 className="text-center mb-2">
            Your bill is on the way
          </h4>

          <p className="text-center">
            Please speak with your server if you encounter any issues
          </p>

          <button
            onClick={() => router.push(`/bill/${orderId}`)}
            className="mt-6 bg-primary text-white px-6 py-3 rounded-lg w-full max-w-sm"
          >
            View Receipt
          </button>
        </div>
      </div>
    </section>
  );
}
