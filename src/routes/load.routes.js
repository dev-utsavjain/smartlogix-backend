const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const { createLoad, getMyLoads, getAvailableLoads, acceptLoad } = require("../controllers/load.controller");

// Business: Post a load
router.post("/", auth, role(["BUSINESS"]), createLoad);

// Business: Get my posted loads
router.get("/my-loads", auth, role(["BUSINESS"]), getMyLoads);

// Trucker: Get available loads
router.get("/available", auth, role(["TRUCKER"]), getAvailableLoads);

// Trucker: Accept a load
router.patch("/:loadId/accept", auth, role(["TRUCKER"]), acceptLoad);

module.exports = router;
