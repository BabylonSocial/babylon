'use client';

import { useTransferPoints as useTransferPointsMutation } from '@babylon/api-hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

interface TransferPointsPayload {
  recipientId: string;
  amount: number;
  message?: string;
}

/**
 * Hook for transferring points to other users with automatic cache invalidation.
 *
 * Uses the generated useTransferPoints mutation from @babylon/api-hooks
 * and adds cache invalidation for balance-related queries.
 */
export function useTransferPoints() {
  const queryClient = useQueryClient();

  const mutation = useTransferPointsMutation({
    mutation: {
      onSuccess: (_data, variables) => {
        void queryClient.invalidateQueries({
          predicate: (query) =>
            Array.isArray(query.queryKey) &&
            typeof query.queryKey[0] === 'string' &&
            query.queryKey[0].includes('/balance'),
        });
        void queryClient.invalidateQueries({
          queryKey: ['user', variables.data.toUserId],
        });
        void queryClient.invalidateQueries({
          queryKey: ['profile'],
        });
      },
    },
  });

  const transferPoints = useCallback(
    async (payload: TransferPointsPayload) => {
      return mutation.mutateAsync({
        data: {
          toUserId: payload.recipientId,
          amount: payload.amount,
          reason: payload.message,
        },
      });
    },
    [mutation]
  );

  return {
    transferPoints,
    isLoading: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}
