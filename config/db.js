const mongoose = require("mongoose");
require("dotenv").config(); // Load environment variables

const MONGO_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://Minha:894c5012@cluster0.epkwp.mongodb.net/management?retryWrites=true&w=majority";

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

module.exports = mongoose.connection;
