const express = require('express');
const Venue = require('../models/Venue');
const router = express.Router();

// Get all venues
router.get('/', async (req, res) => {
  try {
    const venues = await Venue.find();
    res.json(venues);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Seed Initial Venues
router.get('/seed', async (req, res) => {
  try {
    await Venue.deleteMany({});
    const defaultVenues = [
      { name: 'Central Auditorium', type: 'academic', capacity: 500, location: 'Academic Building 1' },
      { name: 'Seminar Hall B', type: 'academic', capacity: 120, location: 'Academic Building 2' },
      { name: 'Main Campus Playground', type: 'sports', capacity: 2000, location: 'Sports Complex' },
      { name: 'Indoor Basketball Court', type: 'sports', capacity: 300, location: 'Gymnasium' }
    ];
    const created = await Venue.insertMany(defaultVenues);
    res.json({ message: 'Venues seeded successfully!', venues: created });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;