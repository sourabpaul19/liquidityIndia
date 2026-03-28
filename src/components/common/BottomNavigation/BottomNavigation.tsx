"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, ShoppingBag, CalendarFold, User } from "lucide-react";
import { motion } from "framer-motion";

const BottomNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { label: "Home", icon: <Home size={22} />, path: "/home" },
    { label: "Cart", icon: <ShoppingBag size={22} />, path: "/cart" },
    { label: "Events", icon: <CalendarFold size={22} />, path: "/events" },
    { label: "Profile", icon: <User size={22} />, path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <ul className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <li key={item.path}>
              <button
                onClick={() => router.push(item.path)}
                className="flex flex-col items-center text-gray-500"
              >
                <motion.div
                  animate={{ scale: isActive ? 1.15 : 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className={`flex flex-col items-center ${
                    isActive ? "color-primary" : "text-gray-500"
                  }`}
                >
                  {item.icon}
                  <span className="text-xs mt-1">{item.label}</span>
                </motion.div>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default BottomNavigation;
