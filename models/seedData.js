const User = require("./User");
const Course = require("./Course");

module.exports = async function seedData() {
  try {
    // Check if we already have data
    const adminCount = await User.countDocuments({ role: "admin" });
    const studentCount = await User.countDocuments({ role: "student" });
    const courseCount = await Course.countDocuments();

    if (adminCount > 0 && studentCount > 0 && courseCount > 0) {
      console.log("Database already seeded");
      return;
    }

    // Create admin user
    const admin = new User({
      username: "admin",
      password: "admin123", // In a real app, this would be hashed
      role: "admin",
      name: "System Administrator",
      email: "admin@university.edu",
    });
    await admin.save();

    // Create student user (using your roll number)
    const student = new User({
      username: "student",
      role: "student",
      rollNumber: "22F-3653", // Change this to your roll number
      name: "Student User",
      email: "student@university.edu",
      department: "Computer Science",
      registeredCourses: [],
    });
    await student.save();

    // Create some courses
    const courses = [
      {
        courseCode: "CS101",
        title: "Introduction to Programming",
        department: "Computer Science",
        description: "Basic programming concepts using Python",
        creditHours: 3,
        level: "100",
        prerequisites: [],
        totalSeats: 50,
        availableSeats: 50,
        schedule: [
          {
            day: "Monday",
            startTime: "09:00",
            endTime: "10:30",
            room: "CS-1",
          },
          {
            day: "Wednesday",
            startTime: "09:00",
            endTime: "10:30",
            room: "CS-1",
          },
        ],
      },
      {
        courseCode: "CS201",
        title: "Data Structures",
        department: "Computer Science",
        description: "Advanced data structures and algorithms",
        creditHours: 4,
        level: "200",
        prerequisites: [], // Will be updated after courses are created
        totalSeats: 40,
        availableSeats: 40,
        schedule: [
          {
            day: "Tuesday",
            startTime: "11:00",
            endTime: "12:30",
            room: "CS-2",
          },
          {
            day: "Thursday",
            startTime: "11:00",
            endTime: "12:30",
            room: "CS-2",
          },
        ],
      },
      {
        courseCode: "CS301",
        title: "Database Systems",
        department: "Computer Science",
        description: "Introduction to database design and SQL",
        creditHours: 3,
        level: "300",
        prerequisites: [], // Will be updated after courses are created
        totalSeats: 35,
        availableSeats: 35,
        schedule: [
          {
            day: "Monday",
            startTime: "14:00",
            endTime: "15:30",
            room: "CS-3",
          },
          {
            day: "Wednesday",
            startTime: "14:00",
            endTime: "15:30",
            room: "CS-3",
          },
        ],
      },
      {
        courseCode: "MATH101",
        title: "Calculus I",
        department: "Mathematics",
        description: "Introduction to differential calculus",
        creditHours: 3,
        level: "100",
        prerequisites: [],
        totalSeats: 60,
        availableSeats: 60,
        schedule: [
          {
            day: "Tuesday",
            startTime: "09:00",
            endTime: "10:30",
            room: "MATH-1",
          },
          {
            day: "Thursday",
            startTime: "09:00",
            endTime: "10:30",
            room: "MATH-1",
          },
        ],
      },
      {
        courseCode: "ENG101",
        title: "English Composition",
        department: "English",
        description: "Fundamentals of academic writing",
        creditHours: 3,
        level: "100",
        prerequisites: [],
        totalSeats: 45,
        availableSeats: 45,
        schedule: [
          {
            day: "Friday",
            startTime: "10:00",
            endTime: "13:00",
            room: "ENG-1",
          },
        ],
      },
    ];

    const savedCourses = await Course.insertMany(courses);

    // Update prerequisites
    const cs101 = savedCourses.find((c) => c.courseCode === "CS101");
    const cs201 = savedCourses.find((c) => c.courseCode === "CS201");
    const cs301 = savedCourses.find((c) => c.courseCode === "CS301");

    // CS201 requires CS101
    cs201.prerequisites = [cs101._id];
    await cs201.save();

    // CS301 requires CS201
    cs301.prerequisites = [cs201._id];
    await cs301.save();

    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};
