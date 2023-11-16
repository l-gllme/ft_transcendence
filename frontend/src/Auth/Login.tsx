import React, { useEffect } from 'react';

import '../Styles/Login.css';

function parallax(event: MouseEvent) {
    const layers = document.querySelectorAll('.layer');
    const el = document.getElementById('box');
    layers.forEach(layer => {
        event.preventDefault();
        const point: { x: number; y: number } = { x: event.clientX, y: event.clientY };

        const speed = (layer as HTMLElement).dataset.speed || '1';
        const x = ((el?.offsetWidth || 0) - point.x * parseFloat(speed)) / 100;
        const y = ((el?.offsetHeight || 0) - point.y * parseFloat(speed)) / 100;
        (layer as HTMLElement).style.transform = `translate(${x}px, ${y}px)`;
    });
}

export default function Login() {

    const FtLogin = () => {
        window.location.href = "http://localhost:4000/auth/42/login";
    }
    const GoogleLogin = () => {
        window.location.href = "http://localhost:4000/auth/google/login";
    }

    useEffect(() => {
        document.addEventListener('mousemove', parallax, false);
        document.body.classList.add('overflow-hidden');

        return () => {
            document.removeEventListener('mousemove', parallax, false);
            document.body.classList.remove('overflow-hidden');
        };
    }, []);

    return (
        <div className="overflow-hidden">
            <div id="box">
                <div className="bg layer" data-speed="0"></div>
                <div className="wave-top layer" data-speed="-10"></div>
                <div className="wave-right layer" data-speed="-1"></div>
                <div className="wave-bottom layer" data-speed="4"></div>
                <div className="wave-bottom-right layer" data-speed="1"></div>
            </div>
            <div className=" absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-6 max-w-sm mx-auto rounded-full shadow-lg shadow-white flex flex-col items-center space-y-4 z-2">
                {/*<div className="text-xl font-semibold text-blue-800">ログイン - LOGIN</div>*/}
                <div className="flex items-center space-x-4">
                    <div className="px-6">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/8/8d/42_Logo.svg" 
                        alt="42" width="100" height="100" onClick={FtLogin} style={{ cursor: 'pointer' }} />
                    </div>
                    <div className="px-6">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" 
                        alt="Google" width="100" height="100" onClick={GoogleLogin} style={{ cursor: 'pointer' }} />
                    </div>
                </div>
            </div>
        </ div>
    );
}