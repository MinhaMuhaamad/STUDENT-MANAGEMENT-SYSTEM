document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const addCourseBtn = document.getElementById("add-course-btn")
  const courseForm = document.getElementById("course-form")
  const courseModal = document.getElementById("course-modal")
  const viewCourseModal = document.getElementById("view-course-modal")
  const deleteModal = document.getElementById("delete-modal")
  const courseSearchInput = document.getElementById("course-search")
  const coursesTableBody = document.getElementById("courses-table-body")
  const modalTitle = document.getElementById("modal-title")
  const courseIdInput = document.getElementById("course-id")
  const cancelBtn = document.getElementById("cancel-btn")
  const addScheduleBtn = document.getElementById("add-schedule-btn")
  const scheduleContainer = document.getElementById("schedule-container")
  const confirmDeleteBtn = document.getElementById("confirm-delete-btn")
  const cancelDeleteBtn = document.getElementById("cancel-delete-btn")

  // Close buttons
  const closeButtons = document.querySelectorAll(".close")
  closeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      courseModal.style.display = "none"
      viewCourseModal.style.display = "none"
      deleteModal.style.display = "none"
    })
  })

  // Add Course button
  addCourseBtn.addEventListener("click", () => {
    modalTitle.textContent = "Add New Course"
    courseForm.reset()
    courseIdInput.value = ""

    // Hide available seats field for new courses
    document.getElementById("availableSeatsGroup").style.display = "none"

    // Ensure there's at least one schedule item
    const scheduleItems = scheduleContainer.querySelectorAll(".schedule-item")
    if (scheduleItems.length === 0) {
      addScheduleItem()
    }

    courseModal.style.display = "block"
  })

  // Cancel button
  cancelBtn.addEventListener("click", () => {
    courseModal.style.display = "none"
  })

  // Add Schedule Item button
  addScheduleBtn.addEventListener("click", addScheduleItem)

  function addScheduleItem() {
    const scheduleItem = document.createElement("div")
    scheduleItem.className = "schedule-item"
    scheduleItem.innerHTML = `
      <select class="schedule-day" required>
        <option value="">Select Day</option>
        <option value="Monday">Monday</option>
        <option value="Tuesday">Tuesday</option>
        <option value="Wednesday">Wednesday</option>
        <option value="Thursday">Thursday</option>
        <option value="Friday">Friday</option>
      </select>
      
      <input type="time" class="schedule-start-time" required>
      <span>to</span>
      <input type="time" class="schedule-end-time" required>
      
      <input type="text" class="schedule-room" placeholder="Room" required>
      
      <button type="button" class="btn btn-small btn-remove-schedule">Remove</button>
    `

    scheduleContainer.appendChild(scheduleItem)

    // Add event listener to remove button
    const removeBtn = scheduleItem.querySelector(".btn-remove-schedule")
    removeBtn.addEventListener("click", () => {
      scheduleContainer.removeChild(scheduleItem)
    })
  }

  // Course Form Submit
  courseForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    // Collect form data
    const formData = {
      courseCode: document.getElementById("courseCode").value,
      title: document.getElementById("title").value,
      department: document.getElementById("department").value,
      description: document.getElementById("description").value,
      creditHours: document.getElementById("creditHours").value,
      level: document.getElementById("level").value,
      totalSeats: document.getElementById("totalSeats").value,
    }

    // Get prerequisites
    const prerequisitesSelect = document.getElementById("prerequisites")
    const selectedPrereqs = Array.from(prerequisitesSelect.selectedOptions).map((option) => option.value)
    formData.prerequisites = selectedPrereqs

    // Get schedule
    const scheduleItems = scheduleContainer.querySelectorAll(".schedule-item")
    const schedule = []

    scheduleItems.forEach((item) => {
      const day = item.querySelector(".schedule-day").value
      const startTime = item.querySelector(".schedule-start-time").value
      const endTime = item.querySelector(".schedule-end-time").value
      const room = item.querySelector(".schedule-room").value

      if (day && startTime && endTime && room) {
        schedule.push({ day, startTime, endTime, room })
      }
    })

    formData.schedule = JSON.stringify(schedule)

    // Check if editing or creating
    const courseId = courseIdInput.value
    let url = "/admin/courses"
    let method = "POST"

    if (courseId) {
      url = `/admin/courses/${courseId}`
      method = "PUT"
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        // Close modal
        courseModal.style.display = "none"

        // Refresh page to show updated data
        window.location.reload()
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      console.error("Error saving course:", error)
      alert("An error occurred while saving the course")
    }
  })

  // Edit Course buttons
  document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("btn-edit")) {
      const courseId = e.target.dataset.courseId

      try {
        // Get course data
        const response = await fetch(`/admin/courses/${courseId}`)
        const data = await response.json()

        if (data.success) {
          const course = data.course

          // Fill form with course data
          document.getElementById("course-id").value = course._id
          document.getElementById("courseCode").value = course.courseCode
          document.getElementById("title").value = course.title
          document.getElementById("department").value = course.department
          document.getElementById("description").value = course.description || ""
          document.getElementById("creditHours").value = course.creditHours
          document.getElementById("level").value = course.level
          document.getElementById("totalSeats").value = course.totalSeats

          // Show and set available seats
          document.getElementById("availableSeatsGroup").style.display = "block"
          document.getElementById("availableSeats").value = course.availableSeats

          // Set prerequisites
          const prerequisitesSelect = document.getElementById("prerequisites")
          if (course.prerequisites && course.prerequisites.length > 0) {
            const prereqCodes = course.prerequisites.map((p) => p.courseCode)

            Array.from(prerequisitesSelect.options).forEach((option) => {
              option.selected = prereqCodes.includes(option.value)
            })
          } else {
            Array.from(prerequisitesSelect.options).forEach((option) => {
              option.selected = false
            })
          }

          // Clear existing schedule items
          scheduleContainer.innerHTML = ""

          // Add schedule items
          if (course.schedule && course.schedule.length > 0) {
            course.schedule.forEach((scheduleItem) => {
              const item = document.createElement("div")
              item.className = "schedule-item"
              item.innerHTML = `
                <select class="schedule-day" required>
                  <option value="">Select Day</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                </select>
                
                <input type="time" class="schedule-start-time" required>
                <span>to</span>
                <input type="time" class="schedule-end-time" required>
                
                <input type="text" class="schedule-room" placeholder="Room" required>
                
                <button type="button" class="btn btn-small btn-remove-schedule">Remove</button>
              `

              scheduleContainer.appendChild(item)

              // Set values
              const daySelect = item.querySelector(".schedule-day")
              daySelect.value = scheduleItem.day

              item.querySelector(".schedule-start-time").value = scheduleItem.startTime
              item.querySelector(".schedule-end-time").value = scheduleItem.endTime
              item.querySelector(".schedule-room").value = scheduleItem.room

              // Add event listener to remove button
              const removeBtn = item.querySelector(".btn-remove-schedule")
              removeBtn.addEventListener("click", () => {
                scheduleContainer.removeChild(item)
              })
            })
          } else {
            // Add at least one empty schedule item
            addScheduleItem()
          }

          // Update modal title
          modalTitle.textContent = "Edit Course"

          // Show modal
          courseModal.style.display = "block"
        } else {
          alert(`Error: ${data.message}`)
        }
      } catch (error) {
        console.error("Error fetching course:", error)
        alert("An error occurred while fetching the course")
      }
    }
  })

  // View Course buttons
  document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("btn-view")) {
      const courseId = e.target.dataset.courseId

      try {
        // Get course data
        const response = await fetch(`/admin/courses/${courseId}`)
        const data = await response.json()

        if (data.success) {
          const course = data.course

          // Fill view modal with course data
          document.getElementById("view-courseCode").textContent = course.courseCode
          document.getElementById("view-title").textContent = course.title
          document.getElementById("view-department").textContent = course.department
          document.getElementById("view-description").textContent = course.description || "No description provided"
          document.getElementById("view-creditHours").textContent = course.creditHours
          document.getElementById("view-level").textContent = course.level
          document.getElementById("view-availableSeats").textContent = `${course.availableSeats} / ${course.totalSeats}`
          document.getElementById("view-totalSeats").textContent = course.totalSeats

          // Prerequisites
          const prereqElement = document.getElementById("view-prerequisites")
          if (course.prerequisites && course.prerequisites.length > 0) {
            const prereqList = course.prerequisites.map((p) => `${p.courseCode}: ${p.title}`).join("<br>")
            prereqElement.innerHTML = prereqList
          } else {
            prereqElement.textContent = "None"
          }

          // Schedule
          const scheduleElement = document.getElementById("view-schedule")
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

          // Show modal
          viewCourseModal.style.display = "block"
        } else {
          alert(`Error: ${data.message}`)
        }
      } catch (error) {
        console.error("Error fetching course:", error)
        alert("An error occurred while fetching the course")
      }
    }
  })

  // Delete Course buttons
  let courseToDelete = null

  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-delete")) {
      courseToDelete = e.target.dataset.courseId
      deleteModal.style.display = "block"
    }
  })

  // Confirm Delete button
  confirmDeleteBtn.addEventListener("click", async () => {
    if (!courseToDelete) return

    try {
      const response = await fetch(`/admin/courses/${courseToDelete}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        // Close modal
        deleteModal.style.display = "none"

        // Remove row from table
        const row = document.querySelector(`tr[data-course-id="${courseToDelete}"]`)
        if (row) {
          row.remove()
        }

        // Reset courseToDelete
        courseToDelete = null
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      console.error("Error deleting course:", error)
      alert("An error occurred while deleting the course")
    }
  })

  // Cancel Delete button
  cancelDeleteBtn.addEventListener("click", () => {
    deleteModal.style.display = "none"
    courseToDelete = null
  })

  // Search functionality
  courseSearchInput.addEventListener("input", function () {
    const searchTerm = this.value.toLowerCase()
    const rows = coursesTableBody.querySelectorAll("tr")

    rows.forEach((row) => {
      const courseCode = row.cells[0].textContent.toLowerCase()
      const title = row.cells[1].textContent.toLowerCase()
      const department = row.cells[2].textContent.toLowerCase()

      if (courseCode.includes(searchTerm) || title.includes(searchTerm) || department.includes(searchTerm)) {
        row.style.display = ""
      } else {
        row.style.display = "none"
      }
    })
  })

  // Helper function to format time
  function formatTime(timeStr) {
    const [hours, minutes] = timeStr.split(":")
    const hour = Number.parseInt(hours, 10)
    const ampm = hour >= 12 ? "PM" : "AM"
    const formattedHour = hour % 12 || 12
    return `${formattedHour}:${minutes} ${ampm}`
  }
})

