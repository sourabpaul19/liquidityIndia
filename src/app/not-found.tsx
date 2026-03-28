import React from 'react'
import Image from 'next/image';
import logo from '../../public/images/logo.png';

export default function notfound() {
  return (
    <section className='page_content'>
      <div className='loadingWrapper'>
        <Image alt='' src={logo}></Image>
        <div>Page Not Found</div>
      </div>
    </section>    
  )
}
