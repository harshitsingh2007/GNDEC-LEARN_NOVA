import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema } = mongoose;

const adminSchema = new Schema(
  {
    // ─── Admin Identity ───────────────────────────────
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "super_admin"],
      default: "admin",
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    
    // ─── Admin Permissions ───────────────────────
    permissions: {
      canManageCourses: { type: Boolean, default: true },
      canManageStudents: { type: Boolean, default: true },
      canManageAssessments: { type: Boolean, default: true },
      canViewAnalytics: { type: Boolean, default: true },
      canManageAdmins: { type: Boolean, default: false },
    },

    // ─── Admin Activity Tracking ─────────────────
    lastLogin: { type: Date, default: Date.now },
    loginHistory: [
      {
        ipAddress: String,
        userAgent: String,
        loginAt: { type: Date, default: Date.now },
      }
    ],
    isActive: {
      type: Boolean,
      default: true,
    },

    // ─── Admin Profile ───────────────────────────
    fullName: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      default: "General",
    },
    phone: {
      type: String,
      default: "",
    },

    // ─── Security ────────────────────────────────
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    lastPasswordChange: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

//
// ─── PASSWORD HASHING ───────────────────────────────
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

//
// ─── METHODS ────────────────────────────────────────
adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

adminSchema.methods.recordLogin = function (ipAddress, userAgent) {
  this.lastLogin = new Date();
  this.loginHistory.unshift({
    ipAddress,
    userAgent,
    loginAt: new Date(),
  });
  
  // Keep only last 10 logins
  if (this.loginHistory.length > 10) {
    this.loginHistory = this.loginHistory.slice(0, 10);
  }
};

adminSchema.methods.getDashboardSummary = function () {
  return {
    _id: this._id,
    username: this.username,
    email: this.email,
    fullName: this.fullName,
    role: this.role,
    department: this.department,
    permissions: this.permissions,
    lastLogin: this.lastLogin,
    isActive: this.isActive,
  };
};

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;