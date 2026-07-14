import React, { useState } from 'react';
import { addToast } from './ToastContainer';

export default function Login({ onAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return addToast('Please enter both email and password.', 'danger');
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed.');
      }

      addToast('Login successful! Welcome back.');
      onAuth(data.token, data.user);
    } catch (err) {
      addToast(err.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="d-flex flex-column gap-3 text-white">
      <div>
        <label className="form-label small text-uppercase tracking-wider fw-bold">Email Address</label>
        <input
          type="email"
          className="form-control bg-white bg-opacity-10 border-0 text-white shadow-none rounded-3 py-2 px-3"
         // placeholder="yourname@domain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="form-label small text-uppercase tracking-wider fw-bold">Password</label>
        <div className="position-relative">
          <input
            type={showPassword ? 'text' : 'password'}
            className="form-control bg-white bg-opacity-10 border-0 text-white shadow-none rounded-3 py-2 px-3 pe-5"
           // placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-white text-opacity-70 text-decoration-none shadow-none pe-3"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? '🐵' : '🙈'}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="btn btn-warning py-2 rounded-3 fw-bold mt-3 d-flex align-items-center justify-content-center gap-2 shadow"
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
            Signing In...
          </>
        ) : (
          'Access ChatRoom'
        )}
      </button>
    </form>
  );
}