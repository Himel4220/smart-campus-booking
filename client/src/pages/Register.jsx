import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'student', clubName: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/auth/register', formData);
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: 'auto', marginTop: '40px' }}>
      <h3>User Registration</h3>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Full Name" onChange={e => setFormData({...formData, name: e.target.value})} required style={{ width: '100%', marginBottom: '10px' }} />
        <input type="email" placeholder="Email" onChange={e => setFormData({...formData, email: e.target.value})} required style={{ width: '100%', marginBottom: '10px' }} />
        <input type="password" placeholder="Password" onChange={e => setFormData({...formData, password: e.target.value})} required style={{ width: '100%', marginBottom: '10px' }} />
        <select onChange={e => setFormData({...formData, role: e.target.value})} style={{ width: '100%', marginBottom: '10px' }}>
          <option value="student">Student</option>
          <option value="club_executive">Club Executive</option>
          <option value="academic_admin">Academic Admin</option>
          <option value="pe_admin">PE Department Admin</option>
        </select>
        {formData.role === 'club_executive' && (
          <input type="text" placeholder="Club Name" onChange={e => setFormData({...formData, clubName: e.target.value})} required style={{ width: '100%', marginBottom: '10px' }} />
        )}
        <button type="submit" style={{ width: '100%' }}>Register</button>
      </form>
    </div>
  );
}