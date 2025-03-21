document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const departmentFilter = document.getElementById("department-filter")
  const levelFilter = document.getElementById("level-filter")
  const dayFilter = document.getElementById("day-filter")
  const timeFilter = document.getElementById("time-filter")
  const availableSeatsFilter = document.getElementById("available-seats-filter")
  const keywordSearch = document.getElementById("keyword-search")
  const searchBtn = document.getElementById("search-btn")
  const resetBtn = document.getElementById("reset-btn")
  const searchResults = document.getElementById("search-results")
  const resultsCount = document.getElementById("results-count")
  const courseDetailsModal = document.getElementById("course-details-modal")
  const registrationResultModal = document.getElementById("registration-result-modal")
  const resultTitle = document.getElementById("result-title")
  const resultMessage = document.getElementById("result-message")
  const resultOkBtn = document.getElementById("result-ok-btn")
  const registerBtn = document.getElementById("register-btn")
  const subscribeBtn = document.getElementById("subscribe-btn")

  // Schedule elements
  const mondaySchedule = document.getElementById("monday-schedule")
  const tuesdaySchedule = document.getElementById("tuesday-schedule")
  const wednesdaySchedule = document.getElementById("wednesday-schedule")
  const thursdaySchedule = document.getElementById("thursday-schedule")
  const fridaySchedule = document.getElementById("friday-schedule")

  // Close buttons
  const closeButtons = document.querySelectorAll(".close")
  closeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      courseDetailsModal.style.display = "none"
    })
  })

  // Result OK button
  resultOkBtn.addEventListener("click", () => {
    registrationResultModal.style.display = "none"
  })

  // Current course being viewed
  let currentCourse = null

  // User's registered courses (for schedule visualization)
  let registeredCourses = []

  // Search button
  searchBtn.addEventListener("click", searchCourses)

  // Reset button
  resetBtn.addEventListener("click", () => {
    departmentFilter.value = "all"
    levelFilter.value = "all"
    dayFilter.value = "all"
    timeFilter.value = "all"
    availableSeatsFilter.checked = true
    keywordSearch.value = ""

    // Clear results
    searchResults.innerHTML = `
      <div class="no-results-message">
        Use the filters above to search for courses
      </div>
    `
    resultsCount.textContent = "0 courses found"
  })

  // Search courses function
  async function searchCourses() {
    // Build query string
    const queryParams = new URLSearchParams()

    if (departmentFilter.value !== "all") {
      queryParams.append("department", departmentFilter.value)
    }

    if (levelFilter.value !== "all") {
      queryParams.append("level", levelFilter.value)
    }

    if (dayFilter.value !== "all") {
      queryParams.append("day", dayFilter.value)
    }

    if (timeFilter.value !== "all") {
      queryParams.append("timeOfDay", timeFilter.value)
    }

    if (availableSeatsFilter.checked) {
      queryParams.append("availableSeats", "true")
    }

    if (keywordSearch.value.trim()) {
      queryParams.append("keyword", keywordSearch.value.trim())
    }

    try {
      const response = await fetch(`/student/search-courses?${queryParams.toString()}`)
      const data = await response.json()

      if (data.success) {
        const courses = data.courses

        // Update results count
        resultsCount.textContent = `${courses.length} courses found`

        if (courses.length > 0) {
          // Clear results
          searchResults.innerHTML = ""

          // Add courses to results
          courses.forEach((course) => {
            // Determine seat status
            let seatStatus = ""
            let seatClass = ""

            if (course.availableSeats === 0) {
              seatStatus = "Full"
              seatClass = "seats-full"
            } else if (course.availableSeats <= 5) {
              seatStatus = `${course.availableSeats} seats left`
              seatClass = "seats-limited"
            } else {
              seatStatus = `${course.availableSeats} seats available`
              seatClass = "seats-available"
            }

            // Create course card
            const courseCard = document.createElement("div")
            courseCard.className = "course-result-card"
            courseCard.dataset.courseId = course._id

            courseCard.innerHTML = `
              <div class="course-result-header">
                <h4>${course.courseCode}</h4>
                <span class="seats-badge ${seatClass}">${seatStatus}</span>
              </div>
              <div class="course-result-title">${course.title}</div>
              <div class="course-result-details">
                <div>${course.department} | ${course.creditHours} credit hours</div>
                <div>${formatSchedulePreview(course.schedule)}</div>
              </div>
              <div class="course-result-actions">
                <button class="btn btn-small btn-primary view-details-btn" data-course-id="${course._id}">
                  View Details
                </button>
                ${
                  course.availableSeats > 0
                    ? `
                  <button class="btn btn-small btn-success register-btn" data-course-id="${course._id}">
                    Register
                  </button>
                `
                    : `
                  <button class="btn btn-small btn-secondary subscribe-btn" data-course-id="${course._id}">
                    Subscribe
                  </button>
                `
                }
              </div>
            `

            searchResults.appendChild(courseCard)
          })
        } else {
          // No results
          searchResults.innerHTML = `
            <div class="no-results-message">
              No courses found matching your criteria
            </div>
          `
        }
      } else {
        console.error("Error searching courses:", data.message)
        searchResults.innerHTML = `
          <div class="no-results-message">
            Error searching courses
          </div>
        `
      }
    } catch (error) {
      console.error("Error searching courses:", error)
      searchResults.innerHTML = `
        <div class="no-results-message">
          Error searching courses
        </div>
      `
    }
  }

  // View Details button
  document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("view-details-btn")) {
      const courseId = e.target.dataset.courseId

      try {
        const response = await fetch(`/student/course/${courseId}`)
        const data = await response.json()

        if (data.success) {
          const course = data.course
          currentCourse = course

          // Fill modal with course data
          document.getElementById("modal-course-title").textContent = `${course.courseCode}: ${course.title}`
          document.getElementById("detail-courseCode").textContent = course.courseCode
          document.getElementById("detail-department").textContent = course.department
          document.getElementById("detail-creditHours").textContent = `${course.creditHours} credit hours`
          document.getElementById("detail-availableSeats").textContent =
            `${course.availableSeats} / ${course.totalSeats}`
          document.getElementById("detail-description").textContent = course.description || "No description provided"

          // Prerequisites
          const prereqElement = document.getElementById("detail-prerequisites")
          if (course.prerequisites && course.prerequisites.length > 0) {
            const prereqList = course.prerequisites.map((p) => `${p.courseCode}: ${p.title}`).join("<br>")
            prereqElement.innerHTML = prereqList
          } else {
            prereqElement.textContent = "None"
          }

          // Schedule
          const scheduleElement = document.getElementById("detail-schedule")
          if (course.schedule && course.schedule.length > 0) {
            const scheduleList = course.schedule
              .map((s) => {
                return `<div class="schedule-list-item">${s.day}, ${formatTime(s.startTime)} - ${formatTime(s.endTime)}, Room ${s.room}</div>`
              })
              .join("")
            scheduleElement.innerHTML = scheduleList
          } else {
            scheduleElement.textContent = "No schedule provided"
          }

          // Update buttons based on seat availability
          if (course.availableSeats > 0) {
            registerBtn.style.display = "block"
            subscribeBtn.style.display = "none"
          } else {
            registerBtn.style.display = "none"
            subscribeBtn.style.display = "block"
          }

          // Show modal
          courseDetailsModal.style.display = "block"
        } else {
          console.error("Error fetching course:", data.message)
          showNotification("Error fetching course details", "error")
        }
      } catch (error) {
        console.error("Error fetching course:", error)
        showNotification("Error fetching course details", "error")
      }
    }
  })

  // Register button (in search results)
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("register-btn")) {
      const courseId = e.target.dataset.courseId
      registerForCourse(courseId)
    }
  })

  // Register button (in modal)
  registerBtn.addEventListener("click", () => {
    if (currentCourse) {
      registerForCourse(currentCourse._id)
    }
  })

  // Subscribe button (in search results)
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("subscribe-btn")) {
      const courseId = e.target.dataset.courseId
      subscribeToCourse(courseId)
    }
  })

  // Subscribe button (in modal)
  subscribeBtn.addEventListener("click", () => {
    if (currentCourse) {
      subscribeToCourse(currentCourse._id)
    }
  })

  // Register for course
  async function registerForCourse(courseId) {
    try {
      const response = await fetch("/student/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ courseId }),
      })

      const data = await response.json()

      // Close course details modal
      courseDetailsModal.style.display = "none"

      if (data.success) {
        // Show success message
        resultTitle.textContent = "Registration Successful"
        resultTitle.className = "success-text"
        resultMessage.textContent = data.message

        // Add course to registered courses
        registeredCourses.push(data.course)

        // Update schedule visualization
        updateScheduleVisualization()
      } else {
        // Show error message
        resultTitle.textContent = "Registration Failed"
        resultTitle.className = "error-text"
        resultMessage.textContent = data.message
      }

      // Show result modal
      registrationResultModal.style.display = "block"
    } catch (error) {
      console.error("Error registering for course:", error)

      // Close course details modal
      courseDetailsModal.style.display = "none"

      // Show error message
      resultTitle.textContent = "Registration Failed"
      resultTitle.className = "error-text"
      resultMessage.textContent = "An error occurred while registering for the course"

      // Show result modal
      registrationResultModal.style.display = "block"
    }
  }

  // Subscribe to course
  async function subscribeToCourse(courseId) {
    try {
      const response = await fetch("/student/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ courseId }),
      })

      const data = await response.json()

      // Close course details modal
      courseDetailsModal.style.display = "none"

      if (data.success) {
        // Show success message
        resultTitle.textContent = "Subscription Successful"
        resultTitle.className = "success-text"
        resultMessage.textContent = data.message
      } else {
        // Show error message
        resultTitle.textContent = "Subscription Failed"
        resultTitle.className = "error-text"
        resultMessage.textContent = data.message
      }

      // Show result modal
      registrationResultModal.style.display = "block"
    } catch (error) {
      console.error("Error subscribing to course:", error)

      // Close course details modal
      courseDetailsModal.style.display = "none"

      // Show error message
      resultTitle.textContent = "Subscription Failed"
      resultTitle.className = "error-text"
      resultMessage.textContent = "An error occurred while subscribing to the course"

      // Show result modal
      registrationResultModal.style.display = "block"
    }
  }

  // Load registered courses
  async function loadRegisteredCourses() {
    try {
      const response = await fetch("/student/registered-courses")
      const data = await response.json()

      if (data.success) {
        registeredCourses = data.courses
        updateScheduleVisualization()
      } else {
        console.error("Error loading registered courses:", data.message)
      }
    } catch (error) {
      console.error("Error loading registered courses:", error)
    }
  }

  // Update schedule visualization
  function updateScheduleVisualization() {
    // Clear schedule
    mondaySchedule.innerHTML = ""
    tuesdaySchedule.innerHTML = ""
    wednesdaySchedule.innerHTML = ""
    thursdaySchedule.innerHTML = ""
    fridaySchedule.innerHTML = ""

    // Track course blocks for conflict detection
    const courseBlocks = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
    }

    // Add registered courses to schedule
    registeredCourses.forEach((course) => {
      const courseColor = generateCourseColor(course.courseCode)

      course.schedule.forEach((slot) => {
        const daySchedule = getDayScheduleElement(slot.day)

        if (daySchedule) {
          // Calculate position and width
          const left = calculateLeft(slot.startTime)
          const width = calculateWidth(slot.startTime, slot.endTime)

          // Create course block
          const courseBlock = document.createElement("div")
          courseBlock.className = "course-block"
          courseBlock.style.left = `${left}%`
          courseBlock.style.width = `${width}%`
          courseBlock.style.backgroundColor = courseColor

          courseBlock.innerHTML = `
            <div>${course.courseCode}</div>
            <div class="course-time">${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}</div>
          `

          // Check for conflicts
          const newBlock = {
            start: timeToMinutes(slot.startTime),
            end: timeToMinutes(slot.endTime),
            element: courseBlock,
          }

          let hasConflict = false

          courseBlocks[slot.day].forEach((block) => {
            if (
              checkTimeOverlap(
                { startTime: slot.startTime, endTime: slot.endTime },
                { startTime: minutesToTimeString(block.start), endTime: minutesToTimeString(block.end) },
              )
            ) {
              hasConflict = true
              block.element.classList.add("course-block-conflict")
              courseBlock.classList.add("course-block-conflict")
            }
          })

          courseBlocks[slot.day].push(newBlock)
          daySchedule.appendChild(courseBlock)
        }
      })
    })
  }

  // Get day schedule element
  function getDayScheduleElement(day) {
    switch (day) {
      case "Monday":
        return mondaySchedule
      case "Tuesday":
        return tuesdaySchedule
      case "Wednesday":
        return wednesdaySchedule
      case "Thursday":
        return thursdaySchedule
      case "Friday":
        return fridaySchedule
      default:
        return null
    }
  }

  // Format schedule preview
  function formatSchedulePreview(schedule) {
    if (!schedule || schedule.length === 0) {
      return "No schedule available"
    }

    const days = new Set(schedule.map((s) => s.day.substring(0, 3)))
    return Array.from(days).join(", ")
  }

  // Format time
  function formatTime(timeStr) {
    const [hours, minutes] = timeStr.split(":")
    const hour = Number.parseInt(hours, 10)
    const ampm = hour >= 12 ? "PM" : "AM"
    const formattedHour = hour % 12 || 12
    return `${formattedHour}:${minutes} ${ampm}`
  }

  // Convert time to minutes
  function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number)
    return hours * 60 + minutes
  }

  // Convert minutes to time string
  function minutesToTimeString(minutes) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
  }

  // Calculate left position for schedule block
  function calculateLeft(startTime) {
    const startMinutesCalcLeft = timeToMinutes(startTime)
    // Assuming 8:00 (480 minutes) to 21:  {
    // Assuming 8:00 (480 minutes) to 21:00 (1260 minutes) is our schedule range
    const startOfDay = 480 // 8:00 AM in minutes
    const totalMinutes = 780 // 13 hours in minutes

    return ((startMinutesCalcLeft - startOfDay) / totalMinutes) * 100
  }

  // Calculate width for schedule block
  function calculateWidth(startTime, endTime) {
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)
    const totalMinutes = 780 // 13 hours in minutes

    return ((endMinutes - startMinutes) / totalMinutes) * 100
  }

  // Generate color based on course code
  function generateCourseColor(courseCode) {
    // Simple hash function to generate a consistent color
    let hash = 0
    for (let i = 0; i < courseCode.length; i++) {
      hash = courseCode.charCodeAt(i) + ((hash << 5) - hash)
    }

    // Use hue to generate different colors (avoid red which is used for conflicts)
    const hue = Math.abs(hash % 280) // Avoid red (around 0/360)
    return `hsl(${hue}, 70%, 45%)`
  }

  // Check for time overlap
  function checkTimeOverlap(slot1, slot2) {
    const start1 = timeToMinutes(slot1.startTime)
    const end1 = timeToMinutes(slot1.endTime)
    const start2 = timeToMinutes(slot2.startTime)
    const end2 = timeToMinutes(slot2.endTime)

    return start1 < end2 && start2 < end1
  }

  // Show notification toast
  function showNotification(message, type = "info") {
    const toast = document.createElement("div")
    toast.className = `toast toast-${type}`
    toast.textContent = message

    document.body.appendChild(toast)

    // Trigger animation
    setTimeout(() => {
      toast.classList.add("show")
    }, 10)

    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.remove("show")
      setTimeout(() => {
        document.body.removeChild(toast)
      }, 300)
    }, 3000)
  }

  // Load registered courses on page load
  loadRegisteredCourses()

  // Initial search
  searchCourses()
})

