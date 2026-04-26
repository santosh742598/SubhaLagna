"use strict";

/**
 * @file SubhaLagna v3.2.5 — Notification Routes
 * @description   Route definitions for in-app notification management.
 *
 * Base path: /api/notifications
 *
 *   GET    /           → paginated notification list + unread count
 *   PUT    /read-all   → mark all as read
 *   PUT    /:id/read   → mark single notification as read
 *   DELETE /:id        → delete a notification
 * @author SubhaLagna Team
 * @version      3.2.5
 */

const express = require('express');
const router = express.Router();

const {
  getNotifications,
  markOneRead,
  markAllRead,
  deleteNotification,
} = require('../controllers/notificationController');

const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getNotifications);
router.put('/read-all', markAllRead); // MUST come before /:id
router.put('/:id/read', markOneRead);
router.delete('/:id', deleteNotification);

module.exports = router;
