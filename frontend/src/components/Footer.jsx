import React from 'react'
import { assets } from '../assets/assets_frontend/assets'

const Footer = () => {
  return (
    <div className='md:mx-10'>
        <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>

            {/* left section */}
            <div>
                <img className='mb-5 w-40' src={assets.logo} alt='' ></img>
                <p className='w-full md:w-2/3 text-gray-600 leading-6'>Lorem ipsum dolor sit amet consectetur adipisicing elit. 
                    Maxime blanditiis delectus itaque, sequi inventore dolor! 
                    Accusantium ab explicabo expedita amet eum voluptatum, atque, 
                    quos assumenda consequuntur ducimus eveniet fugit fuga.</p>
            </div>

            {/* center section */}
            <div>
                <p className='text-xl font-medium mb-5'>COMPANY</p>
                <ul className='flex flex-col gap-2 text-gray-600'>
                    <li>Home</li>
                    <li>About Us</li>
                    <li>Contact Us</li>
                    <li>Privacy Policy</li>
                </ul>
            </div>

            {/* right section */}
            <div>
                <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
                <ul className='flex flex-col gap-2 text-gray-600'>
                    <li>+91-7820891908</li>
                    <li>tejasdhake04@gmail.com</li>
                </ul>
            </div>

        </div>
            {/* Copyright text */}
            <div>
                <hr />
                <p className='py-5 text-sm text-center'>Copyright © 2025 TejasDhake - All Right Reserved.</p>
            </div>
    </div>
  )
}

export default Footer