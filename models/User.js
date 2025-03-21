const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: function () {
      return this.role === "admin";
    },
  },
  role: {
    type: String,
    enum: ["admin", "student"],
    required: true,
  },
  rollNumber: {
    type: String,
    required: function () {
      return this.role === "student";
    },
    unique: function () {
      return this.role === "student";
    },
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  department: {
    type: String,
    required: function () {
      return this.role === "student";
    },
  },
  registeredCourses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  ],
});

module.exports = mongoose.model("User", userSchema);
