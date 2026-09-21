import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE_URL } from '../services/api';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    let ioClient;
    try {
      const io = require('socket.io-client');
      ioClient = io(API_BASE_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        timeout: 10000
      });

      ioClient.on('connect', () => {
        console.log('⚡ Connected to LifeLink Real-Time Sockets:', ioClient.id);

        // Re-join rooms on every (re)connect using the persisted auth session.
        // This handles page refreshes and auto-reconnects after network drops.
        try {
          const donorRaw    = localStorage.getItem('donor');
          const hospitalRaw = localStorage.getItem('hospital');
          const userData    = donorRaw
            ? { ...JSON.parse(donorRaw),    role: 'donor'    }
            : hospitalRaw
              ? { ...JSON.parse(hospitalRaw), role: 'hospital' }
              : null;

          if (userData) {
            const userId = userData._id || userData.id;
            if (userId) {
              ioClient.emit('join_room', { userId, role: userData.role });
              console.log(`🏠 Emitted join_room for ${userData.role} [${userId}]`);
            }
          }
        } catch (err) {
          console.warn('Socket room-join error (non-blocking):', err);
        }
      });

      setSocket(ioClient);
    } catch (e) {
      console.warn('Socket.IO Client load error:', e);
    }

    return () => {
      if (ioClient) {
        ioClient.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};

/**
 * useJoinSocketRoom — Call this hook from any authenticated dashboard to
 * ensure the socket room-join fires whenever the user object or socket
 * connection changes (e.g. login after socket already connected).
 *
 * Usage:
 *   import { useJoinSocketRoom } from '../context/SocketContext';
 *   useJoinSocketRoom(socket, user);
 */
export const useJoinSocketRoom = (socket, user) => {
  useEffect(() => {
    if (!socket || !user) return;
    const userId = user._id || user.id;
    if (!userId) return;

    const emitJoin = () => {
      socket.emit('join_room', { userId, role: user.role });
      console.log(`🏠 Re-emitted join_room for ${user.role} [${userId}]`);
    };

    // Emit immediately if already connected
    if (socket.connected) {
      emitJoin();
    }

    // Also re-emit on reconnection
    socket.on('connect', emitJoin);
    return () => socket.off('connect', emitJoin);
  }, [socket, user?._id, user?.id, user?.role]);
};
