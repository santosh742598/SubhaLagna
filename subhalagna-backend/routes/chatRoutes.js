"use strict";

/**
 * @file SubhaLagna v3.1.0 — Chat Routes
 * @description   Route definitions for the real-time messaging system.
 *                REST endpoints for persistence; Socket.io handles real-time delivery.
 *
 * Base path: /api/chat
 *
 *   GET  /conversations                            → list all my conversations
 *   GET  /conversations/:conversationId/messages   → paginated message history
 *   POST /conversations/:conversationId/messages   → send a message (saved to DB)
 *   PUT  /conversations/:conversationId/read       → mark all messages as read
 * @author SubhaLagna Team
 * @version      3.1.0
 */

const express = require('express');
const router = express.Router();

const {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
} = require('../controllers/chatController');

const { protect } = require('../middleware/authMiddleware');

// All chat routes require authentication
router.use(protect);

router.get('/conversations', getConversations);
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/conversations/:conversationId/messages', sendMessage);
router.put('/conversations/:conversationId/read', markAsRead);

module.exports = router;
