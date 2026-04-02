'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import wallet from '../../../public/images/wallet_bg.svg';
import cartempty from '../../../public/images/Cards_empty.svg';
import styles from './wallet.module.scss';
import BottomNavigation from '@/components/common/BottomNavigation/BottomNavigation';
import Header from '@/components/common/Header/Header';
import Modal from '@/components/common/Modal/Modal';
import Script from "next/script";


interface Transaction {
  type: string;
  credit_type?: string;
  amount: string;
  date_time: string;
}

interface RazorpayFormProps {
  walletBalance: number;
  userId: string;
  onSuccess: (newBalance: number, newTransactions: Transaction[]) => void;
  onClose: () => void;
}

const RazorpayForm: React.FC<RazorpayFormProps> = ({
  walletBalance,
  userId,
  onSuccess,
  onClose,
}) => {
  const [addAmount, setAddAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const newBalance = useMemo(
    () => walletBalance + (Number(addAmount || 0) || 0),
    [walletBalance, addAmount]
  );

  const handleRazorpayPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountNumber = Number(addAmount);
    if (!addAmount || isNaN(amountNumber) || amountNumber <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }

    if (typeof window === 'undefined' || !(window as any).Razorpay) {
      setError('Razorpay not loaded. Please refresh the page.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1) Create Razorpay order using YOUR API
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(amountNumber * 100), // paise
          currency: 'INR',
          receipt: `wallet_topup_${userId}_${Date.now()}`,
        }),
      });

      const orderData = await orderRes.json();
      
      if (!orderData.success || !orderData.id) {
        setError(orderData.error || 'Failed to create payment order');
        setLoading(false);
        return;
      }

      // 2) Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Liquidity Bars',
        description: `Wallet Top-up ₹${amountNumber.toFixed(2)}`,
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
            // 3) Verify payment using YOUR API
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            
            if (verifyData.success) {
              // 4) Add to wallet using YOUR API
              const walletRes = await fetch('/api/wallet/add-balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  user_id: userId,
                  amount: amountNumber,
                  razorpay_payment_id: response.razorpay_payment_id, // Bonus: track payment
                }),
              });

              const walletData = await walletRes.json();
              
              if (walletData.status === '1') {
                // 5) Refresh wallet data
                const refreshRes = await fetch(
                  `https://dev2024.co.in/web/liquidity-india-backend/admin/api/fetch_wallet_balance/${userId}`
                );
                const refreshData = await refreshRes.json();

                if (refreshData.status === '1') {
                  const updatedBalance = Number(refreshData.wallet_balance || 0);
                  const updatedTxns: Transaction[] = refreshData.wallets || [];
                  onSuccess(updatedBalance, updatedTxns);
                } else {
                  onSuccess(walletBalance + amountNumber, []);
                }
                onClose();
              } else {
                setError(walletData.message || 'Wallet update failed');
              }
            } else {
              setError('Payment verification failed');
            }
          } catch (err) {
            console.error('Wallet topup verification error:', err);
            setError('Payment processing failed');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: localStorage.getItem('user_name') || '',
          email: localStorage.getItem('user_email') || '',
          contact: localStorage.getItem('user_mobile') || '',
        },
        theme: {
          color: '#10b981', // Your primary green
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          }
        }
      };

      const rzp: any = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error('Wallet topup error:', err);
      setError('Something went wrong, please try again');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRazorpayPayment} className="space-y-4">
      <h5 className="mb-2">Enter amount</h5>

      <input
        type="number"
        placeholder="0.00"
        className={styles.textbox}
        value={addAmount}
        onChange={(e) => setAddAmount(e.target.value)}
        min="1"
        step="0.01"
      />

      <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
            💳
          </span>
          <span className="font-semibold text-emerald-800">Razorpay</span>
        </div>
        <p className="text-xs text-emerald-700">
          Secure payment processed by Razorpay
        </p>
      </div>

      {error && (
        <div className="p-2 text-sm rounded bg-red-50 text-red-600">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between mb-1 text-sm">
        <span>Current balance</span>
        <span>₹{walletBalance.toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between mb-4 font-semibold">
        <span>New balance</span>
        <span>₹{newBalance.toFixed(2)}</span>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-emerald-600 hover:bg-emerald-700 px-3 py-3 rounded-lg w-full text-white text-center disabled:opacity-50 transition-all"
      >
        {loading ? 'Processing…' : `Pay & add ₹${(Number(addAmount) || 0).toFixed(2)}`}
      </button>
    </form>
  );
};

export default function Wallet() {
  const [open, setOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedId =
      typeof window !== 'undefined'
        ? localStorage.getItem('user_id')
        : null;
    setUserId(storedId);
  }, []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchWalletData = async () => {
      try {
        const res = await fetch(
          `https://dev2024.co.in/web/liquidity-india-backend/admin/api/fetch_wallet_balance/${userId}`
        );
        const data = await res.json();

        if (data.status === '1') {
          const balance = Number(data.wallet_balance || 0);
          const txns: Transaction[] = data.wallets || [];
          setWalletBalance(balance);
          setTransactions(txns);
          localStorage.setItem('wallet_balance', String(balance));
          localStorage.setItem('wallet_transactions', JSON.stringify(txns));
        } else {
          setWalletBalance(0);
          setTransactions([]);
        }
      } catch (err) {
        console.error('Wallet fetch error:', err);
        const cachedBalance = localStorage.getItem('wallet_balance');
        const cachedTxns = localStorage.getItem('wallet_transactions');
        if (cachedBalance) setWalletBalance(Number(cachedBalance));
        if (cachedTxns) setTransactions(JSON.parse(cachedTxns));
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, [userId]);

  const formatDateTime = (dateString: string) => {
    const dateObj = new Date(dateString.replace(' ', 'T'));
    const date = dateObj.toLocaleDateString('en-GB');
    const time = dateObj.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    return { date, time };
  };

  const getTransactionLabel = (txn: Transaction) => {
    if (txn.type === '1') {
      if (txn.credit_type === '1') return 'Online payment';
      if (txn.credit_type === '2') return 'Referral bonus';
      return 'Wallet credit';
    }
    if (txn.type === '2') return 'Wallet deduction';
    return 'Transaction';
  };

  const handleAddSuccess = (
    newBalance: number,
    newTransactions: Transaction[]
  ) => {
    setWalletBalance(newBalance);
    if (newTransactions.length) {
      setTransactions(newTransactions);
      localStorage.setItem(
        'wallet_transactions',
        JSON.stringify(newTransactions)
      );
    }
    localStorage.setItem('wallet_balance', String(newBalance));
  };

  return (
    <>
      <Header title="Wallet" />
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      <section className="pageWrapper hasHeader hasFooter hasBottomNav">
        <div className="pageContainer">
          {loading ? (
            <p className="text-center py-3">Loading wallet data…</p>
          ) : (
            <>
              <div className={styles.walletBox}>
                <h4>Liquidity Cash</h4>
                <h2>₹{walletBalance.toFixed(2)}</h2>
                <Image
                  src={wallet}
                  alt=""
                  width={225}
                  height={214}
                  className={styles.walletIcon}
                />
              </div>

              <div className="sectionHeading">
                <h4 className="section_title">Transactions</h4>
              </div>

              {transactions.length === 0 ? (
                <div className={styles.emptyCart}>
                  <Image
                    src={cartempty}
                    alt=""
                    width={120}
                    height={120}
                    className={styles.walletIcon}
                  />
                  <p>Your wallet is empty.</p>
                </div>
              ) : (
                <div className={`${styles.walletList} px-4`}>
                  {transactions.map((txn, index) => {
                    const { date, time } = formatDateTime(txn.date_time);
                    const amount = parseFloat(txn.amount);
                    const isCredit = txn.type === '1';

                    return (
                      <div key={index} className={styles.walletItem}>
                        <div>
                          <h5>{getTransactionLabel(txn)}</h5>
                          <p>
                            {date} • {time}
                          </p>
                        </div>
                        <div>
                          <p
                            className={
                              isCredit ? 'text-success' : 'text-danger'
                            }
                          >
                            {isCredit
                              ? `+ ₹${amount.toFixed(2)}`
                              : `- ₹${amount.toFixed(2)}`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="container-fluid pt-4 px-4 bottomButton fixed">
                <button
                  className="bg-emerald-600 hover:bg-emerald-700 px-3 py-3 rounded-lg w-full text-white text-center transition-all"
                  onClick={() => setOpen(true)}
                  disabled={!userId || loading}
                >
                  + Add to balance
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ✅ Razorpay Modal - No Stripe Elements needed */}
      {userId && (
        <Modal
          isOpen={open}
          onClose={() => setOpen(false)}
          title="Add Liquidity Cash"
        >
          <RazorpayForm
            walletBalance={walletBalance}
            userId={userId}
            onSuccess={handleAddSuccess}
            onClose={() => setOpen(false)}
          />
        </Modal>
      )}

      <BottomNavigation />
    </>
  );
}