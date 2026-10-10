import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function LandingPage() {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    axios.get('http://localhost:5000/api/bookings/public')
      .then(res => setEvents(res.data))
      .catch(err => console.error(err));
  }, []);

  const filteredEvents = events.filter(e => filter === 'all' || e.venueType === filter);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Public Event Calendar</h2>
          <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)' }}>Confirmed venue bookings across academic and sports facilities.</p>
        </div>
        <select style={{ width: '180px', margin: 0 }} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Venues</option>
          <option value="academic">Academic Halls</option>
          <option value="sports">Sports Grounds</option>
        </select>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>No approved campus events found.</p>
        </div>
      ) : (
        filteredEvents.map(event => (
          <div key={event._id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{event.title}</h3>
              <span className="type-tag">{event.venueType.toUpperCase()}</span>
            </div>
            <p style={{ margin: '0.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <strong>Venue:</strong> {event.venue?.name} | <strong>Organizer:</strong> {event.requestedBy?.clubName || event.requestedBy?.name}
            </p>
            <p style={{ margin: '0.4rem 0', fontSize: '0.9rem' }}>
              <strong>Schedule:</strong> {event.bookingType === 'single_day' ? `${event.date} (${event.timeSlot})` : `Multi-Day Event (${event.startDate} to ${event.endDate})`}
            </p>
            {event.description && <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#334155' }}>{event.description}</p>}
          </div>
        ))
      )}
    </div>
  );
}