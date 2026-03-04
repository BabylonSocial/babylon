'use client';

import {
  createPointsPayment,
  createStripeCheckout,
  verifyPointsPayment,
} from '@babylon/api-hooks';
import { cn, logger, WALLET_ERROR_MESSAGES } from '@babylon/shared';
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { Address } from 'viem';
import { Skeleton } from '@/components/shared/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useBuyPointsTx } from '@/hooks/useBuyPointsTx';
import { useWalletFunding } from '@/hooks/useWalletFunding';
import { getExplorerTxUrl } from '@/lib/chain';
import { isStripeEnabled } from '@/lib/stripe';

/**
 * Buy points modal component for purchasing points with ETH or credit card.
 *
 * Provides a multi-step payment flow for buying points using either:
 * - ETH from smart wallet (crypto)
 * - Credit card via Stripe Checkout
 *
 * Features:
 * - Payment method selection (crypto vs card)
 * - USD amount input
 * - ETH conversion (for crypto)
 * - Smart wallet funding (if needed)
 * - Stripe Checkout redirect (for card)
 * - Payment processing
 * - Point award verification
 * - Multi-step flow (input → payment → verifying → success/error)
 * - Loading states
 * - Error handling
 * - Body scroll lock and escape key handling
 * - Cancellable async operations with AbortController
 *
 * @param props - BuyPointsModal component props
 * @returns Buy points modal element or null if not open
 *
 * @example
 * ```tsx
 * <BuyPointsModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onSuccess={() => refreshBalance()}
 * />
 * ```
 */
interface BuyPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Payment step type for buy points flow.
 */
type PaymentStep = 'input' | 'payment' | 'verifying' | 'success' | 'error';

/**
 * Payment method type.
 */
type PaymentMethod = 'crypto' | 'stripe';

/**
 * Payment request structure for point purchase.
 */
interface PaymentRequest {
  requestId: string;
  to: string;
  from: string;
  amount: string;
}

export function BuyPointsModal({
  isOpen,
  onClose,
  onSuccess,
}: BuyPointsModalProps) {
  const { user, embeddedWalletAddress, embeddedWalletReady } = useAuth();
  const { sendPointsPayment } = useBuyPointsTx();
  const { ensureFunds } = useWalletFunding();

  const [amountUSD, setAmountUSD] = useState('10');
  const [step, setStep] = useState<PaymentStep>('input');
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pointsAwarded, setPointsAwarded] = useState(0);
  const [walletInitializing, setWalletInitializing] = useState(false);

  // Check if Stripe is available
  const stripeAvailable = isStripeEnabled();

  // Determine available payment methods
  const canUseCrypto = !!embeddedWalletAddress;
  const canUseStripe = stripeAvailable;
  const hasAnyPaymentMethod = canUseCrypto || canUseStripe;

  // Track if user has manually selected a payment method
  const [userSelectedMethod, setUserSelectedMethod] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() => {
    // Default to Stripe if available and user has no wallet, otherwise crypto
    if (stripeAvailable && !embeddedWalletAddress) {
      return 'stripe';
    }
    return 'crypto';
  });

  // Handle user selecting a payment method
  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setUserSelectedMethod(true);
    setPaymentMethod(method);
  };

  // Only auto-switch if user hasn't manually selected AND no payment methods available
  // Don't auto-switch away from user's choice - let them see the "no wallet" message
  useEffect(() => {
    // Only auto-switch on initial mount if user hasn't made a selection
    if (!userSelectedMethod) {
      // If currently on crypto but no wallet, switch to stripe if available
      if (paymentMethod === 'crypto' && !canUseCrypto && canUseStripe) {
        setPaymentMethod('stripe');
      }
    }
  }, [canUseCrypto, canUseStripe, paymentMethod, userSelectedMethod]);

  // AbortController for canceling async operations
  const abortControllerRef = useRef<AbortController | null>(null);

  // Ref to track embeddedWalletReady state for use in async callbacks (avoids stale closure)
  const embeddedWalletReadyRef = useRef(embeddedWalletReady);

  // Ref to track if component is mounted
  const isMountedRef = useRef(true);

  // Keep ref updated when embeddedWalletReady changes
  useEffect(() => {
    embeddedWalletReadyRef.current = embeddedWalletReady;
  }, [embeddedWalletReady]);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Cancel any in-flight operations
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      // Reset state after animation completes
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current) {
          setAmountUSD('10');
          setStep('input');
          setLoading(false);
          setTxHash(null);
          setError(null);
          setPointsAwarded(0);
          setWalletInitializing(false);
          // Reset payment method selection - stripe preferred if available
          setPaymentMethod(stripeAvailable ? 'stripe' : 'crypto');
          setUserSelectedMethod(false);
        }
      }, 300);

      // Cleanup timeout if component unmounts or modal reopens
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [isOpen, stripeAvailable]);

  // Handle escape key and body scroll lock
  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = '';
      return;
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading && step === 'input') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, loading, step]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
      // Cancel any in-flight operations on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  const amountNum = Number.parseFloat(amountUSD) || 0;
  const pointsAmount = Math.floor(amountNum * 100);

  /**
   * Waits for the embedded wallet to be ready with proper interval-based polling.
   * Uses refs to avoid stale closure issues and supports cancellation.
   */
  const waitForWalletReady = (signal: AbortSignal): Promise<boolean> => {
    return new Promise((resolve) => {
      // If already aborted, resolve immediately
      if (signal.aborted) {
        resolve(false);
        return;
      }

      // If already ready, resolve immediately
      if (embeddedWalletReadyRef.current) {
        resolve(true);
        return;
      }

      const maxWaitTime = 5000;
      const checkInterval = 100;
      const startTime = Date.now();

      const intervalId = setInterval(() => {
        // Check if cancelled
        if (signal.aborted) {
          clearInterval(intervalId);
          resolve(false);
          return;
        }

        // Check if wallet is ready
        if (embeddedWalletReadyRef.current) {
          clearInterval(intervalId);
          resolve(true);
          return;
        }

        // Check if timeout exceeded
        if (Date.now() - startTime >= maxWaitTime) {
          clearInterval(intervalId);
          resolve(false);
          return;
        }
      }, checkInterval);

      // Handle abort during wait
      signal.addEventListener(
        'abort',
        () => {
          clearInterval(intervalId);
          resolve(false);
        },
        { once: true }
      );
    });
  };

  /**
   * Handle Stripe Checkout - redirects to Stripe hosted checkout
   */
  const handleStripeCheckout = async () => {
    if (!user) {
      toast.error('Please sign in to continue');
      return;
    }

    if (amountNum < 1) {
      toast.error('Minimum purchase is $1');
      return;
    }

    if (amountNum > 1000) {
      toast.error('Maximum purchase is $1000');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await createStripeCheckout({ amountUSD: amountNum });

      // Redirect to Stripe Checkout
      // Points will be credited via webhook after successful payment
      window.location.href = data.url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error';
      logger.error(
        'Stripe checkout failed',
        { error: errorMessage },
        'BuyPointsModal'
      );
      setError(errorMessage);
      setStep('error');
      toast.error('Failed to connect to payment server');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async () => {
    if (!user || !embeddedWalletAddress) {
      toast.error(WALLET_ERROR_MESSAGES.NO_EMBEDDED_WALLET);
      return;
    }

    if (amountNum < 1) {
      toast.error('Minimum purchase is $1');
      return;
    }

    if (amountNum > 1000) {
      toast.error('Maximum purchase is $1000');
      return;
    }

    // Create abort controller FIRST - before any async operations
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Check if embedded wallet is ready, if not wait for initialization
    if (!embeddedWalletReady) {
      setWalletInitializing(true);
      toast.info('Initializing wallet...');

      const isReady = await waitForWalletReady(signal);

      // Check if cancelled during wait
      if (signal.aborted || !isMountedRef.current) {
        setWalletInitializing(false);
        return;
      }

      setWalletInitializing(false);

      if (!isReady) {
        toast.error(
          'Wallet is still initializing. Please try again in a moment.'
        );
        abortControllerRef.current = null;
        return;
      }

      toast.success('Wallet ready!');
    }

    setLoading(true);
    setError(null);

    try {
      // Create payment request with abort signal (auth handled by orvalFetch)
      const data = await createPointsPayment(
        { amountUSD: amountNum, fromAddress: embeddedWalletAddress },
        { signal }
      );

      // Check if cancelled after fetch
      if (signal.aborted || !isMountedRef.current) {
        setLoading(false);
        return;
      }

      setStep('payment');

      // Initiate blockchain transaction
      await handleSendPayment(data.paymentRequest, signal);
    } catch (err) {
      // Handle abort errors silently
      if (err instanceof Error && err.name === 'AbortError') {
        setLoading(false);
        return;
      }

      // Only propagate non-cancellation errors
      if (err instanceof Error && !err.message.includes('cancelled')) {
        const errorMessage = err.message || 'Payment failed';
        logger.error(
          'Payment failed',
          { error: errorMessage },
          'BuyPointsModal'
        );
        if (isMountedRef.current) {
          setError(errorMessage);
          setStep('error');
          toast.error('Payment transaction failed');
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      // Clean up abort controller after operation completes
      abortControllerRef.current = null;
    }
  };

  const handleSendPayment = async (
    paymentRequest: PaymentRequest,
    signal: AbortSignal
  ) => {
    setLoading(true);
    setStep('payment');

    // Use ref for consistent check (avoids stale closure)
    if (!embeddedWalletReadyRef.current || !embeddedWalletAddress) {
      const errorMessage = WALLET_ERROR_MESSAGES.NO_EMBEDDED_WALLET;
      logger.error('Payment failed', { error: errorMessage }, 'BuyPointsModal');
      setError(errorMessage);
      setStep('error');
      toast.error('Payment transaction failed');
      setLoading(false);
      return;
    }

    try {
      const requiredAmountWei = BigInt(paymentRequest.amount);

      // Use shared hook with abort signal
      await ensureFunds(embeddedWalletAddress, requiredAmountWei, { signal });

      // Check if operation was cancelled after funding
      if (signal.aborted || !isMountedRef.current) {
        setLoading(false);
        return;
      }

      const hash = await sendPointsPayment({
        to: paymentRequest.to as Address,
        amountWei: requiredAmountWei,
      });

      // Check if cancelled after payment
      if (signal.aborted || !isMountedRef.current) {
        setLoading(false);
        return;
      }

      setTxHash(hash);
      setStep('verifying');

      // Verify payment and credit points
      await handleVerifyPayment(
        paymentRequest.requestId,
        hash,
        paymentRequest,
        signal
      );
    } catch (err) {
      // Don't show error if operation was cancelled
      if (err instanceof Error && err.message === 'Operation cancelled') {
        setLoading(false);
        return;
      }
      throw err;
    }
  };

  const handleVerifyPayment = async (
    requestId: string,
    transactionHash: string,
    paymentRequest: PaymentRequest,
    signal: AbortSignal
  ) => {
    // Check if cancelled before starting
    if (signal.aborted || !isMountedRef.current) {
      setLoading(false);
      return;
    }

    // Wait a bit for transaction to be confirmed (with cancellation support)
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, 3000);
      const abortHandler = () => {
        clearTimeout(timeout);
        resolve();
      };
      signal.addEventListener('abort', abortHandler, { once: true });
    });

    // Check if cancelled after wait
    if (signal.aborted || !isMountedRef.current) {
      setLoading(false);
      return;
    }

    try {
      // Auth handled by orvalFetch
      const data = await verifyPointsPayment(
        {
          requestId,
          txHash: transactionHash,
          fromAddress: paymentRequest.from,
          toAddress: paymentRequest.to,
          amount: paymentRequest.amount,
        },
        { signal }
      );

      // Check if cancelled after fetch
      if (signal.aborted || !isMountedRef.current) {
        setLoading(false);
        return;
      }

      setPointsAwarded(data.pointsAwarded);
      setStep('success');
      toast.success(`Successfully purchased ${data.pointsAwarded} points!`);

      // Call onSuccess callback
      if (onSuccess) {
        onSuccess();
      }
      setLoading(false);
    } catch (err) {
      // Handle abort errors silently
      if (err instanceof Error && err.name === 'AbortError') {
        setLoading(false);
        return;
      }
      throw err;
    }
  };

  const handleClose = () => {
    if (loading || step === 'payment' || step === 'verifying') {
      return; // Prevent closing during payment
    }
    onClose();
  };

  const handleSubmit = () => {
    if (paymentMethod === 'stripe') {
      handleStripeCheckout();
    } else {
      handleCreatePayment();
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'input':
        return (
          <div className="flex h-full flex-col">
            <div className="flex-1 space-y-5">
              {/* Payment Method Selector */}
              {stripeAvailable && (
                <div>
                  <label className="mb-2 block font-medium text-foreground text-sm">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handlePaymentMethodChange('crypto')}
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 transition-all',
                        paymentMethod === 'crypto'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground/50'
                      )}
                      disabled={loading}
                    >
                      <Wallet
                        className={cn(
                          'h-5 w-5',
                          paymentMethod === 'crypto'
                            ? 'text-primary'
                            : 'text-muted-foreground'
                        )}
                      />
                      <span
                        className={cn(
                          'font-medium',
                          paymentMethod === 'crypto'
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        )}
                      >
                        Crypto
                      </span>
                    </button>
                    <button
                      onClick={() => handlePaymentMethodChange('stripe')}
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 transition-all',
                        paymentMethod === 'stripe'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground/50'
                      )}
                      disabled={loading}
                    >
                      <CreditCard
                        className={cn(
                          'h-5 w-5',
                          paymentMethod === 'stripe'
                            ? 'text-primary'
                            : 'text-muted-foreground'
                        )}
                      />
                      <span
                        className={cn(
                          'font-medium',
                          paymentMethod === 'stripe'
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        )}
                      >
                        Card
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Amount Input + Quick Buttons */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="font-medium text-foreground text-sm">
                    Amount (USD)
                  </label>
                  <span className="text-muted-foreground text-xs">
                    Min: $1 • Max: $1,000
                  </span>
                </div>
                <div className="relative">
                  <DollarSign className="-translate-y-1/2 absolute top-1/2 left-3 h-5 w-5 text-muted-foreground" />
                  <input
                    data-testid="points-amount-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={amountUSD}
                    onChange={(e) => {
                      const sanitized = e.target.value.replace(/[^0-9]/g, '');
                      const noLeadingZeros = sanitized.replace(/^0+/, '') || '';
                      const num = parseInt(noLeadingZeros, 10);
                      if (noLeadingZeros === '' || isNaN(num)) {
                        setAmountUSD('');
                      } else if (num > 1000) {
                        setAmountUSD('1000');
                      } else {
                        setAmountUSD(noLeadingZeros);
                      }
                    }}
                    className="w-full rounded-lg border-2 border-border bg-background py-3 pr-4 pl-10 font-medium text-lg transition-colors focus:border-primary focus:outline-none"
                    placeholder="10"
                    disabled={loading}
                  />
                </div>
                {/* Quick Amount Buttons */}
                <div className="mt-1 grid grid-cols-4 gap-2">
                  {[10, 25, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setAmountUSD(amt.toString())}
                      className={cn(
                        'rounded-lg border-2 py-2.5 font-medium transition-all',
                        amountNum === amt
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-muted-foreground/50'
                      )}
                      disabled={loading}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Points Calculation */}
              <div className="rounded-lg bg-blue-500/10 p-4 text-center">
                <p className="mb-1 text-muted-foreground text-xs uppercase tracking-wide">
                  You'll receive
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="h-6 w-6 text-yellow-500" />
                  <span
                    data-testid="points-amount-display"
                    className="font-bold text-3xl text-foreground"
                  >
                    {pointsAmount.toLocaleString()}
                  </span>
                  <span className="font-medium text-lg text-muted-foreground">
                    pts
                  </span>
                </div>
                <p className="mt-3 text-muted-foreground text-xs">
                  100 points = $1 USD
                </p>
              </div>

              {/* Crypto selected but no wallet */}
              {paymentMethod === 'crypto' && !canUseCrypto && (
                <div className="flex items-start gap-3 rounded-lg bg-amber-500/10 p-3">
                  <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <div className="text-xs">
                    <p className="font-medium text-amber-600 dark:text-amber-400">
                      Wallet not connected
                    </p>
                    <p className="mt-0.5 text-amber-600/80 dark:text-amber-400/80">
                      {embeddedWalletReady
                        ? 'No wallet found. Please connect a wallet to pay with crypto.'
                        : 'Your wallet is still initializing. Please wait a moment or switch to card payment.'}
                    </p>
                  </div>
                </div>
              )}

              {/* No Payment Methods Warning */}
              {!hasAnyPaymentMethod && (
                <div className="flex items-start gap-3 rounded-lg bg-red-500/10 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <div className="text-xs">
                    <p className="font-medium text-red-600 dark:text-red-400">
                      No payment methods available
                    </p>
                    <p className="mt-0.5 text-red-600/80 dark:text-red-400/80">
                      Your wallet is still initializing. Please wait a moment
                      and try again.
                    </p>
                  </div>
                </div>
              )}

              {/* Info notices */}
              <div className="space-y-2 text-muted-foreground text-xs">
                <div>
                  <p>Points are non-transferable.</p>
                  <p>Points can be used for trading and rewards.</p>
                </div>
                {paymentMethod === 'stripe' && (
                  <p className="flex items-start gap-2">
                    <CreditCard className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      You'll be redirected to Stripe for secure checkout.
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons - Fixed at bottom on mobile */}
            <div className="mt-6 flex gap-3 border-border pt-4 md:border-t">
              <button
                onClick={handleClose}
                className="flex-1 rounded-lg border-2 border-border py-3 font-medium transition-colors hover:bg-muted"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                data-testid="buy-points-submit-button"
                onClick={handleSubmit}
                disabled={
                  loading ||
                  walletInitializing ||
                  amountNum < 1 ||
                  amountNum > 1000 ||
                  !user ||
                  !hasAnyPaymentMethod ||
                  (paymentMethod === 'crypto' && !canUseCrypto) ||
                  (paymentMethod === 'stripe' && !canUseStripe)
                }
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-lg py-3 font-medium transition-all',
                  'bg-primary text-primary-foreground hover:bg-primary/90',
                  'disabled:cursor-not-allowed disabled:opacity-50'
                )}
              >
                {walletInitializing
                  ? 'Initializing...'
                  : loading
                    ? 'Processing...'
                    : 'Buy'}
              </button>
            </div>
          </div>
        );

      case 'payment':
      case 'verifying':
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-6">
              <Skeleton className="h-16 w-16 rounded-full" />
            </div>
            <h3 className="mb-2 font-semibold text-foreground text-lg">
              {step === 'payment'
                ? 'Processing Payment...'
                : 'Verifying Transaction...'}
            </h3>
            <p className="mb-6 text-center text-muted-foreground text-sm">
              {step === 'payment'
                ? 'Preparing your payment transaction...'
                : 'Confirming your payment on the blockchain'}
            </p>
            {txHash && getExplorerTxUrl(txHash) && (
              <a
                data-testid="transaction-hash-link"
                href={getExplorerTxUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-sm hover:underline"
              >
                View transaction →
              </a>
            )}
          </div>
        );

      case 'success':
        return (
          <div
            data-testid="payment-success"
            className="flex flex-col items-center justify-center py-12"
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h3 className="mb-2 font-semibold text-foreground text-lg">
              Purchase Successful!
            </h3>
            <div className="mb-6 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <span
                data-testid="points-awarded-amount"
                className="font-bold text-2xl text-foreground"
              >
                {pointsAwarded.toLocaleString()}
              </span>
              <span className="text-muted-foreground">points added</span>
            </div>
            {txHash && getExplorerTxUrl(txHash) && (
              <a
                href={getExplorerTxUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-6 text-primary text-sm hover:underline"
              >
                View transaction →
              </a>
            )}
            <button
              onClick={handleClose}
              className="w-full rounded-lg bg-primary py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Done
            </button>
          </div>
        );

      case 'error':
        return (
          <div
            data-testid="payment-error"
            className="flex flex-col items-center justify-center py-12"
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
            <h3 className="mb-2 font-semibold text-foreground text-lg">
              Payment Failed
            </h3>
            <p
              data-testid="payment-error-message"
              className="mb-8 text-center text-muted-foreground text-sm"
            >
              {error || 'An error occurred during payment'}
            </p>
            <div className="flex w-full gap-3">
              <button
                onClick={handleClose}
                className="flex-1 rounded-lg border-2 border-border py-3 font-medium transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setStep('input');
                  setError(null);
                }}
                className="flex-1 rounded-lg bg-primary py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Try Again
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      data-testid="buy-points-modal-overlay"
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-0 backdrop-blur-sm md:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        data-testid="buy-points-modal"
        className="relative flex h-full w-full flex-col bg-background md:h-auto md:max-h-[90vh] md:w-auto md:min-w-[480px] md:max-w-lg md:rounded-lg md:border md:border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - fixed */}
        <div className="shrink-0 border-border border-b px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <h2 className="font-bold text-lg">Buy Points</h2>
            </div>
            <button
              onClick={handleClose}
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              disabled={loading || step === 'payment' || step === 'verifying'}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
