/**
 * @file        SubhaLagna v3.3.0 — Chat Context
 * @description   Manages the Socket.io connection and real-time chat state.
 *                Provides the socket instance and active message streams to
 *                all chat-related components.
 *
 *                Usage:
 *                  const { socket, joinConversation, messages, sendSocketMessage } =
 *                    useContext(ChatContext);
 * @author        SubhaLagna Team
 * @version      3.3.0
 */

import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { NotificationContext } from './NotificationContext';
import { SOCKET_URL } from '../config';

/**
 * @typedef {object} ChatContextValue
 * @property {import('socket.io-client').Socket|null} socket - Active socket instance
 * @property {boolean}  isConnected - Socket connection status
 * @property {object[]} messages    - Messages for the active conversation
 * @property {string|null} typingUser - Name of user currently typing
 * @property {Function} joinConversation - Join a conversation room
 * @property {Function} sendSocketMessage - Emit a message via socket
 * @property {Function} sendTyping - Emit typing indicator
 * @property {Function} stopTyping - Emit stop typing
 * @property {Function} setMessages - Directly set messages (for initial load)
 */

export const ChatContext = createContext(
  /** @type {ChatContextValue} */ ({
    socket: null,
    isConnected: false,
    messages: [],
    typingUser: null,
    joinConversation: () => {},
    sendSocketMessage: () => {},
    sendTyping: () => {},
    stopTyping: () => {},
    setMessages: () => {},
  }),
);

/**
 * ChatProvider — must be inside both AuthProvider and NotificationProvider.
 * @param root0
 * @param root0.children
 */
export const ChatProvider = ({ children }) => {
  const { token, isAuthenticated } = useContext(AuthContext);
  const { addRealtime } = useContext(NotificationContext);

  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const typingTimeoutRef = useRef(null);

  // ── Initialize Socket.io connection when user logs in ──────────────────────
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    // New message received via socket
    socket.on('new_message', (message) => {
      setMessages((prev) => {
        // 1. If this message ID already exists, ignore it
        if (prev.find((m) => m._id === message._id)) return prev;

        // 2. Look for a temporary message (sent by the current user with same content)
        const tempIndex = prev.findIndex(
          (m) =>
            m._id?.toString().startsWith('temp-') &&
            m.content === message.content &&
            (m.sender?._id === message.sender?._id || m.sender === message.sender?._id),
        );

        if (tempIndex !== -1) {
          // Replace the temporary message with the real one from the server
          const updated = [...prev];
          updated[tempIndex] = message;
          return updated;
        }

        // 3. Otherwise, just add the new message
        return [...prev, message];
      });
    });

    // Typing indicator
    socket.on('typing', ({ name }) => {
      setTypingUser(name);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
    });

    socket.on('stop_typing', () => {
      setTypingUser(null);
    });

    // Real-time push notification
    socket.on('notification', (notification) => {
      addRealtime(notification);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token, addRealtime]);

  /**
   * Join a conversation's Socket.io room.
   * Should be called when the user opens a specific conversation.
   * @param {string} conversationId
   */
  const joinConversation = useCallback((conversationId) => {
    socketRef.current?.emit('join_conversation', conversationId);
  }, []);

  /**
   * Emit a message via Socket.io (also triggers DB save server-side).
   * @param {string} conversationId
   * @param {string} content
   */
  const sendSocketMessage = useCallback((conversationId, content) => {
    socketRef.current?.emit('send_message', { conversationId, content });
  }, []);

  /**
   * Emit a typing indicator to the conversation room.
   * @param {string} conversationId
   */
  const sendTyping = useCallback((conversationId) => {
    socketRef.current?.emit('typing', { conversationId });
  }, []);

  /**
   * Emit a stop-typing event.
   * @param {string} conversationId
   */
  const stopTyping = useCallback((conversationId) => {
    socketRef.current?.emit('stop_typing', { conversationId });
  }, []);

  const value = {
    socket: socketRef.current,
    isConnected,
    messages,
    typingUser,
    joinConversation,
    sendSocketMessage,
    sendTyping,
    stopTyping,
    setMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
