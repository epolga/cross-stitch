'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

interface PayPalData {
  subscriptionID?: string | null;
}

interface PayPalActions {
  subscription: {
    create: (options: { plan_id: string; custom_id?: string }) => Promise<string>;
  };
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  interval: string;
  recommended?: boolean;
}

interface TrialStatusResponse {
  status: 'NOT_STARTED' | 'ACTIVE' | 'LIMIT_REACHED' | 'EXPIRED';
  available: boolean;
  startedAt?: string;
  endsAt?: string;
  downloadLimit: number;
  downloadsUsed: number;
  downloadsRemaining: number;
  durationDays?: number;
}

interface SubscriptionStatusResponse {
  active?: boolean;
  status?: string;
  error?: string;
  trial?: TrialStatusResponse;
}

interface StartTrialResponse {
  outcome?:
    | 'USER_CREATED_AND_STARTED'
    | 'STARTED'
    | 'ALREADY_STARTED'
    | 'SUBSCRIPTION_ACTIVE'
    | 'SUBSCRIPTION_INACTIVE'
    | 'MISSING_REGISTRATION_FIELDS';
  trial?: TrialStatusResponse;
  error?: string;
}

interface RegisterFormProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginClick: () => void;
  onRegisterSuccess: () => void;
  isLoggedIn?: boolean;
  currentEmail?: string;
}

const DEFAULT_TRIAL_LIMIT = 10;
const DEFAULT_TRIAL_DURATION_DAYS = 30;
const DEFAULT_MONTHLY_PLAN_ID = 'P-4JN53753JF067172ANGILEGY';
const DEFAULT_YEARLY_PLAN_ID = 'P-4R88162396385170BNGILF7Y';

export function RegisterForm({
  isOpen,
  onClose,
  onLoginClick,
  onRegisterSuccess,
  isLoggedIn = false,
  currentEmail = '',
}: RegisterFormProps) {
  const [registerEmail, setRegisterEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [receiveUpdates, setReceiveUpdates] = useState(true);

  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatusResponse | null>(null);

  const isValidEmail = (email: string): boolean =>
    email.includes('@') && email.includes('.');

  const normalizedCurrentEmail = currentEmail.trim().toLowerCase();

  const effectiveEmail = useMemo(() => {
    if (isLoggedIn && normalizedCurrentEmail) return normalizedCurrentEmail;
    return registerEmail.trim().toLowerCase();
  }, [isLoggedIn, normalizedCurrentEmail, registerEmail]);

  const isFormValid = useMemo(() => {
    if (isLoggedIn) {
      return isValidEmail(effectiveEmail);
    }

    return (
      registerEmail.trim() !== '' &&
      confirmEmail.trim() !== '' &&
      isValidEmail(registerEmail) &&
      isValidEmail(confirmEmail) &&
      registerEmail === confirmEmail &&
      registerPassword.trim() !== '' &&
      confirmPassword.trim() !== '' &&
      registerPassword === confirmPassword
    );
  }, [
    isLoggedIn,
    effectiveEmail,
    registerEmail,
    confirmEmail,
    registerPassword,
    confirmPassword,
  ]);

  const trialStatus = subscriptionStatus?.trial;
  const hasActiveSubscription = subscriptionStatus?.active === true;
  const isSubscriptionInactive = subscriptionStatus?.status === 'INACTIVE_RECORDED';
  const canStartTrial =
    !hasActiveSubscription &&
    !isSubscriptionInactive &&
    (!trialStatus || trialStatus.status === 'NOT_STARTED');

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
  const hasPayPalClientId = clientId.trim().length > 0;

  const dispatchAuthStateChange = useCallback((): void => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new Event('authStateChange'));
  }, []);

  const persistLogin = useCallback((email: string): void => {
    if (typeof window === 'undefined') return;
    const normalized = email.trim().toLowerCase();
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', normalized);
    dispatchAuthStateChange();
  }, [dispatchAuthStateChange]);

  const resetFormState = (): void => {
    setErrorMessage('');
    setInfoMessage('');
    setRegisterPassword('');
    setConfirmPassword('');
    if (!isLoggedIn) {
      setRegisterEmail('');
      setConfirmEmail('');
      setReceiveUpdates(true);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setSubscriptionStatus(null);
      setIsCheckingSubscription(false);
      return;
    }

    setErrorMessage('');
    setInfoMessage('');

    if (isLoggedIn && normalizedCurrentEmail) {
      setRegisterEmail(normalizedCurrentEmail);
      setConfirmEmail(normalizedCurrentEmail);
    }
  }, [isOpen, isLoggedIn, normalizedCurrentEmail]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchPlans = async (): Promise<void> => {
      try {
        const response = await fetch('/api/subscription/plan', { method: 'POST' });
        const data = (await response.json().catch(() => null)) as
          | { monthlyPlanId?: string; yearlyPlanId?: string; error?: string }
          | null;

        if (!response.ok) {
          setErrorMessage(data?.error || 'Failed to load payment plans.');
          return;
        }

        const fetchedPlans: SubscriptionPlan[] = [
          {
            id: data?.monthlyPlanId || DEFAULT_MONTHLY_PLAN_ID,
            name: 'Monthly Plan',
            price: '$4.50 / month',
            interval: 'Monthly',
            recommended: true,
          },
          {
            id: data?.yearlyPlanId || DEFAULT_YEARLY_PLAN_ID,
            name: 'Yearly Plan',
            price: '$27 / year',
            interval: 'Yearly',
            recommended: false,
          },
        ];

        setPlans(fetchedPlans);
        setSelectedPlanId((prev) => prev || fetchedPlans[0]?.id || null);
      } catch (error) {
        console.error('Error fetching plans:', error);
        setErrorMessage('Error loading payment plans. Please try again.');
      }
    };

    void fetchPlans();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const notifyAdmin = async (): Promise<void> => {
      try {
        await fetch('/api/notify-admin', { method: 'POST' });
      } catch (error) {
        console.error('Failed to send email notification to admin:', error);
      }
    };

    void notifyAdmin();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!isValidEmail(effectiveEmail)) {
      setSubscriptionStatus(null);
      setIsCheckingSubscription(false);
      return;
    }

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(() => {
      const checkSubscriptionStatus = async (): Promise<void> => {
        setIsCheckingSubscription(true);

        try {
          const response = await fetch('/api/subscription/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: effectiveEmail }),
            signal: abortController.signal,
          });

          const data = (await response
            .json()
            .catch(() => null)) as SubscriptionStatusResponse | null;

          if (response.ok) {
            setSubscriptionStatus(data);
            return;
          }

          setSubscriptionStatus(null);
          setErrorMessage(data?.error || 'Unable to verify subscription status.');
        } catch (error: unknown) {
          if (error instanceof Error && error.name === 'AbortError') return;
          console.error('Error checking subscription status:', error);
          setSubscriptionStatus(null);
          setErrorMessage('Unable to verify subscription status.');
        } finally {
          setIsCheckingSubscription(false);
        }
      };

      void checkSubscriptionStatus();
    }, 300);

    return () => {
      abortController.abort();
      window.clearTimeout(timeoutId);
    };
  }, [isOpen, effectiveEmail]);

  const handlePayPalSubscription = (
    data: Record<string, unknown>,
    actions: PayPalActions,
  ) => {
    try {
      if (!selectedPlanId) {
        throw new Error('No payment plan selected');
      }

      return actions.subscription.create({
        plan_id: selectedPlanId,
        custom_id: effectiveEmail,
      });
    } catch (error) {
      console.error('Error initiating subscription:', error, data);
      setErrorMessage('Failed to initiate payment.');
      throw error;
    }
  };

  const handlePayPalApprove = async (data: PayPalData): Promise<void> => {
    setIsProcessing(true);
    setErrorMessage('');

    try {
      if (!data.subscriptionID) {
        throw new Error('No subscription ID provided');
      }

      const response = await fetch('/api/subscription/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: data.subscriptionID,
          email: effectiveEmail,
          password: isLoggedIn ? undefined : registerPassword,
          username: effectiveEmail.split('@')[0],
          receiveUpdates,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;

      if (!response.ok) {
        setErrorMessage(result?.error || 'Failed to complete subscription.');
        return;
      }

      if (typeof window !== 'undefined') {
        const pendingDownload = localStorage.getItem('pendingDownload');
        if (pendingDownload) {
          localStorage.setItem('pendingPaidAccessGranted', 'true');
        }
      }

      persistLogin(effectiveEmail);
      resetFormState();
      onRegisterSuccess();
    } catch (error) {
      console.error('Error confirming subscription:', error);
      setErrorMessage('Error completing subscription. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartTrial = useCallback(async (): Promise<void> => {
    setErrorMessage('');
    setInfoMessage('');

    if (!isValidEmail(effectiveEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!isLoggedIn && !isFormValid) {
      setErrorMessage('Please complete registration fields to start your trial.');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/trial/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: effectiveEmail,
          password: isLoggedIn ? undefined : registerPassword,
          firstName: effectiveEmail.split('@')[0] || 'User',
          username: effectiveEmail.split('@')[0] || 'user',
          receiveUpdates,
        }),
      });

      const result = (await response.json().catch(() => null)) as StartTrialResponse | null;

      if (!response.ok) {
        setErrorMessage(result?.error || 'Unable to start free trial.');
        return;
      }

      if (result?.trial) {
        setSubscriptionStatus((prev) => ({ ...(prev || {}), trial: result.trial }));
      }

      if (result?.outcome === 'SUBSCRIPTION_INACTIVE') {
        setErrorMessage('Subscription expired. Renew to continue.');
        return;
      }

      if (result?.outcome === 'SUBSCRIPTION_ACTIVE') {
        persistLogin(effectiveEmail);
        setInfoMessage('Subscription active. You have unlimited downloads.');
        onRegisterSuccess();
        return;
      }

      persistLogin(effectiveEmail);

      const limit = result?.trial?.downloadLimit ?? DEFAULT_TRIAL_LIMIT;
      const days = result?.trial?.durationDays ?? DEFAULT_TRIAL_DURATION_DAYS;
      setInfoMessage(`Trial started: ${limit} downloads available for ${days} days.`);

      onRegisterSuccess();
    } catch (error) {
      console.error('Error starting trial:', error);
      setErrorMessage('Unable to start free trial. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [
    effectiveEmail,
    isLoggedIn,
    isFormValid,
    onRegisterSuccess,
    persistLogin,
    receiveUpdates,
    registerPassword,
  ]);

  const handleEmailChange = (value: string): void => {
    setRegisterEmail(value);
    if (!isValidEmail(value)) {
      setErrorMessage('Please enter a valid email address');
    } else if (confirmEmail && value !== confirmEmail) {
      setErrorMessage('Emails do not match');
    } else if (
      errorMessage === 'Please enter a valid email address' ||
      errorMessage === 'Emails do not match'
    ) {
      setErrorMessage('');
    }
  };

  const handleConfirmEmailChange = (value: string): void => {
    setConfirmEmail(value);
    if (!isValidEmail(value)) {
      setErrorMessage('Please enter a valid email address');
    } else if (registerEmail && value !== registerEmail) {
      setErrorMessage('Emails do not match');
    } else if (
      errorMessage === 'Please enter a valid email address' ||
      errorMessage === 'Emails do not match'
    ) {
      setErrorMessage('');
    }
  };

  const handlePasswordChange = (value: string): void => {
    setRegisterPassword(value);
    if (confirmPassword && value !== confirmPassword) {
      setErrorMessage('Passwords do not match');
    } else if (errorMessage === 'Passwords do not match') {
      setErrorMessage('');
    }
  };

  const handleConfirmPasswordChange = (value: string): void => {
    setConfirmPassword(value);
    if (registerPassword && value !== registerPassword) {
      setErrorMessage('Passwords do not match');
    } else if (errorMessage === 'Passwords do not match') {
      setErrorMessage('');
    }
  };

  if (!isOpen) return null;

  const trialRemaining = trialStatus?.downloadsRemaining ?? DEFAULT_TRIAL_LIMIT;
  const trialLimit = trialStatus?.downloadLimit ?? DEFAULT_TRIAL_LIMIT;

  return (
    <PayPalScriptProvider
      options={{
        clientId: hasPayPalClientId ? clientId : 'test',
        vault: true,
        intent: 'subscription',
      }}
    >
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50"
        style={{ backgroundColor: 'rgba(17, 24, 39, 0.5)' }}
      >
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Download Access</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
              aria-label="Close modal"
            >
              x
            </button>
          </div>

          <p className="text-sm text-gray-700 mb-4">
            Create account to download patterns. Start free trial ({trialLimit} downloads) or
            subscribe monthly/yearly for unlimited access. Cancel anytime.
          </p>

          {isLoggedIn && normalizedCurrentEmail && (
            <p className="text-sm text-gray-700 mb-4">
              Logged in as <span className="font-medium">{normalizedCurrentEmail}</span>
            </p>
          )}

          {!isLoggedIn && (
            <div className="space-y-4">
              <div>
                <label htmlFor="register-email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="register-email"
                  type="email"
                  value={registerEmail}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Enter your email"
                  aria-label="Email"
                  disabled={isProcessing}
                  required
                />
              </div>

              <div>
                <label htmlFor="confirm-email" className="block text-sm font-medium text-gray-700">
                  Confirm Email
                </label>
                <input
                  id="confirm-email"
                  type="email"
                  value={confirmEmail}
                  onChange={(e) => handleConfirmEmailChange(e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md"
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
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md"
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
                  onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Confirm your password"
                  aria-label="Confirm Password"
                  disabled={isProcessing}
                  required
                />
              </div>
            </div>
          )}

          <div className="flex items-center mt-4">
            <input
              id="receive-updates"
              type="checkbox"
              checked={receiveUpdates}
              onChange={(e) => setReceiveUpdates(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              disabled={isProcessing}
            />
            <label htmlFor="receive-updates" className="ml-2 block text-sm text-gray-700">
              Send me updates on new designs
            </label>
          </div>

          {isCheckingSubscription && isValidEmail(effectiveEmail) && (
            <p className="text-gray-600 text-sm text-center mt-4" role="status">
              Checking subscription status...
            </p>
          )}

          {hasActiveSubscription && (
            <p className="text-green-700 text-sm text-center mt-4" role="status">
              Subscription active. You have unlimited downloads.
            </p>
          )}

          {!hasActiveSubscription && trialStatus?.status === 'ACTIVE' && (
            <p className="text-blue-700 text-sm text-center mt-4" role="status">
              Trial active: {trialRemaining} downloads left.
            </p>
          )}

          {!hasActiveSubscription && trialStatus?.status === 'LIMIT_REACHED' && (
            <p className="text-amber-700 text-sm text-center mt-4" role="status">
              Trial limit reached. Subscribe for unlimited access.
            </p>
          )}

          {!hasActiveSubscription && trialStatus?.status === 'EXPIRED' && (
            <p className="text-amber-700 text-sm text-center mt-4" role="status">
              Trial expired. Subscribe for unlimited access.
            </p>
          )}

          {!hasActiveSubscription && subscriptionStatus?.status === 'INACTIVE_RECORDED' && (
            <p className="text-amber-700 text-sm text-center mt-4" role="status">
              Subscription expired. Renew to continue.
            </p>
          )}

          {errorMessage && (
            <p className="text-red-500 text-sm text-center mt-4" role="alert">
              {errorMessage}
            </p>
          )}

          {infoMessage && (
            <p className="text-green-700 text-sm text-center mt-4" role="status">
              {infoMessage}
            </p>
          )}

          {!hasActiveSubscription && canStartTrial && (
            <button
              type="button"
              onClick={() => {
                void handleStartTrial();
              }}
              disabled={isProcessing || isCheckingSubscription || !isFormValid}
              className="mt-5 w-full rounded-md bg-gray-700 px-3 py-2 text-white hover:bg-gray-800 disabled:opacity-50"
            >
              Start Free Trial ({trialLimit} downloads)
            </button>
          )}

          {!hasActiveSubscription && (
            <div className="mt-6">
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
          )}

          {!hasActiveSubscription && !hasPayPalClientId && (
            <p className="text-red-500 text-sm text-center mt-4" role="alert">
              Payment configuration error: missing NEXT_PUBLIC_PAYPAL_CLIENT_ID.
            </p>
          )}

          {selectedPlanId &&
            isFormValid &&
            !hasActiveSubscription &&
            !isCheckingSubscription &&
            hasPayPalClientId && (
              <div className="mt-4">
                <PayPalButtons
                  createSubscription={handlePayPalSubscription}
                  onApprove={handlePayPalApprove}
                  onError={(error) => {
                    console.error('PayPal error:', error);
                    setErrorMessage('Failed to process payment. Please try again.');
                    setIsProcessing(false);
                  }}
                  style={{ layout: 'vertical' }}
                  disabled={isProcessing}
                />
              </div>
            )}

          {!isLoggedIn && (
            <p className="mt-4 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={onLoginClick}
                className="px-2 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-sm"
                aria-label="Login"
                disabled={isProcessing}
              >
                Login
              </button>
            </p>
          )}
        </div>
      </div>
    </PayPalScriptProvider>
  );
}
