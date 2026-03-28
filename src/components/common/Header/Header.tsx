// "use client";
// import styles from "./Header.module.scss";

// const Header = () => {
//   return (
//     <header className={styles.header}>
//         <button className={styles.icon_only}>
//             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//                 <path fillRule="evenodd" clipRule="evenodd" d="M20.75 12C20.75 11.8011 20.671 11.6103 20.5303 11.4697C20.3897 11.329 20.1989 11.25 20 11.25H4C3.80109 11.25 3.61032 11.329 3.46967 11.4697C3.32902 11.6103 3.25 11.8011 3.25 12C3.25 12.1989 3.32902 12.3897 3.46967 12.5303C3.61032 12.671 3.80109 12.75 4 12.75H20C20.1989 12.75 20.3897 12.671 20.5303 12.5303C20.671 12.3897 20.75 12.1989 20.75 12ZM17.467 19C17.467 18.8011 17.388 18.6103 17.2473 18.4697C17.1067 18.329 16.9159 18.25 16.717 18.25H4C3.80109 18.25 3.61032 18.329 3.46967 18.4697C3.32902 18.6103 3.25 18.8011 3.25 19C3.25 19.1989 3.32902 19.3897 3.46967 19.5303C3.61032 19.671 3.80109 19.75 4 19.75H16.717C16.9159 19.75 17.1067 19.671 17.2473 19.5303C17.388 19.3897 17.467 19.1989 17.467 19ZM11.778 5C11.778 4.80109 11.699 4.61032 11.5583 4.46967C11.4177 4.32902 11.2269 4.25 11.028 4.25H4C3.80109 4.25 3.61032 4.32902 3.46967 4.46967C3.32902 4.61032 3.25 4.80109 3.25 5C3.25 5.19891 3.32902 5.38968 3.46967 5.53033C3.61032 5.67098 3.80109 5.75 4 5.75H11.028C11.2269 5.75 11.4177 5.67098 11.5583 5.53033C11.699 5.38968 11.778 5.19891 11.778 5Z" fill="black"/>
//             </svg>
//         </button>
//         <h2 className={styles.pageTitle}>Home</h2>
//         <button className={styles.icon_only}>
//             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//                 <g clipPath="url(#clip0_10_112)">
//                 <mask id="mask0_10_112" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
//                 <path d="M24 0H0V24H24V0Z" fill="white"/>
//                 </mask>
//                 <g mask="url(#mask0_10_112)">
//                 <path d="M10.5691 0C4.74145 0 0 4.74145 0 10.5691C0 16.3971 4.74145 21.1382 10.5691 21.1382C16.3971 21.1382 21.1382 16.3971 21.1382 10.5691C21.1382 4.74145 16.3971 0 10.5691 0ZM10.5691 19.187C5.81723 19.187 1.95122 15.321 1.95122 10.5691C1.95122 5.81728 5.81723 1.95122 10.5691 1.95122C15.321 1.95122 19.187 5.81723 19.187 10.5691C19.187 15.321 15.321 19.187 10.5691 19.187Z" fill="#28303F"/>
//                 <path d="M23.714 22.3347L18.1205 16.7412C17.7393 16.36 17.1221 16.36 16.7409 16.7412C16.3598 17.122 16.3598 17.7399 16.7409 18.1207L22.3344 23.7142C22.4249 23.805 22.5324 23.8769 22.6508 23.926C22.7692 23.975 22.8961 24.0002 23.0242 24.0001C23.1523 24.0002 23.2792 23.975 23.3976 23.9259C23.516 23.8769 23.6235 23.8049 23.714 23.7142C24.0951 23.3334 24.0951 22.7155 23.714 22.3347Z" fill="#28303F"/>
//                 </g>
//                 </g>
//                 <defs>
//                 <clipPath id="clip0_10_112">
//                 <rect width="24" height="24" fill="white"/>
//                 </clipPath>
//                 </defs>
//             </svg>
//         </button>
//     </header>
//   );
// };

// export default Header;

'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import DynamicButton from '@/components/common/DynamicButton/DynamicButton';
import styles from './Header.module.scss';
import { ChevronRight, User, Wallet, Home, History, CalendarFold, Settings, LogOut } from "lucide-react";

interface HeaderProps {
  title?: string; // Optional custom title
  buttonType?: 'menu' | 'back'; // Optional manual override
}

const Header: React.FC<HeaderProps> = ({ title, buttonType }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isHome = pathname === '/';
  const finalButtonType = buttonType ? buttonType : isHome ? 'menu' : 'back';

  const handleButtonClick = () => {
    if (finalButtonType === 'menu') {
      setIsMenuOpen(true);
    } else {
      router.back();
    }
  };

  const pageTitle =
    title ||
    (isHome
      ? 'Home'
      : pathname.split('/').pop()?.replace(/-/g, ' ').toUpperCase() || 'Page');

  return (
    <>
      <header className={styles.header}>
        {/* Left side: Menu / Back button */}
        <DynamicButton type={finalButtonType} onClick={handleButtonClick} />

        {/* Center: Page title */}
        <h2 className={styles.pageTitle}>{pageTitle}</h2>

        {/* Right side: Search icon */}
        <Link href='/search' className={styles.icon_only}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clipPath="url(#clip0_10_112)">
              <mask
                id="mask0_10_112"
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="24"
                height="24"
              >
                <path d="M24 0H0V24H24V0Z" fill="white" />
              </mask>
              <g mask="url(#mask0_10_112)">
                <path
                  d="M10.5691 0C4.74145 0 0 4.74145 0 10.5691C0 16.3971 4.74145 21.1382 10.5691 21.1382C16.3971 21.1382 21.1382 16.3971 21.1382 10.5691C21.1382 4.74145 16.3971 0 10.5691 0ZM10.5691 19.187C5.81723 19.187 1.95122 15.321 1.95122 10.5691C1.95122 5.81728 5.81723 1.95122 10.5691 1.95122C15.321 1.95122 19.187 5.81723 19.187 10.5691C19.187 15.321 15.321 19.187 10.5691 19.187Z"
                  fill="#28303F"
                />
                <path
                  d="M23.714 22.3347L18.1205 16.7412C17.7393 16.36 17.1221 16.36 16.7409 16.7412C16.3598 17.122 16.3598 17.7399 16.7409 18.1207L22.3344 23.7142C22.4249 23.805 22.5324 23.8769 22.6508 23.926C22.7692 23.975 22.8961 24.0002 23.0242 24.0001C23.1523 24.0002 23.2792 23.975 23.3976 23.9259C23.516 23.8769 23.6235 23.8049 23.714 23.7142C24.0951 23.3334 24.0951 22.7155 23.714 22.3347Z"
                  fill="#28303F"
                />
              </g>
            </g>
            <defs>
              <clipPath id="clip0_10_112">
                <rect width="24" height="24" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </Link>
      </header>

      {/* Slide Menu Drawer */}
      <div
        className={`${styles.modal_overlay} ${
          isMenuOpen ? styles.open : ''
        }`}
        onClick={() => setIsMenuOpen(false)}
      >
        <div
          className={styles.modal_content}
          onClick={(e) => e.stopPropagation()}
        >
          {/* <button
            className={styles.close_btn}
            onClick={() => setIsMenuOpen(false)}
          >
            ✕
          </button> */}
          <nav className={styles.menu}>
            <Link className={styles.menuItem} href="/">
              <span className={styles.menuImage}>
                <Image src='https://ui-avatars.com/api/?name=Sourab+Paul&background=ffffff&color=0089e8' alt="" fill />
              </span>
              <span className={styles.menuText}>
                <h5>Sourab Paul</h5>
                <p className='color-primary'>sourab@liquiditybars.com</p>
              </span>
            </Link>
            <Link className={styles.menuItem} href="/">
              <span className={styles.menuIcon}>
                <Wallet size={16} />
              </span>
              <span className={styles.menuText}>
                <h5>Liquidity Cash</h5>
                <p className='text-red-700'>Only supported on the app</p>
              </span>
              <ChevronRight size={16} />
            </Link>
            <Link className={styles.menuItem} href="/">
              <span className={styles.menuIcon}>
                <User size={16} />
              </span>
              <span className={styles.menuText}>
                <h5>Edit Profile</h5>
              </span>
              <ChevronRight size={16} />
            </Link>
            <h5>Menu</h5>
            <div className={styles.menuList}>
              <Link className={styles.menuItem} href="/home">
                <span className={styles.menuIcon}>
                  <Home size={16} />
                </span>
                <span className={styles.menuText}>
                  <h5>Home</h5>
                </span>
                <ChevronRight size={16} />
              </Link>
              <Link className={styles.menuItem} href="/my-orders">
                <span className={styles.menuIcon}>
                  <History size={16} />
                </span>
                <span className={styles.menuText}>
                  <h5>Order History</h5>
                </span>
                <ChevronRight size={16} />
              </Link>
              <Link className={styles.menuItem} href="/wallet">
                <span className={styles.menuIcon}>
                  <Wallet size={16} />
                </span>
                <span className={styles.menuText}>
                  <h5>Wallet</h5>
                </span>
                <ChevronRight size={16} />
              </Link>
              <Link className={styles.menuItem} href="/events">
                <span className={styles.menuIcon}>
                  <CalendarFold size={16} />
                </span>
                <span className={styles.menuText}>
                  <h5>Events</h5>
                </span>
                <ChevronRight size={16} />
              </Link>
              <Link className={styles.menuItem} href="/settings">
                <span className={styles.menuIcon}>
                  <Settings size={16} />
                </span>
                <span className={styles.menuText}>
                  <h5>Settings</h5>
                </span>
                <ChevronRight size={16} />
              </Link>
              <Link className={styles.menuItem} href="/">
                <span className={styles.menuIcon}>
                  <LogOut size={16} />
                </span>
                <span className={styles.menuText}>
                  <h5>Log Out</h5>
                </span>
                <ChevronRight size={16} />
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Header;
