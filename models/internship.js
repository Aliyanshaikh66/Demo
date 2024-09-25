const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  internship: {
    type: String,
    required: true
  },
  resume: {
    type: String,
    required: true
  },
  coverLetter: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'Pending', // Options: Pending, Approved, Rejected
  },
  assignmentSubmitted: {
    type: Boolean,
    default: false
  },
  idCardGenerated: {
    type: Boolean,
    default: false
  },
  certificateIssued: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const Internship = mongoose.model('Internship', internshipSchema);

module.exports = Internship;
