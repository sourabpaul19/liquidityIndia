"use client";
import React, { useEffect, useState } from "react";
import styles from "./QuantityButton.module.scss";
import { Plus, Minus, Trash2 } from "lucide-react";

interface QuantityButtonProps {
  min?: number;
  max?: number;
  initialValue?: number;
  onChange?: (value: number) => void;
  onDelete?: () => void;
  className?: string;
}

const QuantityButtonComponent: React.FC<QuantityButtonProps> = ({
  min = 1,
  max = 99,
  initialValue = 0,
  onChange,
  onDelete,
  className = "",
}) => {
  const [quantity, setQuantity] = useState<number>(initialValue);

  // Keep local state in sync only when initialValue actually changes
  useEffect(() => {
    setQuantity(initialValue);
  }, [initialValue]);

  const handleIncrement = () => {
    if (quantity === 0) {
      setQuantity(1);
      onChange?.(1);
      return;
    }

    if (quantity < max) {
      const newValue = quantity + 1;
      setQuantity(newValue);
      onChange?.(newValue);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      const newValue = quantity - 1;
      setQuantity(newValue);
      onChange?.(newValue);
    } else if (quantity === 1) {
      setQuantity(0);
      onDelete?.();
      onChange?.(0);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= max) {
      setQuantity(value);
      onChange?.(value);
    }
  };

  // Only show + button when quantity is 0
  if (quantity === 0) {
    return (
      <button
        onClick={handleIncrement}
        className={`${styles.addButton} flex items-center justify-center p-2 rounded-full bg-gray-200 text-black hover:bg-gray-300 transition-all ${className}`}
      >
        <Plus size={16} />
      </button>
    );
  }

  // Show full control when quantity > 0
  return (
    <div className={`${styles.quantityBtn} flex items-center ${className}`}>
      {/* Left button: Trash if 1, Minus otherwise */}
      <button
        onClick={handleDecrement}
        className="p-2 rounded-full hover:bg-gray-100 transition-all"
        aria-label={quantity === 1 ? "Delete" : "Decrease"}
      >
        {quantity === 1 ? (
          <Trash2 size={16} className="text-red-500" />
        ) : (
          <Minus size={16} />
        )}
      </button>

      {/* Quantity input */}
      <input
        type="number"
        value={quantity}
        onChange={handleInputChange}
        className="w-10 text-center border-none focus:outline-none"
        min={0}
        max={max}
      />

      {/* Right button: Plus */}
      <button
        onClick={handleIncrement}
        className="p-2 rounded-full hover:bg-gray-100 transition-all"
        aria-label="Increase"
      >
        <Plus size={16} />
      </button>
    </div>
  );
};

// ✅ Memoize to prevent re-renders when parent state (like checkoutLoading) changes
export default React.memo(QuantityButtonComponent);
