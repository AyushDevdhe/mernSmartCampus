const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minLength: 6,
    },
    prn: {
      type: Number,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["Student", "admin", "Supervisor"],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
