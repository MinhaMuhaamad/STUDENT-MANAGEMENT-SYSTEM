const express = require("express")
const router = express.Router()
const studentController = require("../controllers/studentController")
const { isAuthenticated } = require("../middleware/auth")
const { isStudent } = require("../middleware/roleCheck")

// Apply middleware to all student routes
router.use(isAuthenticated)
router.use(isStudent)

// Dashboard
router.get("/dashboard", studentController.getDashboard)

// Course Search and Registration
router.get("/course-search", studentController.getCourseSearch)
router.get("/search-courses", studentController.searchCourses)
router.post("/register", studentController.registerForCourse)
router.delete("/drop-course/:courseId", studentController.dropCourse)

// Schedule Visualization
router.get("/schedule", studentController.getSchedule)

// Notifications
router.post("/subscribe", studentController.subscribeToCourse)
router.put("/notifications/:notificationId", studentController.markNotificationRead)

module.exports = router

