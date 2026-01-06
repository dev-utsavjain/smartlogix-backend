const Load = require("../models/Load");

// Create a new load
exports.createLoad = async (req, res) => {
  try {
    const { origin, destination, cargoType, weight, price, pickupDate } = req.body;

    const newLoad = await Load.create({
      createdBy: req.user.id,
      origin,
      destination,
      cargoType,
      weight,
      price,
      pickupDate
    });

    res.status(201).json(newLoad);
  } catch (err) {
    res.status(500).json({ message: "Failed to create load", error: err.message });
  }
};

// Get all loads created by the logged-in business
exports.getMyLoads = async (req, res) => {
  try {
    const loads = await Load.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    res.json(loads);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch loads", error: err.message });
  }
};

// Get all available loads (for truckers) - filtered by status PENDING
exports.getAvailableLoads = async (req, res) => {
  try {
    const loads = await Load.find({ status: "PENDING" }).sort({ createdAt: -1 });
    res.json(loads);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch available loads", error: err.message });
  }
};

// Accept a load (Trucker only)
exports.acceptLoad = async (req, res) => {
  try {
    const { loadId } = req.params;

    const load = await Load.findById(loadId);
    if (!load) {
      return res.status(404).json({ message: "Load not found" });
    }

    if (load.status !== "PENDING") {
      return res.status(400).json({ message: "Load is no longer available" });
    }

    load.status = "IN_TRANSIT";
    load.assignedTo = req.user.id;
    await load.save();

    res.json({ message: "Load accepted successfully", load });
  } catch (err) {
    res.status(500).json({ message: "Failed to accept load", error: err.message });
  }
};
