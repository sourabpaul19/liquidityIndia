'use client';
import React from 'react';
import styles from './DynamicButton.module.scss';

interface DynamicButtonProps {
  type?: 'menu' | 'back';
  onClick?: () => void;
}

const DynamicButton: React.FC<DynamicButtonProps> = ({ type = 'menu', onClick }) => {
  return (
    <button className={styles.icon_only} onClick={onClick} aria-label={type}>
      {type === 'menu' ? (
        // Menu Icon
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          
        </svg>
      ) : (
        // Back Arrow Icon
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15 6L9 12L15 18"
            stroke="black"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
};

export default DynamicButton;
