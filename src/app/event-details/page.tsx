import React from 'react'
import Image from 'next/image';
import logo from '../../public/images/logo.png';
import Header from '@/components/common/Header/Header';
import BottomNavigation from '@/components/common/BottomNavigation/BottomNavigation';
import styles from "./event-details.module.scss";
import Link from 'next/link';
import bar from '../../../public/images/bar.jpg';
import { Clock, Calendar } from "lucide-react";

export default function Events() {

  return (
    <>
    <Header title='Events' />
    <section className='pageWrapper hasHeader hasFooter'>
        <div className='pageContainer py-4'>
        <div className="container-fluid px-4">
            <figure className={styles.eventBanner}>
                <Image src={bar} fill alt="" />
            </figure>
            <figcaption>
                <div className={styles.eventLeft}>
                    <h2 className={`${styles.eventTitle} text-center`}>Pop-up at Casa Mezcal</h2>
                    <div className={`${styles.eventAddress}`}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g clipPath="url(#clip0_27_103)">
                                <path d="M17.5 8.33333C17.5 14.1667 10 19.1667 10 19.1667C10 19.1667 2.5 14.1667 2.5 8.33333C2.5 6.34421 3.29018 4.43655 4.6967 3.03003C6.10322 1.62351 8.01088 0.833332 10 0.833332C11.9891 0.833332 13.8968 1.62351 15.3033 3.03003C16.7098 4.43655 17.5 6.34421 17.5 8.33333Z" stroke="#19A83E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M10 10.8333C11.3807 10.8333 12.5 9.71404 12.5 8.33333C12.5 6.95262 11.3807 5.83333 10 5.83333C8.61929 5.83333 7.5 6.95262 7.5 8.33333C7.5 9.71404 8.61929 10.8333 10 10.8333Z" stroke="#19A83E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </g>
                            <defs>
                                <clipPath id="clip0_27_103">
                                    <rect width="20" height="20" fill="white"/>
                                </clipPath>
                            </defs>
                        </svg>
                        <span>291 King St W, Toronto, ON M5V 1J5</span>
                    </div>
                </div>
            </figcaption>
            <div className='flex bg-white p-4 rounded-lg gap-4 mt-4'>
                <div className='flex w-full items-center gap-3 color-primary'>
                    <Calendar size={24} />
                    <div>
                        <h4 className='text-gray-900'>Event Date</h4>
                        <p>20 Jan 2026</p>
                    </div>
                </div>
                <div className='flex w-full items-center gap-3 color-primary'>
                    <Clock size={24} />
                    <div>
                        <h4 className='text-gray-900'>Event Time</h4>
                        <p>09:00 PM</p>
                    </div>
                </div>
            </div>
        </div>
        </div>
    </section>
    <BottomNavigation />    
    </>

  )
}
