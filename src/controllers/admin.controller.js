const User = require("../models/User");
const Load = require("../models/Load");
const BusinessProfile = require("../models/BusinessProfile");
const TruckerProfile = require("../models/TruckerProfile");

exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalLoads = await Load.countDocuments();
    const businessUsers = await User.countDocuments({ role: "BUSINESS" });
    const truckerUsers = await User.countDocuments({ role: "TRUCKER" });

    res.json({
      totalUsers,
      totalLoads,
      businessUsers,
      truckerUsers
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch admin stats" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

exports.getAllLoads = async (req, res) => {
  try {
    const loads = await Load.find().populate("createdBy", "name email");
    res.json(loads);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch loads" });
  }
};
