const mongoose = require('mongoose');

const VenueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['academic', 'sports'], required: true },
  capacity: { type: Number, required: true },
  location: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Venue', VenueSchema);