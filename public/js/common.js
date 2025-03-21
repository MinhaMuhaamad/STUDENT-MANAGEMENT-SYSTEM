// Utility functions used across the application

// Format time from 24-hour to 12-hour format
function formatTime(timeStr) {
  const [hours, minutes] = timeStr.split(":")
  const hour = Number.parseInt(hours, 10)
  const ampm = hour >= 12 ? "PM" : "AM"
  const formattedHour = hour % 12 || 12
  return `${formattedHour}:${minutes} ${ampm}`
}

// Convert time string to minutes for calculations
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number)
  return hours * 60 + minutes
}

// Convert minutes to percentage of day for positioning
function minutesToPercent(minutes) {
  // Assuming 8:00 (480 minutes) to 21:00 (1260 minutes) is our schedule range
  const startMinute = 480 // 8:00
  const endMinute = 1260 // 21:00
  const totalMinutes = endMinute - startMinute

  return ((minutes - startMinute) / totalMinutes) * 100
}

// Calculate width percentage for a time slot
function calculateWidth(startTime, endTime) {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)

  return minutesToPercent(endMinutes) - minutesToPercent(startMinutes)
}

// Calculate left position percentage for a time slot
function calculateLeft(startTime) {
  const startMinutes = timeToMinutes(startTime)
  return minutesToPercent(startMinutes)
}

// Generate a color based on department or course code
function generateCourseColor(identifier) {
  // Simple hash function to generate a consistent color
  let hash = 0
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash)
  }

  // Use hue to generate different colors (avoid red which is used for conflicts)
  const hue = Math.abs(hash % 280) // Avoid red (around 0/360)
  return `hsl(${hue}, 70%, 45%)`
}

// Check if two time slots overlap
function checkTimeOverlap(slot1, slot2) {
  const start1 = timeToMinutes(slot1.startTime)
  const end1 = timeToMinutes(slot1.endTime)
  const start2 = timeToMinutes(slot2.startTime)
  const end2 = timeToMinutes(slot2.endTime)

  return start1 < end2 && start2 < end1
}

// Format schedule for display
function formatSchedule(schedule) {
  return schedule
    .map((slot) => {
      return `${slot.day}, ${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}, Room ${slot.room}`
    })
    .join("<br>")
}

// Show a notification toast
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

