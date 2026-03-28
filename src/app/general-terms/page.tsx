import React from 'react'
import Image from 'next/image';
import logo from '../../public/images/logo.png';
import Header from '@/components/common/Header/Header';
import BottomNavigation from '@/components/common/BottomNavigation/BottomNavigation';

export default function GeneralTerms() {
  return (
    <>
    <Header title='General Terms' />
    <section className='pageWrapper hasHeader hasFooter'>
        <div className='pageContainer'>
        <div className="cmsContent pt-4 px-4">
            <p><u><strong>Liquidity terms and conditions for Customers order through Liquidity APP</strong></u></p>
            <p>ORDERING time is between 11 am till 11 pm on any given days ,other than days when as per respective State Excise laws , sale of alcohol is prohibited.All alcoholic products must be consumed in the outlet itself. Alcoholic products cannot be taken out from the premises under any circumstances.Food and alcohol products ordered ,must be consumed as scheduled by you ,while placing of the order .You may place order for upto 72 hours in advance, within the stipulated ordering time .You can order a maximum of 10 units each of any available brand in the categories of Single Malt Whisky, Premium Whisky , Regular Whisky , Vodka , Cognac , Rum , Gin, Tequila , Brandy ,Liqueurs, Champagne,Wine (per unit is = 30 ml) , Low Alcoholic Beverages ( per unit is 500 ml ) Beers( per unit is 330 ml ) per transaction.</p>
            <p></p>
            <p>In the Unlikely event of Participating outlet ,not being able to provide you with your selection of product, the outlet will alternatively provide with similar or higher product at the price ,which has been already paid by you .</p>
            <p>At the time , when the order is successfully placed , you will receive a confirmation via sms and email ,with the invoice , which you need to present at the outlet upon your arrival in the outlet ,upon presentation of the same ,your order will be served .</p>
            <p></p>
            <p>At time of placing of the order, please indicate number of guests, to enable the outlet to reserve the table for you .</p>
            <p>Liquidity charges a transaction fee of Rs 25 on any order below Rs 1500 and Rs 50 for order valued Rs 1500 and above .</p>
            <p>Pubs , Bars and Restaurants have Dress codes and Gate Policies . You are requested to kindly adhere to the same upon your choice of outlet .<br/><br/><u><strong>Cancellations</strong></u><br/>You may cancel your order for free within 15 minutes of placing of orderIf you can cancel order anytime after 15 minutes to within one hour of your scheduled time ,25 % of the order value is deductedIn case you cancel your order, less than one hour of your scheduled time, 50 % of the order value is deductedNo refund allowed if order cancelled within less than 30 minutes of your scheduled time.Refund amount will be credited to your liquidity wallet ,within 3 working days .Amount credited will be after applied deductions and transaction fee cannot be refunded. <br/><br/><u><strong>ReSchedule</strong></u><br/>You may reschedule your order once ,for a fee of Rs 50 as per below terms :</p>
            <ol>
                <li>
                    <p>Rescheduling can be done till 4 (four )hours before your scheduled arrival.</p>
                </li>
                <li>
                    <p>You may reschedule the time and or the date once ,within time frame of 72 hours thereon .</p>
                </li>
                <li>
                    <p>Rescheduling is allowed only once and rescheduled orders cannot be cancelled or modified .</p>
                </li>
            </ol>
            <p></p>
            <p></p>
            <p>To ensure that the reserved table is provided to you on your arrival , you are requested to arrive at your scheduled time, failing which the outlet may not be able to immediately provide you with the table and under this circumstances only the next available table with be provided to you .</p>
            <p></p>
            <p>For your table reservation , you are allowed a grace time of 15 minutes between your scheduled arrival time and actual arrival time .</p>
            <p>Failure to arrive within the grace time, would cancel your order without refund .The grace time but cannot be beyond the closing time of the outlet, or the last alcohol service time, whichever is earlier .</p>
            <p>Outlet might ,at its sole discretion, extend you the courtesy of some more grace time for your arrival beyond the scheduled time, upon receipt of your specific request by them .</p>
            <br/>
            <p><u><strong>Order Modifications</strong></u><br/>Once the order has been placed Order cannot be modified with regard to change of product and or the quantity .</p>
            <p>You may cancel or reschedule the order and as per cancellation &amp; rescheduling policy .</p>
            <p></p>
            <p><u><strong>Refund</strong></u></p>
            <p>In the event the outlet, fails to provide you with your selected product ,and your unwillingness to accept the alternative being offered , we will refund your amount to your Liquidity wallet for the product which was unavailable .the Refund claim must be lodged within 24 hours of your visit to the participating outlet</p>
            <p>To claim such Refund, please log in to your Liquidity account and select HELP in the options .</p>
        </div>
        </div>
    </section>
    <BottomNavigation />
    </>    
  )
}
