import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import db from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_jwt_key_123!";
const JWT_EXPIRES_IN = "24h";

export const signup = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required!" });
  }

  try {
    const [existingUsers] = await db.query("SELECT id FROM users WHERE email = ?", [email]);

    if (existingUsers.length > 0) {
      return res.status(409).json({ success: false, message: "Email already registered!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );

    const newUser = { id: result.insertId, name, email };
    const token = jwt.sign(newUser, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.status(201).json({
      success: true,
      message: "Account created successfully!",
      token,
      user: newUser
    });
  } catch (error) {
    console.error("Signup Error:", error);
    return res.status(500).json({ success: false, message: "Server error during signup." });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required!" });
  }

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    if (rows.length === 0 || !(await bcrypt.compare(password, rows[0].password))) {
      return res.status(401).json({ message: "Invalid email or password!" });
    }

    const { password: _, ...userInfo } = rows[0];
    const token = jwt.sign(userInfo, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.status(200).json({
      success: true,
      message: "Login successful!",
      token,
      user: userInfo
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Database error" });
  }
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  try {
    const email = req.user.email;
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    if (rows.length === 0 || !(await bcrypt.compare(currentPassword, rows[0].password))) {
      return res.status(401).json({ message: "Invalid current password." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);

    return res.status(200).json({ message: "Password updated successfully!" });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ message: "Failed to update password." });
  }
};