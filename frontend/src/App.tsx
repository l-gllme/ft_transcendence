import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthContextProvider } from './Auth/AuthContext';
import { WebSocketContextProvider } from './WebSockets/WebSocketsContext';
import Private from './Auth/PrivateRoute';

import Login from './Auth/Login';
import Settings from './Settings/Settings';
import Profile from './Profile/Profile';
import UserProfile from './Profile/UserProfile';
import Chat from './Chat/Chat';
import Game from './Game/Game';
import Friends from './Friends/Friends'
import Layout from './Nav/NavLayout';
import Room from './Chat/Room';

import './Styles/App.css';

export default function App() {

  return (
    <div className='bg-gray-800'>
      <AuthContextProvider>
        <WebSocketContextProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route path="*" element={<Private><Layout><Profile /></Layout></Private>} />
              <Route path="/" element={<Private><Layout><Profile /></Layout></Private>} />

              <Route path="/profile" element={<Private><Layout><Profile /></Layout></Private>} />
              <Route path="/profile/:display_name" element={<Private><Layout><UserProfile /></Layout></Private>} />
              <Route path="/chat/:roomId" element={<Private><Layout><Room /></Layout></Private>} />
              <Route path="/chat" element={<Private><Layout><Chat /></Layout></Private>} />
              <Route path="/game" element={<Private><Layout><Game /></Layout></Private>} />
              <Route path="/friends" element={<Private><Layout><Friends /></Layout></Private>} />
              <Route path="/profile/settings" element={<Private><Layout><Settings /></Layout></Private>} />

            </Routes>
          </Router>
        </WebSocketContextProvider>
      </AuthContextProvider>
    </div>
  );
}
