import mongoose from "mongoose";
const { Schema } = mongoose;

const storeItemSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    cost: { type: Number, required: true }, // XP cost
    stock: { type: Number, default: 100 },
    category: { type: String, default: "Merch" },
  },
  { timestamps: true }
);

const StoreItem = mongoose.model("StoreItem", storeItemSchema);
export default StoreItem;