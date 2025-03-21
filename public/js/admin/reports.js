document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const tabBtns = document.querySelectorAll(".tab-btn")
  const tabContents = document.querySelectorAll(".tab-content")
  const courseSelect = document.getElementById("course-select")
  const studentsTableBody = document.getElementById("students-table-body")
  const noStudentsMessage = document.getElementById("no-students-message")
  const availableCoursesTableBody = document.getElementById("available-courses-table-body")
  const noAvailableCoursesMessage = document.getElementById("no-available-courses-message")
  const prerequisiteIssuesTableBody = document.getElementById("prerequisite-issues-table-body")
  const noPrerequisiteIssuesMessage = document.getElementById("no-prerequisite-issues-message")

  // Tab switching
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Remove active class from all tabs
      tabBtns.forEach((b) => b.classList.remove("active"))
      tabContents.forEach((c) => c.classList.remove("active"))

      // Add active class to clicked tab
      btn.classList.add("active")
      const tabId = `${btn.dataset.tab}-tab`
      document.getElementById(tabId).classList.add("active")

      // Load data for the active tab
      if (btn.dataset.tab === "available-seats") {
        loadAvailableCourses()
      } else if (btn.dataset.tab === "prerequisite-issues") {
        loadPrerequisiteIssues()
      }
    })
  })

  // Course select change event
  courseSelect.addEventListener("change", function () {
    const courseId = this.value

    if (courseId) {
      loadStudentsForCourse(courseId)
    } else {
      // Clear table and show message
      studentsTableBody.innerHTML = ""
      noStudentsMessage.textContent = "Select a course to view registered students"
      noStudentsMessage.style.display = "block"
    }
  })

  // Load students for a course
  async function loadStudentsForCourse(courseId) {
    try {
      const response = await fetch(`/admin/reports/course-students/${courseId}`)
      const data = await response.json()

      if (data.success) {
        const students = data.students

        if (students.length > 0) {
          // Clear table and hide message
          studentsTableBody.innerHTML = ""
          noStudentsMessage.style.display = "none"

          // Add students to table
          students.forEach((student) => {
            const row = document.createElement("tr")
            row.innerHTML = `
              <td>${student.rollNumber}</td>
              <td>${student.name}</td>
              <td>${student.email}</td>
            `
            studentsTableBody.appendChild(row)
          })
        } else {
          // Clear table and show message
          studentsTableBody.innerHTML = ""
          noStudentsMessage.textContent = "No students registered for this course"
          noStudentsMessage.style.display = "block"
        }
      } else {
        console.error("Error loading students:", data.message)
        noStudentsMessage.textContent = "Error loading students"
        noStudentsMessage.style.display = "block"
      }
    } catch (error) {
      console.error("Error loading students:", error)
      noStudentsMessage.textContent = "Error loading students"
      noStudentsMessage.style.display = "block"
    }
  }

  // Load courses with available seats
  async function loadAvailableCourses() {
    try {
      const response = await fetch("/admin/reports/available-courses")
      const data = await response.json()

      if (data.success) {
        const courses = data.courses

        if (courses.length > 0) {
          // Clear table and hide message
          availableCoursesTableBody.innerHTML = ""
          noAvailableCoursesMessage.style.display = "none"

          // Add courses to table
          courses.forEach((course) => {
            const row = document.createElement("tr")
            row.innerHTML = `
              <td>${course.courseCode}</td>
              <td>${course.title}</td>
              <td>${course.department}</td>
              <td>${course.availableSeats}</td>
              <td>${course.totalSeats}</td>
            `
            availableCoursesTableBody.appendChild(row)
          })
        } else {
          // Clear table and show message
          availableCoursesTableBody.innerHTML = ""
          noAvailableCoursesMessage.textContent = "No courses with available seats"
          noAvailableCoursesMessage.style.display = "block"
        }
      } else {
        console.error("Error loading available courses:", data.message)
        noAvailableCoursesMessage.textContent = "Error loading courses"
        noAvailableCoursesMessage.style.display = "block"
      }
    } catch (error) {
      console.error("Error loading available courses:", error)
      noAvailableCoursesMessage.textContent = "Error loading courses"
      noAvailableCoursesMessage.style.display = "block"
    }
  }

  // Load prerequisite issues
  async function loadPrerequisiteIssues() {
    try {
      const response = await fetch("/admin/reports/prerequisite-issues")
      const data = await response.json()

      if (data.success) {
        const issues = data.issues

        if (issues.length > 0) {
          // Clear table and hide message
          prerequisiteIssuesTableBody.innerHTML = ""
          noPrerequisiteIssuesMessage.style.display = "none"

          // Add issues to table
          issues.forEach((issue) => {
            const row = document.createElement("tr")

            // Format missing prerequisites
            const missingPrereqs = issue.missingPrerequisites.map((p) => `${p.code}: ${p.title}`).join("<br>")

            row.innerHTML = `
              <td>${issue.student.rollNumber}</td>
              <td>${issue.student.name}</td>
              <td>${issue.course.code}: ${issue.course.title}</td>
              <td>${missingPrereqs}</td>
            `
            prerequisiteIssuesTableBody.appendChild(row)
          })
        } else {
          // Clear table and show message
          prerequisiteIssuesTableBody.innerHTML = ""
          noPrerequisiteIssuesMessage.textContent = "No prerequisite issues found"
          noPrerequisiteIssuesMessage.style.display = "block"
        }
      } else {
        console.error("Error loading prerequisite issues:", data.message)
        noPrerequisiteIssuesMessage.textContent = "Error loading prerequisite issues"
        noPrerequisiteIssuesMessage.style.display = "block"
      }
    } catch (error) {
      console.error("Error loading prerequisite issues:", error)
      noPrerequisiteIssuesMessage.textContent = "Error loading prerequisite issues"
      noPrerequisiteIssuesMessage.style.display = "block"
    }
  }

  // Load available courses on page load
  if (document.getElementById("available-seats-tab")) {
    loadAvailableCourses()
  }

  // Load prerequisite issues on page load
  if (document.getElementById("prerequisite-issues-tab")) {
    loadPrerequisiteIssues()
  }
})

