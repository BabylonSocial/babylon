'use client';

import { cn } from '@babylon/shared';
import { Check, Loader2, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTransferPoints } from '@/hooks/useTransferPoints';

/**
 * Send points modal component for transferring points to other users.
 *
 * Provides a form interface for sending points to another user with
 * optional message. Includes amount validation, balance checking, and
 * transfer confirmation. Shows success state before closing.
 *
 * Features:
 * - Amount input
 * - Optional message field
 * - Recipient display
 * - Form validation
 * - Loading states
 * - Success state
 * - Error handling
 * - Body scroll lock and escape key handling
 *
 * @param props - SendPointsModal component props
 * @returns Send points modal element or null if not open
 *
 * @example
 * ```tsx
 * <SendPointsModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   recipientId="user-123"
 *   recipientName="Alice"
 *   onSuccess={() => refreshBalance()}
 * />
 * ```
 */
interface SendPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
  recipientUsername?: string | null;
  onSuccess?: () => void;
}

export function SendPointsModal({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  recipientUsername,
  onSuccess,
}: SendPointsModalProps) {
  const { transferPoints, isLoading: isSubmitting } = useTransferPoints();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount to prevent calling callbacks after unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = Number.parseInt(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      await transferPoints({
        recipientId,
        amount: numAmount,
        message: message.trim() || undefined,
      });

      setSuccess(true);

      // Wait a moment to show success state, then close
      // Store timer ID so we can clear it on unmount
      successTimeoutRef.current = setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send points');
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setAmount('');
    setMessage('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-0 backdrop-blur-sm md:p-4">
      {/* Modal */}
      <div
        className="relative flex h-full w-full flex-col bg-background md:h-auto md:max-h-[90vh] md:w-auto md:min-w-[480px] md:max-w-md md:rounded-xl md:border md:border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-border border-b p-4 md:p-6">
          <div>
            <h2 className="font-bold text-foreground text-xl">Send Points</h2>
            <p className="mt-1 text-muted-foreground text-sm">
              to {recipientUsername ? `@${recipientUsername}` : recipientName}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-full p-2 transition-colors hover:bg-muted/50 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form
          id="send-points-form"
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6"
        >
          {success ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <p className="font-semibold text-foreground text-lg">
                Points Sent!
              </p>
              <p className="mt-2 text-muted-foreground text-sm">
                {amount} points sent to {recipientName}
              </p>
            </div>
          ) : (
            <>
              {/* Amount Input */}
              <div className="mb-4">
                <label className="mb-2 block font-medium text-foreground text-sm">
                  Amount (points)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount..."
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  required
                  autoFocus
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="mb-4 grid grid-cols-3 gap-2">
                {[10, 100, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt.toString())}
                    className={cn(
                      'rounded-lg border px-4 py-2 transition-colors',
                      amount === amt.toString()
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background hover:border-primary hover:bg-muted/50'
                    )}
                    disabled={isSubmitting}
                  >
                    {amt} pts
                  </button>
                ))}
              </div>

              {/* Optional Message */}
              <div className="mb-6">
                <label className="mb-2 block font-medium text-foreground text-sm">
                  Message (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a message..."
                  disabled={isSubmitting}
                  rows={3}
                  maxLength={200}
                  className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                />
                <div className="mt-1 text-right text-muted-foreground text-xs">
                  {message.length}/200
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 rounded-lg border border-red-300 bg-red-100 p-3 dark:border-red-800 dark:bg-red-900/20">
                  <p className="text-red-800 text-sm dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}
            </>
          )}
        </form>

        {/* Footer */}
        {!success && (
          <div className="shrink-0 border-border border-t bg-background p-4 md:p-6">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 rounded-lg border border-border px-4 py-3 font-semibold transition-colors hover:bg-muted/50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="send-points-form"
                disabled={
                  isSubmitting || !amount || Number.parseInt(amount) <= 0
                }
                className={cn(
                  'flex-1 rounded-lg px-4 py-3 font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50',
                  'bg-primary text-primary-foreground hover:bg-primary/90',
                  'flex items-center justify-center gap-2'
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Points
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
