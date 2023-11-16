import React from 'react';

const Logout = () => {
    return (
        <>
            <button
                className='
                font-semibold text-amber-50 bg-sky-950 hover:bg-blue-800 focus:ring-4 focus:outline-none 
                focus:ring-blue-300 rounded-lg text-sm px-4 py-2 text-center mr-3 md:mr-0 
                dark:bg-sky-950 dark:hover:bg-blue-300 dark:hover:text-gray-900 dark:focus:ring-blue-800'
                onClick={() => {
                    window.location.href = "http://localhost:4000/auth/logout";
                }}>
                Sign out
            </button>
        </>
    );
}

export default Logout;