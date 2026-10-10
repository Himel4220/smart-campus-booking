const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookingType: { type: String, enum: ['single_day', 'multi_day'], default: 'single_day' },
  date: { type: String },
  timeSlot: { type: String },
  startDate: { type: String },
  endDate: { type: String },
  venueType: { type: String, enum: ['academic', 'sports'], required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);