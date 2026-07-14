import React, { useState } from 'react';
import { addToast } from './ToastContainer';

export default function Register({ onRegistered }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        addToast('Avatar size must be smaller than 2MB.', 'danger');
        return;
      }
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return addToast('Passwords do not match.', 'danger');
    }
    if (password.length < 6) {
      return addToast('Password must be at least 6 characters long.', 'danger');
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('username', username.trim());
    formData.append('email', email.trim().toLowerCase());
    formData.append('password', password);
    if (avatar) {
      formData.append('avatar', avatar);
    }

    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      addToast('Registration Successful! Please log in to your account.');
      onRegistered();
    } catch (err) {
      addToast(err.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="d-flex flex-column gap-3 text-white">
      {/* Avatar upload & Preview */}
      <div className="d-flex flex-column align-items-center gap-2">
        <div className="position-relative">
          <img
            src={avatarPreview || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
            alt="profile preview"
            className="rounded-circle border border-2 border-white shadow"
            style={{ width: '80px', height: '80px', objectFit: 'cover' }}
          />
          <label
            htmlFor="avatar-upload"
            className="btn btn-warning rounded-circle position-absolute bottom-0 end-0 p-0 d-flex align-items-center justify-content-center shadow-sm"
            style={{ width: '28px', height: '28px', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            📸
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="d-none"
            onChange={handleAvatarChange}
          />
        </div>
        <span className="small text-light text-opacity-75">Upload Profile Photo (Optional)</span>
      </div>

      <div className="row g-2">
        <div className="col-md-6">
          <label className="form-label small text-uppercase tracking-wider fw-bold mb-1">Username</label>
          <input
            type="text"
            className="form-control bg-white bg-opacity-10 border-0 text-white shadow-none rounded-3 py-2 px-3"
           // placeholder="JohnDoe"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label small text-uppercase tracking-wider fw-bold mb-1">Email</label>
          <input
            type="email"
            className="form-control bg-white bg-opacity-10 border-0 text-white shadow-none rounded-3 py-2 px-3"
            //placeholder="john@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="row g-2">
        <div className="col-md-6">
          <label className="form-label small text-uppercase tracking-wider fw-bold mb-1">Password</label>
          <input
            type="password"
            className="form-control bg-white bg-opacity-10 border-0 text-white shadow-none rounded-3 py-2"
            //placeholder="••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label small text-uppercase tracking-wider fw-bold mb-1">Confirm Password</label>
          <input
            type="password"
            className="form-control bg-white bg-opacity-10 border-0 text-white shadow-none rounded-3 py-2"
           // placeholder="••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
      </div>

      <button
        type="submit"
        className="btn btn-warning py-2 rounded-3 fw-bold mt-2 d-flex align-items-center justify-content-center gap-2 shadow"
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="spinner-border spinner-border-sm" role="status" />
            Creating Account...
          </>
        ) : (
          'Create Free Account'
        )}
      </button>
    </form>
  );
}