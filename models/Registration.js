const mongoose = require("mongoose")

const registrationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["registered", "dropped", "waitlisted"],
      default: "registered",
    },
    overrideReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
)

// Compound index to ensure a student can't register for the same course twice
registrationSchema.index({ student: 1, course: 1 }, { unique: true })

module.exports = mongoose.model("Registration", registrationSchema)

