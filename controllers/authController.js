const User = require("../models/User");

exports.getLoginPage = (req, res) => {
  res.render("auth/login");
};

exports.login = async (req, res) => {
  try {
    const { username, password, rollNumber } = req.body;
    let user;

    if (username && password) {
      // Admin login
      user = await User.findOne({ username, role: "admin" });

      if (!user || user.password !== password) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      req.session.user = {
        id: user._id,
        role: "admin",
        name: user.name, // Added 'name' property
      };

      return res.json({
        success: true,
        redirect: "/admin/dashboard",
      });
    }

    if (rollNumber) {
      // Student login
      user = await User.findOne({ rollNumber, role: "student" });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid roll number",
        });
      }

      req.session.user = {
        id: user._id,
        role: "student",
        name: user.name, // Added 'name' property
      };

      return res.json({
        success: true,
        redirect: "/student/dashboard",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid login attempt",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
    }
    res.redirect("/");
  });
};
