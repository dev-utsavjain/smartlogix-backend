// src/controllers/trucker.controller.js

const TruckerProfile = require("../models/TruckerProfile");

exports.upsertProfile = async (req, res) => {
  try {
    const { vehicleType, capacity, currentLocation, city, lat, lng } = req.body;

    const locationData = currentLocation || { city, lat, lng };

    const profile = await TruckerProfile.findOneAndUpdate(
      { userId: req.user.id },
      {
        vehicleType,
        capacity,
        currentLocation: locationData
      },
      { new: true, upsert: true }
    );

    res.json(profile);
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Profile update failed" });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const profile = await TruckerProfile.findOne({
      userId: req.user.id
    });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: "Error fetching profile" });
  }
};
