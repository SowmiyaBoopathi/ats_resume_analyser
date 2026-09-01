import jwt from "jsonwebtoken";
import dbPool from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_jwt_key_123!";
const JWT_EXPIRES_IN = "24h";

export const signup = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "All fields are required!" });

  try {
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    dbPool.query(
      "INSERT INTO ats_users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword],
      (err, result) => {
        if (err?.code === "ER_DUP_ENTRY")
          return res.status(409).json({ message: "Email already registered!" });
        if (err) return res.status(500).json({ message: "Server error during signup." });

        const newUser = { id: result.insertId, name, email };
        const token = jwt.sign(newUser, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        res.status(201).json({
          message: "Account created successfully!",
          token,
          user: newUser
        });
      }
    );
  } catch (error) {
    res.status(500).json({ message: "Server error during registration." });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required!" });

  dbPool.query("SELECT * FROM ats_users WHERE email = ?", [email], async (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (!result.length) return res.status(401).json({ message: "Invalid email or password!" });

    const user = result[0];
    try {
      const bcrypt = await import("bcryptjs");
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ message: "Invalid email or password!" });

      const { password: _, ...userInfo } = user;
      const token = jwt.sign(userInfo, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      res.status(200).json({
        message: "Login successful!",
        token,
        user: userInfo
      });
    } catch {
      res.status(500).json({ message: "Server error during authentication." });
    }
  });
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const email = req.user.email;

  if (!currentPassword || !newPassword)
    return res.status(400).json({ message: "All fields are required!" });

  dbPool.query("SELECT * FROM ats_users WHERE email = ?", [email], async (err, result) => {
    if (err || !result.length)
      return res.status(404).json({ message: "User not found." });

    const user = result[0];
    const bcrypt = await import("bcryptjs");
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ message: "Current password is incorrect!" });

    const hashed = await bcrypt.hash(newPassword, 10);
    dbPool.query("UPDATE ats_users SET password = ? WHERE email = ?", [hashed, email], (err) => {
      if (err) return res.status(500).json({ message: "Failed to update password." });
      res.status(200).json({ message: "Password updated successfully!" });
    });
  });
};