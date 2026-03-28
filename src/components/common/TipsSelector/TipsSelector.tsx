"use client";
import React, { useState, useEffect } from "react";
import styles from "./TipsSelector.module.scss";

interface TipsSelectorProps {
  value: number; // tip value (can be percent OR $ amount)
  isAmount?: boolean; // true if value is a fixed $ amount
  onChange: (val: number, isAmount: boolean) => void; // inform parent if it’s $ amount
}


const TipsSelector: React.FC<TipsSelectorProps> = ({ value, onChange }) => {
  const [tips, setTips] = useState<string[]>(["18%", "20%", "25%", "Other"]);
  const [activeTip, setActiveTip] = useState<string>(`${value}%`);
  const [showModal, setShowModal] = useState(false);
  const [customTip, setCustomTip] = useState<string>("");

  // Sync with prop value
  useEffect(() => {
    if (!`${value}%`.startsWith("$")) setActiveTip(`${value}%`);
  }, [value]);

  const handleTipClick = (tip: string) => {
  if (tip === "Other" || tip.startsWith("$")) {
    setShowModal(true);
    setCustomTip(tip.startsWith("$") ? tip.replace("$", "") : "");
  } else {
    const numeric = parseInt(tip.replace("%", ""), 10);
    setActiveTip(tip);
    onChange(numeric, false); // predefined % tip
    setShowModal(false);
  }
};

//   const handleCustomSubmit = () => {
//   const amount = Number(customTip);
//   if (!amount || amount <= 0) {
//     alert("Please enter a valid tip amount greater than 0.");
//     return;
//   }

//   const newTip = `$${amount}`;
//   const updatedTips = tips.some((t) => t.startsWith("$"))
//     ? tips.map((t) => (t.startsWith("$") ? newTip : t))
//     : tips.map((t) => (t === "Other" ? newTip : t));

//   setTips(updatedTips);
//   setActiveTip(newTip);
//   onChange(amount, true); // custom $ tip
//   setShowModal(false);
// };
const handleCustomSubmit = () => {
  const amount = Number(customTip);
  if (!amount && amount !== 0) {  // Changed: Now allows exactly 0
    alert("Please enter a valid tip amount.");
    return;
  }

  const newTip = `$${amount}`;
  const updatedTips = tips.some((t) => t.startsWith("$"))
    ? tips.map((t) => (t.startsWith("$") ? newTip : t))
    : tips.map((t) => (t === "Other" ? newTip : t));

  setTips(updatedTips);
  setActiveTip(newTip);
  onChange(amount, true); // custom $ tip (0 is now allowed)
  setShowModal(false);
};


  return (
    <>
      <div className={`${styles.tipsArea}`}>
        <h4 className="text-lg font-semibold mb-3">Tips</h4>
        <div className={`${styles.tipsBlock} flex gap-3 flex-wrap`}>
          {tips.map((tip) => (
            <button
              key={tip}
              onClick={() => handleTipClick(tip)}
              className={`${styles.tipsItem} px-4 py-2 rounded-md ${
                activeTip === tip ? "bg-primary text-white" : "text-gray-700"
              }`}
            >
              {tip}
            </button>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className={`${styles.topModal} bg-white rounded-lg shadow-lg p-5 w-80`}>
            <h4 className="text-lg text-center font-semibold mb-3">
              Choose or Enter Tip
            </h4>
            <p className="text-center text-sm text-gray-600 mb-3">
              Bartenders work hard to get you quality orders on time
            </p>

            <div className="flex gap-3 flex-wrap mb-4">
              {["18%", "20%", "25%"].map((tip) => (
                <button
                  key={tip}
                  onClick={() => handleTipClick(tip)}
                  className={`${styles.tipsItem} px-4 py-2 rounded-md ${
                    activeTip === tip ? "bg-primary text-white" : "text-gray-700"
                  }`}
                >
                  {tip}
                </button>
              ))}
            </div>

            <input
              type="number"
              value={customTip}
              onChange={(e) => setCustomTip(e.target.value)}
              placeholder="Enter Tip Amount ($)"
              className={`${styles.textbox} w-full mb-4 rounded-md px-3 py-2`}
              min="1"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCustomSubmit}
                className="px-4 py-2 rounded-md bg-primary text-white hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TipsSelector;
