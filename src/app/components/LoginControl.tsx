'use client';

import { useState } from 'react';

export default function LoginControl() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    console.log('Logging in...');
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    console.log('Logging out...');
    setIsLoggedIn(false);
  };

  const handleRegister = () => {
    console.log('Registering...');
    // Optionally set isLoggedIn(true) if registration implies login
  };

  return (
    <div className="flex items-center space-x-2">
      {isLoggedIn ? (
        <button
          onClick={handleLogout}
          className="text-gray-700 hover:text-gray-900 text-xl"
          aria-label="Logout"
        >
          Logout
        </button>
      ) : (
        <>
          <button
            onClick={handleLogin}
            className="text-gray-700 hover:text-gray-900 text-xl"
            aria-label="Login"
          >
            Login
          </button>
          <span className="text-gray-500 text-xl">|</span>
          <button
            onClick={handleRegister}
            className="text-gray-700 hover:text-gray-900 text-xl"
            aria-label="Register"
          >
            Register
          </button>
        </>
      )}
    </div>
  );
}