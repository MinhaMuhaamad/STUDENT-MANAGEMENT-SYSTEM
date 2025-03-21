document.addEventListener("DOMContentLoaded", () => {
  // Tab switching functionality
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`${btn.dataset.tab}-tab`).classList.add("active");
    });
  });

  // Login form handling
  const handleLogin = (formId, endpoint, getCredentials) => {
    const form = document.getElementById(formId);
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const errorElement = document.getElementById("login-error");
        const credentials = getCredentials();

        if (!credentials) {
          errorElement.textContent = "Please enter required fields.";
          return;
        }

        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
          });

          const data = await response.json();

          if (data.success) {
            localStorage.setItem("user", JSON.stringify(data.user));
            window.location.href = data.redirect;
          } else {
            errorElement.textContent = data.message;
          }
        } catch (error) {
          console.error("Login error:", error);
          errorElement.textContent = "An error occurred. Please try again.";
        }
      });
    }
  };

  // Student login
  handleLogin("student-login-form", "/auth/login", () => {
    const rollNumber = document.getElementById("rollNumber").value.trim();
    return rollNumber ? { rollNumber } : null;
  });

  // Admin login
  handleLogin("admin-login-form", "/auth/login", () => {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    return username && password ? { username, password } : null;
  });
});
