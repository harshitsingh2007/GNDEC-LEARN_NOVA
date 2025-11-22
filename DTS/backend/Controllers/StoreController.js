import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import User from "../Models/User.js";
import StoreItem from "../Models/StoreSchema.js";
import Redemption from "../Models/Redemption.js";

//
// ─── AUTH HELPER ─────────────────────────────────
const authenticateUser = async (req) => {
  let token;

  if (req.cookies?.jwt) token = req.cookies.jwt;
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  )
    token = req.headers.authorization.split(" ")[1];

  if (!token) throw new Error("Not authorized, no token");

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.userId);
  if (!user) throw new Error("User not found");

  return user;
};

//
// ─── GET STORE ITEMS ─────────────────────────────
export const getStoreItems = asyncHandler(async (req, res) => {
  try {
    const user = await authenticateUser(req);
    const items = await StoreItem.find().sort({ createdAt: -1 });
    res.status(200).json({ userXP: user.xp, items });
  } catch (err) {
    console.error("❌ Store Fetch Error:", err.message);
    res.status(401).json({ message: err.message || "Unauthorized" });
  }
});

//
// ─── REDEEM ITEM ────────────────────────────────
export const redeemItem = asyncHandler(async (req, res) => {
  try {
    const user = await authenticateUser(req);
    const { itemId, shippingAddress } = req.body;

    const item = await StoreItem.findById(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (item.stock <= 0)
      return res.status(400).json({ message: "Out of stock" });

    if (user.xp < item.cost)
      return res.status(400).json({ message: "Not enough XP" });

    let trackingInfo = null;
    if (item.category === "Physical" || item.category === "Merch") {
      if (!shippingAddress)
        return res.status(400).json({ message: "Shipping address required" });

      trackingInfo = {
        trackingId: `TRK${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        status: "Processing",
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        shippingAddress,
        carrier: "Nova Logistics",
      };
    }

    const redemption = await Redemption.create({
      user: user._id,
      item: item._id,
      cost: item.cost,
      trackingInfo,
      status: trackingInfo ? "processing" : "delivered",
    });

    user.xp -= item.cost;
    await user.save();

    item.stock = Math.max(0, item.stock - 1);
    await item.save();

    res.status(200).json({
      message: `✅ Redeemed ${item.name} successfully!`,
      remainingXP: user.xp,
      trackingInfo,
      redemptionId: redemption._id,
    });
  } catch (err) {
    console.error("❌ Redeem Error:", err.message);
    res.status(401).json({ message: err.message || "Unauthorized" });
  }
});

export const getRedemptions = asyncHandler(async (req, res) => {
  try {
    const user = await authenticateUser(req);
    const redemptions = await Redemption.find({ user: user._id })
      .populate("item")
      .sort({ createdAt: -1 });

    res.status(200).json({ redemptions });
  } catch (err) {
    console.error("❌ Redemptions Fetch Error:", err.message);
    res.status(401).json({ message: err.message || "Unauthorized" });
  }
});

export const getTrackingInfo = asyncHandler(async (req, res) => {
  try {
    const user = await authenticateUser(req);
    const { redemptionId } = req.params;

    const redemption = await Redemption.findOne({
      _id: redemptionId,
      user: user._id,
    }).populate("item");

    if (!redemption)
      return res.status(404).json({ message: "Redemption not found" });

    res.status(200).json({ trackingInfo: redemption.trackingInfo });
  } catch (err) {
    console.error("❌ Tracking Fetch Error:", err.message);
    res.status(401).json({ message: err.message || "Unauthorized" });
  }
});
