import React, { useState, useEffect } from 'react';

const Toggle2FA: React.FC = () => {
    const [isActive, setIsActive] = useState(false);
    const [qrCodeDataURL, setQrCodeDataURL] = useState<string | null>(null);
    const [twoFactorCode, setTwoFactorCode] = useState('');

    useEffect(() => {
        check2FAStatus();
    }, []);

    const check2FAStatus = async () => {
        try {
            const response = await fetch('http://localhost:4000/auth/2fa/isEnabled', {
                method: "GET",
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (response.status === 200) {
                setIsActive(true);
            } else if (response.status === 201) {
                setIsActive(false);
            }
        } catch (error) {
            console.error('Failed to check 2FA status:', error);
        }
    };

    const handleToggle = async () => {
        try {
            if (isActive) {
                // Disable 2FA
                const response = await fetch('http://localhost:4000/auth/2fa/disable', {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                if (response.ok) {
                    setIsActive(false); // Toggle to unchecked
                    setQrCodeDataURL(null);
                } else {
                    console.error('2FA disable request failed');
                }
            } else {
                // Enable 2FA
                const response = await fetch('http://localhost:4000/auth/2fa/enable', {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    const { qrCodeDataURL } = data;
                    setQrCodeDataURL(qrCodeDataURL);
                    setIsActive(true); // Toggle to checked
                } else {
                    console.error('2FA toggle request failed');
                }
            }
        } catch (error) {
            console.error('Network error:', error);
        }
    };

    const handleTwoFactorCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTwoFactorCode(e.target.value);
    };

    const handleTwoFactorCodeSubmit = async () => {
        try {
            const response = await fetch('http://localhost:4000/auth/2fa/check', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code2FA: twoFactorCode }),
            });

            if (response.ok) {
                alert('2FA verification successful, 2fa is now enabled');
            } else {
                console.error('2FA verification failed');
            }
        } catch (error) {
            console.error('Network error:', error);
        }
    };

    return (
        <div>
            <div className="bg-gray-700 rounded-lg p-4 m-4 text-amber-50">
                <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold">{isActive ? 'active' : 'inactive'}</p>
                    <div className="relative">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={handleToggle}
                            className="sr-only"
                        />
                        <div className="toggle-switch w-10 h-6 bg-gray-500 rounded-full relative cursor-pointer">
                            <div
                                className={`h-6 w-6 rounded-full shadow-md transform duration-300 ease-in-out ${isActive ? 'translate-x-full' : ''
                                    } ${isActive ? 'bg-sky-500' : 'bg-orange-500'}`}
                                onClick={handleToggle}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
            {qrCodeDataURL && (
                <div className="text-center mt-4">
                    <img src={qrCodeDataURL} alt="QR Code" style={{ display: 'block', margin: '0 auto' }} />
                    <p className="text-center mt-2">Scan the QR code with your 2FA app</p>
                    <div className="mt-4">
                        <input
                            type="text"
                            placeholder="Enter 2FA code"
                            value={twoFactorCode}
                            onChange={handleTwoFactorCodeChange}
                            className="border border-gray-300 rounded px-4 py-2 mb-2"
                        />
                        <button
                            onClick={handleTwoFactorCodeSubmit}
                            className="bg-blue-500 hover:bg-blue-600 text-amber-50 font-bold py-2 px-4 rounded"
                        >
                            Submit
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Toggle2FA;
