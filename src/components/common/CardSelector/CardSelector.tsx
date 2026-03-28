"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp } from "lucide-react";
import styles from './CardSelector.module.scss';

interface CardOption {
  id: string;
  type: string;
  last4: string;
  image: string;
}

interface CardSelectorProps {
  cards: CardOption[];
  onSelect?: (card: CardOption) => void;
  defaultCardId?: string;
}

const CardSelector: React.FC<CardSelectorProps> = ({
  cards,
  onSelect,
  defaultCardId,
}) => {
  const [selectedCard, setSelectedCard] = useState<CardOption>(
    cards.find((c) => c.id === defaultCardId) || cards[0]
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSelect = (card: CardOption) => {
    setSelectedCard(card);
    setShowDropdown(false);
    onSelect?.(card);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full max-w-sm" ref={dropdownRef}>
      {/* Selected Card */}
      <div
        className={`${styles.CardItem} rounded-md`}
        onClick={() => setShowDropdown((prev) => !prev)}
      >
        <div className="flex items-center gap-3">
          <Image
            src={selectedCard.image}
            alt={selectedCard.type}
            width={32}
            height={32}
          />
          <span className="text-sm text-gray-700">
            **** {selectedCard.last4}
          </span>
        </div>
        {showDropdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>

      {/* Dropdown List */}
      {showDropdown && (
        <div className="absolute mt-2 w-full bg-white rounded-md shadow-lg z-10">
          {cards.map((card) => (
            <label
              key={card.id}
              className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Image
                  src={card.image}
                  alt={card.type}
                  width={32}
                  height={32}
                />
                <span className="text-sm text-gray-700">
                  **** {card.last4}
                </span>
              </div>
              <input
                type="radio"
                name="card"
                value={card.id}
                checked={selectedCard.id === card.id}
                onChange={() => handleSelect(card)}
                className="accent-blue-500"
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default CardSelector;
