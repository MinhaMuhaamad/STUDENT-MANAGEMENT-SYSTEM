const User = require("../models/User")
const Course = require("../models/Course")
const Registration = require("../models/Registration")

// Render student dashboard
exports.getDashboard = async (req, res) => {
  try {
    const student = await User.findById(req.user.id).populate({
      path: "registeredCourses",
      select: "courseCode title schedule department creditHours",
    })

    if (!student) {
      return res.status(404).render("auth/error", { message: "Student not found" })
    }

    // Get notifications
    const notifications = student.notifications || []

    res.render("student/dashboard", {
      student,
      registeredCourses: student.registeredCourses,
      notifications,
    })
  } catch (error) {
    res.status(500).render("auth/error", { message: "Server error", error })
  }
}

// Course search and registration
exports.getCourseSearch = async (req, res) => {
  try {
    const departments = await Course.distinct("department")
    const student = await User.findById(req.user.id).populate("registeredCourses", "courseCode")

    res.render("student/course-search", {
      departments,
      registeredCourseIds: student.registeredCourses.map((c) => c._id),
    })
  } catch (error) {
    res.status(500).render("auth/error", { message: "Server error", error })
  }
}

exports.searchCourses = async (req, res) => {
  try {
    const { department, level, day, timeOfDay, availableSeats, keyword } = req.query

    // Build query
    const query = {}

    if (department && department !== "all") {
      query.department = department
    }

    if (level && level !== "all") {
      query.level = level
    }

    if (availableSeats === "true") {
      query.availableSeats = { $gt: 0 }
    }

    if (day && day !== "all") {
      query["schedule.day"] = day
    }

    if (timeOfDay && timeOfDay !== "all") {
      // Morning: 8:00-12:00, Afternoon: 12:00-17:00, Evening: 17:00-21:00
      let startTime, endTime

      if (timeOfDay === "morning") {
        startTime = "08:00"
        endTime = "12:00"
      } else if (timeOfDay === "afternoon") {
        startTime = "12:00"
        endTime = "17:00"
      } else if (timeOfDay === "evening") {
        startTime = "17:00"
        endTime = "21:00"
      }

      if (startTime && endTime) {
        query["schedule"] = {
          $elemMatch: {
            startTime: { $gte: startTime },
            endTime: { $lte: endTime },
          },
        }
      }
    }

    if (keyword) {
      query.$or = [
        { courseCode: { $regex: keyword, $options: "i" } },
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ]
    }

    const courses = await Course.find(query).populate("prerequisites", "courseCode title")

    res.json({ success: true, courses })
  } catch (error) {
    console.error("Search courses error:", error)
    res.status(500).json({ success: false, message: "Server error" })
  }
}

exports.registerForCourse = async (req, res) => {
  try {
    const { courseId } = req.body
    const studentId = req.user.id

    // Check if course exists and has available seats
    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" })
    }

    if (course.availableSeats <= 0) {
      return res.status(400).json({
        success: false,
        message: "No available seats for this course",
      })
    }

    // Check if student is already registered
    const existingReg = await Registration.findOne({
      student: studentId,
      course: courseId,
    })

    if (existingReg) {
      return res.status(400).json({
        success: false,
        message: "You are already registered for this course",
      })
    }

    // Check for schedule conflicts
    const student = await User.findById(studentId).populate({
      path: "registeredCourses",
      select: "schedule",
    })

    const hasConflict = checkScheduleConflict(student.registeredCourses, course)
    if (hasConflict) {
      return res.status(400).json({
        success: false,
        message: "This course conflicts with your current schedule",
      })
    }

    // Check prerequisites
    if (course.prerequisites && course.prerequisites.length > 0) {
      const studentRegistrations = await Registration.find({
        student: studentId,
        status: "registered",
      }).select("course")

      const studentCourseIds = studentRegistrations.map((reg) => reg.course.toString())

      const missingPrereqs = course.prerequisites.filter((prereq) => !studentCourseIds.includes(prereq.toString()))

      if (missingPrereqs.length > 0) {
        // Get prerequisite course details for the error message
        const prereqCourses = await Course.find({
          _id: { $in: missingPrereqs },
        }).select("courseCode title")

        const prereqList = prereqCourses.map((p) => `${p.courseCode}: ${p.title}`).join(", ")

        return res.status(400).json({
          success: false,
          message: `Missing prerequisites: ${prereqList}`,
        })
      }
    }

    // Create registration
    const registration = new Registration({
      student: studentId,
      course: courseId,
    })

    await registration.save()

    // Update student's registered courses
    student.registeredCourses.push(courseId)
    await student.save()

    // Update course available seats
    course.availableSeats -= 1
    await course.save()

    res.json({
      success: true,
      message: "Successfully registered for the course",
      course: {
        _id: course._id,
        courseCode: course.courseCode,
        title: course.title,
        schedule: course.schedule,
      },
    })
  } catch (error) {
    console.error("Register for course error:", error)
    res.status(500).json({ success: false, message: "Server error" })
  }
}

exports.dropCourse = async (req, res) => {
  try {
    const { courseId } = req.params
    const studentId = req.user.id

    // Find and update registration
    const registration = await Registration.findOneAndUpdate(
      { student: studentId, course: courseId },
      { status: "dropped" },
      { new: true },
    )

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      })
    }

    // Update student's registered courses
    const student = await User.findById(studentId)
    student.registeredCourses = student.registeredCourses.filter((c) => c.toString() !== courseId)
    await student.save()

    // Update course available seats
    const course = await Course.findById(courseId)
    course.availableSeats += 1
    await course.save()

    // Notify subscribers if seats become available
    if (course.availableSeats === 1) {
      await notifySubscribers(courseId)
    }

    res.json({ success: true, message: "Course dropped successfully" })
  } catch (error) {
    console.error("Drop course error:", error)
    res.status(500).json({ success: false, message: "Server error" })
  }
}

// Schedule visualization
exports.getSchedule = async (req, res) => {
  try {
    const student = await User.findById(req.user.id).populate({
      path: "registeredCourses",
      select: "courseCode title schedule department creditHours",
    })

    if (!student) {
      return res.status(404).render("auth/error", { message: "Student not found" })
    }

    res.render("student/schedule", {
      student,
      registeredCourses: student.registeredCourses,
    })
  } catch (error) {
    res.status(500).render("auth/error", { message: "Server error", error })
  }
}

// Subscribe to course notifications
exports.subscribeToCourse = async (req, res) => {
  try {
    const { courseId } = req.body
    const studentId = req.user.id

    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" })
    }

    // Check if student is already subscribed
    if (course.subscribers.includes(studentId)) {
      return res.status(400).json({
        success: false,
        message: "You are already subscribed to this course",
      })
    }

    // Add student to subscribers
    course.subscribers.push(studentId)
    await course.save()

    res.json({ success: true, message: "Successfully subscribed to course notifications" })
  } catch (error) {
    console.error("Subscribe to course error:", error)
    res.status(500).json({ success: false, message: "Server error" })
  }
}

// Mark notification as read
exports.markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params
    const studentId = req.user.id

    await User.updateOne(
      { _id: studentId, "notifications._id": notificationId },
      { $set: { "notifications.$.read": true } },
    )

    res.json({ success: true, message: "Notification marked as read" })
  } catch (error) {
    console.error("Mark notification read error:", error)
    res.status(500).json({ success: false, message: "Server error" })
  }
}

// Helper function to check for schedule conflicts
function checkScheduleConflict(registeredCourses, newCourse) {
  for (const regCourse of registeredCourses) {
    for (const regSchedule of regCourse.schedule) {
      for (const newSchedule of newCourse.schedule) {
        // Check if days match
        if (regSchedule.day === newSchedule.day) {
          // Convert times to minutes for easier comparison
          const regStart = timeToMinutes(regSchedule.startTime)
          const regEnd = timeToMinutes(regSchedule.endTime)
          const newStart = timeToMinutes(newSchedule.startTime)
          const newEnd = timeToMinutes(newSchedule.endTime)

          // Check for overlap
          if (
            (newStart >= regStart && newStart < regEnd) ||
            (newEnd > regStart && newEnd <= regEnd) ||
            (newStart <= regStart && newEnd >= regEnd)
          ) {
            return true
          }
        }
      }
    }
  }
  return false
}

// Helper function to convert time string to minutes
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number)
  return hours * 60 + minutes
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

