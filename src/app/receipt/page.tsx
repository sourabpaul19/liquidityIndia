"use client";
import { useState } from "react";
import styles from "./receipt.module.scss";
import Image from "next/image";
import Header from "@/components/common/Header/Header";
import QuantityButton from "@/components/common/QuantityButton/QuantityButton";
import Button from "@/components/common/Button/Button";
import BottomNavigation from "@/components/common/BottomNavigation/BottomNavigation";

export default function Cart() {
  const [selected, setSelected] = useState<string>("creditcard");

  const handleQuantityChange = (qty: number) => {
    console.log("Quantity changed:", qty);
  };

  const [selectedTip, setSelectedTip] = useState<string>("20");
  const [customTip, setCustomTip] = useState<string>("");

  const handleTipClick = (tip: string) => {
    setSelectedTip(tip);
    if (tip !== "other") setCustomTip(""); // clear custom tip when selecting preset
  };


  return (
    <>
      <Header title="Receipt" />

      <section className="page_content">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4">
          {/* 🛍️ Items Section */}
          <div>
            <h5 className="mb-4">Booking Details</h5>
            <div className={styles.receiptBlock}>
                <div className={`${styles.receiptItem} ${styles.noLine}`}>
                    <div>
                        <p>Booked By</p>
                        <h5>Sourab Paul</h5>
                    </div>
                </div>
                <div className={`${styles.receiptItem} ${styles.noLine}`}>
                    <div>
                        <p>Booked For</p>
                        <h5>Myself</h5>
                    </div>
                </div>
                <div className={`${styles.receiptItem} ${styles.noLine}`}>
                    <div>
                        <p>Phone</p>
                        <h5>+18420425082</h5>
                    </div>
                </div>
            </div>
            <h5 className="mb-4">Establishment Information</h5>
            <div className={styles.receiptBlock}>
                <div className={`${styles.receiptItem} ${styles.noLine}`}>
                    <div>
                        <p>Name</p>
                        <h5>Vic Pool Society at Casa Mezcal</h5>
                    </div>
                </div>
                <div className={`${styles.receiptItem} ${styles.noLine}`}>
                    <div>
                        <p>Address</p>
                        <h5>291 King St W, Toronto, ON M5V 1J5</h5>
                    </div>
                </div>
            </div>
            <h5 className="mb-4">Items</h5>
            <div className={styles.receiptBlock}>
                <div className={`${styles.receiptItem}`}>
                    <div>
                    <h5>
                        1 X Gin Shot <span>(1oz)</span>
                    </h5>
                    <p>
                        Mixer Name : Cranberry Juice
                        <br />
                        Extra Shots Unit : 1
                        <br />
                        Special Instruction : New Chilled
                    </p>
                    </div>
                    <div>
                        <h5>$ 11.00</h5>
                    </div>
                </div>
                <div className={`${styles.receiptItem}`}>
                    <div>
                  <h4>
                    1 X Gin Shot <span>(1oz)</span>
                  </h4>
                  <p>Mixer Name : Cranberry Juice</p>
                </div>
                    <div>
                        <h5>$ 11.00</h5>
                    </div>
                </div>
            </div>
          </div>

          {/* 💳 Billing Summary */}
          <div>
            <h5 className="mb-4">Billing Information</h5>
            <div className={styles.receiptBlock}>
                <div className={`${styles.receiptItem} ${styles.noLine}`}>
                    <div>
                        <p>Item Total</p>
                    </div>
                    <div>
                        <h5>$ 33.00</h5>
                    </div>
                </div>
                <div className={`${styles.receiptItem} ${styles.noLine}`}>
                    <div>
                        <p>Taxes & Other Fees</p>
                    </div>
                    <div>
                        <h5>$ 4.00</h5>
                    </div>
                </div>
                <div className={`${styles.receiptItem} ${styles.noLine}`}>
                    <div>
                        <p>Tips</p>
                    </div>
                    <div>
                        <h5>$ 10.00</h5>
                    </div>
                </div>
                <div className={`${styles.receiptItem} ${styles.noLine}`}>
                    <div>
                        <h5>Grand Total</h5>
                    </div>
                    <div>
                        <h5>$ 47.00</h5>
                    </div>
                </div>
            </div>

            <h5 className="mb-4">Order Information</h5>
            <div className={styles.receiptBlock}>
                <div className={`${styles.receiptItem} ${styles.noLine}`}>
                    <div>
                        <p>Order Id</p>
                        <h5>Sourab Paul</h5>
                    </div>
                </div>
                <div className={`${styles.receiptItem} ${styles.noLine}`}>
                    <div>
                        <p>Payment</p>
                        <h5>Credit Card</h5>
                    </div>
                </div>
                <div className={`${styles.receiptItem} ${styles.noLine}`}>
                    <div>
                        <p>Delivery Method</p>
                        <h5>Pickup at bar</h5>
                    </div>
                </div>
                <div className={`${styles.receiptItem} ${styles.noLine}`}>
                    <div>
                        <p>Order placed</p>
                        <h5>placed on Fri, 22 Nov’24, 05:53 PM</h5>
                    </div>
                </div>
            </div>
        </div>
    </div>
      </section>
      <BottomNavigation />
    </>
  );
}
