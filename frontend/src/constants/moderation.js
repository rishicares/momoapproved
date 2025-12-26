// Moderation reason codes (matching backend)
export const REASON_CODES = {
  MOMO: 'MOMO',
  OTHER_FOOD: 'OTHER_FOOD',
  NOT_FOOD: 'NOT_FOOD',
  HUMAN_DETECTED: 'HUMAN_DETECTED',
  UNSAFE_CONTENT: 'UNSAFE_CONTENT'
};

// Human-friendly messages
export const REASON_MESSAGES = {
  [REASON_CODES.MOMO]: 'Delicious momo detected! ✓',
  [REASON_CODES.OTHER_FOOD]: 'This appears to be food, but not momo',
  [REASON_CODES.NOT_FOOD]: 'This doesn\'t appear to be food',
  [REASON_CODES.HUMAN_DETECTED]: 'Human face detected in image',
  [REASON_CODES.UNSAFE_CONTENT]: 'Inappropriate or unsafe content detected'
};

/**
 * Get human-friendly message for a reason code
 * @param {string} reasonCode - The reason code from backend
 * @returns {string} Human-friendly message
 */
export function getReasonMessage(reasonCode) {
  return REASON_MESSAGES[reasonCode] || reasonCode || 'Unknown reason';
}

// Status codes
export const STATUS = {
  APPROVED: 'APPROVED',
  BLURRED: 'BLURRED',
  BLOCKED: 'BLOCKED',
  PROCESSING: 'PROCESSING'
};
