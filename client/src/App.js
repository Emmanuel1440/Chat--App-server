import React, { useState, useEffect } from 'react';
import Register from './components/Register';
import Login from './components/Login';
import Chat from './components/Chat';
import {jwtDecode} from 'jwt-decode';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token)  {
      const decoded = jwtDecode(token);
      setUser(decoded);//{id,iat,exp}

    }
  },[]);
  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  //Check if user is logged in



  if (!user) {
    return (
      <>
        <Register onAuth={(u) => setUser(jwtDecode(localStorage.getItem('token')))} />
        <hr />
        <Login onAuth={(u) => setUser(jwtDecode(localStorage.getItem('token')))} />
      </>
    );
  }

  return <Chat user={user} onLogout={handleLogout} />;
}

export default App;
