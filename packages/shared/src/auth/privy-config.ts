import type { PrivyClientConfig } from '@privy-io/react-auth';

import { CHAIN } from '../constants/chains';

type SolanaConnectors = ReturnType<
  typeof import('@privy-io/react-auth/solana')['toSolanaWalletConnectors']
>;

type Appearance = Omit<NonNullable<PrivyClientConfig['appearance']>, 'theme'> & {
  theme?: 'light' | 'dark' | `#${string}` | 'system';
};

type BabylonPrivyConfig = Omit<
  PrivyClientConfig,
  'appearance' | 'embeddedWallets' | 'externalWallets'
> & {
  appearance?: Appearance;
  embeddedWallets?: {
    ethereum?: { createOnLogin?: 'all-users' | 'users-without-wallets' | 'off' };
  };
  externalWallets?: {
    solana?: { connectors?: SolanaConnectors };
  };
};

function getSolanaConnectors(): SolanaConnectors | undefined {
  // Solana connector bundle relies on React context; skip on the server.
  if (typeof window === 'undefined') return undefined;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { toSolanaWalletConnectors } = require('@privy-io/react-auth/solana') as {
      toSolanaWalletConnectors: () => SolanaConnectors;
    };
    return toSolanaWalletConnectors();
  } catch (error) {
    console.warn('Failed to load Solana connectors', error);
    return undefined;
  }
}

const appearance: Appearance = {
  theme: 'system',
  accentColor: '#0066FF',
  logo: '/assets/logos/logo.svg',
};

const loginMethodsAndOrder: NonNullable<BabylonPrivyConfig['loginMethodsAndOrder']> =
  {
    primary: ['farcaster', 'email'],
    overflow: [
      'metamask',
      'twitter',
      'discord',
      'telegram',
      'phantom',
      'rabby_wallet',
      'coinbase_wallet',
      'rainbow',
      'backpack',
    ],
  };

const embeddedWallets: NonNullable<BabylonPrivyConfig['embeddedWallets']> = {
  ethereum: { createOnLogin: 'off' },
};

const externalWallets: BabylonPrivyConfig['externalWallets'] = (() => {
  const solanaConnectors = getSolanaConnectors();
  return solanaConnectors ? { solana: { connectors: solanaConnectors } } : undefined;
})();

// @NOTE: Do not update this config without making sure it won't break anything
export const privyConfig: { appId: string; config: BabylonPrivyConfig } = {
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
  config: {
    appearance,
    loginMethodsAndOrder,
    embeddedWallets,
    defaultChain: CHAIN,
    externalWallets,
  },
};
