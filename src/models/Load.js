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
    
    // Address (Human readable)
    origin: {
      type: String,
      required: true
    },
    // GeoJSON for geospatial queries
    originLocation: {
      type: {
        type: String,
        enum: ["Point"]
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: "2dsphere"
      }
    },

    destination: {
      type: String,
      required: true
    },
    destinationLocation: {
      type: {
        type: String,
        enum: ["Point"]
      },
      coordinates: {
        type: [Number] // [longitude, latitude]
      }
    },

    vehicleTypeRequired: {
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
    
    // New fields for Phase 2
    distance: {
      type: Number // in km
    },
    ratePerKm: {
      type: Number
    },

    status: {
      type: String,
      enum: [
        "POSTED", 
        "MATCHED", 
        "ASSIGNED", 
        "IN_TRANSIT", 
        "DELIVERED", 
        "CLOSED", 
        "CANCELLED"
      ],
      default: "POSTED",
      index: true
    },
    
    pickupDate: {
      type: Date,
      required: true
    },

    history: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Indexes
loadSchema.index({ originLocation: "2dsphere" });
loadSchema.index({ status: 1 });

module.exports = mongoose.model("Load", loadSchema);