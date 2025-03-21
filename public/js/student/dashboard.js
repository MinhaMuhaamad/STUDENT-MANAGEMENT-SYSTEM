document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const dropCourseBtns = document.querySelectorAll(".drop-course-btn")
  const dropCourseModal = document.getElementById("drop-course-modal")
  const dropCourseName = document.getElementById("drop-course-name")
  const confirmDropBtn = document.getElementById("confirm-drop-btn")
  const cancelDropBtn = document.getElementById("cancel-drop-btn")
  const markReadBtns = document.querySelectorAll(".mark-read-btn")

  let courseToDropId = null

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

  // Mark Notification as Read buttons
  markReadBtns.forEach((btn) => {
    btn.addEventListener("click", async function () {
      const notificationId = this.dataset.notificationId
      const notificationItem = document.querySelector(`.notification-item[data-notification-id="${notificationId}"]`)

      try {
        const response = await fetch(`/student/notifications/${notificationId}`, {
          method: "PUT",
        })

        const data = await response.json()

        if (data.success) {
          // Update UI
          notificationItem.classList.remove("unread")
          notificationItem.classList.add("read")
          btn.remove()
        } else {
          showNotification(`Error: ${data.message}`, "error")
        }
      } catch (error) {
        console.error("Error marking notification as read:", error)
        showNotification("An error occurred", "error")
      }
    })
  })

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

  // Add toast styles if they don't exist
  if (!document.getElementById("toast-styles")) {
    const style = document.createElement("style")
    style.id = "toast-styles"
    style.textContent = `
      .toast {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 4px;
        color: white;
        max-width: 300px;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        transform: translateY(-20px);
        opacity: 0;
        transition: transform 0.3s, opacity 0.3s;
      }
      .toast.show {
        transform: translateY(0);
        opacity: 1;
      }
      .toast-info {
        background-color: #3498db;
      }
      .toast-success {
        background-color: #2ecc71;
      }
      .toast-error {
        background-color: #e74c3c;
      }
      .toast-warning {
        background-color: #f39c12;
      }
    `
    document.head.appendChild(style)
  }
})

