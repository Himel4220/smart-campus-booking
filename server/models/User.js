const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['student', 'club_executive', 'academic_admin', 'pe_admin'], 
    default: 'student' 
  },
  clubName: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);