import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import Admin from "../Models/Admin.js";

export const protectAdmin = asyncHandler(async (req, res, next) => {
  try {
    let token;

    // Check cookie first
    if (req.cookies && req.cookies.admin_jwt) {
      token = req.cookies.admin_jwt;
    } 
    // Check authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "Not authorized as admin, no token" 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET);
    
    // Check if token is admin type
    if (decoded.type !== 'admin') {
      return res.status(401).json({ 
        success: false,
        message: "Invalid admin token" 
      });
    }

    // Get admin from token
    const admin = await Admin.findById(decoded.adminId).select("-loginHistory");

    if (!admin) {
      return res.status(401).json({ 
        success: false,
        message: "Admin not found" 
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({ 
        success: false,
        message: "Admin account deactivated" 
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error("Admin Auth Middleware Error:", error.message);
    res.status(401).json({ 
      success: false,
      message: "Not authorized, token failed" 
    });
  }
});

export const requireSuperAdmin = asyncHandler(async (req, res, next) => {
  if (req.admin && req.admin.role === 'super_admin') {
    next();
  } else {
    res.status(403).json({ 
      success: false,
      message: "Access denied. Super admin role required." 
    });
  }
});