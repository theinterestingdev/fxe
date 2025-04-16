import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { patchSocketForSafety } from '../utils/socketDebounce';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const { isLoggedIn, userId } = useAuth();

  useEffect(() => {
    let socketInstance = null;

    
    if (isLoggedIn && userId) {
      console.log('Initializing socket connection for user:', userId);
      
      if (socketInstance) {
        console.log('Socket instance already exists, cleaning up first');
        socketInstance.disconnect();
      }
      
      
      socketInstance = io('http://localhost:5000', {
        auth: { token: localStorage.getItem('token') },
        query: { userId },
        transports: ['websocket'],
        reconnectionAttempts: 15,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });
      
      // Add the safety patch
      patchSocketForSafety(socketInstance);
      
      // Set up event listeners
      socketInstance.on('connect', () => {
        console.log('Socket connected successfully with ID:', socketInstance.id);
        setIsConnected(true);
        setConnectionError(null);
        
        // Register the user with the socket server
        socketInstance.emit('registerUser', userId);
        console.log('User registered with socket server:', userId);
        
        // Debug info about socket state
        console.log('Socket state after connection:', {
          id: socketInstance.id,
          connected: socketInstance.connected,
          disconnected: socketInstance.disconnected
        });
      });
      
      socketInstance.on('disconnect', (reason) => {
        console.log('Socket disconnected, reason:', reason);
        setIsConnected(false);
        
        
        if (reason === 'io server disconnect') {
          setTimeout(() => {
            if (socketInstance) {
              console.log('Attempting to reconnect after server disconnect...');
              socketInstance.connect();
            }
          }, 2000);
        }
        
        // If the client closed the connection, we don't need to attempt reconnection
        if (reason === 'io client disconnect') {
          console.log('Client initiated disconnect, not attempting reconnect');
        }
      });
      
      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        setConnectionError(error.message);
        
        // Try to reconnect with backoff
        setTimeout(() => {
          if (socketInstance && !socketInstance.connected) {
            console.log('Attempting to reconnect after connection error...');
            socketInstance.connect();
          }
        }, 3000);
      });
      
      socketInstance.on('reconnect', (attemptNumber) => {
        console.log(`Socket reconnected after ${attemptNumber} attempts`);
        setIsConnected(true);
        setConnectionError(null);
        
        // Re-register user after reconnection
        socketInstance.emit('registerUser', userId);
      });
      
      socketInstance.on('reconnect_attempt', (attemptNumber) => {
        console.log(`Socket reconnection attempt #${attemptNumber}`);
      });
      
      socketInstance.on('reconnect_error', (error) => {
        console.error('Socket reconnection error:', error.message);
        setConnectionError(error.message);
      });
      
      socketInstance.on('reconnect_failed', () => {
        console.error('Socket failed to reconnect');
        setConnectionError('Failed to reconnect after multiple attempts');
      });
      
      // Handle session replacement (logged in elsewhere)
      socketInstance.on('connectionReplaced', (data) => {
        console.warn('Socket connection replaced:', data.message);
        setConnectionError('Your session is active elsewhere. This connection has been closed.');
        
        // Display a notification or toast to the user explaining why they were disconnected
        if (window.confirm('Your account is now active in another session. Would you like to reconnect and disconnect other sessions?')) {
          // If user confirms, try to reclaim the session
          socketInstance.disconnect();
          setTimeout(() => {
            socketInstance.connect();
            socketInstance.emit('registerUser', userId);
          }, 1000);
        } else {
          // If user doesn't want to reconnect, just keep disconnected
          socketInstance.disconnect();
        }
      });
      
      // Periodic ping to keep connection alive
      const pingInterval = setInterval(() => {
        if (socketInstance.connected) {
          console.log('Sending ping to keep connection alive');
          socketInstance.emit('ping');
        } else {
          console.log('Cannot ping - socket not connected');
          // Try to reconnect if socket is not connected
          if (!socketInstance.connecting) {
            console.log('Attempting to reconnect on ping fail...');
            socketInstance.connect();
          }
        }
      }, 30000); // Every 30 seconds
      
      // Set the socket instance in state
      setSocket(socketInstance);
      
      return () => {
        clearInterval(pingInterval);
        console.log('Cleaning up socket connection');
        if (socketInstance) {
          socketInstance.disconnect();
          setSocket(null);
        }
      };
    }
    
    // When logged out, ensure socket is disconnected
    if (!isLoggedIn && socket) {
      console.log('User logged out, disconnecting socket');
      socket.disconnect();
      setSocket(null);
    }
  }, [isLoggedIn, userId]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, connectionError }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext); 