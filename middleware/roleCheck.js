const User = require("../models/User")

// Check if user is an admin
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    if (user && user.role === "admin") {
      return next()
    }
    res.status(403).render("auth/error", { message: "Access denied. Admin privileges required." })
  } catch (error) {
    res.status(500).render("auth/error", { message: "Server error", error })
  }
}

// Check if user is a student
const isStudent = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    if (user && user.role === "student") {
      return next()
    }
    res.status(403).render("auth/error", { message: "Access denied. Student privileges required." })
  } catch (error) {
    res.status(500).render("auth/error", { message: "Server error", error })
  }
}

module.exports = {
  isAdmin,
  isStudent,
}

