import bcrypt from "bcrypt";
import { Codes, User } from "../models/userInfo.models.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const makeToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

const safeUser = (u) => ({
  _id: u._id,
  name: u.name,
  username: u.username,
  email: u.email,
  profileImage: u.profileImage,
});

export const checkCodeMatch = async (req, res) => {
  try {
    const { documentId, code } = req.body;
    if (!documentId || code === undefined) {
      return res
        .status(400)
        .json({ status: "error", message: "Missing documentId or code" });
    }

    const numCode = Number(code);
    if (Number.isNaN(numCode)) {
      return res
        .status(400)
        .json({ status: "error", message: "Code must be numeric" });
    }

    const doc = await Codes.findById(documentId).select("Codes").lean();
    if (!doc) {
      return res
        .status(404)
        .json({ status: "error", message: "Document not found" });
    }

    const arr = Array.isArray(doc.Codes) ? doc.Codes : [];
    const exists = arr.includes(numCode);
    return res.json({ status: "success", found: exists });
  } catch (error) {
    console.error("Error checking code match:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export const register = async (req, res) => {
  try {
    const { username, email, password, profile, name } = req.body;
    const oldUser = await User.findOne({ email });
    if (oldUser) {
      return res
        .status(409)
        .json({ status: "error", message: "User already exists" });
    }

    const encryptedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      username,
      email,
      password: encryptedPassword,
      profileImage: profile,
    });

    const token = makeToken({ email: user.email, sub: String(user._id) });
    return res
      .status(201)
      .json({ status: "success", data: token, user: safeUser(user) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: "Register failed" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const oldUser = await User.findOne({ email });
    if (!oldUser) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    const ok = await bcrypt.compare(password, oldUser.password);
    if (!ok) {
      return res
        .status(401)
        .json({ status: "error", message: "Invalid credentials" });
    }

    const token = makeToken({ email: oldUser.email, sub: String(oldUser._id) });
    return res
      .status(200)
      .json({ status: "success", data: token, user: safeUser(oldUser) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: "Login failed" });
  }
};
