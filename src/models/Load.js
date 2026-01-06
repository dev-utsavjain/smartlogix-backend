const mongoose = require("mongoose");

const loadSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    origin: {
      type: String,
      required: true
    },
    destination: {
      type: String,
      required: true
    },
    cargoType: {
      type: String,
      required: true
    },
    weight: {
      type: Number, // in kg or tons
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["PENDING", "IN_TRANSIT", "DELIVERED", "CANCELLED"],
      default: "PENDING"
    },
    pickupDate: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Load", loadSchema);
