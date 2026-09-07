const { verifyToken } = require("@clerk/backend");

function getBearerToken(req) {
  const header = req.headers.authorization;

  if (!header || typeof header !== "string") {
    return null;
  }

  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

async function requireAuth(req, res, next) {
  const secretKey = process.env.CLERK_SECRET_KEY;

  if (!secretKey) {
    return res.status(500).json({
      error: "Server auth is not configured",
    });
  }

  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({
      error: "Authorization token is required",
    });
  }

  try {
    const sessionClaims = await verifyToken(token, { secretKey });
    const userId = sessionClaims?.sub;

    if (!userId) {
      return res.status(401).json({
        error: "Invalid authentication token",
      });
    }

    req.auth = {
      userId,
      sessionClaims,
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired authentication token",
    });
  }
}

module.exports = {
  requireAuth,
};
