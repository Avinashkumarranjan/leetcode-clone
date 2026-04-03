const redisClient = require("../config/redis");

const submitCodeRateLimiter = async (req, res, next) => {
  const userId = req.result?._id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const redisKey = `submit_cooldown:${userId}`;

  try {
    const exists = await redisClient.exists(redisKey);
    if (exists) {
      return res.status(429).json({
        error: "Please wait 10 seconds before submitting again"
      });
    }

    await redisClient.set(redisKey, "cooldown_active", {
      EX: 10,
      NX: true
    });

    return next();
  } catch (error) {
    console.error("Rate limiter error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = submitCodeRateLimiter;

