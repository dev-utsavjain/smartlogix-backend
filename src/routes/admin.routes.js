const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const { getStats, getAllUsers, getAllLoads } = require("../controllers/admin.controller");

router.get("/stats", auth, role(["ADMIN"]), getStats);
router.get("/users", auth, role(["ADMIN"]), getAllUsers);
router.get("/loads", auth, role(["ADMIN"]), getAllLoads);

module.exports = router;
