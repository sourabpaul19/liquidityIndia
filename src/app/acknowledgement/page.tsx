"use client";
import { useRouter } from "next/navigation";
import styles from "./acknowledgement.module.scss";
import Image from 'next/image';
import user from '../../../public/images/3177440.png';
import Link from "next/link";

export default function Acknowledgement() {

    const router = useRouter();

    const handleButtonClick = () => {
        router.back();
    };

    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        router.push("/home");
    };
  
  return (
    <>
    <header className='header app-bg'>
        <button type='button' className='icon_only app-bg' onClick={handleButtonClick}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <Link href="" className={styles.user}>
            <Image alt="Liquidity Logo" src={user} />
        </Link>
    </header>
    <section className='pageWrapper hasHeader hasFooter app-bg'>
        <div className={styles.acknowledgementWrapper}>
            <div className={`${styles.acknowledgementForm}`}>
                <h3>Acknowledgement</h3>
                <p><strong>I understand that it is my responsibility to pick up my drink when it is ready,</strong> and that failure to do so in a timely manner means my drink could get stolen, or disposed of by the bar</p>
                <div className="grid grid-cols-1 mt-7 gap-4">
                    <form onSubmit={handleVerify} className="space-y-4">
                        <Link href='/order-success' className='bg-primary px-3 py-3 flex justify-center rounded-lg w-full text-white'>I Understand</Link>
                        <Link href='/' className='bg-black px-3 py-3 flex justify-center rounded-lg w-full text-white'>Yes, Don&apos;t Show Again</Link>
                        <Link href='/' className='bg-black px-3 py-3 flex justify-center rounded-lg w-full text-white'>No, Cancel</Link>
                    </form>
                </div>
            </div>
        </div>
    </section>
    <div className={styles.acknowledgementFooter}>
        <p>Discloser: Liquidity is not liable for drink theft/losses that occur at the bar</p>
    </div>
    </>    
  )
}
