import React, { useState } from 'react';
import { useAuth } from '../Auth/AuthContext';

const AvatarUpload: React.FC = () => {
  const [avatar, setAvatar] = useState<File | null>(null);
  const [message, setMessage] = useState<string>('');

  const { user } = useAuth();
  const { refresh } = useAuth();


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setAvatar(files[0]);
    }
  };

  const uploadAvatar = async () => {
    setMessage('');

    if (!avatar) {
      setMessage('Please select an image to upload.');
      return;
    }

    const blobAvatar = new Blob([avatar], { type: avatar.type });

    const formData = new FormData();
    formData.append('image', blobAvatar, avatar.name);
    formData.append('userId', user?.id.toString() || '');


    try {
        const response = await fetch('http://localhost:4000/users/upload/', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
  
        if (response.ok) {
          refresh();
          setMessage('Image uploaded successfully.');
        } else {
          setMessage('Failed to upload the image.');
        }
      } catch (error) {
        setMessage('An error occurred while uploading the image.');
      }

  };

  return (
    <div className='mx-auto w-1/2'>
      <input
        type="file"
        className="mx-auto block w-full text-sm text-slate-400
        file:mr-4 file:py-2 file:px-4
        file:rounded-full file:border-0
        file:text-sm file:font-semibold
        file:bg-white file:text-violet-700
        hover:file:bg-violet-100 hover:cursor-pointer"
        accept="image/jpg, image/png, image/jpeg"
        onChange={handleFileChange}
      />
      {message && <p className='py-1 text-amber-50'>{message}</p>}
      <button className="bg-transparent text-amber-50 font-light py-2 px-4 border-transparent hover:bg-transparent hover:border-slate-50 rounded" onClick={uploadAvatar}>Upload Avatar</button>
    </div>
  );
};

export default AvatarUpload;

