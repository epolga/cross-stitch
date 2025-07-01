'use client';

import { useState, useEffect } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

interface PayPalData {
  subscriptionID?: string | null;
}

interface PayPalActions {
  subscription: {
    create: (options: { plan_id: string }) => Promise<string>;
  };
}

// Define plan interface
interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  interval: string;
  recommended?: boolean;
}

export function AuthControl() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Validate email format
  const isValidEmail = (email: string) => email.includes('@') && email.includes('.');

  // Check if form is valid for showing PayPal button
  const isFormValid =
    registerEmail.trim() !== '' &&
    confirmEmail.trim() !== '' &&
    isValidEmail(registerEmail) &&
    isValidEmail(confirmEmail) &&
    registerEmail === confirmEmail &&
    registerPassword.trim() !== '' &&
    confirmPassword.trim() !== '' &&
    registerPassword === confirmPassword;

  useEffect(() => {
    console.log('AuthControl component mounted');
  }, []);

  useEffect(() => {
    window.addEventListener('error', (e) => console.error('Global error:', e));
    return () => window.removeEventListener('error', (e) => console.error('Global error:', e));
  }, []);

  useEffect(() => {
    console.log('NEXT_PUBLIC_PAYPAL_CLIENT_ID:', process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'Missing');
    console.log('Running on localhost:', window.location.hostname.includes('localhost'));

    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/subscription/plan', { method: 'POST' });
        const data = await response.json();
        if (response.ok) {
          console.log('Fetched plans:', data);
          const fetchedPlans: SubscriptionPlan[] = [
            {
              id: data.monthlyPlanId || 'P-XXXMONTHLYXXX',
              name: 'Monthly Plan',
              price: '$4.50 / month',
              interval: 'Monthly',
              recommended: true,
            },
            {
              id: data.yearlyPlanId || 'P-XXXYEARLYXXX',
              name: 'Yearly Plan',
              price: '$27 / year',
              interval: 'Yearly',
              recommended: false,
            },
          ];
          setPlans(fetchedPlans);
          setSelectedPlanId(fetchedPlans[0].id); // Default to monthly plan
        } else {
          console.error('Failed to fetch plans:', data.error, 'Status:', response.status);
          setErrorMessage(`Failed to load payment plans: ${data.error}`);
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
        setErrorMessage('Error loading payment plans. Please try again.');
      }
    };
    fetchPlans();
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
      if (!isValidEmail(loginUsername)) {
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

  const handlePayPalSubscription = (data: Record<string, unknown>, actions: PayPalActions) => {
    try {
      console.log('PayPal subscription initiated:', data);
      if (!selectedPlanId) {
        throw new Error('No payment plan selected');
      }

      return actions.subscription.create({
        plan_id: selectedPlanId,
      });
    } catch (error) {
      console.error('Error initiating subscription:', error);
      setErrorMessage('Failed to initiate payment');
      throw error;
    }
  };

  const handlePayPalApprove = async (data: PayPalData) => {
    setIsProcessing(true);
    try {
      if (!data.subscriptionID) {
        throw new Error('No subscription ID provided');
      }
      console.log('PayPal subscription approved:', data.subscriptionID);
      const response = await fetch('/api/subscription/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: data.subscriptionID,
          email: registerEmail,
          password: registerPassword,
          username: registerEmail.split('@')[0], // Derive username from email
        }),
      });

      const result = await response.json();
      console.log('Confirm API response:', result);

      if (response.ok) {
        console.log('Test user registration completed:', registerEmail);
        setIsLoggedIn(true);
        setIsRegisterModalOpen(false);
        setRegisterEmail('');
        setConfirmEmail('');
        setRegisterPassword('');
        setConfirmPassword('');
        setErrorMessage('');
        alert('Test user registration successful! Welcome!');
      } else {
        console.log('Registration failed:', result.message || 'Unknown error');
        setErrorMessage(result.message || 'Failed to complete registration');
      }
    } catch (error) {
      console.error('Error confirming subscription:', error);
      setErrorMessage('Error completing registration. Please try again.');
    } finally {
      setIsProcessing(false);
    }
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
    setRegisterEmail('');
    setConfirmEmail('');
    setRegisterPassword('');
    setConfirmPassword('');
    setErrorMessage('');
    setSelectedPlanId(plans[0]?.id || null); // Reset to default plan
  };

  // Validate email match and format
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setRegisterEmail(email);
    if (!isValidEmail(email)) {
      setErrorMessage('Please enter a valid email address');
    } else if (confirmEmail && email !== confirmEmail) {
      setErrorMessage('Emails do not match');
    } else if (errorMessage === 'Please enter a valid email address' || errorMessage === 'Emails do not match') {
      setErrorMessage('');
    }
  };

  const handleConfirmEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setConfirmEmail(email);
    if (!isValidEmail(email)) {
      setErrorMessage('Please enter a valid email address');
    } else if (registerEmail && email !== registerEmail) {
      setErrorMessage('Emails do not match');
    } else if (errorMessage === 'Please enter a valid email address' || errorMessage === 'Emails do not match') {
      setErrorMessage('');
    }
  };

  // Validate passwords match
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterPassword(e.target.value);
    if (confirmPassword && e.target.value !== confirmPassword) {
      setErrorMessage('Passwords do not match');
    } else if (errorMessage === 'Passwords do not match') {
      setErrorMessage('');
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (registerPassword && e.target.value !== registerPassword) {
      setErrorMessage('Passwords do not match');
    } else if (errorMessage === 'Passwords do not match') {
      setErrorMessage('');
    }
  };

  console.log('Rendering AuthControl, isLoggedIn:', isLoggedIn, 'isLoginModalOpen:', isLoginModalOpen);

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
  if (!clientId) {
    console.error('PayPal client ID is missing');
    setErrorMessage('Payment configuration error');
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId: clientId,
        vault: true,
        intent: 'subscription',
      }}
    >
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
                    required
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
                    required
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
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg">
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
              <div className="space-y-4">
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
                    onChange={handleEmailChange}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your email"
                    aria-label="Email"
                    disabled={isProcessing}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirm-email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Confirm Email
                  </label>
                  <input
                    id="confirm-email"
                    type="email"
                    value={confirmEmail}
                    onChange={handleConfirmEmailChange}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Confirm your email"
                    aria-label="Confirm Email"
                    disabled={isProcessing}
                    required
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
                    onChange={handlePasswordChange}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your password"
                    aria-label="Password"
                    disabled={isProcessing}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Confirm your password"
                    aria-label="Confirm Password"
                    disabled={isProcessing}
                    required
                  />
                </div>
                {/* Plan Selection */}
                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Choose a Subscription Plan</h3>
                  {plans.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {plans.map((plan) => (
                        <div
                          key={plan.id}
                          className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedPlanId === plan.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-300 hover:border-gray-400'
                          } ${plan.recommended ? 'border-2 border-blue-500' : ''}`}
                          onClick={() => setSelectedPlanId(plan.id)}
                        >
                          {plan.recommended && (
                            <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                              Recommended
                            </span>
                          )}
                          <h4 className="text-lg font-semibold">{plan.name}</h4>
                          <p className="text-xl font-bold text-gray-900">{plan.price}</p>
                          <p className="text-sm text-gray-600">Billed {plan.interval}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm text-center">Loading payment plans...</p>
                  )}
                </div>
                {errorMessage && (
                  <p className="text-red-500 text-sm text-center" role="alert">
                    {errorMessage}
                  </p>
                )}
                {selectedPlanId && isFormValid && (
                  <PayPalButtons
                    createSubscription={handlePayPalSubscription}
                    onApprove={handlePayPalApprove}
                    onError={(err) => {
                      console.error('PayPal error:', err);
                      setErrorMessage('Failed to process payment. Please try again.');
                      setIsProcessing(false);
                    }}
                    style={{ layout: 'vertical' }}
                    disabled={isProcessing}
                  />
                )}
              </div>
              <p className="mt-4 text-center text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={handleLoginClick}
                  className="px-2 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-sm"
                  aria-label="Login"
                  disabled={isProcessing}
                >
                  Login
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </PayPalScriptProvider>
  );
}