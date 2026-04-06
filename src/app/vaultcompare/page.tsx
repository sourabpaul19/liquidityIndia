'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header/Header';
import BottomNavigation from '@/components/common/BottomNavigation/BottomNavigation';
import styles from "./vaultcompare.module.scss";
import { Star } from 'lucide-react';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

interface CartItem {
  vault_category_name: ReactNode;
  id: string | number;
  product_name: string;
  quantity: number | string;
  price: number | string;
}

interface OutletItem {
  id?: string | number;
  name: string;
  address: string;
  image: string;
  rating: number | string;
}

interface UserDetails {
  name?: string;
  email?: string;
  mobile?: string;
}

export default function VaultComparePage() {
  const router = useRouter();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartPrice, setCartPrice] = useState<number>(0);
  const [outletDetails, setOutletDetails] = useState<OutletItem[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<'wallet' | 'online' | ''>('');
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletStatus, setWalletStatus] = useState<number>(0);
  const [user, setUser] = useState<UserDetails>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [initializingPayment, setInitializingPayment] = useState<boolean>(false);

  const cartItemCount = useMemo(() => cartItems.length, [cartItems]);
  const IMAGE_BASE_URL = 'https://dev2024.co.in/web/liquidity-india-backend/assets/upload/vault_shops/';

  

  useEffect(() => {
    initializePage();
  }, []);

  useEffect(() => {
    if (cartPrice > walletBalance) {
      setWalletStatus(1);
      if (selectedPayment === 'wallet') setSelectedPayment('');
    } else if (cartPrice <= walletBalance && walletBalance > 0) {
      setWalletStatus(2);
    } else {
      setWalletStatus(0);
    }
  }, [cartPrice, walletBalance, selectedPayment]);

  const initializePage = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('userDetails') || '{}');
      setUser(storedUser);
      setWalletBalance(Number(localStorage.getItem('wallet_balance') || 0));

      await Promise.all([fetchCartItems(), fetchVaultShops()]);
    } catch (error) {
      console.error('Initialization failed', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCartItems = async () => {
    try {
      const device_id =
        localStorage.getItem('uniqueDeviceID') ||
        localStorage.getItem('device_id') ||
        '';

      const response = await fetch('/api/vault/fetch-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id }),
      });

      const res = await response.json();

      if (res.status === '1') {
        const items = Array.isArray(res.cartItems) ? res.cartItems : [];
        const total = Number(res.total_price || 0);
        setCartItems(items);
        setCartPrice(total);
      } else {
        setCartItems([]);
        setCartPrice(0);
      }
    } catch (error) {
      console.error('fetchVaultCartItems error', error);
      setCartItems([]);
      setCartPrice(0);
    }
  };

  const fetchVaultShops = async () => {
    try {
      const outletCategory = localStorage.getItem('outletCategory') || '';

      const response = await fetch('/api/vault/fetch-shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outletCategory }),
      });

      const res = await response.json();

      if (res.status === 1 || res.status === '1') {
        setOutletDetails(Array.isArray(res.vault_shops) ? res.vault_shops : []);
      } else {
        setOutletDetails([]);
      }
    } catch (error) {
      console.error('fetchVaultShops error:', error);
      setOutletDetails([]);
    }
  };

  const removeItem = async (item: CartItem) => {
    try {
      const response = await fetch('/api/vault/delete-cart-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id }),
      });

      const res = await response.json();

      if (res.status === 1 || res.status === '1') {
        await fetchCartItems();
      } else {
        alert(res.message || 'Unable to delete item');
      }
    } catch (error) {
      console.error(error);
      alert('Delete failed');
    }
  };

  const pay = async () => {
    if (!cartItems.length) {
      alert('Please select any Order');
      return;
    }

    if (!selectedPayment) {
      alert('Please choose payment mode');
      return;
    }

    if (selectedPayment === 'wallet') {
      await createOrder('123456', '2');
      return;
    }

    await handleRazorpayPayment();
  };

  const createOrder = async (transactionId: string, paymentType: '1' | '2') => {
  try {
    setSubmitting(true);

    const storedUser = JSON.parse(localStorage.getItem('userData') || '{}');
    const userId = localStorage.getItem('user_id') || '';
    const deviceId =
      localStorage.getItem('device_id') ||
      localStorage.getItem('uniqueDeviceID') ||
      'null';

    const params = new URLSearchParams();
    params.append('name', storedUser.name || '');
    params.append('email', storedUser.email || '');
    params.append('mobile', storedUser.mobile || '');
    params.append('user_id', userId);
    params.append('payment_type', paymentType);
    params.append('transaction_id', transactionId);
    params.append('device_id', deviceId || 'null');

    const response = await fetch('/api/vault/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const res = await response.json();

    if (res.status === '1' || res.status === 1) {
  const orderId = String(res.order_id || '');
  localStorage.setItem('vault_orderrr_id', orderId);
  if (paymentType === '1') localStorage.setItem('vault', '1');
  router.push(`/vault-order-success/${orderId}`);
} else {
  alert(res.message || 'Unable to create order');
}
  } catch (error) {
    console.error('createOrder error:', error);
    alert('Order failed');
  } finally {
    setSubmitting(false);
  }
};

  const handleRazorpayPayment = async () => {
    if (!window.Razorpay) {
      alert('Razorpay SDK is still loading. Please try again.');
      return;
    }

    try {
      setInitializingPayment(true);

      const amountPaise = Math.round(Number(cartPrice) * 100);
      const deviceId =
        localStorage.getItem('device_id') ||
        localStorage.getItem('uniqueDeviceID') ||
        'vault';

      const receipt = `vault_${String(deviceId).slice(0, 20)}_${Date.now()
        .toString()
        .slice(-6)}`;

      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountPaise,
          currency: 'INR',
          receipt,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderData?.id) {
        alert(orderData?.error || 'Failed to create Razorpay order');
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amountPaise,
        currency: 'INR',
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              await createOrder(response?.razorpay_payment_id || '', '1');
            } else {
              alert('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification failed:', error);
            alert('Payment verification failed');
          }
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on('payment.failed', function () {
        alert('Payment failed');
      });

      razorpay.open();
    } catch (error) {
      console.error('Razorpay init error:', error);
      alert('Unable to start payment');
    } finally {
      setInitializingPayment(false);
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };
  

  const getImageUrl = (image?: string) => {
    if (!image) return 'https://picsum.photos/400/300';
    if (image.startsWith('http://') || image.startsWith('https://')) return image;
    return `${IMAGE_BASE_URL}${image.replace(/^\/+/, '')}`;
  };

  const walletAmountToUse = useMemo(() => {
  return Math.min(Number(cartPrice), Number(walletBalance));
}, [cartPrice, walletBalance]);

const remainingAmount = useMemo(() => {
  return Math.max(0, Number(cartPrice) - walletAmountToUse);
}, [cartPrice, walletAmountToUse]);

const canUseWalletFull = walletBalance >= cartPrice && cartPrice > 0;
const canUseSplit = walletBalance > 0 && walletBalance < cartPrice;

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      
      <Header title="Compare &amp; Reserve" />

      <section className={`pageWrapper hasHeader hasFooter`}>


        <div className="pageContainer">
          <section className="px-4">

            {loading ? (
              <div className="space-y-3 px-4 py-4">
                {[1, 2].map((item) => (
                  <div key={item} className="h-10 animate-pulse rounded-xl bg-neutral-100" />
                ))}
              </div>
            ) : (
              <>
                {cartItems.map((cartItem) => (
                  <div key={cartItem.id} className={`${styles.vaultItem} flex items-center justify-between pb-4`}>
                    <div className='left'>
                      <h4>{cartItem.product_name}</h4>
                      <p><strong>Vault Category:</strong> {cartItem.vault_category_name}</p>
                    </div>
                    
                    <div className="right">
                      

                      <h4 className='text-right'>
                        {cartItem.quantity} Unit
                      </h4>
                      <button
                        onClick={() => removeItem(cartItem)}
                        className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </section>

          <div className='px-4 pb-4'>
            <h4 className='text-lg font-semibold mb-3'>Billing Summary</h4>
            <div className={`${styles.vaultItem} flex items-center justify-between pb-1`}>
              <div className='left'>
                <h5>Subtotal</h5>
              </div>
              <div className='right'>
                <h5>₹ {formatPrice(cartPrice)}</h5>
              </div>
            </div>
            <div className={`${styles.vaultItem} flex items-center justify-between pb-1`}>
              <div className='left'>
                <h5>Liquidity cash</h5>
              </div>
              <div className='right'>
                {walletBalance > 0 ? (
                  <h5 className="text-green-600 font-semibold">
                    -₹ {formatPrice(walletAmountToUse)}
                  </h5>
                ) : (
                  <h5>₹ 0.00</h5>
                )}
              </div>
            </div>
            <div className={`${styles.vaultItem} flex items-center justify-between pb-1`}>
              <div className='left'>
                <h4>Total</h4>
              </div>
              <div className='right'>
                <h4>₹ {formatPrice(cartPrice)}</h4>
              </div>
            </div>
          </div>

          {walletStatus === 1 && (
            <div className="px-4 mb-4">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">Your wallet balance is low. Please use online payment to complete the transactions.</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 px-4">
            {walletStatus === 2 && (
              <button
                onClick={() => setSelectedPayment('wallet')}
                className={`py-3 px-4 rounded-lg font-medium border transition ${
                  selectedPayment === 'wallet'
                    ? 'bg-green-600 text-white border-green-600 shadow-lg'
                    : 'border border-gray-200 hover:border-gray-300 bg-white text-neutral-700'
                }`}
              >

                <span>Pay ₹{formatPrice(cartPrice)} with Wallet</span>
              </button>
            )}

            <button
              onClick={() => setSelectedPayment('online')}
              className={`py-3 px-4 rounded-lg font-medium border transition flex items-center justify-center gap-2 ${
                selectedPayment === 'online'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg'
                  : 'border border-gray-200 hover:border-gray-300 bg-white text-neutral-700'
              }`}
            >
              <span className="">
                💳
              </span>
              <span>Pay ₹{formatPrice(cartPrice)} with Razorpay</span>
            </button>
          </div>

          

          <section className='px-4 pt-4 pb-[86px]'>
            <h4 className="text-lg font-semibold mb-3">
              Outlets in the selected category
            </h4>

            <div className="grid grid-cols-1 gap-3">
              {outletDetails.map((outlet, index) => (
                
                <article
                  key={outlet.id ?? index}
                  className=""
                >
                  <div className={`${styles.outletImage}`}>
                    <Image
                      src={getImageUrl(outlet.image) || 'https://picsum.photos/400/300'}
                      alt={outlet.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  <div className={`${styles.outletContent}`}>
                    <div className="left">
                      <h4 className="">{outlet.name}</h4>
                      <p className="">{outlet.address}</p>
                      
                    </div>
                      <div className="right">
                        <p><span><Star size={12} color="gray" /></span>
                        <span>{outlet.rating}</span></p>
                      </div>
                    
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <footer className={`${styles.bottomButton}`}>
          <div className="flex gap-3">
 

            <button
              onClick={pay}
              disabled={submitting || initializingPayment}
              className="px-4 py-3 rounded-lg w-full text-white flex justify-between items-center bg-primary"
            >
              <div className="min-w-0 text-left">
                <p className="text-[10px] leading-tight text-white">
                  {cartItemCount} item in cart
                </p>

                <p className="text-sm leading-tight text-white">
                  ₹ {formatPrice(cartPrice)}{' '}
                  <span className="text-[10px] font-medium text-white">plus taxes*</span>
                </p>
              </div>
              <span>
                {submitting || initializingPayment ? 'Processing...' : 'Checkout'}
              </span>
            </button>
          </div>
        </footer>
      </section>
      <BottomNavigation/>
    </>
  );
}