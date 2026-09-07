const { ipKeyGenerator, rateLimit } = require("express-rate-limit");

const workoutWriteLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.auth?.userId || ipKeyGenerator(req),
  message: {
    error: "Too many workout write requests. Please try again in a minute.",
  },
});

module.exports = {
  workoutWriteLimiter,
};
