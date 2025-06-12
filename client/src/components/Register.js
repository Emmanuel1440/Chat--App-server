import React, { useState } from 'react';
import { register } from '../services/api';

export default function Register({ onAuth }) {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [avatar, setAvatar] = useState(null);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    setAvatar(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('username', form.username);
    formData.append('email', form.email);
    formData.append('password', form.password);
    if (avatar) formData.append('avatar', avatar);

    try {
      const res = await register(formData);
      localStorage.setItem('token', res.data.token);
      onAuth(res.data.user);
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="container mt-5">
      <h2>Register</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input
          name="username"
          placeholder="Username"
          onChange={handleChange}
          required
          className="form-control my-2"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          onChange={handleChange}
          required
          className="form-control my-2"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          onChange={handleChange}
          required
          className="form-control my-2"
        />
        <input
          type="file"
          name="avatar"
          accept="image/*"
          onChange={handleFileChange}
          className="form-control my-2"
        />
        <button className="btn btn-primary">Register</button>
      </form>
    </div>
  );
}
