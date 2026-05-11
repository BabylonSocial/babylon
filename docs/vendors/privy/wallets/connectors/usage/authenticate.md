> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Authenticate a connected wallet

<View title="React" icon="react">
  Once a user has connected their wallet to your app, and the wallet is available in either of the **`useWallets`** arrays, you can also prompt them to **login** with that wallet or **link** that wallet to their existing account, instead of prompting the entire **`login`** or **`linkWallet`** flow.

  To do so, find the **`ConnectedWallet`** or **`ConnectedStandardSolanaWallet`** object from Privy, and call the object's **`loginOrLink`** method for EVM wallets and use the **`useLoginWithSiws`** or **`useLinkWithSiws`** hooks for the Solana wallets:

  <Tabs>
    <Tab title="EVM">
      ```tsx  theme={"system"}
      import {useWallets} from '@privy-io/react-auth';
      ...
      const {wallets} = useWallets();
      ...
      wallets[0].loginOrLink();
      ```
    </Tab>

    <Tab title="Solana">
      ```tsx  theme={"system"}
      import {useLoginWithSiws} from '@privy-io/react-auth';
      import {useWallets} from '@privy-io/react-auth/solana';

      const {wallets} = useWallets();
      const {generateSiwsMessage, loginWithSiws} = useLoginWithSiws();

      const message = await generateSiwsMessage({address: wallets[0].address});
      const encodedMessage = new TextEncoder().encode(message);
      const results = await wallets[0].signMessage({message: encodedMessage});
      await loginWithSiws({message: encodedMessage, signature: results.signature});
      ```
    </Tab>
  </Tabs>

  When called, **`loginOrLink`** will directly request a [SIWE](https://docs.login.xyz/general-information/siwe-overview/eip-4361) signature from the user's connected wallet to authenticate the wallet.

  If the user was not **`authenticated`** when the method was called, the user will become **`authenticated`** after signing the message.

  If the user was already **`authenticated`** when the method was called, the user will remain **`authenticated`** after signing the message, and the connected wallet will become one of the user's **`linkedAccounts`** in their **`user`** object.

  You might use the methods above to "split up" the connect and sign steps of external wallet login, like so:

  <Tabs>
    <Tab title="EVM">
      ```tsx  theme={"system"}
      import {useConnectWallet, useWallets} from '@privy-io/react-auth';

      export default function WalletButton() {
      const {connectWallet} = useConnectWallet();
      const {wallets} = useWallets();

      // Prompt user to connect a wallet with Privy modal
      return (
          {/* Button to connect wallet */}
          <button
              onClick={connectWallet}>
              Connect wallet
          </button>
          {/* Button to login with or link the most recently connected wallet */}
          <button
              disabled={!wallets[0]}
              onClick={() => { wallets[0].loginOrLink() }}>
              Login with wallet
          </button>
      );
      }
      ```
    </Tab>

    <Tab title="Solana">
      ```tsx  theme={"system"}
      import {useConnectWallet, useLoginWithSiws} from '@privy-io/react-auth';
      import {useWallets} from '@privy-io/react-auth/solana';

      export default function WalletButton() {
        const {connectWallet} = useConnectWallet();
        const {wallets} = useWallets();
        const {generateSiwsMessage, loginWithSiws} = useLoginWithSiws()

        // Prompt user to connect a wallet with Privy modal
        return (
          {/* Button to connect wallet */}
          <button
              onClick={connectWallet}>
              Connect wallet
          </button>
          {/* Button to login with the most recently connected wallet */}
          <button
              disabled={!wallets[0]}
              onClick={async () => {
                const message = await generateSiwsMessage({address: wallets[0].address})
                const encodedMessage = new TextEncoder().encode(message)
                const results = await wallets[0].signMessage({message: encodedMessage})
                await loginWithSiws({message: encodedMessage, signature: results.signature})
              }}
          >
              Login with wallet
          </button>
        );
      }
      ```
    </Tab>
  </Tabs>

  ### Sign in with Ledger on Solana

  Currently, Ledger Solana hardware wallets only support transaction signatures, not the message signatures required
  for Sign-In With Solana (SIWS) authentication. In order to authenticate with a Solana Ledger wallet,
  you must mount the `useSolanaLedgerPlugin` hook **inside** your `PrivyProvider`.

  <Warning>
    **Critical:** The `useSolanaLedgerPlugin` hook **must be placed inside** a component that is
    wrapped by `PrivyProvider`. If the hook is placed alongside or outside the `PrivyProvider`, it
    will not function correctly.
  </Warning>

  ```tsx  theme={"system"}
  import {PrivyProvider} from '@privy-io/react-auth';
  import {useSolanaLedgerPlugin} from '@privy-io/react-auth/solana';

  function SolanaLedgerSetup() {
    // This hook MUST be called inside a component wrapped by PrivyProvider
    useSolanaLedgerPlugin();
    return null;
  }

  export default function App() {
    return (
      <PrivyProvider appId="your-app-id" config={{...}}>
        <SolanaLedgerSetup />
        {/* Your app components */}
      </PrivyProvider>
    );
  }
  ```

  Then, when you attempt to login with a Phantom Solana wallet, you will be prompted to indicate whether you are signing with a Ledger wallet,
  which will initiate a separate SIWS flow wherein which a no-op transaction will be signed and used for verification.
</View>
\n