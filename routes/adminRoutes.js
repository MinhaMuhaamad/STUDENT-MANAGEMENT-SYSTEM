const express = require("express")
const router = express.Router()
const adminController = require("../controllers/adminController")
const { isAuthenticated } = require("../middleware/auth")
const { isAdmin } = require("../middleware/roleCheck")

// Apply middleware to all admin routes
router.use(isAuthenticated)
router.use(isAdmin)

// Dashboard
router.get("/dashboard", adminController.getDashboard)

// Course Management
router.get("/courses", adminController.getCourses)
router.post("/courses", adminController.createCourse)
router.put("/courses/:id", adminController.updateCourse)
router.delete("/courses/:id", adminController.deleteCourse)

// Student Management
router.get("/students", adminController.getStudents)
router.post("/override-registration", adminController.overrideRegistration)

// Reports
router.get("/reports", adminController.getReports)
router.get("/reports/course-students/:courseId", adminController.getCourseStudents)
router.get("/reports/available-courses", adminController.getAvailableCourses)
router.get("/reports/prerequisite-issues", adminController.getPrerequisiteIssues)

module.exports = router

