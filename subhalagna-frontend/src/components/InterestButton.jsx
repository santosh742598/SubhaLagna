/**
 * @file        SubhaLagna v3.0.8 — Interest Button Component
 * @description   Smart button that shows the current interest status between
 *                the logged-in user and a profile owner. States:
 *                  - No interest    → "Send Interest" button
 *                  - Sent (pending) → "Interest Sent" (withdrawable)
 *                  - Accepted       → "Start Chat" button
 *                  - Rejected       → "Not Available" (disabled)
 *                  - Received       → "Respond" (accept/reject)
 *
 *                Fetches current status on mount. Handles all transitions.
 *
 * @author        SubhaLagna Team
 * @version      3.0.8
 */

import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  sendInterest,
  respondToInterest,
  getInterestStatus,
  withdrawInterest,
} from '../services/interestService';

// ── Icon helpers ──────────────────────────────────────────────────────────────

const HeartIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
    />
  </svg>
);

const ChatIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
);

const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────

/**
 * InterestButton — shows contextual interest action buttons.
 *
 * @param {object}  props
 * @param {string}  props.receiverUserId  - MongoDB ObjectId of the profile owner's user account
 * @param {string}  [props.conversationId] - Conversation ID (populated after acceptance)
 * @param {boolean} [props.compact=false]  - Compact mode for card view
 */
const InterestButton = ({ receiverUserId, compact = false }) => {
  const navigate = useNavigate();

  // Normalize ID: handle both string IDs and populated user objects
  const targetUserId = typeof receiverUserId === 'object' ? receiverUserId._id : receiverUserId;

  const [status, setStatus] = useState(null); // 'pending'|'accepted'|'rejected'|null
  const [isMe, setIsMe] = useState(false); // Did I send it?
  const [interestId, setInterestId] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [bursts, setBursts] = useState([]); // For heart particles

  // ── Fetch current interest status on mount ────────────────────────────────
  useEffect(() => {
    if (!targetUserId) return;

    const fetchStatus = async () => {
      try {
        const data = await getInterestStatus(targetUserId);
        setStatus(data.status);
        setIsMe(data.isMe);
        setInterestId(data.interest?._id || null);
      } catch {
        // Silently fail — button simply shows "Send Interest"
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [receiverUserId]);

  // ── Action Handlers ────────────────────────────────────────────────────────

  const handleSendInterest = async () => {
    setActionLoading(true);
    try {
      const interest = await sendInterest(targetUserId, message);
      setStatus('pending');
      setIsMe(true);
      setInterestId(interest._id);

      // Trigger Heart Burst
      const newBurst = Array.from({ length: 8 }).map((_, i) => ({
        id: Date.now() + i,
        left: Math.random() * 80 - 40, // spread
        delay: Math.random() * 0.2,
        scale: Math.random() * 0.5 + 0.5,
      }));
      setBursts(newBurst);
      setTimeout(() => setBursts([]), 1500); // Cleanup
    } catch (err) {
      alert(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!window.confirm('Withdraw this interest?')) return;
    setActionLoading(true);
    try {
      await withdrawInterest(interestId);
      setStatus(null);
      setIsMe(false);
      setInterestId(null);
    } catch (err) {
      alert(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRespond = async (newStatus) => {
    setActionLoading(true);
    try {
      const { interest, conversation } = await respondToInterest(interestId, newStatus);
      setStatus(newStatus);
      if (conversation) setConversationId(conversation._id);
    } catch (err) {
      alert(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenChat = () => {
    if (conversationId) navigate(`/chat/${conversationId}`);
  };

  // ── Loading State ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className={`${compact ? 'w-28 h-8' : 'w-36 h-10'} bg-gray-100 rounded-xl animate-pulse`}
      />
    );
  }

  // ── Render by Status ──────────────────────────────────────────────────────
  const baseClass = compact
    ? 'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all'
    : 'flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all';

  // No interest yet
  if (!status) {
    return (
      <button
        onClick={handleSendInterest}
        disabled={actionLoading}
        className={`${baseClass} bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600 shadow-lg shadow-rose-200 hover:-translate-y-0.5`}
        id={`send-interest-${receiverUserId}`}
      >
        <HeartIcon className={compact ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
        {actionLoading ? 'Sending...' : 'Send Interest'}

        {/* Heart Burst Particles */}
        {bursts.map((b) => (
          <div
            key={b.id}
            className="absolute pointer-events-none text-rose-400"
            style={{
              left: `calc(50% + ${b.left}px)`,
              top: '0',
              animation: `heart-burst 1s ease-out ${b.delay}s forwards`,
              transform: `scale(${b.scale})`,
            }}
          >
            <HeartIcon className="w-5 h-5 fill-current" />
          </div>
        ))}
      </button>
    );
  }

  // Sent by me — pending
  if (status === 'pending' && isMe) {
    return (
      <button
        onClick={handleWithdraw}
        disabled={actionLoading}
        className={`${baseClass} bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100`}
        id={`withdraw-interest-${receiverUserId}`}
      >
        <CheckIcon className={compact ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
        {actionLoading ? 'Withdrawing...' : 'Interest Sent'}
      </button>
    );
  }

  // Received from them — show accept/reject
  if (status === 'pending' && !isMe) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleRespond('accepted')}
          disabled={actionLoading}
          className={`${baseClass} bg-emerald-500 text-white hover:bg-emerald-600`}
        >
          ✓ Accept
        </button>
        <button
          onClick={() => handleRespond('rejected')}
          disabled={actionLoading}
          className={`${baseClass} bg-gray-100 text-gray-600 hover:bg-gray-200`}
        >
          ✕ Decline
        </button>
      </div>
    );
  }

  // Accepted — show Chat button
  if (status === 'accepted') {
    return (
      <button
        onClick={handleOpenChat}
        className={`${baseClass} bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-200`}
        id={`chat-btn-${receiverUserId}`}
      >
        <ChatIcon className={compact ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
        Start Chat
      </button>
    );
  }

  // Rejected
  if (status === 'rejected') {
    return (
      <button disabled className={`${baseClass} bg-gray-100 text-gray-400 cursor-not-allowed`}>
        Not Available
      </button>
    );
  }

  // Withdrawn — same as no interest
  return (
    <button
      onClick={handleSendInterest}
      disabled={actionLoading}
      className={`${baseClass} bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600`}
    >
      <HeartIcon className={compact ? 'w-3.5 h-3.5' : 'w-5 h-5'} />
      {actionLoading ? 'Sending...' : 'Send Interest'}
    </button>
  );
};

export default InterestButton;
