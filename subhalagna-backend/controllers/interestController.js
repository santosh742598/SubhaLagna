"use strict";

/**
 * @file        SubhaLagna v3.0.7 — Interest Controller
 * @description   Manages the interest/connection request system:
 *                - Handles sending, accepting, and rejecting interests.
 *                - Automated Conversation creation upon interest acceptance.
 *                - Integrated with Notification system for real-time alerts.
 *                - [v3.0.0 changes]
 *                - Upgraded to Version 3.0.0.
 *                - Implemented strict JSDoc validation and standard headers.
 *                - Standardized security checks for interest ownership.
 *                - Verified Express 5 compatibility for nested population.
 * @author        SubhaLagna Team
 * @version      3.0.7
 */

const Interest = require('../models/Interest');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Profile = require('../models/Profile');
const { sendInterestNotificationEmail } = require('../utils/emailService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Send an interest to another user
// @route   POST /api/interests
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const sendInterest = async (req, res, next) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user._id;

    // Prevent self-interest
    if (senderId.toString() === receiverId.toString()) {
      return sendError(res, 'You cannot send an interest to yourself', 400);
    }

    // Verify receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) return sendError(res, 'User not found', 404);

    // Check for existing interest (compound unique index enforces this, but better UX here)
    const existing = await Interest.findOne({ sender: senderId, receiver: receiverId });
    if (existing) {
      return sendError(res, `You have already sent an interest (status: ${existing.status})`, 409);
    }

    // Create the interest
    const interest = await Interest.create({
      sender: senderId,
      receiver: receiverId,
      message: message || '',
    });

    // ── Create in-app notification ─────────────────────────────────────────
    await Notification.create({
      recipient: receiverId,
      sender: senderId,
      type: 'new_interest',
      message: `${req.user.name} sent you an interest 💌`,
      link: `/profile/${senderId}`,
    });

    // ── Send email notification (non-blocking) ─────────────────────────────
    const senderProfile = await Profile.findOne({ user: senderId });
    sendInterestNotificationEmail(
      receiver.email,
      receiver.name,
      senderProfile?.name || req.user.name,
    ).catch((e) => console.error('Interest email failed:', e.message));

    return sendSuccess(res, interest, 'Interest sent successfully', 201);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Accept or reject a received interest
// @route   PUT /api/interests/:id
// @access  Private (receiver only)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const respondInterest = async (req, res, next) => {
  try {
    const { status } = req.body; // 'accepted' | 'rejected'

    if (!['accepted', 'rejected'].includes(status)) {
      return sendError(res, 'Status must be "accepted" or "rejected"', 400);
    }

    const interest = await Interest.findById(req.params.id);
    if (!interest) return sendError(res, 'Interest not found', 404);

    // Only the receiver can respond
    if (interest.receiver.toString() !== req.user._id.toString()) {
      return sendError(res, 'Not authorized to respond to this interest', 403);
    }

    if (interest.status !== 'pending') {
      return sendError(res, `This interest has already been ${interest.status}`, 400);
    }

    interest.status = status;
    interest.respondedAt = new Date();
    await interest.save();

    let conversation = null;

    // ── On acceptance: create a conversation ──────────────────────────────
    if (status === 'accepted') {
      // Check if conversation already exists (edge case)
      const existingConvo = await Conversation.findOne({
        participants: { $all: [interest.sender, interest.receiver] },
      });

      if (!existingConvo) {
        conversation = await Conversation.create({
          participants: [interest.sender, interest.receiver],
          interest: interest._id,
        });
      } else {
        conversation = existingConvo;
      }
    }

    // ── Notify the original sender ─────────────────────────────────────────
    await Notification.create({
      recipient: interest.sender,
      sender: req.user._id,
      type: status === 'accepted' ? 'interest_accepted' : 'interest_rejected',
      message:
        status === 'accepted'
          ? `${req.user.name} accepted your interest! You can now chat 🎉`
          : `${req.user.name} has declined your interest`,
      link: status === 'accepted' ? `/chat/${conversation?._id}` : null,
    });

    return sendSuccess(
      res,
      { interest, conversation },
      status === 'accepted' ? 'Interest accepted! You can now chat.' : 'Interest rejected.',
    );
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get sent or received interests for the logged-in user
// @route   GET /api/interests?type=sent|received&status=pending
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const getMyInterests = async (req, res, next) => {
  try {
    const { type = 'received', status } = req.query;

    // Build query based on direction
    const query = type === 'sent' ? { sender: req.user._id } : { receiver: req.user._id };

    if (status) query.status = status;

    const interests = await Interest.find(query)
      .populate({
        path: type === 'sent' ? 'receiver' : 'sender',
        select: 'name',
        // Also populate their profile photo
      })
      .sort({ createdAt: -1 });

    // Enrich with profile photos
    const enriched = await Promise.all(
      interests.map(async (interest) => {
        const otherUserId = type === 'sent' ? interest.receiver?._id : interest.sender?._id;
        const profile = await Profile.findOne({ user: otherUserId }).select(
          'profilePhoto name location',
        );
        return { ...interest.toObject(), otherProfile: profile };
      }),
    );

    return sendSuccess(res, enriched);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Withdraw a sent interest (only if still pending)
// @route   DELETE /api/interests/:id
// @access  Private (sender only)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Handles the requested operation.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const withdrawInterest = async (req, res, next) => {
  try {
    const interest = await Interest.findById(req.params.id);
    if (!interest) return sendError(res, 'Interest not found', 404);

    // Only the original sender can withdraw
    if (interest.sender.toString() !== req.user._id.toString()) {
      return sendError(res, 'Not authorized to withdraw this interest', 403);
    }

    if (interest.status !== 'pending') {
      return sendError(res, 'Only pending interests can be withdrawn', 400);
    }

    interest.status = 'withdrawn';
    await interest.save();

    return sendSuccess(res, null, 'Interest withdrawn');
  } catch (err) {
    next(err);
  }
};

/**
 * Check interest status between current user and a specific profile owner.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
const getInterestStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    const interest = await Interest.findOne({
      $or: [
        { sender: myId, receiver: userId },
        { sender: userId, receiver: myId },
      ],
    });

    return sendSuccess(res, {
      status: interest?.status || null,
      isMe: interest?.sender.toString() === myId.toString(),
      interest: interest || null,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  sendInterest,
  respondInterest,
  getMyInterests,
  withdrawInterest,
  getInterestStatus,
};
