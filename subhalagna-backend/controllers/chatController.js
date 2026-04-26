"use strict";

/**
 * @file SubhaLagna v3.2.4 — Chat Controller
 * @description   REST endpoints for the messaging system.
 *                Real-time delivery is handled separately by Socket.io
 *                (see socket/socketHandler.js). These REST endpoints handle:
 *                  - getConversations → list all conversations for current user
 *                  - getMessages      → paginated messages in a conversation
 *                  - sendMessage      → save message to DB (socket emits in real-time)
 *                  - markAsRead       → mark all messages in a conversation as read
 * @author        SubhaLagna Team
 * @version      3.2.4
 */

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Profile = require('../models/Profile');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all conversations for the logged-in user
// @route   GET /api/chat/conversations
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'name email')
      .sort({ lastMessageAt: -1 });

    // Enrich each conversation with the other user's profile photo
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const otherUser = conv.participants.find(
          (p) => p._id.toString() !== req.user._id.toString(),
        );
        const otherProfile = otherUser
          ? await Profile.findOne({ user: otherUser._id }).select('profilePhoto name location')
          : null;

        // Count unread messages in this conversation
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: req.user._id },
          isRead: false,
        });

        return { ...conv.toObject(), otherProfile, unreadCount };
      }),
    );

    return sendSuccess(res, enriched);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get paginated messages within a conversation
// @route   GET /api/chat/conversations/:conversationId/messages
// @access  Private (participant only)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 30 } = req.query;

    // Verify the user is a participant in this conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return sendError(res, 'Conversation not found', 404);

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString(),
    );
    if (!isParticipant) {
      return sendError(res, 'Not authorized to view this conversation', 403);
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [messages, total] = await Promise.all([
      Message.find({ conversation: conversationId })
        .populate('sender', 'name')
        .sort({ createdAt: -1 }) // newest first, frontend reverses for display
        .skip(skip)
        .limit(limitNum),
      Message.countDocuments({ conversation: conversationId }),
    ]);

    return sendPaginated(res, messages.reverse(), total, pageNum, limitNum);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Send a message (also updates conversation's lastMessage preview)
// @route   POST /api/chat/conversations/:conversationId/messages
// @access  Private (participant only)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) return sendError(res, 'Message content cannot be empty', 400);

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return sendError(res, 'Conversation not found', 404);

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString(),
    );
    if (!isParticipant) {
      return sendError(res, 'Not authorized to send messages here', 403);
    }

    // Save the message
    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      content: content.trim(),
    });

    // Update conversation preview
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: content.substring(0, 100),
      lastMessageAt: new Date(),
    });

    // Populate sender for response
    await message.populate('sender', 'name');

    // Create notification for the other participant
    const otherUserId = conversation.participants.find(
      (p) => p.toString() !== req.user._id.toString(),
    );

    if (otherUserId) {
      await Notification.create({
        recipient: otherUserId,
        sender: req.user._id,
        type: 'new_message',
        message: `${req.user.name}: ${content.substring(0, 60)}${content.length > 60 ? '...' : ''}`,
        link: `/chat/${conversationId}`,
      });
    }

    return sendSuccess(res, message, 'Message sent', 201);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Mark all unread messages in a conversation as read
// @route   PUT /api/chat/conversations/:conversationId/read
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const markAsRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user._id }, // only mark messages sent BY others
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      },
    );

    return sendSuccess(res, null, 'Messages marked as read');
  } catch (err) {
    next(err);
  }
};

module.exports = { getConversations, getMessages, sendMessage, markAsRead };
