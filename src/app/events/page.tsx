import React from 'react'
import Image from 'next/image';
import logo from '../../public/images/logo.png';
import Header from '@/components/common/Header/Header';
import BottomNavigation from '@/components/common/BottomNavigation/BottomNavigation';
import styles from "./events.module.scss";
import Link from 'next/link';

export default function Events() {

    const events = [
        {
            id: 1,
            img: "/images/bar.jpg",
            title: "Pop-up at Casa Mezcal",
            address: '291 King St W, Toronto, ON M5V 1J5',
        },
        {
            id: 2,
            img: "/images/bar.jpg",
            title: "Pop-up at Casa Mezcal",
            address: '291 King St W, Toronto, ON M5V 1J5',
        },
        {
            id: 3,
            img: "/images/bar.jpg",
            title: "Pop-up at Casa Mezcal",
            address: '291 King St W, Toronto, ON M5V 1J5',
        },
        {
            id: 4,
            img: "/images/bar.jpg",
            title: "Pop-up at Casa Mezcal",
            address: '291 King St W, Toronto, ON M5V 1J5',
        },
        {
            id: 5,
            img: "/images/bar.jpg",
            title: "Pop-up at Casa Mezcal",
            address: '291 King St W, Toronto, ON M5V 1J5',
        },
        {
            id: 6,
            img: "/images/bar.jpg",
            title: "Pop-up at Casa Mezcal",
            address: '291 King St W, Toronto, ON M5V 1J5',
        },
    ];

  return (
    <>
    <Header title='Events' />
    <section className='pageWrapper hasHeader hasFooter'>
        <div className='pageContainer py-4'>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
                {events.map((event) => (
                    <article key={event.id}>
                        <Link href="/event-details">
                        <figure className={styles.barImage}> 
                            <Image src={event.img} alt={event.title} fill className="" ></Image> 
                        </figure> 
                        </Link>
                        <figcaption className={styles.barContent}> 
                            <div className={styles.left}> 
                                <h4>{event.title}</h4> 
                                <p>{event.address}</p> 
                            </div> 
                        </figcaption>
                    </article>
                ))}
            </div>
        </div>
    </section>
    <BottomNavigation />    
    </>

  )
}
