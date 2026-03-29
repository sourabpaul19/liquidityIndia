"use client";

import React, { useEffect, useState } from "react";

interface SavedCard {
  id: string;
  card_number: string;
  expiry: string;
}

export default function CardManager({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCVV] = useState("");

  // ============================================================
  // STEP 1 - FETCH SAVED CARDS
  // ============================================================
  async function fetchCards() {
    try {
      const res = await fetch(
        `https://dev2024.co.in/web/liquidity-backend/admin/api/fetchCards/${userId}`
      );

      const data = await res.json();
      if (data?.data) {
        setCards(data.data);
      }
    } catch (err) {
      console.log("Fetch cards error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCards();
  }, []);

  // ============================================================
  // STEP 2 - SAVE NEW CARD
  // ============================================================
  async function saveCard() {
    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("card_number", cardNumber);
    formData.append("expiry", expiry);
    formData.append("cvv", cvv);

    try {
      const res = await fetch(
        "https://dev2024.co.in/web/liquidity-backend/admin/api/saveCards/",
        {
          method: "POST",
          body: formData, // ❗ DON'T set Content-Type manually
        }
      );

      const data = await res.json();

      if (data.status === "1") {
        alert("Card saved successfully!");
        fetchCards();
        setCardNumber("");
        setExpiry("");
        setCVV("");
      } else {
        alert("Failed to save card.");
      }
    } catch (err) {
      console.log("Save card error:", err);
      alert("CORS or network error");
    }
  }

  // ============================================================
  // STEP 3 - DELETE CARD
  // ============================================================
  async function deleteCard(cardId: string) {
    try {
      const res = await fetch(
        `https://dev2024.co.in/web/liquidity-backend/admin/api/deleteCard/${cardId}`,
        { method: "GET" }
      );

      const data = await res.json();

      if (data.status === "1") {
        alert("Card deleted!");
        fetchCards();
      } else {
        alert("Delete failed");
      }
    } catch (err) {
      console.log("Delete error:", err);
    }
  }

  // ============================================================
  // UI RENDERING
  // ============================================================
  if (loading) return <p>Loading cards...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Saved Cards</h2>

      {/* If no cards → Show input form */}
      {cards.length === 0 && (
        <div>
          <h3>Add Card</h3>

          <input
            placeholder="Card Number"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            className="input"
          />

          <input
            placeholder="Expiry (MM/YY)"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className="input"
          />

          <input
            placeholder="CVV"
            value={cvv}
            onChange={(e) => setCVV(e.target.value)}
            className="input"
          />

          <button onClick={saveCard} className="btn-primary">
            Save Card
          </button>
        </div>
      )}

      {/* If cards exist → show list */}
      {cards.length > 0 && (
        <div>
          {cards.map((card) => (
            <div
              key={card.id}
              className="card-list-item"
              style={{
                border: "1px solid #ccc",
                padding: "10px",
                marginBottom: "10px",
              }}
            >
              <p>Card: **** **** **** {card.card_number.slice(-4)}</p>
              <p>Expiry: {card.expiry}</p>

              <button
                onClick={() => deleteCard(card.id)}
                style={{ color: "red" }}
              >
                Delete
              </button>
            </div>
          ))}

          <h3>Add Another Card</h3>
          <input
            placeholder="Card Number"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            className="input"
          />

          <input
            placeholder="Expiry (MM/YY)"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className="input"
          />

          <input
            placeholder="CVV"
            value={cvv}
            onChange={(e) => setCVV(e.target.value)}
            className="input"
          />

          <button onClick={saveCard} className="btn-primary">
            Save Card
          </button>
        </div>
      )}
    </div>
  );
}
