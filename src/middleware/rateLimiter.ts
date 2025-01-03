import rateLimit from 'express-rate-limit';

export const visionBoardLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 2, // 2 requests per window
  message: {
    error: 'Too many vision board requests. Please wait a minute before trying again.',
    nextAllowedRequest: '', // This will be populated automatically
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many vision board requests. Please wait a minute before trying again.',
      nextAllowedRequest: res.getHeader('RateLimit-Reset'),
    });
  },
}); 