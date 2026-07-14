import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Register from "./components/Register";
import Login from "./components/Login";
import Chat from "./components/Chat";
import ToastContainer, { addToast } from "./components/ToastContainer";

function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);

  // Auto-restore login sessions
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error(err);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
  }, []);

  const handleAuth = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setShowLogin(true);
    addToast("Session terminated successfully.");
  };

  const handleRegistrationSuccess = () => {
    setShowLogin(true);
  };

  if (user) {
    return (
      <>
        <ToastContainer />
        <Chat user={user} onLogout={handleLogout} />
      </>
    );
  }

  const fadeSlide = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 },
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 auth-backdrop">
      <ToastContainer />
      <motion.div
        layout
        className="shadow-lg rounded-4 p-4 p-md-5 mx-3 glass-card"
        style={{
          width: "100%",
          maxWidth: "480px",
        }}
      >
        <div className="text-center mb-4">
          <h1 className="text-white fw-bold tracking-tight mb-1" style={{ fontSize: '2.5rem' }}>
            CHATUP <span style={{ fontSize: '1.2rem', verticalAlign: 'super' }}></span>
          </h1>
          <p className="text-light text-opacity-75 small text-uppercase tracking-widest">
            Chat Smarter • Connect Instantly
          </p>
        </div>

        <AnimatePresence mode="wait">
          {showLogin ? (
            <motion.div
              key="login"
              variants={fadeSlide}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <h3 className="text-white fw-bold mb-3 text-center">Sign In</h3>
              <Login onAuth={handleAuth} />

              <div className="text-center mt-4 text-white">
                Don't have an account?{" "}
                <button
                  className="btn btn-link text-warning text-decoration-none fw-bold p-0 ms-1"
                  onClick={() => setShowLogin(false)}
                >
                  Register
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="register"
              variants={fadeSlide}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <h3 className="text-white fw-bold mb-3 text-center">Create Account</h3>
              <Register onRegistered={handleRegistrationSuccess} />

              <div className="text-center mt-4 text-white">
                Already have an account?{" "}
                <button
                  className="btn btn-link text-warning text-decoration-none fw-bold p-0 ms-1"
                  onClick={() => setShowLogin(true)}
                >
                  Login
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default App;