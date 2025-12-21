require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

/* ---------- Middleware ---------- */
app.use(cors());
app.use(express.json());

/* ---------- Routes ---------- */
app.use("/auth", require("./routes/auth.routes"));
app.use("/trucker", require("./routes/trucker.routes"));

/* ---------- Health Check ---------- */
app.get("/", (req, res) => {
  res.send("SmartLogix backend running");
});

/* ---------- Database Connection ---------- */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error("DB connection failed:", err);
    process.exit(1);
  });
