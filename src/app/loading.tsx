import React from 'react'
import Image from 'next/image';
import logo from '../../public/images/logo.png';

export default function loading() {
  return (
    <section className='pageWrapper'>
      <div className='loadingWrapper'>
        <Image alt='' src={logo}></Image>
        <div>loading...</div>
      </div>
    </section>    
  )
}
