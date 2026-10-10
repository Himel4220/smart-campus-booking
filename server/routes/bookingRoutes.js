const express = require('express');
const Booking = require('../models/Booking');
const Venue = require('../models/Venue');
const { verifyToken, verifyRole } = require('../middleware/auth');
const router = express.Router();

// Helper: Convert time strings ("10:00 AM", "10.00 AM") to minutes from midnight
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const clean = timeStr.trim().toLowerCase().replace(/\./g, ':');
  const match = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  let minutes = match[2] ? parseInt(match[2], 10) : 0;
  const meridian = match[3];

  if (meridian === 'pm' && hours < 12) hours += 12;
  if (meridian === 'am' && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

// Helper: Extract range start and end in minutes
const parseSlotRange = (slotStr) => {
  if (!slotStr) return null;
  const parts = slotStr.split(/[-–—~]|to/i);
  if (parts.length < 2) return null;

  const start = parseTimeToMinutes(parts[0]);
  const end = parseTimeToMinutes(parts[1]);

  if (start === null || end === null) return null;
  return { start, end };
};

// Conflict Detection Algorithm against APPROVED bookings
const hasConflict = async ({ venueId, bookingType, date, timeSlot, startDate, endDate, excludeBookingId = null }) => {
  const existingApproved = await Booking.find({ venue: venueId, status: 'approved' });
  const reqType = bookingType || (startDate ? 'multi_day' : 'single_day');

  for (let item of existingApproved) {
    if (excludeBookingId && item._id.toString() === excludeBookingId.toString()) {
      continue;
    }

    const itemType = item.bookingType || (item.startDate ? 'multi_day' : 'single_day');

    if (reqType === 'single_day' && itemType === 'single_day') {
      if (item.date && date && item.date.trim() === date.trim()) {
        const rangeReq = parseSlotRange(timeSlot);
        const rangeItem = parseSlotRange(item.timeSlot);

        if (rangeReq && rangeItem) {
          if (rangeReq.start < rangeItem.end && rangeReq.end > rangeItem.start) {
            return true;
          }
        } else {
          const s1 = (timeSlot || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const s2 = (item.timeSlot || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          if (!s1 || !s2 || s1 === s2) {
            return true;
          }
        }
      }
    } else {
      const reqStart = new Date(reqType === 'multi_day' ? startDate : date);
      const reqEnd = new Date(reqType === 'multi_day' ? endDate : date);
      const existStart = new Date(itemType === 'multi_day' ? item.startDate : item.date);
      const existEnd = new Date(itemType === 'multi_day' ? item.endDate : item.date);

      if (!isNaN(reqStart) && !isNaN(reqEnd) && !isNaN(existStart) && !isNaN(existEnd)) {
        if (reqStart <= existEnd && reqEnd >= existStart) {
          return true;
        }
      }
    }
  }

  return false;
};

// Get Public Approved Events
router.get('/public', async (req, res) => {
  try {
    const bookings = await Booking.find({ status: 'approved' })
      .populate('venue')
      .populate('requestedBy', 'name clubName')
      .sort({ createdAt: 1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get User / Admin Bookings (Chronological FCFS Sorting)
router.get('/', verifyToken, async (req, res) => {
  try {
    let filter = {};
    if (['student', 'club_executive'].includes(req.user.role)) {
      filter.requestedBy = req.user.id;
    } else if (req.user.role === 'academic_admin') {
      filter.venueType = 'academic';
    } else if (req.user.role === 'pe_admin') {
      filter.venueType = 'sports';
    }

    const bookings = await Booking.find(filter)
      .populate('venue')
      .populate('requestedBy', 'name clubName')
      .sort({ createdAt: 1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create Booking Request (Student and Club Executive)
router.post('/', verifyToken, verifyRole('student', 'club_executive'), async (req, res) => {
  try {
    const { title, description, venueId, bookingType, date, timeSlot, startDate, endDate } = req.body;

    const venue = await Venue.findById(venueId);
    if (!venue) return res.status(404).json({ message: 'Venue not found' });

    const conflict = await hasConflict({ venueId, bookingType, date, timeSlot, startDate, endDate });
    if (conflict) {
      return res.status(400).json({ message: 'Conflict: Venue is already approved for an overlapping event in this time slot/date range.' });
    }

    const newBooking = new Booking({
      title,
      description,
      venue: venueId,
      requestedBy: req.user.id,
      bookingType,
      date,
      timeSlot,
      startDate,
      endDate,
      venueType: venue.type
    });

    await newBooking.save();
    res.status(201).json(newBooking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve / Reject Booking with Strict FCFS Conflict Guard
router.put('/:id/status', verifyToken, verifyRole('academic_admin', 'pe_admin'), async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (
      (req.user.role === 'academic_admin' && booking.venueType !== 'academic') ||
      (req.user.role === 'pe_admin' && booking.venueType !== 'sports')
    ) {
      return res.status(403).json({ message: 'Unauthorized for this department venue.' });
    }

    if (status === 'approved') {
      const conflict = await hasConflict({
        venueId: booking.venue,
        bookingType: booking.bookingType,
        date: booking.date,
        timeSlot: booking.timeSlot,
        startDate: booking.startDate,
        endDate: booking.endDate,
        excludeBookingId: booking._id
      });

      if (conflict) {
        return res.status(400).json({ 
          message: 'Cannot Approve: Venue is ALREADY approved for an overlapping request in this slot!' 
        });
      }
    }

    booking.status = status;
    if (rejectionReason) booking.rejectionReason = rejectionReason;

    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;