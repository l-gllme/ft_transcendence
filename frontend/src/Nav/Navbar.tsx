import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logout from '../Auth/Logout';
import Logo from '../assets/logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';

function Navbar() {
  const location = useLocation();
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <nav className='bg-gray-900 z-10'>
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4 relative">
        <Link to='/profile' className='flex items-center'>
          <img src={Logo} alt='logo' className='h-12 mr-2' />
          <span className="self-center text-2xl font-semibold whitespace-nowrap text-amber-50">Transcendence</span>
        </Link>
        <button
          onClick={() => setMenuVisible(!menuVisible)}
          className="md:hidden block text-gray-400 hover:text-amber-50 focus:text-amber-50 focus:outline-none"
        >
          <FontAwesomeIcon
            icon={menuVisible ? faTimes : faBars}
            className="h-6 w-6 absolute right-1 top-8"
          />
        </button>
        <div className={`md:flex md:w-auto ${menuVisible ? 'block' : 'hidden'}`}>
          <ul className='flex p-0 font-medium-50 md:flex-row md:space-x-8 mt-0 md:border-0'>
            <li>
              <Link
                to='/profile'
                className={`font-semibold block py-2 px-2 rounded hover:text-blue-300 ${location.pathname.startsWith('/profile') ? 'text-blue-300' : 'text-amber-50'}`}
              >
                Profile
              </Link>
            </li>
            <li>
              <Link
                to='/chat'
                className={`font-semibold block py-2 px-2 rounded hover:text-blue-300 ${location.pathname.startsWith('/chat') ? 'text-blue-300' : 'text-amber-50'}`}
              >
                Chat
              </Link>
            </li>
            <li>
              <Link
                to='/game'
                className={`font-semibold block py-2 px-2 rounded hover:text-blue-300 ${location.pathname.startsWith('/game') ? 'text-blue-300' : 'text-amber-50'}`}
              >
                Game
              </Link>
            </li>
            <li>
              <Link
                to='/friends'
                className={`font-semibold block py-2 px-2 rounded hover:text-blue-300 ${location.pathname.startsWith('/friends') ? 'text-blue-300' : 'text-amber-50'}`}
              >
                Friends
              </Link>
            </li>
            <li><Logout /></li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
