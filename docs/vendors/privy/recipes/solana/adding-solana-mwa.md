> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Integrating Solana Mobile Wallet Adapter

The Solana Mobile Wallet Adapter (MWA) is a library that allows apps to connect to mobile Solana wallets. This guide will walk you through the steps to integrate MWA into your Privy app.

<View title="React" icon="react">
  ## Resources

  <CardGroup cols={1}>
    <Card title="Privy Solana setup" icon="wallet" href="/basics/react/setup#solana" arrow>
      Learn how to set up Solana in your React app with Privy.
    </Card>
  </CardGroup>

  ## Install dependencies

  Install the required dependencies:

  ```bash  theme={"system"}
  npm i @solana-mobile/wallet-standard-mobile
  ```

  ## Register the MWA adapter

  In your app's root component, register the MWA adapter with Privy.

  ```typescript  theme={"system"}
  import {
    createDefaultAuthorizationCache,
    createDefaultChainSelector,
    createDefaultWalletNotFoundHandler,
    registerMwa
  } from '@solana-mobile/wallet-standard-mobile';

  registerMwa({
    appIdentity: {
      name: 'My app',
      uri: 'https://myapp.io',
      icon: 'relative/path/to/icon.png' // resolves to https://myapp.io/relative/path/to/icon.png
    },
    authorizationCache: createDefaultAuthorizationCache(),
    chains: ['solana:mainnet'],
    chainSelector: createDefaultChainSelector(),
    onWalletNotFound: createDefaultWalletNotFoundHandler()
  });
  ```
</View>

<View title="React Native" icon="react">
  <Note>
    Solana Mobile Wallet Adapter is only supported on Android devices.
  </Note>

  ## Resources

  <CardGroup cols={1}>
    <Card title="Mobile Wallet Adapter documentation" icon="wallet" href="https://docs.solanamobile.com/react-native/using_mobile_wallet_adapter#add-dependencies" arrow>
      Official documentation for integrating Solana Mobile Wallet Adapter in React Native apps.
    </Card>
  </CardGroup>

  ## Install dependencies

  Install the required dependencies:

  ```bash  theme={"system"}
  npm install @solana-mobile/mobile-wallet-adapter-protocol-web3js @solana-mobile/mobile-wallet-adapter-protocol
  ```

  ## Create a MWA session

  In order to connect and log in users with MWA wallets, you need to create a MWA session by calling the `transact` and `authorize` methods from the `@solana-mobile/mobile-wallet-adapter-protocol-web3js` package, you'll then need to log in the user with Privy using the `useLoginWithSiws` hook.

  You can do this in a custom login button component.

  ```tsx  theme={"system"}
  import {transact} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
  import {useLoginWithSiws} from '@privy-io/expo';
  import {toByteArray} from 'react-native-quick-base64';
  import {PublicKey} from '@solana/web3.js';
  import {Buffer} from 'buffer';

  const MwaLoginButton = () => {
    const {generateMessage, login} = useLoginWithSiws();

    const handleLogin = async () => {
      try {
        await transact(async (wallet) => {
          // 1. Create a MWA session
          const authorizationResult = await wallet.authorize({
            chain: 'mainnet-beta',
            identity: {
              name: 'My app',
              uri: 'https://myapp.io',
              icon: 'https://myapp.io/icon.png'
            }
          });
          const desiredAccount = authorizationResult.accounts[0];

          // 2. Convert base64 address to base58 (Privy expects base58)
          const addressBytes = toByteArray(desiredAccount.address);
          const publicKey = new PublicKey(addressBytes);
          const base58Address = publicKey.toBase58();

          // 3. Generate a Privy SIWS message for the wallet address
          const siwsMessage = await generateMessage({
            wallet: {address: base58Address}, // Use base58 for Privy
            from: {domain: 'com.myapp.app', uri: 'https://myapp.io'}
          });

          // 4. Convert the SIWS message to Uint8Array for signing
          const encodedSiwsMessage = new TextEncoder().encode(siwsMessage.message);

          // 5. Request user to sign the SIWS message with their wallet
          const [signatureBytes] = await wallet.signMessages({
            addresses: [desiredAccount.address], // Use base64 for MWA
            payloads: [encodedSiwsMessage]
          });
          const signatureBase64 = Buffer.from(signatureBytes).toString('base64');

          // 6. Authenticate with Privy using the signed message
          const user = await login({
            signature: signatureBase64,
            message: siwsMessage.message
          });

          return {mwaResult: authResult, user};
        });
      } catch (error) {
        console.error('Login failed', error);
      }
    };

    return <Button title="Login with MWA" onPress={handleLogin} />;
  };
  ```

  ## Next steps

  You can now use MWA wallets within your app. For more information on how to sign and send transactions using MWA wallets, refer to the [Solana Mobile Wallet Adapter guide](https://docs.solanamobile.com/react-native/using_mobile_wallet_adapter#signing-and-sending-a-transaction).
</View>

## Conclusion

That's it! Your Privy app is now set up to connect to Solana wallets using the Solana Mobile Wallet Adapter. You can now use Privy's [wallet connection](/wallets/connectors/usage/connecting-external-wallets) and [transaction signing](/wallets/using-wallets/solana/sign-a-message) features with Solana wallets that support MWA.
\n