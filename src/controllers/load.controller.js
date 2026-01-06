const Load = require("../models/Load");
const TruckerProfile = require("../models/TruckerProfile");

// --- Helper for History ---
const updateStatus = (load, newStatus, userId) => {
  load.status = newStatus;
  load.history.push({
    status: newStatus,
    updatedBy: userId,
    timestamp: new Date()
  });
};

// --- Business Endpoints ---

exports.createLoad = async (req, res) => {
  try {
    const { 
      origin, destination, cargoType, weight, price, pickupDate, vehicleTypeRequired,
      originCoords, destinationCoords, distance 
    } = req.body;

    // Construct GeoJSON if coords provided (UI should send [lng, lat])
    // If not provided, we just rely on string address for now, but backend supports GeoJSON
    const originLocation = originCoords ? { type: "Point", coordinates: originCoords } : undefined;
    const destinationLocation = destinationCoords ? { type: "Point", coordinates: destinationCoords } : undefined;

    const newLoad = await Load.create({
      createdBy: req.user.id,
      origin,
      originLocation,
      destination,
      destinationLocation,
      cargoType,
      weight,
      price,
      pickupDate,
      vehicleTypeRequired,
      distance,
      status: "POSTED",
      history: [{ status: "POSTED", updatedBy: req.user.id }]
    });

    res.status(201).json(newLoad);
  } catch (err) {
    res.status(500).json({ message: "Failed to create load", error: err.message });
  }
};

exports.getMyLoads = async (req, res) => {
  try {
    const loads = await Load.find({ createdBy: req.user.id })
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });
    res.json(loads);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch loads", error: err.message });
  }
};

exports.assignTrucker = async (req, res) => {
  try {
    const { loadId } = req.params;
    const { truckerId } = req.body; // Business manually selects a trucker (if we had a list of applicants)
    
    // In this simplified flow, "MATCHED" means a trucker already accepted. 
    // So the business is confirming *that* trucker.
    
    const load = await Load.findById(loadId);
    if (!load) return res.status(404).json({ message: "Load not found" });

    // Business must own the load
    if (load.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (load.status !== "MATCHED") {
      return res.status(400).json({ message: "Load must be in MATCHED state to assign" });
    }

    // Use the trucker who accepted (stored in assignedTo temporarily or we confirm it now)
    // In our flow: Trucker 'accepts' -> MATCHED. We store that trucker in assignedTo?
    // Let's assume acceptLoad puts the trucker in assignedTo but status is MATCHED.
    
    updateStatus(load, "ASSIGNED", req.user.id);
    await load.save();

    res.json({ message: "Trucker confirmed. Load assigned.", load });
  } catch (err) {
    res.status(500).json({ message: "Failed to assign load", error: err.message });
  }
};

exports.cancelLoad = async (req, res) => {
  try {
    const { loadId } = req.params;
    const load = await Load.findById(loadId);
    
    if (!load) return res.status(404).json({ message: "Load not found" });
    if (load.createdBy.toString() !== req.user.id) return res.status(403).json({ message: "Not authorized" });

    if (!["POSTED", "MATCHED"].includes(load.status)) {
      return res.status(400).json({ message: "Cannot cancel load in progress" });
    }

    updateStatus(load, "CANCELLED", req.user.id);
    await load.save();
    res.json({ message: "Load cancelled", load });
  } catch (err) {
    res.status(500).json({ message: "Failed to cancel load", error: err.message });
  }
};

exports.closeLoad = async (req, res) => {
  try {
    const { loadId } = req.params;
    const load = await Load.findById(loadId);
    
    if (!load) return res.status(404).json({ message: "Load not found" });
    if (load.createdBy.toString() !== req.user.id) return res.status(403).json({ message: "Not authorized" });

    if (load.status !== "DELIVERED") {
      return res.status(400).json({ message: "Load must be delivered before closing" });
    }

    updateStatus(load, "CLOSED", req.user.id);
    await load.save();
    res.json({ message: "Load closed successfully", load });
  } catch (err) {
    res.status(500).json({ message: "Failed to close load", error: err.message });
  }
};


// --- Trucker Endpoints ---

exports.getAvailableLoads = async (req, res) => {
  try {
    const truckerProfile = await TruckerProfile.findOne({ userId: req.user.id });
    
    let query = { status: "POSTED" };
    
    // 1. Filter by vehicle/capacity
    if (truckerProfile) {
      query.weight = { $lte: truckerProfile.capacity };
      query.vehicleTypeRequired = truckerProfile.vehicleType;
      
      // 2. Geospatial query (Phase 2)
      // If trucker has location, find loads starting near them (e.g. 100km)
      if (truckerProfile.currentLocation && truckerProfile.currentLocation.coordinates && truckerProfile.currentLocation.coordinates.length === 2) {
         // Only if valid coords (not 0,0)
         const [lng, lat] = truckerProfile.currentLocation.coordinates;
         if (lng !== 0 || lat !== 0) {
             query.originLocation = {
                 $near: {
                     $geometry: { type: "Point", coordinates: [lng, lat] },
                     $maxDistance: 100000 // 100km
                 }
             };
         }
      }
    }

    const loads = await Load.find(query).sort({ createdAt: -1 }).limit(20);
    res.json(loads);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch available loads", error: err.message });
  }
};

exports.getMyJobs = async (req, res) => {
  try {
    const loads = await Load.find({ assignedTo: req.user.id }).sort({ updatedAt: -1 });
    res.json(loads);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch jobs", error: err.message });
  }
};

exports.acceptLoad = async (req, res) => {
  try {
    const { loadId } = req.params;
    const load = await Load.findById(loadId);
    
    if (!load) return res.status(404).json({ message: "Load not found" });

    if (load.status !== "POSTED") {
      return res.status(400).json({ message: "Load is not available" });
    }

    // Transition to MATCHED
    // We tentatively assign to this trucker
    load.assignedTo = req.user.id;
    updateStatus(load, "MATCHED", req.user.id);
    
    await load.save();
    res.json({ message: "Load accepted. Waiting for business approval.", load });
  } catch (err) {
    res.status(500).json({ message: "Failed to accept load", error: err.message });
  }
};

exports.pickupLoad = async (req, res) => {
  try {
    const { loadId } = req.params;
    const load = await Load.findById(loadId);
    
    if (!load) return res.status(404).json({ message: "Load not found" });
    if (String(load.assignedTo) !== req.user.id) return res.status(403).json({ message: "Not assigned to you" });

    if (load.status !== "ASSIGNED") {
      return res.status(400).json({ message: "Load must be ASSIGNED before pickup" });
    }

    updateStatus(load, "IN_TRANSIT", req.user.id);
    await load.save();
    res.json({ message: "Load picked up", load });
  } catch (err) {
    res.status(500).json({ message: "Failed to pickup load", error: err.message });
  }
};

exports.deliverLoad = async (req, res) => {
  try {
    const { loadId } = req.params;
    const load = await Load.findById(loadId);
    
    if (!load) return res.status(404).json({ message: "Load not found" });
    if (String(load.assignedTo) !== req.user.id) return res.status(403).json({ message: "Not assigned to you" });

    if (load.status !== "IN_TRANSIT") {
      return res.status(400).json({ message: "Load is not in transit" });
    }

    updateStatus(load, "DELIVERED", req.user.id);
    await load.save();
    res.json({ message: "Load delivered", load });
  } catch (err) {
    res.status(500).json({ message: "Failed to deliver load", error: err.message });
  }
};