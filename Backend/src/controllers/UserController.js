import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { generateAccessToken, generateRefreshToken } from "../token.js";
dotenv.config();
export const registerUser = async (req, res) => {
  try {
    const { name, email, mobile, password, role } = req.body;
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }
    const hashed = await bcrypt.hash(password, 10);

    const user = new User({ 
      name, 
      email, 
      mobile, 
      password: hashed,
      role: role || 'user' // Default to 'user' if not specified
    });
    await user.save();

    res.status(201).json({ 
      message: "User Registered Successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error.", data: error });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not exists" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Password" });
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id, user.role);

    // Set cookie expiration based on role
    // Admin: 365 days, User: 7 days
    const cookieMaxAge = user.role === 'admin' 
      ? 365 * 24 * 60 * 60 * 1000  // 365 days
      : 7 * 24 * 60 * 60 * 1000;   // 7 days

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      maxAge: cookieMaxAge,
    });
    res.status(200).json({
      message: "Login Successfull",
      accessToken,
      role: user.role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error });
  }
};

export const getUserDetails = async (req, res) => {
  try {
    // User info is now attached by middleware
    const user = await User.findOne({ _id: req.user.userId }).select('-password');
    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }
    res.status(200).json(user);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error });
  }
};
export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
      return res.status(401).json({ message: "Refresh token missing" });

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    const newAccessToken = generateAccessToken(user._id, user.role);
    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    return res
      .status(403)
      .json({ message: "Invalid or expired refresh token", error });
  }
};

// LOGOUT
export const logout = async (req, res) => {
  try {
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "Logout Successful" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

// GET ALL USERS (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ 
      count: users.length,
      users 
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

// DELETE USER (Admin only)
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

// UPDATE USER ROLE (Admin only)
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be 'user' or 'admin'" });
    }
    
    const user = await User.findByIdAndUpdate(
      userId, 
      { role }, 
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({ 
      message: "User role updated successfully",
      user 
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};
