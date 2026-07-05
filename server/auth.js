import jwt from "jsonwebtoken";

function secret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }
  return process.env.JWT_SECRET;
}

export function createToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name },
    secret(),
    { expiresIn: "7d" }
  );
}

export function requireAuth(req, res, next) {
  const value = req.headers.authorization || "";
  const token = value.startsWith("Bearer ") ? value.slice(7) : "";

  try {
    const payload = jwt.verify(token, secret());
    req.user = { id: payload.sub, email: payload.email, name: payload.name };
    next();
  } catch {
    res.status(401).json({ error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." });
  }
}
