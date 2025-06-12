import React, { useState } from 'react';
import { login } from '../services/api';

export default function Login({ onAuth }) {
  const [form, setForm] = useState({ email: '', password: '' });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await login(form);
      localStorage.setItem('token', res.data.token);
      onAuth(res.data.user);
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="container mt-5">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input name="email" type="email" placeholder="Email" onChange={handleChange} required className="form-control my-2" />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} required className="form-control my-2" />
        <button className="btn btn-success">Login</button>
      </form>
    </div>
  );
}
