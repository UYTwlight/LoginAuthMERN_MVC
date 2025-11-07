import express from 'express';
import { 
  getUserDetails, 
  loginUser, 
  logout, 
  refreshAccessToken, 
  registerUser,
  getAllUsers,
  deleteUser,
  updateUserRole
} from '../controllers/UserController.js';
import { verifyToken, isAdmin, isUser } from '../middleware/auth.js';

const router=express.Router();

// Public routes
router.post("/register",registerUser);
router.post("/login",loginUser);
router.post("/logout",logout);
router.get("/refresh",refreshAccessToken);

// Protected routes (requires authentication)
router.get("/getUserDetails", verifyToken, isUser, getUserDetails);

// Admin only routes
router.get("/users", verifyToken, isAdmin, getAllUsers);
router.delete("/users/:userId", verifyToken, isAdmin, deleteUser);
router.patch("/users/:userId/role", verifyToken, isAdmin, updateUserRole);

export default router;