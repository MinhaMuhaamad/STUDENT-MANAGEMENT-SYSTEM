document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const weeklySchedule = document.getElementById("weekly-schedule")
  const mondaySchedule = document.getElementById("monday-schedule")
  const tuesdaySchedule = document.getElementById("tuesday-schedule")
  const wednesdaySchedule = document.getElementById("wednesday-schedule")
  const thursdaySchedule = document.getElementById("thursday-schedule")
  const fridaySchedule = document.getElementById("friday-schedule")
  const dropCourseBtns = document.querySelectorAll(".drop-course-btn")
  const dropCourseModal = document.getElementById("drop-course-modal")
  const dropCourseName = document.getElementById("drop-course-name")
  const confirmDropBtn = document.getElementById("confirm-drop-btn")
  const cancelDropBtn = document.getElementById("cancel-drop-btn")

  let courseToDropId = null

  // Initialize schedule visualization
  initializeSchedule()

  // Drop Course buttons
  dropCourseBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      courseToDropId = this.dataset.courseId
      const courseCode = this.dataset.courseCode

      dropCourseName.textContent = courseCode
      dropCourseModal.style.display = "block"
    })
  })

  // Confirm Drop button
  confirmDropBtn.addEventListener("click", async () => {
    if (!courseToDropId) return

    try {
      const response = await fetch(`/student/drop-course/${courseToDropId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        // Close modal
        dropCourseModal.style.display = "none"

        // Show success message
        showNotification("Course dropped successfully", "success")

        // Reload page after a short delay
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        // Close modal
        dropCourseModal.style.display = "none"

        // Show error message
        showNotification(`Error: ${data.message}`, "error")
      }
    } catch (error) {
      console.error("Error dropping course:", error)

      // Close modal
      dropCourseModal.style.display = "none"

      // Show error message
      showNotification("An error occurred while dropping the course", "error")
    }
  })

  // Cancel Drop button
  cancelDropBtn.addEventListener("click", () => {
    dropCourseModal.style.display = "none"
    courseToDropId = null
  })

  // Initialize schedule visualization
  function initializeSchedule() {
    // Get all course elements
    const courseElements = document.querySelectorAll(".courses-table tbody tr")

    // Track course blocks for conflict detection
    const courseBlocks = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
    }

    // Process each course
    courseElements.forEach((courseElement) => {
      const courseId = courseElement.querySelector(".drop-course-btn").dataset.courseId
      const courseCode = courseElement.querySelector(".drop-course-btn").dataset.courseCode
      const courseTitle = courseElement.cells[1].textContent
      const scheduleItems = courseElement.querySelectorAll(".schedule-item")

      // Generate a color for this course
      const courseColor = generateCourseColor(courseCode)

      // Add each schedule item to the visualization
      scheduleItems.forEach((item) => {
        const scheduleText = item.textContent.trim()
        const [day, timeRoom] = scheduleText.split(",")
        const [timeRange, room] = timeRoom.split(",")
        const [startTime, endTime] = timeRange.trim().split(" - ")

        // Convert times to 24-hour format for calculations
        const start24 = convertTo24Hour(startTime.trim())
        const end24 = convertTo24Hour(endTime.trim())

        // Get the appropriate day schedule element
        const daySchedule = getDayScheduleElement(day.trim())

        if (daySchedule) {
          // Calculate position and width
          const left = calculateLeft(start24)
          const width = calculateWidth(start24, end24)

          // Create course block
          const courseBlock = document.createElement("div")
          courseBlock.className = "course-block"
          courseBlock.style.left = `${left}%`
          courseBlock.style.width = `${width}%`
          courseBlock.style.backgroundColor = courseColor

          courseBlock.innerHTML = `
            <div>${courseCode}</div>
            <div class="course-time">${startTime} - ${endTime}</div>
          `

          // Check for conflicts
          const newBlock = {
            start: timeToMinutes(start24),
            end: timeToMinutes(end24),
            element: courseBlock,
          }

          let hasConflict = false

          courseBlocks[day.trim()].forEach((block) => {
            if (
              checkTimeOverlap(
                { startTime: start24, endTime: end24 },
                { startTime: minutesToTimeString(block.start), endTime: minutesToTimeString(block.end) },
              )
            ) {
              hasConflict = true
              block.element.classList.add("course-block-conflict")
              courseBlock.classList.add("course-block-conflict")
            }
          })

          courseBlocks[day.trim()].push(newBlock)
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

  // Convert 12-hour time to 24-hour time
  function convertTo24Hour(time12h) {
    const [time, modifier] = time12h.split(" ")
    let [hours, minutes] = time.split(":")

    if (hours === "12") {
      hours = "00"
    }

    if (modifier === "PM") {
      hours = Number.parseInt(hours, 10) + 12
    }

    return `${hours}:${minutes}`
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
    const startMinutes = timeToMinutes(startTime)
    // Assuming 8:00 (480 minutes) to 21:00 (1260 minutes) is our schedule range
    const startOfDay = 480 // 8:00 AM in minutes
    const totalMinutes = 780 // 13 hours in minutes

    return ((startMinutes - startOfDay) / totalMinutes) * 100
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
})

