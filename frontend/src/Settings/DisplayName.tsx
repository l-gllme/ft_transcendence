import React, { useState } from 'react';
import { useAuth } from '../Auth/AuthContext';

const DisplayName: React.FC = () => {
  const [display_name, setDisplayName] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const { refresh } = useAuth();

  const checkDisplayNameAvailability = async () => {
    try {
      const response = await fetch('http://localhost:4000/users/checkdisplayname', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ display_name }),
      });
  
      if (response.ok) {
        return true;
      } else {
        const errorMessage = await response.text();
        setMessage(errorMessage);
        return false;
      }
    } catch (error) {
      throw new Error('An error occurred while checking availability.');
    }
  };

  const changeDisplayName = async () => {
    setMessage('');
    try {
      const isAvailable = await checkDisplayNameAvailability();
      if (isAvailable) {
        const response = await fetch('http://localhost:4000/users/displayname', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ display_name }),
          credentials: 'include',
        });

        if (response.ok) {
          refresh();
          setDisplayName('');
          setMessage('Name changed successfully.');
        } else {
          return false;
        }
      }
    } catch (error: any) {
      return false;
    }
  };

  return (
    <div className="display-name-container">
      <div className="display-name-input w-1/2 mx-auto">
        <input
          type="text"
          className="placeholder:italic placeholder:text-slate-400 block bg-white w-full border 
          border-slate-300 rounded-md py-2 pl-2 pr-5 text-gray-400
          shadow-sm focus:outline-none focus:border-sky-500 focus:ring-sky-500 focus:ring-1"
          placeholder="Enter a name"
          value={display_name}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>
      {message && (
        <p className="py-2 text-amber-50">
          {message}
        </p>
      )}
      <button className="bg-transparent text-amber-50 font-light py-2 px-4 border-transparent hover:bg-transparent hover:border-slate-50 rounded" onClick={changeDisplayName}>
        Change Name
      </button>
    </div>
  );
};

export default DisplayName;
