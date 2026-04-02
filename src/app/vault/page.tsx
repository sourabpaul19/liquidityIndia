"use client";

import React from "react";
import Header from "@/components/common/Header/Header";
import BottomNavigation from "@/components/common/BottomNavigation/BottomNavigation";
import styles from "./liquidity-vault.module.scss";

const vaultCards = [
  {
    title: "Category\nand outlets",
    image:
      "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80",
    href: "/vault-outlet-category",
  },
  {
    title: "Reserve\nat vault",
    image:
      "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1200&q=80",
    href: "/vault-selected",
  },
  {
    title: "Redeem\nand balance",
    image:
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=80",
    href: "/redeem-balance",
  },
  {
    title: "Order\nHistory",
    image:
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80",
    href: "/order-history",
  },
  {
    title: "Frequently\nAsked Questions",
    image:
      "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80",
    href: "/faq",
  },
];

export default function LiquidityVaultPage() {
  return (
    <>
      <Header title="LIQUIDITY" />

      <section className={`pageWrapper hasHeader hasFooter ${styles.page}`}>
        <div className={styles.inner}>
          <p className={styles.description}>
            Through <span>Liquidity Vault</span>, reserve your favorite brands
            at a special price and redeem your reserved product across the
            outlets in the category of your choice.
          </p>

          <div className={styles.cardList}>
            {vaultCards.map((card) => (
              <a key={card.title} href={card.href} className={styles.card}>
                <div
                  className={styles.cardBg}
                  style={{ backgroundImage: `url(${card.image})` }}
                />
                <div className={styles.overlay} />
                <h2 className={styles.cardTitle}>
                  {card.title.split("\n").map((line) => (
                    <React.Fragment key={line}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </h2>
              </a>
            ))}
          </div>
        </div>
      </section>

      <BottomNavigation />
    </>
  );
}