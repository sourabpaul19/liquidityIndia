'use client';

import { useEffect, useState, useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Thumbs, Navigation, Autoplay } from 'swiper/modules';
import { useRouter } from 'next/navigation';
import 'swiper/css';
import 'swiper/css/thumbs';
import 'swiper/css/navigation';
import Image from 'next/image';
import styles from './home.module.scss';
import BottomNavigation from '@/components/common/BottomNavigation/BottomNavigation';
import Header from '@/components/common/Header/Header';
import { Star, Heart, SlidersHorizontal, MapPinned } from 'lucide-react';
import Link from 'next/link';
import Modal from '@/components/common/Modal/Modal';

// -------------------------------
// Types (unchanged)
interface Banner {
  id: number;
  image: string;
}

interface Shop {
  id: string;
  name: string;
  address: string;
  image: string;
  rating: string;
  lat?: string;
  lng?: string;
  is_active?: string;
}

interface Order {
  id: string | number;
  status: number | string;
  square_order_id?: string;
  square_order_status?: string;
}

interface DashboardResponse {
  status: string | number;
  banners?: Banner[];
  shops?: Shop[];
  last_orders?: Order[];
  message?: string;
}

export default function HomePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ongoingOrder, setOngoingOrder] = useState<Order | null>(null);

  // ✅ Distance filter state - default ALL shops
  const [isDistanceFilterActive, setIsDistanceFilterActive] = useState(false);
  const [selectedDistance, setSelectedDistance] = useState(10);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);

  const [showDistanceModal, setShowDistanceModal] = useState(false);
  const [tempSelectedDistance, setTempSelectedDistance] =
    useState<{ id: number; name: string } | null>(null);

  // ✅ Haversine distance calculation (unchanged)
  const calculateDistance = (lat1: number, lng1: number, lat2: number | string, lng2: number | string): number => {
    const shopLat = typeof lat2 === 'string' ? parseFloat(lat2) : lat2;
    const shopLng = typeof lng2 === 'string' ? parseFloat(lng2) : lng2;
    
    if (isNaN(shopLat) || isNaN(shopLng)) return 999;

    const R = 6371;
    const dLat = (shopLat - lat1) * Math.PI / 180;
    const dLng = (shopLng - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(shopLat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // --------------------------------
  // Get user location from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const lat = localStorage.getItem('latitude');
      const lng = localStorage.getItem('longitude');
      
      if (lat && lng) {
        const parsedLat = parseFloat(lat);
        const parsedLng = parseFloat(lng);
        setUserLat(parsedLat);
        setUserLng(parsedLng);
        console.log('📍 User location loaded:', { lat: parsedLat, lng: parsedLng });
      }
    }
  }, []);

  // --------------------------------
  // Filter logic: ALL shops by default, filter when active
  useEffect(() => {
    console.log('🔄 Filtering shops:', { 
      totalShops: shops.length, 
      userLat, 
      isDistanceFilterActive,
      selectedDistance 
    });

    if (!isDistanceFilterActive || !userLat || !userLng) {
      // ✅ DEFAULT: Show ALL shops
      setFilteredShops(shops);
      console.log('✅ Showing ALL shops (no filter active)');
      return;
    }

    // ✅ FILTER MODE: Distance-based
    const shopsWithDistance = shops
      .map(shop => {
        if (shop.lat && shop.lng) {
          const distance = calculateDistance(userLat, userLng, shop.lat, shop.lng);
          console.log(`📍 ${shop.name}: ${distance.toFixed(1)}km`);
          return { ...shop, distance };
        }
        return { ...shop, distance: 999 };
      })
      .filter(shop => {
        const distance = (shop as any).distance;
        return distance <= selectedDistance;
      })
      .sort((a, b) => {
        const distA = (a as any).distance || 999;
        const distB = (b as any).distance || 999;
        return distA - distB;
      });

    console.log('✅ Filtered shops within', selectedDistance, 'km:', shopsWithDistance.length);
    setFilteredShops(shopsWithDistance);
  }, [shops, userLat, userLng, isDistanceFilterActive, selectedDistance]);

  // --------------------------------
  // Initial load (unchanged)
  useEffect(() => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      router.push('/');
      return;
    }

    const cachedShops = localStorage.getItem('shops');
    if (cachedShops) {
      try {
        const parsed = JSON.parse(cachedShops) as Shop[];
        if (Array.isArray(parsed)) {
          setShops(parsed);
          setFilteredShops(parsed); // ✅ Show all cached shops immediately
          setLoading(false);
        }
      } catch {}
    }

    const fetchDashboardData = async () => {
      try {
        const dashboardRes = await fetch(
          `https://dev2024.co.in/web/liquidity-backend/admin/api/fetchDashboardDataForUsers/${userId}`,
          { cache: 'no-store' }
        );
        const dashboardData: DashboardResponse = await dashboardRes.json();

        if (dashboardData.status === '1' || dashboardData.status === 1) {
          setBanners(dashboardData.banners || []);
          setShops(dashboardData.shops || []);
          setFilteredShops(dashboardData.shops || []); // ✅ Show all shops initially

          if ((dashboardData.shops?.length ?? 0) > 0) {
            localStorage.setItem('shops', JSON.stringify(dashboardData.shops));
          }

          const lastOrders: Order[] = dashboardData.last_orders || [];
          const proposedOrders = lastOrders.filter(
            (o) => o.square_order_status === 'PROPOSED'
          );
          const lastProposedOrder =
            proposedOrders.length > 0
              ? proposedOrders[proposedOrders.length - 1]
              : null;
          setOngoingOrder(lastProposedOrder);
        } else {
          setError(dashboardData.message || 'Failed to load data');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        if (shops.length === 0) {
          setError('Something went wrong while fetching data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  const handleSelectShop = (shop: Shop) => {
    localStorage.setItem('selected_shop', JSON.stringify(shop));
    router.push(`/bars/${shop.id}`);
  };

  // ✅ Toggle distance filter ON/OFF
  const confirmDistance = () => {
    if (tempSelectedDistance) {
      setSelectedDistance(tempSelectedDistance.id);
      setIsDistanceFilterActive(true); // ✅ Activate filter
    } else {
      setIsDistanceFilterActive(false); // ✅ Show all shops
    }
    setShowDistanceModal(false);
    setTempSelectedDistance(null);
  };

  // ✅ Reset filter to show all shops
  const resetFilter = () => {
    setIsDistanceFilterActive(false);
    setFilteredShops(shops);
  };

  if (loading && shops.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error && shops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => router.refresh()}
          className="mt-4 bg-primary text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <Header buttonType="menu" />
      <section className="pageWrapper hasHeader hasFooter">
        <div className="pageContainer py-4">
          {/* Banner Slider - unchanged */}
          {banners.length > 0 && (
            <Swiper modules={[Thumbs, Navigation, Autoplay]} autoplay={{ delay: 3000 }} loop={false} spaceBetween={16} breakpoints={{
              320: { slidesPerView: 1.05 },
              640: { slidesPerView: 2.2 },
              768: { slidesPerView: 3.3 },
              1024: { slidesPerView: 3.3 },
            }} className={styles.bannerSlider}>
              {banners.map((banner, index) => (
                <SwiperSlide key={banner.id}>
                  <div className="relative overflow-hidden rounded-xl shadow-md">
                    <figure className={styles.bannerImage}>
                      <Image src={banner.image} alt="Banner" fill sizes="100vw" priority={index === 0} />
                    </figure>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 px-4">
            <Link href="/ongoing-orders" className="bg-black px-3 py-3 flex justify-center rounded-lg w-full text-white">
              Ongoing and Past Orders
            </Link>
          </div>

          {/* Bars Section */}
          <div className="container-fluid mt-6">
            <div className="sectionHeading flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h4 className="section_title">
                  Bars ({filteredShops.length})
                </h4>
                {isDistanceFilterActive && userLat && (
                  <span className="text-sm text-primary bg-primary/10 px-2 py-1 rounded-full">
                    Selected Distance {selectedDistance}km
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isDistanceFilterActive && (
                  <button 
                    onClick={resetFilter}
                    className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-lg transition-all"
                  >
                    Clear Filter
                  </button>
                )}
                <button className={styles.mixerButton} onClick={() => setShowDistanceModal(true)}>
                  <SlidersHorizontal size={20} />
                </button>
              </div>
            </div>

            {/* Distance Modal */}
            <Modal isOpen={showDistanceModal} onClose={() => setShowDistanceModal(false)} title="Choose Distance">
              <div className="flex flex-col items-center justify-center">
                <div className="flex items-center gap-2 mb-4">
                  <MapPinned size={20} />
                  <span className="text-sm font-medium">
                    Select Distance:{' '}
                    <strong>{tempSelectedDistance ? `${tempSelectedDistance.name}` : `${selectedDistance}`} km</strong>
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={tempSelectedDistance?.id || selectedDistance}
                  onChange={(e) => setTempSelectedDistance({
                    id: Number(e.target.value),
                    name: `${e.target.value}`,
                  })}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between w-full text-xs text-gray-500 mt-2">
                  <span>1 km</span>
                  <span>100 km</span>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg" onClick={() => setShowDistanceModal(false)}>
                    Cancel
                  </button>
                  <button className="bg-primary text-white px-4 py-2 rounded-lg" onClick={confirmDistance}>
                    {isDistanceFilterActive ? 'Update' : 'Apply Filter'}
                  </button>
                </div>
              </div>
            </Modal>

            {filteredShops.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
                {filteredShops.map((shop) => {
                  const distanceDisplay = (shop as any).distance && (shop as any).distance < 999 && isDistanceFilterActive
                    ? `${(shop as any).distance.toFixed(1)}km` 
                    : '';
                  
                  return (
                    <article key={shop.id} onClick={() => handleSelectShop(shop)} className="cursor-pointer">
                      <figure className={styles.barImage}>
                        <Image
                          src={shop.image}
                          alt={shop.name}
                          fill
                          sizes="100vw"
                          className="rounded-xl object-cover"
                        />
                        {distanceDisplay && (
                          <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-full">
                            {distanceDisplay}
                          </div>
                        )}
                      </figure>
                      <figcaption className={styles.barContent}>
                        <div className={styles.left}>
                          <h4>{shop.name}</h4>
                          <p>{shop.address}</p>
                        </div>
                        <div className={styles.right}>
                          <Heart size={16} color="black" />
                          <p>{shop.rating} <Star size={12} color="gray" /> (600+)</p>
                        </div>
                      </figcaption>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-gray-500 mt-4 px-4">
                {isDistanceFilterActive 
                  ? `No bars within ${selectedDistance}km. Try increasing distance.` 
                  : 'No bars available.'
                }
              </p>
            )}
          </div>
        </div>

        {ongoingOrder && (
          <Link href={`/order-status/${ongoingOrder.id}`} className={styles.stickyMessage}>
            <p>You have an Order In-Progress. Click to see your order status.</p>
            <div className={styles.progressLayer}>
              <div className={styles.progressBar}></div>
            </div>
          </Link>
        )}
      </section>
      <BottomNavigation />
    </>
  );
}
