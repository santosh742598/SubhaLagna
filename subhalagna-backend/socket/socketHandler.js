"use strict";

/**
 * @file SubhaLagna v3.3.5 — Socket.io Real-Time Handler
 * @description   Manages all WebSocket connections for the live chat feature.
 *                Architecture:
 *                  - Each authenticated user joins a private room named by their userId
 *                  - Chat rooms are named by conversationId
 *                  - Messages are saved to DB via REST; socket emits the saved doc to receivers
 *                  - Typing indicators are ephemeral (not stored in DB)
 *
 *                Events (client → server):
 *                  join_conversation  : join a conversation room
 *                  send_message       : emit a message to conversation room
 *                  typing             : broadcast typing indicator
 *                  stop_typing        : stop typing indicator
 *                  mark_read          : mark messages read
 *
 *                Events (server → client):
 *                  new_message        : new message received
 *                  typing             : other user is typing
 *                  stop_typing        : other user stopped typing
 *                  messages_read      : messages marked as read (with count)
 *                  notification       : real-time notification push
 * @author        SubhaLagna Team
 * @version      3.3.5
 */

const { verifyAccessToken } = require('../utils/generateToken');
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

/**
 * Initialize all Socket.io event handlers.
 * @param {import('socket.io').Server} io - The Socket.io server instance
 */
const socketHandler = (io) => {
  // ── Middleware: Authenticate socket connection via JWT ──────────────────────
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id).select('name email role isSuspended');

      if (!user || user.isSuspended) {
        return next(new Error('Not authorized'));
      }

      // Attach user to socket for use in event handlers
      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  // ── On Connection ───────────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.user.name} (${socket.id})`);

    // Each user joins their own private room (for direct notifications)
    socket.join(`user:${socket.user._id}`);

    // ── Event: Join a conversation room ──────────────────────────────────────
    socket.on('join_conversation', async (conversationId) => {
      try {
        // Verify the user is a participant
        const conv = await Conversation.findById(conversationId);
        if (!conv) return;

        const isParticipant = conv.participants.some(
          (p) => p.toString() === socket.user._id.toString(),
        );

        if (isParticipant) {
          socket.join(`conversation:${conversationId}`);
          console.log(`💬 ${socket.user.name} joined conversation ${conversationId}`);
        }
      } catch (err) {
        console.error('join_conversation error:', err.message);
      }
    });

    // ── Event: Send a message ─────────────────────────────────────────────────
    socket.on('send_message', async ({ conversationId, content }) => {
      try {
        if (!content?.trim()) return;

        // Save to DB
        const message = await Message.create({
          conversation: conversationId,
          sender: socket.user._id,
          content: content.trim(),
        });

        // Update conversation preview
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: content.substring(0, 100),
          lastMessageAt: new Date(),
        });

        await message.populate('sender', 'name');

        // Broadcast to everyone in the conversation room (including sender for confirmation)
        io.to(`conversation:${conversationId}`).emit('new_message', message);
      } catch (err) {
        console.error('send_message error:', err.message);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ── Event: Typing indicator ────────────────────────────────────────────────
    socket.on('typing', ({ conversationId }) => {
      // Broadcast to everyone in the room EXCEPT the sender
      socket.to(`conversation:${conversationId}`).emit('typing', {
        userId: socket.user._id,
        name: socket.user.name,
      });
    });

    // ── Event: Stop typing ─────────────────────────────────────────────────────
    socket.on('stop_typing', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('stop_typing', {
        userId: socket.user._id,
      });
    });

    // ── Event: Mark messages as read ──────────────────────────────────────────
    socket.on('mark_read', async ({ conversationId }) => {
      try {
        const now = new Date();

        // Mark all unread messages from OTHER users in this conversation as read
        const result = await Message.updateMany(
          {
            conversation: conversationId,
            sender: { $ne: socket.user._id },
            isRead: false,
          },
          { isRead: true, readAt: now },
        );

        // Notify the conversation room so the sender can update their UI
        if (result.modifiedCount > 0) {
          socket.to(`conversation:${conversationId}`).emit('messages_read', {
            conversationId,
            readBy: socket.user._id,
            readAt: now,
            count: result.modifiedCount,
          });
        }
      } catch (err) {
        console.error('mark_read error:', err.message);
      }
    });

    // ── On Disconnect ──────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.user.name} (reason: ${reason})`);
    });
  });

  // ── Global error handler for socket ──────────────────────────────────────────
  io.engine.on('connection_error', (err) => {
    console.error('Socket.io engine error:', err.message);
  });
};

/**
 * Emit a real-time notification to a specific user (called from controllers).
 * The user must be connected for this to deliver; otherwise it's a no-op.
 * @param {import('socket.io').Server} io - The Socket.io server instance.
 * @param {string} userId - ID of the user to receive the notification.
 * @param {object} notification - The notification object to send.
 */
const emitNotification = (io, userId, notification) => {
  io.to(`user:${userId}`).emit('notification', notification);
};

module.exports = socketHandler;
module.exports.emitNotification = emitNotification;
