> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Using Solana Standard Wallets

> A comprehensive guide to integrating and using Solana standard wallets in your application

# Using Solana Standard Wallets

This guide will help you integrate and use Solana standard wallets in your application. We'll cover everything from basic setup to advanced features like message signing and transaction handling.
To learn more about the wallet standard, you can read more about it [here!](https://docs.phantom.com/developer-powertools/wallet-standard)

<View title="React" icon="react">
  ## Basic Setup

  First, import the necessary hooks and types from Privy:

  ```typescript {skip-check} theme={"system"}
  import {useSolanaStandardWallets, type SolanaStandardWallet} from '@privy-io/react-auth/solana';
  ```

  ## Available Features

  Standard wallets provide these core features:

  * `standard:connect`: Connect the wallet
  * `standard:disconnect`: Disconnect the wallet
  * `solana:signMessage`: Sign messages
  * `solana:signTransaction`: Sign transactions
  * `solana:signAndSendTransaction`: Sign and send transactions

  ## Core Wallet Features

  Here's how to use the core features of any Solana standard wallet:

  ```typescript {skip-check} theme={"system"}
  function WalletComponent() {
    const {ready, wallets} = useSolanaStandardWallets();

    // Connect/Disconnect
    const connect = (wallet: SolanaStandardWallet) => wallet.features['standard:connect']!.connect();
    const disconnect = (wallet: SolanaStandardWallet) =>
      wallet.features['standard:disconnect']!.disconnect();

    // Sign Message
    const signMessage = async (
      wallet: SolanaStandardWallet,
      address: string,
      message: Uint8Array
    ) => {
      const account = wallet.accounts.find((a) => a.address === address)!;
      const [result] = await wallet.features['solana:signMessage']!.signMessage({
        account,
        message
      });
      return result;
    };

    // Sign Transaction
    const signTransaction = async (
      wallet: SolanaStandardWallet,
      address: string,
      transaction: Uint8Array
    ) => {
      const account = wallet.accounts.find((a) => a.address === address)!;
      const [result] = await wallet.features['solana:signTransaction']!.signTransaction({
        transaction,
        chain: 'solana:devnet',
        account
      });
      return result;
    };

    // Sign and Send Transaction
    const signAndSendTransaction = async (
      wallet: SolanaStandardWallet,
      address: string,
      transaction: Uint8Array
    ) => {
      const account = wallet.accounts.find((a) => a.address === address)!;
      return wallet.features['solana:signAndSendTransaction']!.signAndSendTransaction({
        transaction,
        chain: 'solana:devnet',
        account
      });
    };
  }
  ```

  ## Registering the Privy Embedded Wallet

  To make your Privy embedded wallet compatible with other Solana applications, register it with the window object.

  The registration function dispatches the appropriate events to make the wallet available to other applications:

  ```typescript  theme={"system"}
  // This is copied from @wallet-standard/wallet

  import type {
    Wallet,
    WalletEventsWindow,
    WindowRegisterWalletEvent,
    WindowRegisterWalletEventCallback
  } from '@wallet-standard/base';

  class RegisterWalletEvent
    extends CustomEvent<WindowRegisterWalletEventCallback>
    implements WindowRegisterWalletEvent
  {
    readonly #detail: WindowRegisterWalletEventCallback;

    get detail() {
      return this.#detail;
    }

    get type() {
      return 'wallet-standard:register-wallet' as const;
    }

    constructor(callback: WindowRegisterWalletEventCallback) {
      super('wallet-standard:register-wallet', {
        bubbles: false,
        cancelable: false,
        detail: callback
      });
      this.#detail = callback;
    }

    preventDefault(): never {
      throw new Error('preventDefault is not supported');
    }

    stopPropagation(): never {
      throw new Error('stopPropagation is not supported');
    }

    stopImmediatePropagation(): never {
      throw new Error('stopImmediatePropagation is not supported');
    }
  }

  export function registerWallet(wallet: Wallet): void {
    const callback: WindowRegisterWalletEventCallback = ({register}) => register(wallet);
    try {
      (window as WalletEventsWindow).dispatchEvent(new RegisterWalletEvent(callback));
    } catch (error) {
      console.error('wallet-standard:register-wallet event could not be dispatched\n', error);
    }
    try {
      (window as WalletEventsWindow).addEventListener('wallet-standard:app-ready', ({detail: api}) =>
        callback(api)
      );
    } catch (error) {
      console.error('wallet-standard:app-ready event listener could not be added\n', error);
    }
  }
  ```

  After this code is implemented in your application, you can then register the Privy embedded wallet by calling:

  ```typescript {skip-check} theme={"system"}
  registerWallet(wallets.find((wallet) => wallet.name === 'Privy' && 'privy:' in wallet.features));
  ```

  **That's it!** You now have a fully functional Solana standard wallet integration in your application. You can use these features to connect wallets, sign messages, and handle transactions in a standardized way.
</View>
\n