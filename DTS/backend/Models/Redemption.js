import mongoose from "mongoose";

const { Schema } = mongoose;

const redemptionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    item: {
      type: Schema.Types.ObjectId,
      ref: "StoreItem",
      required: true,
    },
    cost: {
      type: Number,
      required: true,
    },
    trackingInfo: {
      trackingId: String,
      status: {
        type: String,
        enum: ["Processing", "Shipped", "Out for Delivery", "Delivered"],
        default: "Processing",
      },
      estimatedDelivery: String,
      shippingAddress: {
        fullName: String,
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
        phone: String,
      },
      carrier: {
        type: String,
        default: "Nova Logistics",
      },
    },
    status: {
      type: String,
      enum: ["processing", "shipped", "delivered"],
      default: "processing",
    },
    redeemedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Redemption = mongoose.model("Redemption", redemptionSchema);

export default Redemption;
