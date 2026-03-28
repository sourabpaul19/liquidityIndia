'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import wallet from '../../../public/images/wallet_bg.svg';
import cartempty from '../../../public/images/Cards_empty.svg';
import styles from './wallet.module.scss';
import BottomNavigation from '@/components/common/BottomNavigation/BottomNavigation';
import Header from '@/components/common/Header/Header';
import Modal from '@/components/common/Modal/Modal';

interface Transaction {
  type: string;
  credit_type?: string;
  amount: string;
  date_time: string;
}

interface StripeCardFormProps {
  walletBalance: number;
  userId: string;
  onSuccess: (newBalance: number, newTransactions: Transaction[]) => void;
  onClose: () => void;
}

const StripeCardForm: React.FC<StripeCardFormProps> = ({
  walletBalance,
  userId,
  onSuccess,
  onClose,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [addAmount, setAddAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const newBalance = useMemo(
    () => walletBalance + (Number(addAmount || 0) || 0),
    [walletBalance, addAmount]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const amountNumber = Number(addAmount);
    if (!addAmount || isNaN(amountNumber) || amountNumber <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not ready');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1) Use your existing create-payment-intent route
      const piRes = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(amountNumber * 100),
          currency: 'cad',
        }),
      });

      if (!piRes.ok) {
        setError('Failed to start payment');
        setLoading(false);
        return;
      }

      const { client_secret } = await piRes.json();

      // 2) Confirm card payment
      const result = await stripe.confirmCardPayment(client_secret, {
        payment_method: { card: cardElement },
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed');
        setLoading(false);
        return;
      }

      if (result.paymentIntent?.status !== 'succeeded') {
        setError('Payment not completed');
        setLoading(false);
        return;
      }

      // 3) Call wallet proxy (form-encoded to PHP)
      const walletRes = await fetch('/api/wallet/add-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          amount: amountNumber,
        }),
      });

      const walletData = await walletRes.json();
      if (walletData.status !== '1') {
        setError(walletData.message || 'Wallet update failed');
        setLoading(false);
        return;
      }

      // 4) Refresh wallet data from backend
      const refreshRes = await fetch(
        `https://admin.liquiditybars.com/admin/api/fetch_wallet_balance/${userId}`
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
    } catch (err) {
      console.error('Wallet topup error:', err);
      setError('Something went wrong, please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div className="p-3 bg-gray-50 rounded-lg border">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': { color: '#aab7c4' },
              },
            },
          }}
        />
        <p className="text-xs text-gray-500 mt-1">
          Card details are processed securely by Stripe.
        </p>
      </div>

      {error && (
        <div className="p-2 text-sm rounded bg-red-50 text-red-600">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between mb-1 text-sm">
        <span>Current balance</span>
        <span>${walletBalance.toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between mb-4 font-semibold">
        <span>New balance</span>
        <span>${newBalance.toFixed(2)}</span>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="bg-primary px-3 py-3 rounded-lg w-full text-white text-center disabled:opacity-50"
      >
        {loading ? 'Processing…' : `Pay & add $${(Number(addAmount) || 0).toFixed(2)}`}
      </button>
    </form>
  );
};

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
);

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
          `https://admin.liquiditybars.com/admin/api/fetch_wallet_balance/${userId}`
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

      <section className="pageWrapper hasHeader hasFooter hasBottomNav">
        <div className="pageContainer">
          {loading ? (
            <p className="text-center py-3">Loading wallet data…</p>
          ) : (
            <>
              <div className={styles.walletBox}>
                <h4>Liquidity Cash</h4>
                <h2>${walletBalance.toFixed(2)}</h2>
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
                              ? `+ $${amount.toFixed(2)}`
                              : `- $${amount.toFixed(2)}`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="container-fluid pt-4 px-4 bottomButton fixed">
                <button
                  className="bg-primary px-3 py-3 rounded-lg w-full text-white text-center"
                  onClick={() => setOpen(true)}
                  disabled={!userId}
                >
                  + Add to balance
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {stripePromise && userId && (
        <Modal
          isOpen={open}
          onClose={() => setOpen(false)}
          title="Add Liquidity Cash"
        >
          <Elements stripe={stripePromise}>
            <StripeCardForm
              walletBalance={walletBalance}
              userId={userId}
              onSuccess={handleAddSuccess}
              onClose={() => setOpen(false)}
            />
          </Elements>
        </Modal>
      )}

      <BottomNavigation />
    </>
  );
}
