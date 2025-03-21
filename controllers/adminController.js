const Course = require("../models/Course")
const User = require("../models/User")
const Registration = require("../models/Registration")
const mongoose = require("mongoose")

// Render admin dashboard
exports.getDashboard = async (req, res) => {
  try {
    const courseCount = await Course.countDocuments()
    const studentCount = await User.countDocuments({ role: "student" })
    const registrationCount = await Registration.countDocuments()

    res.render("admin/dashboard", {
      courseCount,
      studentCount,
      registrationCount,
    })
  } catch (error) {
    res.status(500).render("auth/error", { message: "Server error", error })
  }
}

// Course Management
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate("prerequisites", "courseCode title")
    res.render("admin/course-management", { courses })
  } catch (error) {
    res.status(500).render("auth/error", { message: "Server error", error })
  }
}

exports.createCourse = async (req, res) => {
  try {
    const courseData = req.body

    // Convert prerequisites from courseCode to ObjectId
    if (courseData.prerequisites && courseData.prerequisites.length) {
      const prereqCourses = await Course.find({
        courseCode: { $in: courseData.prerequisites },
      })
      courseData.prerequisites = prereqCourses.map((course) => course._id)
    }

    // Ensure schedule is properly formatted
    if (courseData.schedule) {
      courseData.schedule = JSON.parse(courseData.schedule)
    }

    // Set available seats equal to total seats for new course
    courseData.availableSeats = courseData.totalSeats

    const newCourse = new Course(courseData)
    await newCourse.save()

    res.status(201).json({ success: true, course: newCourse })
  } catch (error) {
    console.error("Create course error:", error)
    res.status(500).json({ success: false, message: "Server error" })
  }
}

exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params
    const courseData = req.body

    // Convert prerequisites from courseCode to ObjectId
    if (courseData.prerequisites && courseData.prerequisites.length) {
      const prereqCourses = await Course.find({
        courseCode: { $in: courseData.prerequisites },
      })
      courseData.prerequisites = prereqCourses.map((course) => course._id)
    }

    // Ensure schedule is properly formatted
    if (courseData.schedule && typeof courseData.schedule === "string") {
      courseData.schedule = JSON.parse(courseData.schedule)
    }

    // Handle seat updates and notifications
    const originalCourse = await Course.findById(id)
    if (originalCourse && courseData.totalSeats > originalCourse.totalSeats) {
      // Seats were added, update available seats
      const seatsAdded = courseData.totalSeats - originalCourse.totalSeats
      courseData.availableSeats = originalCourse.availableSeats + seatsAdded

      // Notify subscribers if seats become available
      if (originalCourse.availableSeats === 0 && courseData.availableSeats > 0) {
        await notifySubscribers(originalCourse._id)
      }
    }

    const updatedCourse = await Course.findByIdAndUpdate(id, courseData, { new: true, runValidators: true })

    if (!updatedCourse) {
      return res.status(404).json({ success: false, message: "Course not found" })
    }

    res.json({ success: true, course: updatedCourse })
  } catch (error) {
    console.error("Update course error:", error)
    res.status(500).json({ success: false, message: "Server error" })
  }
}

exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params

    // Check if course is a prerequisite for other courses
    const dependentCourses = await Course.find({ prerequisites: id })
    if (dependentCourses.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete course as it is a prerequisite for other courses",
      })
    }

    // Check if students are registered for this course
    const registrations = await Registration.find({ course: id })
    if (registrations.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete course as students are registered for it",
      })
    }

    const deletedCourse = await Course.findByIdAndDelete(id)

    if (!deletedCourse) {
      return res.status(404).json({ success: false, message: "Course not found" })
    }

    res.json({ success: true, message: "Course deleted successfully" })
  } catch (error) {
    console.error("Delete course error:", error)
    res.status(500).json({ success: false, message: "Server error" })
  }
}

// Student Management
exports.getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).populate("registeredCourses", "courseCode title")

    res.render("admin/student-management", { students })
  } catch (error) {
    res.status(500).render("auth/error", { message: "Server error", error })
  }
}

exports.overrideRegistration = async (req, res) => {
  try {
    const { studentId, courseId, action, reason } = req.body

    const student = await User.findById(studentId)
    const course = await Course.findById(courseId)

    if (!student || !course) {
      return res.status(404).json({ success: false, message: "Student or course not found" })
    }

    if (action === "add") {
      // Check if student is already registered
      const existingReg = await Registration.findOne({
        student: studentId,
        course: courseId,
      })

      if (existingReg) {
        return res.status(400).json({
          success: false,
          message: "Student is already registered for this course",
        })
      }

      // Create registration with override reason
      const registration = new Registration({
        student: studentId,
        course: courseId,
        overrideReason: reason || "Administrative override",
      })

      await registration.save()

      // Update student's registered courses
      if (!student.registeredCourses.includes(courseId)) {
        student.registeredCourses.push(courseId)
        await student.save()
      }

      // Update course available seats
      if (course.availableSeats > 0) {
        course.availableSeats -= 1
        await course.save()
      }

      return res.json({ success: true, message: "Student added to course successfully" })
    } else if (action === "remove") {
      // Find and remove registration
      const registration = await Registration.findOneAndDelete({
        student: studentId,
        course: courseId,
      })

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: "Registration not found",
        })
      }

      // Update student's registered courses
      student.registeredCourses = student.registeredCourses.filter((c) => c.toString() !== courseId)
      await student.save()

      // Update course available seats
      course.availableSeats += 1
      await course.save()

      // Notify subscribers if seats become available
      if (course.availableSeats === 1) {
        await notifySubscribers(courseId)
      }

      return res.json({ success: true, message: "Student removed from course successfully" })
    }

    return res.status(400).json({ success: false, message: "Invalid action" })
  } catch (error) {
    console.error("Override registration error:", error)
    res.status(500).json({ success: false, message: "Server error" })
  }
}

// Reports
exports.getReports = async (req, res) => {
  try {
    const courses = await Course.find({}, "courseCode title")
    res.render("admin/reports", { courses })
  } catch (error) {
    res.status(500).render("auth/error", { message: "Server error", error })
  }
}

exports.getCourseStudents = async (req, res) => {
  try {
    const { courseId } = req.params

    const registrations = await Registration.find({ course: courseId }).populate("student", "name rollNumber email")

    res.json({ success: true, students: registrations.map((reg) => reg.student) })
  } catch (error) {
    console.error("Get course students error:", error)
    res.status(500).json({ success: false, message: "Server error" })
  }
}

exports.getAvailableCourses = async (req, res) => {
  try {
    const courses = await Course.find({ availableSeats: { $gt: 0 } }).select(
      "courseCode title department availableSeats totalSeats",
    )

    res.json({ success: true, courses })
  } catch (error) {
    console.error("Get available courses error:", error)
    res.status(500).json({ success: false, message: "Server error" })
  }
}

exports.getPrerequisiteIssues = async (req, res) => {
  try {
    const registrations = await Registration.find()
      .populate("student", "name rollNumber")
      .populate({
        path: "course",
        select: "courseCode title prerequisites",
        populate: {
          path: "prerequisites",
          select: "courseCode title",
        },
      })

    const issues = []

    for (const reg of registrations) {
      const student = reg.student
      const course = reg.course

      if (course.prerequisites && course.prerequisites.length > 0) {
        // Get all courses the student has registered for
        const studentCourses = await Registration.find({
          student: student._id,
          status: "registered",
        }).populate("course", "courseCode")

        const studentCourseIds = studentCourses.map((sc) => sc.course._id.toString())

        // Check if student is missing any prerequisites
        const missingPrereqs = course.prerequisites.filter(
          (prereq) => !studentCourseIds.includes(prereq._id.toString()),
        )

        if (missingPrereqs.length > 0) {
          issues.push({
            student: {
              id: student._id,
              name: student.name,
              rollNumber: student.rollNumber,
            },
            course: {
              id: course._id,
              code: course.courseCode,
              title: course.title,
            },
            missingPrerequisites: missingPrereqs.map((mp) => ({
              id: mp._id,
              code: mp.courseCode,
              title: mp.title,
            })),
          })
        }
      }
    }

    res.json({ success: true, issues })
  } catch (error) {
    console.error("Get prerequisite issues error:", error)
    res.status(500).json({ success: false, message: "Server error" })
  }
}

// Helper function to notify subscribers when seats become available
async function notifySubscribers(courseId) {
  try {
    const course = await Course.findById(courseId)
    if (!course || course.subscribers.length === 0) return

    const notification = {
      courseId: course._id,
      message: `Seats are now available for ${course.courseCode}: ${course.title}`,
    }

    // Add notification to each subscriber
    for (const subscriberId of course.subscribers) {
      await User.findByIdAndUpdate(subscriberId, {
        $push: { notifications: notification },
      })
    }

    // Clear subscribers list since they've been notified
    course.subscribers = []
    await course.save()
  } catch (error) {
    console.error("Notify subscribers error:", error)
  }
}

