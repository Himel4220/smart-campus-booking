import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Dashboard({ user }) {
  const [bookings, setBookings] = useState([]);
  const [venues, setVenues] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', venueId: '', bookingType: 'single_day',
    date: '', timeSlot: '', startDate: '', endDate: ''
  });

  const token = localStorage.getItem('token');
  const isRequester = user && (user.role === 'student' || user.role === 'club_executive');
  const isAdmin = user && (user.role === 'academic_admin' || user.role === 'pe_admin');

  useEffect(() => {
    if (!token) return;
    fetchBookings();
    axios.get('http://localhost:5000/api/venues').then(res => setVenues(res.data));
  }, [token]);

  const fetchBookings = () => {
    axios.get('http://localhost:5000/api/bookings', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setBookings(res.data));
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/bookings', form, { headers: { Authorization: `Bearer ${token}` } });
      alert('Booking request submitted successfully!');
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Booking failed');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    let reason = '';
    if (status === 'rejected') {
      reason = prompt('Enter rejection reason:');
      if (reason === null) return;
    }
    try {
      await axios.put(`http://localhost:5000/api/bookings/${id}/status`, { status, rejectionReason: reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  if (!user) return <div className="card"><p>Please login to access dashboard.</p></div>;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Dashboard</h2>
        <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)' }}>
          Welcome back, <strong>{user.name}</strong> ({user.role.replace('_', ' ').toUpperCase()})
        </p>
      </div>

      {isRequester && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginTop: 0, fontSize: '1.15rem' }}>Submit New Booking Request</h3>
          <form onSubmit={handleBookingSubmit}>
            <label>Event Title</label>
            <input type="text" placeholder="e.g. Study Group / Workshop / Tournament" onChange={e => setForm({...form, title: e.target.value})} required />

            <div className="grid-2">
              <div>
                <label>Venue</label>
                <select onChange={e => setForm({...form, venueId: e.target.value})} required>
                  <option value="">Select Venue</option>
                  {venues.map(v => <option key={v._id} value={v._id}>{v.name} ({v.type})</option>)}
                </select>
              </div>
              <div>
                <label>Booking Duration Type</label>
                <select onChange={e => setForm({...form, bookingType: e.target.value})}>
                  <option value="single_day">Single-Day Event (Seminar / Workshop)</option>
                  <option value="multi_day">Multi-Day Event (Tournament)</option>
                </select>
              </div>
            </div>

            {form.bookingType === 'single_day' ? (
              <div className="grid-2">
                <div>
                  <label>Event Date</label>
                  <input type="date" onChange={e => setForm({...form, date: e.target.value})} required />
                </div>
                <div>
                  <label>Time Slot</label>
                  <input type="text" placeholder="e.g. 10:00 AM - 01:00 PM" onChange={e => setForm({...form, timeSlot: e.target.value})} required />
                </div>
              </div>
            ) : (
              <div className="grid-2">
                <div>
                  <label>Start Date</label>
                  <input type="date" onChange={e => setForm({...form, startDate: e.target.value})} required />
                </div>
                <div>
                  <label>End Date</label>
                  <input type="date" onChange={e => setForm({...form, endDate: e.target.value})} required />
                </div>
              </div>
            )}

            <label>Description / Purpose</label>
            <textarea rows="3" placeholder="Describe event purpose..." onChange={e => setForm({...form, description: e.target.value})}></textarea>

            <button type="submit" className="btn">Submit Booking Request</button>
          </form>
        </div>
      )}

      <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>
        {isRequester ? 'Your Submitted Requests' : 'Pending Department Requests (First-Come First-Served Queue)'}
      </h3>

      {bookings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>No booking requests found.</p>
        </div>
      ) : (
        bookings.map((b, index) => (
          <div key={b._id} className="card" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {isAdmin && b.status === 'pending' && (
                    <span style={{ background: '#2563eb', color: '#fff', fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>
                      #{index + 1} Queue Priority
                    </span>
                  )}
                  {b.title}
                </h4>
              </div>

              <div>
                <span className={`status-pill status-${b.status}`} style={{ marginRight: '0.5rem' }}>
                  {b.status}
                </span>
                <span className="type-tag">{b.bookingType === 'single_day' ? 'Single Day' : 'Multi-Day'}</span>
              </div>
            </div>

            <p style={{ margin: '0.4rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <strong>Venue:</strong> {b.venue?.name || 'N/A'} | <strong>Organizer:</strong> {b.requestedBy?.clubName || b.requestedBy?.name}
            </p>

            <p style={{ margin: '0.4rem 0', fontSize: '0.9rem', color: '#1e293b' }}>
              <strong>📅 Requested Schedule:</strong>{' '}
              {b.bookingType === 'single_day'
                ? `${b.date || 'N/A'} (${b.timeSlot || 'N/A'})`
                : `Multi-Day Event: ${b.startDate || 'N/A'} to ${b.endDate || 'N/A'}`}
            </p>

            {b.createdAt && (
              <p style={{ margin: '0.3rem 0', fontSize: '0.8rem', color: '#64748b' }}>
                <strong>⏱ Submitted At:</strong> {new Date(b.createdAt).toLocaleString()}
              </p>
            )}

            {b.description && (
              <p style={{ margin: '0.5rem 0', fontSize: '0.875rem', color: '#475569', background: '#f8fafc', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <strong>Purpose:</strong> {b.description}
              </p>
            )}

            {b.rejectionReason && (
              <p style={{ margin: '0.5rem 0 0 0', color: '#dc2626', fontSize: '0.875rem', fontWeight: 500 }}>
                <strong>Rejection Reason:</strong> {b.rejectionReason}
              </p>
            )}

            {isAdmin && b.status === 'pending' && (
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-approve" onClick={() => handleStatusUpdate(b._id, 'approved')}>
                  ✓ Approve Request
                </button>
                <button className="btn btn-reject" onClick={() => handleStatusUpdate(b._id, 'rejected')}>
                  ✕ Reject Request
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}