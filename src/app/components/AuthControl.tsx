'use client';

import { useState, useEffect } from 'react';

export default function AuthControl() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    console.log('AuthControl component mounted, isLoggedIn:', isLoggedIn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.addEventListener('error', (e) => console.error('Global error:', e));
    return () => window.removeEventListener('error', (e) => console.error('Global error:', e));
  }, []);

  const handleLoginClick = () => {
    console.log('Login button clicked, opening login modal...');
    setIsLoginModalOpen(true);
    setIsRegisterModalOpen(false);
    setErrorMessage('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted, starting login process');
    try {
      console.log('Validating email:', loginUsername);
      if (!loginUsername.includes('@')) {
        console.log('Invalid email format');
        setErrorMessage('Please enter a valid email address');
        return;
      }

      console.log('Sending login request to API');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginUsername, password: loginPassword }),
      });

      const data = await response.json();
      console.log('API response:', data);

      if (response.ok && data.success) {
        console.log('Login successful:', { username: loginUsername });
        setIsLoggedIn(true);
        setIsLoginModalOpen(false);
        setLoginUsername('');
        setLoginPassword('');
        setErrorMessage('');
      } else {
        console.log('Invalid credentials');
        setErrorMessage(data.error || 'Invalid email or password');
      }
    } catch (error) {
      console.error('Error during login:', error);
      setErrorMessage('An error occurred during login. Please try again.');
    }
  };

  const handleLoginButtonClick = () => {
    console.log('Login submit button clicked');
  };
  
  const handleLogout = () => {
    console.log('Logging out...');
    setIsLoggedIn(false);
  };

  const handleRegisterClick = () => {
    console.log('Register button clicked, opening register modal...');
    setIsRegisterModalOpen(true);
    setIsLoginModalOpen(false);
    setErrorMessage('');
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Mock registration attempt:', {
      username: registerUsername,
      password: registerPassword,
      email: registerEmail,
    });
    setIsLoggedIn(true);
    setIsRegisterModalOpen(false);
    setRegisterUsername('');
    setRegisterPassword('');
    setRegisterEmail('');
  };

  const closeLoginModal = () => {
    console.log('Closing login modal');
    setIsLoginModalOpen(false);
    setLoginUsername('');
    setLoginPassword('');
    setErrorMessage('');
  };

  const closeRegisterModal = () => {
    console.log('Closing register modal');
    setIsRegisterModalOpen(false);
    setRegisterUsername('');
    setRegisterPassword('');
    setRegisterEmail('');
  };

  console.log('Rendering AuthControl, isLoggedIn:', isLoggedIn, 'isLoginModalOpen:', isLoginModalOpen);

  return (
    <div className="flex items-center space-x-2">      
      {isLoggedIn ? (
        <button
          onClick={handleLogout}
          className="text-gray-700 hover:text-gray-900 text-xl cursor-pointer pointer-events-auto"
          aria-label="Logout"
        >
          Logout
        </button>
      ) : (
        <>
          <button
            onClick={handleLoginClick}
            className="text-gray-500 hover:text-gray-900 text-xl cursor-pointer pointer-events-auto"
            aria-label="Login"
          >
            Login
          </button>
          <span className="text-gray-500 text-xl">|</span>
          <button
            onClick={handleRegisterClick}
            className="text-gray-500 hover:text-gray-900 text-xl cursor-pointer pointer-events-auto"
            aria-label="Register"
          >
            Register
          </button>
        </>
      )}

      {/* Login Modal */}
      {isLoginModalOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(17, 24, 39, 0.5)' }}
        >
          <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Login</h2>
              <button
                onClick={closeLoginModal}
                className="text-gray-500 hover:text-gray-700 text-xl"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-username" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="login-username"
                  type="email"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                  aria-label="Email"
                />
              </div>
              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                  aria-label="Password"
                />
              </div>
              {errorMessage && (
                <p className="text-red-500 text-sm text-center" role="alert">
                  {errorMessage}
                </p>
              )}
              <button
                type="submit"
                onClick={handleLoginButtonClick}
                className="w-full px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                aria-label="Login"
              >
                Login
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-gray-600">
              Don’t have an account?{' '}
              <button
                onClick={handleRegisterClick}
                className="px-2 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-sm"
                aria-label="Register"
              >
                Register
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {isRegisterModalOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(17, 24, 39, 0.5)' }}
        >
          <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Register</h2>
              <button
                onClick={closeRegisterModal}
                className="text-gray-500 hover:text-gray-700 text-xl"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="register-username"
                  className="block text-sm font-medium text-gray-700"
                >
                  Username
                </label>
                <input
                  id="register-username"
                  type="text"
                  value={registerUsername}
                  onChange={(e) => setRegisterUsername(e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your username"
                  aria-label="Username"
                />
              </div>
              <div>
                <label
                  htmlFor="register-password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  id="register-password"
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                  aria-label="Password"
                />
              </div>
              <div>
                <label
                  htmlFor="register-email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  id="register-email"
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                  aria-label="Email"
                />
              </div>
              <button
                type="submit"
                className="w-full px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                aria-label="Register"
              >
                Register
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-gray-600">
              Already have an account?{' '}
             <button
                onClick={handleLoginClick}
                className="px-2 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-sm"
                aria-label="Login"
              >
                Login
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}