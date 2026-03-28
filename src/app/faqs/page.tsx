"use client";

import React, { useState } from "react";
import Header from "@/components/common/Header/Header";
import BottomNavigation from "@/components/common/BottomNavigation/BottomNavigation";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  {
    question: "What is Liquidity Bars?",
    answer:
      "Liquidity Bars is a modern bar experience where you can order cocktails, drinks, and mixers through an app or directly at our venue.",
  },
  {
    question: "How can I book a table?",
    answer:
      "You can book a table easily using our mobile app or by contacting us through the website’s booking section.",
  },
  {
    question: "Do you offer home delivery?",
    answer:
      "Yes, we provide home delivery of selected beverages depending on your location and local regulations.",
  },
  {
    question: "Can I modify or cancel my order?",
    answer:
      "Yes, modifications or cancellations are possible before your order is prepared. Please contact support immediately for assistance.",
  },
];

export default function Faqs() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      <Header title="FAQs" />
      <section className='pageWrapper hasHeader hasFooter'>
        <div className="pageContainer pt-4">
        <div className="space-y-4 px-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-xl overflow-hidden bg-white"
            >
              <button
                onClick={() => toggleAccordion(index)}
                className="w-full flex justify-between items-center p-4 text-left"
              >
                <span className="font-semibold text-gray-800">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                )}
              </button>

              {openIndex === index && (
                <div className="p-4 pt-0 text-gray-600 border-t border-gray-100">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
        </div>
      </section>
      <BottomNavigation />
    </>
  );
}
