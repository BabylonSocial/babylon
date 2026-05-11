> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Wallet

export const chain_3 = "Solana"

export const chain_2 = "Ethereum"

export const chain_1 = "Solana"

export const chain_0 = "Ethereum"

For users who already have wallets, Privy supports signing in with Ethereum (SIWE) or Solana (SIWS). With this flow, users who are already onchain can bring their existing wallet to your app, verify ownership of assets, and take onchain actions.

<Tip>
  Enable wallet authentication in the [Privy
  Dashboard](https://dashboard.privy.io/apps?page=login-methods) before implementing this feature.
</Tip>

<View title="React" icon="react">
  <Tabs>
    <Tab title="Ethereum (SIWE)">
      To authenticate a user via an Ethereum wallet ([SIWE](https://eips.ethereum.org/EIPS/eip-4361)) without Privy UIs, use the React SDK's `useLoginWithSiwe` hook.

      <Info>
        In order to use Privy's login with wallet flow, users must actively have a {chain_0} wallet
        connected to your app from which you can request signatures.
      </Info>

      ## Generate SIWE message

      ```tsx  theme={"system"}
      generateSiweMessage({ address: string, chainId: `eip155:${number}`, disableSignup?: boolean }) => Promise<string>
      ```

      ### Parameters

      <ParamField path="address" type="string" required>
        EIP-55 checksum-encoded wallet address performing the signing.
      </ParamField>

      <ParamField path="chainId" type="`eip155:${number}`" required>
        EIP-155 Chain ID to which the session is bound (in CAIP-2 format), e.g. `eip155:1`.
      </ParamField>

      <ParamField path="disableSignup" type="boolean">
        Whether to disable signup for this login flow.
      </ParamField>

      ### Returns

      <ResponseField name="message" type="string">
        A SIWE message that can be signed by the wallet.
      </ResponseField>

      ## Sign the SIWE message

      Request an EIP-191 `personal_sign` signature for the `message` returned by `generateSiweMessage` from the connected wallet.

      ```tsx  theme={"system"}
      import { useWallets } from '@privy-io/react-auth';

      const { wallets } = useWallets();

      const signature = await wallets[0].sign(message);
      ```

      ## Login with SIWE

      ```tsx  theme={"system"}
      loginWithSiwe({ signature: string, message: string, disableSignup?: boolean }) => Promise<User>
      ```

      ### Parameters

      <ParamField path="signature" type="string" required>
        The EIP-191 signature corresponding to the message.
      </ParamField>

      <ParamField path="message" type="string" required>
        The EIP-4361 message returned by `generateSiweMessage`.
      </ParamField>

      <ParamField path="disableSignup" type="boolean">
        Whether to disable signup for the login flow.
      </ParamField>

      ### Returns

      <ResponseField name="User" type="User">
        The authenticated user.
      </ResponseField>

      ## Usage

      ```tsx  theme={"system"}
      import { useLoginWithSiwe, useWallets } from '@privy-io/react-auth';

      export function LoginWithWalletButton() {
        const { generateSiweMessage, loginWithSiwe } = useLoginWithSiwe();
        const { wallets } = useWallets();

        const handleLogin = async () => {
          if (!wallets?.length) return;
          const activeWallet = wallets[0];

          const message = await generateSiweMessage({
            address: activeWallet.address,
            chainId: 'eip155:1',
          });

          const signature = await activeWallet.sign(message);
          await loginWithSiwe({ signature, message });
        };

        return (
          <button onClick={handleLogin}>Log in with wallet</button>
        );
      }
      ```

      ## Callbacks

      You can optionally pass callbacks into `useLoginWithSiwe` to run custom logic after a successful login, or to handle errors that occur during the flow.

      ### `onComplete`

      ```tsx  theme={"system"}
      onComplete?: (params: {
        user: User;
        isNewUser: boolean;
        wasAlreadyAuthenticated: boolean;
        loginMethod: LoginMethod | null;
        loginAccount: LinkedAccountWithMetadata | null;
      }) => void
      ```

      #### Parameters

      <ParamField path="user" type="User">
        The user object corresponding to the authenticated user.
      </ParamField>

      <ParamField path="isNewUser" type="boolean">
        Whether the user is a new user or an existing user.
      </ParamField>

      <ParamField path="wasAlreadyAuthenticated" type="boolean">
        Whether the user was already authenticated when the flow ran.
      </ParamField>

      <ParamField path="loginMethod" type="LoginMethod | null">
        The method used by the user to login (if applicable).
      </ParamField>

      <ParamField path="loginAccount" type="LinkedAccountWithMetadata | null">
        The account corresponding to the login method.
      </ParamField>

      ### `onError`

      ```tsx  theme={"system"}
      onError?: (error: PrivyErrorCode) => void
      ```

      #### Parameters

      <ParamField path="error" type="PrivyErrorCode">
        The error that occurred during the login flow.
      </ParamField>

      ### Usage

      ```tsx  theme={"system"}
      import { useLoginWithSiwe } from '@privy-io/react-auth';

      export function SiweWithCallbacks() {
        const { generateSiweMessage, loginWithSiwe } = useLoginWithSiwe({
          onComplete: ({
            user,
            isNewUser,
            wasAlreadyAuthenticated,
            loginMethod,
            loginAccount,
          }) => {
             // show a toast, update form errors, etc...
          },
          onError: (error) => {
             // show a toast, update form errors, etc...
          },
        });

        // ... use generateSiweMessage and loginWithSiwe as shown above
        return null;
      }
      ```

      ## Tracking login flow state

      The `state` variable returned from `useLoginWithSiwe` will always be one of the following values.

      ```tsx  theme={"system"}
      type SiweFlowState =
        | { status: 'initial' }
        | { status: 'error'; error: Error | null }
        | { status: 'generating-message' }
        | { status: 'awaiting-signature' }
        | { status: 'submitting-signature' }
        | { status: 'done' };
      ```

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
    </Tab>

    <Tab title="Solana (SIWS)">
      To authenticate a user via a Solana wallet *([SIWS](https://github.com/phantom/sign-in-with-solana))* without Privy UIs, use the React SDK's `useLoginWithSiws` hook.

      <Info>
        In order to use Privy's login with wallet flow, users must actively have a {chain_1} wallet
        connected to your app from which you can request signatures.
      </Info>

      ## Generate SIWS message

      ```tsx  theme={"system"}
      generateSiwsMessage({ address: string }) => Promise<string>
      ```

      ### Parameters

      <ParamField path="address" type="string" required>
        The base58-encoded Solana wallet address performing the signing.
      </ParamField>

      ### Returns

      <ResponseField name="message" type="string">
        A SIWS message that can be signed by the wallet.
      </ResponseField>

      ## Sign the SIWS message

      Request a signature for the `message` returned by `generateSiwsMessage` from the connected Solana wallet.

      ```tsx  theme={"system"}
      import {useWallets} from '@privy-io/react-auth/solana';

      const {wallets} = useWallets();

      const encodedMessage = new TextEncoder().encode(message);
      const {signature} = await wallets[0].signMessage({message: encodedMessage});
      ```

      ## Login with SIWS

      ```tsx  theme={"system"}
      loginWithSiws({ signature: string, message: string, disableSignup?: boolean }) => Promise<User>
      ```

      ### Parameters

      <ParamField path="signature" type="string" required>
        The signature corresponding to the SIWS message.
      </ParamField>

      <ParamField path="message" type="string" required>
        The SIWS message returned by `generateSiwsMessage`.
      </ParamField>

      <ParamField path="disableSignup" type="boolean">
        Whether to disable signup for the login flow.
      </ParamField>

      ### Returns

      <ResponseField name="User" type="User">
        The authenticated user.
      </ResponseField>

      ## Usage

      ```tsx  theme={"system"}
      import {useLoginWithSiws} from '@privy-io/react-auth';
      import {useWallets} from '@privy-io/react-auth/solana';

      export function LoginWithSolanaWalletButton() {
        const {generateSiwsMessage, loginWithSiws} = useLoginWithSiws();
        const {wallets} = useWallets();

        const handleLogin = async () => {
          if (!wallets?.length) return;
          const activeWallet = wallets[0];

          const message = await generateSiwsMessage({
            address: activeWallet.address,
          });

          const encodedMessage = new TextEncoder().encode(message);
          const {signature} = await activeWallet.signMessage({message: encodedMessage});
          await loginWithSiws({signature, message});
        };

        return (
          <button onClick={handleLogin}>Log in with Solana wallet</button>
        );
      }
      ```
    </Tab>
  </Tabs>

  ## Resources

  <Columns cols={3}>
    <Card title="React starter repo" href="https://github.com/privy-io/examples/tree/main/privy-react-starter" icon="github" arrow="true">
      Get started with React and Privy.
    </Card>

    <Card title="Next.js starter repo" href="https://github.com/privy-io/examples/tree/main/privy-next-starter" icon="github" arrow="true">
      Get started with Next.js and Privy.
    </Card>

    <Card title="Whitelabel starter repo" href="https://github.com/privy-io/examples/tree/main/privy-react-whitelabel-starter" icon="github" arrow="true">
      Get started with a whitelabel Privy integration.
    </Card>
  </Columns>
</View>

<View title="React Native" icon="react">
  <Tabs>
    <Tab title="Ethereum (SIWE)">
      To authenticate a user via an Ethereum wallet *([SIWE](https://eips.ethereum.org/EIPS/eip-4361))*, use the React Native SDK's `useLoginWithSiwe` hook.

      <Info>
        In order to use Privy's login with wallet flow, users must actively have a {chain_2} wallet
        connected to your app from which you can request signatures.
      </Info>

      ## Generate SIWE message

      ```tsx  theme={"system"}
      generateSiweMessage({wallet: {chainId: string, address: string}, from: {domain: string, uri: string}}) => Promise<string>
      ```

      ### Parameters

      <ParamField path="wallet" type="Object">
        Wallet object containing EIP-55 compliant wallet address and chainId in CAIP-2 format.

        <Expandable defaultOpen="true">
          <ParamField path="chainId" type="string" required>
            The chain ID of the wallet.
          </ParamField>

          <ParamField path="address" type="string" required>
            The address of the wallet.
          </ParamField>
        </Expandable>
      </ParamField>

      <ParamField path="from" type="Object">
        Origin object containing domain and uri.

        <Expandable defaultOpen="true">
          <ParamField path="domain" type="string" required>
            The domain of the origin. Must be allowlisted in the Privy dashboard.
          </ParamField>

          <ParamField path="uri" type="string" required>
            The uri of the origin.
          </ParamField>
        </Expandable>
      </ParamField>

      ### Returns

      <ResponseField name="message" type="string">
        A SIWE message that can be signed by the wallet.
      </ResponseField>

      ### Usage

      ```tsx  theme={"system"}
      import {useLoginWithSiwe} from '@privy-io/expo';

      export function LoginScreen() {
      const [address, setAddress] = useState('');
      const [message, setMessage] = useState('');
      const {generateSiweMessage} = useLoginWithSiwe();

      const handleGenerate = async () => {
          const message = await generateSiweMessage({
          from: {
              domain: 'my-domain.com', // domain must be allowlisted in the Privy dashboard.
              uri: 'https://my-domain.com',
          },
          wallet: {
              // sepolia chainId with CAIP-2 prefix
              chainId: `eip155:11155111`,
              address,
          },
          });

          setMessage(message);
      };

      return (
          <View>
          <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="0x..."
              inputMode="ascii-capable"
          />

          <Button onPress={handleGenerate}>Generate Message</Button>

          {Boolean(message) && <Text>{message}</Text>}
          </View>
      );
      }
      ```

      ## Sign the [SIWE message](https://eips.ethereum.org/EIPS/eip-4361)

      Then, request an [ EIP-191 ](https://eips.ethereum.org/EIPS/eip-191) `personal_sign` signature for the `message` returned by `generateSiweMessage`, from a connected wallet.

      <Tip>
        There are many ways to connect a wallet to a mobile app, a few good options are:

        * [Mobile Wallet Protocol](https://mobilewalletprotocol.github.io/wallet-mobile-sdk/)
        * [Metamask React Native SDK](https://docs.metamask.io/wallet/how-to/use-sdk/javascript/react-native/)
        * [WalletConnectClient SDK](https://github.com/WalletConnect/react-native-examples)
      </Tip>

      ## Login with SIWE

      ```tsx  theme={"system"}
      loginWithSiwe({signature: string, messageOverride?: string, disableSignup?: boolean}) => Promise<Result<PrivyUser>>
      ```

      ### Parameters

      <ParamField path="signature" type="string" required>
        The signature of the SIWE message, signed by the user's wallet.
      </ParamField>

      <ParamField path="messageOverride" type="string">
        An optional override for the message that is signed.
      </ParamField>

      <ParamField path="disableSignup" type="boolean">
        If true, the user will not be automatically created if they do not exist in the Privy database.
      </ParamField>

      ### Returns

      <ResponseField name="PrivyUser" type="PrivyUser">
        A PrivyUser object containing the user's information.
      </ResponseField>

      ## Usage

      ```tsx  theme={"system"}
      import {useLoginWithSiwe, usePrivy} from '@privy-io/expo';

      export function LoginScreen() {
      const [signature, setSignature] = useState('');

      const {user} = usePrivy();
      const {loginWithSiwe} = useLoginWithSiwe();

      if (user) {
          return (
          <>
              <Text>Logged In</Text>
              <Text>{JSON.stringify(user, null, 2)}</Text>
          </>
          );
      }

      return (
          <View>
          <TextInput
              value={signature}
              onChangeText={setSignature}
              placeholder="0x..."
              inputMode="ascii-capable"
          />

          <Button onPress={() => loginWithSiwe({signature})}>Login</Button>
          </View>
      );
      }
      ```

      ## Callbacks

      You can optionally pass callbacks into the `useLoginWithSiwe` hook to run custom logic after a message has been generated, after a successful login, or to handle errors that occur during the flow.

      ### `onGenerateMessage`

      ```tsx  theme={"system"}
      onGenerateMessage?: ((message: string) => void) | undefined
      ```

      #### Parameters

      <ParamField path="message" type="string">
        The SIWE message that was generated.
      </ParamField>

      ### `onSuccess`

      ```tsx  theme={"system"}
      onSuccess?: ((user: PrivyUser, isNewUser: boolean) => void) | undefined
      ```

      #### Parameters

      <ParamField path="user" type="PrivyUser">
        The user object corresponding to the authenticated user.
      </ParamField>

      <ParamField path="isNewUser" type="boolean">
        Whether the user is a new user or an existing user.
      </ParamField>

      ### `onError`

      ```tsx  theme={"system"}
      onError?: (error: Error) => void
      ```

      #### Parameters

      <ParamField path="error" type="Error">
        The error that occurred during the login flow.
      </ParamField>

      ## Usage

      ```tsx  theme={"system"}
      import {useLoginWithSiwe} from '@privy-io/expo';

      export function LoginScreen() {
        const {generateSiweMessage, loginWithSiwe} = useLoginWithSiwe({
          onGenerateMessage(message) {
            // show a toast, send analytics event, etc...
          },
          onSuccess(user, isNewUser) {
            // show a toast, send analytics event, etc...
          },
          onError(error) {
            // show a toast, update form errors, etc...
          },
        });

        // ...
      }
      ```

      ## Tracking login flow state

      The `state` variable returned from `useLoginWithSiwe` will **always be one** of the following values.

      ```tsx  theme={"system"}
      type SiweFlowState =
        | { status: "initial" }
        | { status: "error"; error: Error | null }
        | { status: "generating-message" }
        | { status: "awaiting-signature" }
        | { status: "submitting-signature" }
        | { status: "done" };
      ```
    </Tab>

    <Tab title="Solana (SIWS)">
      To authenticate a user via a Solana wallet *([SIWS](https://github.com/phantom/sign-in-with-solana))*, use the React Native SDK's `useLoginWithSiws` hook.

      <Info>
        In order to use Privy's login with wallet flow, users must actively have a {chain_3} wallet
        connected to your app from which you can request signatures.
      </Info>

      ## Generate SIWS message

      ```tsx  theme={"system"}
      generateMessage({wallet: {address: string}, from: {domain: string, uri: string}}) => Promise<{message: string}>
      ```

      ### Parameters

      <ParamField path="wallet" type="Object">
        Wallet object containing Solana wallet address.

        <Expandable defaultOpen="true">
          <ParamField path="address" type="string" required>
            The address of the wallet.
          </ParamField>
        </Expandable>
      </ParamField>

      <ParamField path="from" type="Object">
        Origin object containing domain and uri.

        <Expandable defaultOpen="true">
          <ParamField path="domain" type="string" required>
            The domain of the origin.
          </ParamField>

          <ParamField path="uri" type="string" required>
            The uri of the origin.
          </ParamField>
        </Expandable>
      </ParamField>

      ### Returns

      <ResponseField name="message" type="string">
        A SIWS message that can be signed by the wallet.
      </ResponseField>

      ### Usage

      ```tsx  theme={"system"}
      import {useLoginWithSiws} from '@privy-io/expo';

      export function LoginScreen() {
        const [address, setAddress] = useState('');
        const [message, setMessage] = useState('');
        const {generateMessage} = useLoginWithSiws();

        const handleGenerate = async () => {
          const {message} = await generateMessage({
            from: {
              domain: 'my-domain.com',
              uri: 'https://my-domain.com',
            },
            wallet: {
              address,
            },
          });

          setMessage(message);
        };

        return (
          <View>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="0x..."
              inputMode="ascii-capable"
            />

            <Button onPress={handleGenerate}>Generate Message</Button>

            {Boolean(message) && <Text>{message}</Text>}
          </View>
        );
      }
      ```

      ## Sign the SIWS message

      Then, request a signature for the `message` returned by `generateMessage`, from a connected wallet.

      ## Login with SIWS

      ```tsx  theme={"system"}
      login({signature: string, message: string, wallet: {walletClientType: string, connectorType: string}, disableSignup?: boolean}) => Promise<Result<PrivyUser>>
      ```

      ### Parameters

      <ParamField path="signature" type="string" required>
        The signature of the SIWS message, signed by the user's wallet.
      </ParamField>

      <ParamField path="message" type="string" required>
        The original message that was signed.
      </ParamField>

      <ParamField path="wallet" type="Object" required>
        <Expandable defaultOpen="true">
          <ParamField path="walletClientType" type="string" required>
            The client of the connected wallet (e.g. 'phantom').
          </ParamField>

          <ParamField path="connectorType" type="string" required>
            The type of the connector (e.g. 'wallet\_connect' or 'mobile\_wallet\_protocol').
          </ParamField>
        </Expandable>
      </ParamField>

      <ParamField path="disableSignup" type="boolean">
        If true, the user will not be automatically created if they do not exist in the Privy database.
      </ParamField>

      ### Returns

      <ResponseField name="PrivyUser" type="PrivyUser">
        A PrivyUser object containing the user's information.
      </ResponseField>

      ## Usage

      ```tsx  theme={"system"}
      import {useLoginWithSiws, usePrivy} from '@privy-io/expo';

      export function LoginScreen() {
        const [signature, setSignature] = useState('');

        const {user} = usePrivy();
        const {login} = useLoginWithSiws();

        if (user) {
          return (
            <>
              <Text>Logged In</Text>
              <Text>{JSON.stringify(user, null, 2)}</Text>
            </>
          );
        }

        return (
          <View>
            <TextInput
              value={signature}
              onChangeText={setSignature}
              placeholder="0x..."
              inputMode="ascii-capable"
            />

            <Button
              onPress={() =>
                login({
                  signature,
                  message,
                  wallet: {
                    walletClientType,
                    connectorType,
                  },
                })
              }
            >
              Login
            </Button>
          </View>
        );
      }
      ```
    </Tab>
  </Tabs>

  ## Resources

  <Columns cols={3}>
    <Card title="Expo starter repo" href="https://github.com/privy-io/examples/tree/main/privy-expo-starter" icon="github" arrow="true">
      Get started with Expo and Privy.
    </Card>

    <Card title="Expo bare starter repo" href="https://github.com/privy-io/examples/tree/main/privy-expo-bare-starter" icon="github" arrow="true">
      Get started with Expo bare and Privy.
    </Card>
  </Columns>
</View>

<View title="Swift" icon="swift">
  <Tabs>
    <Tab title="Ethereum (SIWE)">
      To authenticate a user via an Ethereum wallet *([SIWE](https://eips.ethereum.org/EIPS/eip-4361))*, use the Privy client's `siwe` handler.

      ## Generate SIWE message

      ```swift  theme={"system"}
      func generateMessage(params: SiweMessageParams) async throws -> String
      ```

      ### Parameters

      <ParamField path="params" type="SiweMessageParams">
        Set of parameters required to generate the message.

        <Expandable defaultOpen="true">
          <ParamField path="appDomain" type="String" required>
            Your app's domain. e.g. "my-domain.com"
          </ParamField>

          <ParamField path="appUri" type="String" required>
            Your app's URI. e.g. "[https://my-domain.com](https://my-domain.com)"
          </ParamField>

          <ParamField path="chainId" type="String" required>
            EVM Chain ID, e.g. "1" for Ethereum Mainnet
          </ParamField>

          <ParamField path="walletAddress" type="String" required>
            The user's [ERC-55](https://eips.ethereum.org/EIPS/eip-55) compliant wallet address.
          </ParamField>
        </Expandable>
      </ParamField>

      ### Returns

      <ResponseField name="String" type="String">
        A SIWE message that can be signed by the wallet.
      </ResponseField>

      ### Usage

      ```swift  theme={"system"}
      do {
          let params = SiweMessageParams(
              appDomain: "my-domain.com",
              appUri: "https://my-domain.com",
              chainId: "1",
              walletAddress: "0x12345..."
          )

          let siweMessage = try await privy.siwe.generateMessage(params: params)
      } catch {
          // An error can be thrown if the network call to generate the message fails,
          // or if invalid metadata was passed in.
      }
      ```

      ## Sign the SIWE message

      Using the message returned by `generateMessage`, request an EIP-191 `personal_sign` signature from the user's connected wallet. You should do this using the library your app uses to connect to external wallets (e.g. the MetaMask iOS SDK or WalletConnect).
      Once the user successfully signs the message, pass it into `login`.

      ## Login with SIWE

      ```swift  theme={"system"}
      func login(
          message: String,
          signature: String,
          params: SiweMessageParams,
          metadata: WalletLoginMetadata?
      ) async throws -> PrivyUser
      ```

      ### Parameters

      <ParamField path="message" type="String" required>
        The message returned from "generateMessage".
      </ParamField>

      <ParamField path="signature" type="String" required>
        The signature of the SIWE message, signed by the user's wallet.
      </ParamField>

      <ParamField path="params" type="SiweMessageParams" required>
        The same SiweMessageParams passed into "generateMessage".
      </ParamField>

      <ParamField path="metadata" type="WalletLoginMetadata">
        (Optional) you can pass additional metadata that will be stored with the linked wallet.

        <Expandable defaultOpen="true">
          <ParamField path="walletClientType" type="WalletClientType">
            An enum specifying the type of wallet used to login. e.g. WalletClientType.metamask
          </ParamField>

          <ParamField path="connectorType" type="String">
            A string identifying how wallet was connected. e.g. "wallet\_connect"
          </ParamField>
        </Expandable>
      </ParamField>

      ### Returns

      <ResponseField name="PrivyUser" type="PrivyUser">
        The authenticated Privy user
      </ResponseField>

      ### Throws

      An error if logging the user in is unsuccessful.

      ## Usage

      ```swift  theme={"system"}
      do {
          let params = SiweMessageParams(
              appDomain: "my-domain.com",
              appUri: "https://my-domain.com",
              chainId: "1",
              walletAddress: "0x12345..."
          )

          // Generate SIWE message
          let siweMessage = try await privy.siwe.generateMessage(params: siweParams)

          // Optional metadata
          let metadata = WalletLoginMetadata(
              walletClientType: WalletClientType.metamask,
              connectorType: "wallet_connect"
          )

          // Login
          try await privy.siwe.login(
            message: siweMessage,
            // the signature generated by the user's wallet
            signature: signature,
            params: siweParams,
            metadata: metadata
          )
      } catch {
          // error logging user in
      }
      ```
    </Tab>

    <Tab title="Solana (SIWS)">
      To authenticate a user via a Solana wallet *([SIWS](https://github.com/phantom/sign-in-with-solana))*, use the Privy client's `siws` handler.

      ## Generate SIWS message

      ```swift  theme={"system"}
      func generateMessage(params: SiwsMessageParams) async throws -> String
      ```

      ### Parameters

      <ParamField path="params" type="SiwsMessageParams">
        The parameters For building a Sign-In with Solana (SIWS) message.

        <Expandable defaultOpen="true">
          <ParamField path="domain" type="String" required>
            The domain that is requesting the signing. Its value MUST be an *[RFC 3986](https://datatracker.ietf.org/doc/html/rfc3986) authority*.
          </ParamField>

          <ParamField path="uri" type="String" required>
            An *[RFC 3986](https://datatracker.ietf.org/doc/html/rfc3986) URI* referring to the resource that is the subject of the signing (as in the subject of a claim).
          </ParamField>

          <ParamField path="address" type="String" required>
            Solana address performing the sign-in. The address is case-sensitive.
          </ParamField>
        </Expandable>
      </ParamField>

      ### Returns

      <ResponseField name="message" type="String">
        A unique SIWS message as a string
      </ResponseField>

      ### Usage

      ```swift  theme={"system"}
      do {
          let params = SiwsMessageParams(
              domain: "my-domain.com",
              uri: "https://my-domain.com",
              address: "insert-solana-wallet-address"
          )

          let message = try await privy.siws.generateMessage(params: params)
      } catch {
          // An error can be thrown if the network call to generate the message fails,
          // or if invalid parameters are passed in.
          print(error)
      }
      ```

      ## Sign the SIWS message

      Using the message returned by `generateMessage`, request a signature for the `message` returned by `generateMessage`, from a connected wallet.
      You should do this using the library your app uses to connect to external wallets (e.g. WalletConnect).
      Once the user successfully signs the message, pass it into `login`.

      ## Login with SIWS

      ```swift  theme={"system"}
      func login(
          message: String,
          signature: String,
          metadata: WalletLoginMetadata?
      ) async throws -> PrivyUser
      ```

      ### Parameters

      <ParamField path="message" type="String" required>
        The previously generated SIWS message.
      </ParamField>

      <ParamField path="signature" type="String" required>
        The SIWS signature generated by the wallet.
      </ParamField>

      <ParamField path="metadata" type="WalletLoginMetadata">
        (Optional) Additional metadata specifying wallet client and connector type.

        <Expandable defaultOpen="true">
          <ParamField path="walletClientType" type="WalletClientType">
            An enum specifying the type of wallet used to login. e.g. WalletClientType.metamask
          </ParamField>

          <ParamField path="connectorType" type="String">
            A string identifying how wallet was connected. e.g. "wallet\_connect"
          </ParamField>
        </Expandable>
      </ParamField>

      ### Returns

      <ResponseField name="user" type="PrivyUser">
        The authenticated Privy user
      </ResponseField>

      ## Usage

      ```swift  theme={"system"}
      do {
          let params = SiwsMessageParams(
              domain: "my-domain.com",
              uri: "https://my-domain.com",
              address: "insert-solana-wallet-address"
          )

          // Generate SIWS message
          let message = try await privy.siws.generateMessage(params: params)

          // Login
          try await privy.siws.login(
            message: message,
            // the signature generated by the user's wallet
            signature: signature
          )
      } catch {
          // Failed to login with SIWS
          print(error)
      }
      ```

      ## Linking a wallet with SIWS

      If instead of logging in, you want to link a Solana wallet to an already authenticated user, you can use the `link` method in the `siws` handler, having generated the SIWS message in the same way.

      ```swift  theme={"system"}
      func link(
          message: String,
          signature: String,
          metadata: WalletLoginMetadata?
      ) async throws
      ```
    </Tab>
  </Tabs>
</View>

<View title="Android" icon="android">
  <Tabs>
    <Tab title="Ethereum (SIWE)">
      To authenticate a user via an Ethereum wallet *([SIWE](https://eips.ethereum.org/EIPS/eip-4361))*, use the Privy client's `siwe` handler.

      ## Generate SIWE message

      ```kotlin  theme={"system"}
      public suspend fun generateMessage(params: SiweMessageParams): Result<String>
      ```

      ### Parameters

      <ParamField path="params" type="SiweMessageParams">
        Set of parameters required to generate the message.

        <Expandable defaultOpen="true">
          <ParamField path="appDomain" type="String" required>
            Your app's domain. e.g. "my-domain.com"
          </ParamField>

          <ParamField path="appUri" type="String" required>
            Your app's URI. e.g. "[https://my-domain.com](https://my-domain.com)"
          </ParamField>

          <ParamField path="chainId" type="String" required>
            EVM Chain ID, e.g. "1" for Ethereum Mainnet
          </ParamField>

          <ParamField path="walletAddress" type="String" required>
            The user's [ERC-55](https://eips.ethereum.org/EIPS/eip-55) compliant wallet address.
          </ParamField>
        </Expandable>
      </ParamField>

      ### Returns

      <ResponseField name="String" type="Result<String>">
        A result type encapsulating the SIWE message that can be signed by the wallet on success.
      </ResponseField>

      ### Usage

      ```kotlin  theme={"system"}
      val params = SiweMessageParams(
          appDomain = domain,
          appUri = uri,
          chainId = chainId,
          walletAddress = walletAddress
      )

      privy.siwe.generateMessage(params = params).fold(
          onSuccess = { message ->
              // request an EIP-191 `personal_sign` signature on the message
          },
          onFailure = { e ->
              // An error can be thrown if the network call to generate the message fails,
              // or if invalid metadata was passed in.
          }
      )
      ```

      ## Sign the SIWE message

      Using the message returned by `generateMessage`, request an EIP-191 `personal_sign` signature from the user's connected wallet. You should do this using the library your app uses to connect to external wallets (e.g. the MetaMask SDK or WalletConnect).
      Once the user successfully signs the message, pass the signature into the `login` function.

      ## Login with SIWE

      ```kotlin  theme={"system"}
      public suspend fun login(
          message: String,
          signature: String,
          params: SiweMessageParams,
          metadata: WalletLoginMetadata?,
      ): Result<PrivyUser>
      ```

      ### Parameters

      <ParamField path="message" type="String" required>
        The message returned from "generateMessage".
      </ParamField>

      <ParamField path="signature" type="String" required>
        The signature of the SIWE message, signed by the user's wallet.
      </ParamField>

      <ParamField path="params" type="SiweMessageParams" required>
        The same SiweMessageParams passed into "generateMessage".
      </ParamField>

      <ParamField path="metadata" type="WalletLoginMetadata">
        (Optional) you can pass additional metadata that will be stored with the linked wallet.

        <Expandable defaultOpen="true">
          <ParamField path="walletClientType" type="WalletClientType">
            An enum specifying the type of wallet used to login. e.g. WalletClientType.Metamask
          </ParamField>

          <ParamField path="connectorType" type="String">
            A string identifying how wallet was connected. e.g. "wallet\_connect"
          </ParamField>
        </Expandable>
      </ParamField>

      ### Returns

      <ResponseField name="PrivyUser" type="Result<PrivyUser>">
        A result type ecapsulating the PrivyUser on success.
      </ResponseField>

      ## Usage

      ```kotlin  theme={"system"}
      val params = SiweMessageParams(
          appDomain = domain,
          appUri = uri,
          chainId = chainId,
          walletAddress = walletAddress
      )

      // optional metadata
      val metadata = WalletLoginMetadata(walletClientType = walletClient, connectorType = connectorType)

      privy.siwe.login(message, signature, params, metadata).fold(
          onSuccess = { privyUser ->
              // Login success
          },
          onFailure = { e ->
              // Login failure, either due to invalid signature or network error
          }
      )
      ```

      <Info>
        Want to link a wallet to an existing user? Check out the [linking accounts documentation](/user-management/users/linking-accounts#external-wallets).
      </Info>
    </Tab>

    <Tab title="Solana (SIWS)">
      To authenticate a user via a Solana wallet ([SIWS](https://siws.web3auth.io/)), use the Privy client's `siws` handler.

      ## Generate SIWS message

      ```kotlin  theme={"system"}
      public suspend fun generateMessage(params: SiwsMessageParams): Result<String>
      ```

      ### Parameters

      <ParamField path="params" type="SiwsMessageParams">
        Set of parameters required to generate the message.

        <Expandable defaultOpen="true">
          <ParamField path="appDomain" type="String" required>
            Your app's domain. e.g. "my-domain.com"
          </ParamField>

          <ParamField path="appUri" type="String" required>
            Your app's URI. e.g. "[https://my-domain.com](https://my-domain.com)"
          </ParamField>

          <ParamField path="walletAddress" type="String" required>
            The user's Solana wallet address.
          </ParamField>
        </Expandable>
      </ParamField>

      ### Returns

      <ResponseField name="String" type="Result<String>">
        A result type encapsulating the SIWS message that can be signed by the wallet on success.
      </ResponseField>

      ### Usage

      ```kotlin  theme={"system"}
      val params = SiwsMessageParams(
          appDomain = domain,
          appUri = uri,
          walletAddress = walletAddress
      )

      privy.siws.generateMessage(params = params).fold(
          onSuccess = { message ->
              // request a Solana wallet signature on the message
          },
          onFailure = { e ->
              // An error can be thrown if the network call to generate the message fails,
              // or if invalid metadata was passed in.
          }
      )
      ```

      ## Sign the SIWS message

      Using the message returned by `generateMessage`, request a signature from the user's connected Solana wallet. You should do this using the library your app uses to connect to external wallets (e.g. the Solana Mobile SDK or Phantom). Once the user successfully signs the message, pass the signature into the login function.

      ## Login with SIWS

      ```kotlin  theme={"system"}
      public suspend fun login(
          message: String,
          signature: String,
          params: SiwsMessageParams,
          metadata: WalletLoginMetadata?,
      ): Result<PrivyUser>
      ```

      ### Parameters

      <ParamField path="message" type="String" required>
        The message returned from "generateMessage".
      </ParamField>

      <ParamField path="signature" type="String" required>
        The signature of the SIWS message, signed by the user's wallet.
      </ParamField>

      <ParamField path="params" type="SiwsMessageParams" required>
        The same SiwsMessageParams passed into "generateMessage".
      </ParamField>

      <ParamField path="metadata" type="WalletLoginMetadata">
        (Optional) you can pass additional metadata that will be stored with the linked wallet.

        <Expandable defaultOpen="true">
          <ParamField path="walletClientType" type="String">
            The client of the connected wallet (e.g. "phantom").
          </ParamField>

          <ParamField path="connectorType" type="String">
            A string identifying how wallet was connected e.g. "wallet\_connect"
          </ParamField>
        </Expandable>
      </ParamField>

      ### Returns

      <ResponseField name="PrivyUser" type="Result<PrivyUser>">
        A result type encapsulating the PrivyUser on success.
      </ResponseField>

      ### Usage

      ```kotlin  theme={"system"}
      val params = SiwsMessageParams(
          appDomain = domain,
          appUri = uri,
          walletAddress = walletAddress
      )

      // optional metadata
      val metadata = WalletLoginMetadata(
          walletClientType = walletClient,
          connectorType = connectorType
      )

      privy.siws.login(message, signature, params, metadata).fold(
          onSuccess = { privyUser ->
              // Login success
          },
          onFailure = { e ->
              // Login failure, either due to invalid signature or network error
          }
      )
      ```

      <Info>
        Want to link a wallet to an existing user? Check out the [linking accounts documentation](/user-management/users/linking-accounts#external-wallets).
      </Info>
    </Tab>
  </Tabs>
</View>

<View title="Flutter" icon="flutter">
  <Tabs>
    <Tab title="Ethereum (SIWE)">
      To authenticate a user via an Ethereum wallet *([SIWE](https://eips.ethereum.org/EIPS/eip-4361))*, use the Privy client's `siwe` handler.

      ## Generate SIWE message

      ```dart  theme={"system"}
      Future<Result<String>> generateMessage(SiweMessageParams params)
      ```

      ### Parameters

      <ParamField path="params" type="SiweMessageParams">
        Set of parameters required to generate the message.

        <Expandable defaultOpen="true">
          <ParamField path="appDomain" type="String" required>
            Your app's domain. e.g. "my-domain.com"
          </ParamField>

          <ParamField path="appUri" type="String" required>
            Your app's URI. e.g. "[https://my-domain.com](https://my-domain.com)"
          </ParamField>

          <ParamField path="chainId" type="String" required>
            EVM Chain ID, e.g. "1" for Ethereum Mainnet
          </ParamField>

          <ParamField path="walletAddress" type="String" required>
            The user's [ERC-55](https://eips.ethereum.org/EIPS/eip-55) compliant wallet address.
          </ParamField>
        </Expandable>
      </ParamField>

      ### Returns

      <ResponseField name="String" type="Result<String>">
        A result type encapsulating the SIWE message that can be signed by the wallet on success.
      </ResponseField>

      ### Usage

      ```dart  theme={"system"}
      final params = SiweMessageParams(
        appDomain: domain,
        appUri: uri,
        chainId: chainId,
        walletAddress: walletAddress,
      );

      final result = await privy.siwe.generateMessage(params);

      result.fold(
        onSuccess: (message) {
          // request an EIP-191 `personal_sign` signature on the message
        },
        onFailure: (error) {
          // An error can be thrown if the network call to generate the message fails,
          // or if invalid metadata was passed in.
        },
      );
      ```

      ## Sign the SIWE message

      Using the message returned by `generateMessage`, request an EIP-191 `personal_sign` signature from the user's connected wallet.
      You should do this using the library your app uses to connect to external wallets (e.g. the MetaMask SDK or WalletConnect). Once
      the user successfully signs the message, pass the signature into the `login` function.

      ## Login with SIWE

      ```dart  theme={"system"}
      Future<Result<PrivyUser>> login({
        required String message,
        required String signature,
        required SiweMessageParams params,
        WalletLoginMetadata? metadata,
      })
      ```

      ### Parameters

      <ParamField path="message" type="String" required>
        The message returned from "generateMessage".
      </ParamField>

      <ParamField path="signature" type="String" required>
        The signature of the SIWE message, signed by the user's wallet.
      </ParamField>

      <ParamField path="params" type="SiweMessageParams" required>
        The same SiweMessageParams passed into "generateMessage".
      </ParamField>

      <ParamField path="metadata" type="WalletLoginMetadata">
        (Optional) you can pass additional metadata that will be stored with the linked wallet.

        <Expandable defaultOpen="true">
          <ParamField path="walletClientType" type="WalletClientType">
            An enum specifying the type of wallet used to login. e.g. WalletClientType.metamask
          </ParamField>

          <ParamField path="connectorType" type="String">
            A string identifying how wallet was connected. e.g. "wallet\_connect"
          </ParamField>
        </Expandable>
      </ParamField>

      ### Returns

      <ResponseField name="PrivyUser" type="Result<PrivyUser>">
        A result type encapsulating the PrivyUser on success.
      </ResponseField>

      ### Usage

      ```dart  theme={"system"}
      final params = SiweMessageParams(
        appDomain: domain,
        appUri: uri,
        chainId: chainId,
        walletAddress: walletAddress,
      );

      // optional metadata
      final metadata = WalletLoginMetadata(
        walletClientType: walletClient,
        connectorType: connectorType,
      );

      final result = await privy.siwe.login(
        message: message,
        signature: signature,
        params: params,
        metadata: metadata,
      );

      result.fold(
        onSuccess: (privyUser) {
          // Login success
        },
        onFailure: (error) {
          // Login failure, either due to invalid signature or network error
        },
      );
      ```
    </Tab>

    <Tab title="Solana (SIWS)">
      To authenticate a user via a Solana wallet *([SIWS](https://github.com/phantom/sign-in-with-solana))*, use the Privy client's `siws` handler.

      ## Generate SIWS message

      ```dart  theme={"system"}
      Future<Result<String>> generateMessage(SiwsMessageParams params)
      ```

      ### Parameters

      <ParamField path="params" type="SiwsMessageParams">
        Set of parameters required to generate the message.

        <Expandable defaultOpen="true">
          <ParamField path="appDomain" type="String" required>
            Your app's domain. e.g. "my-domain.com"
          </ParamField>

          <ParamField path="appUri" type="String" required>
            Your app's URI. e.g. "[https://my-domain.com](https://my-domain.com)"
          </ParamField>

          <ParamField path="walletAddress" type="String" required>
            The user's base58-encoded Solana wallet address.
          </ParamField>
        </Expandable>
      </ParamField>

      ### Returns

      <ResponseField name="String" type="Result<String>">
        A result type encapsulating the SIWS message that can be signed by the wallet on success.
      </ResponseField>

      ### Usage

      ```dart  theme={"system"}
      final params = SiwsMessageParams(
        appDomain: domain,
        appUri: uri,
        walletAddress: walletAddress,
      );

      final result = await privy.siws.generateMessage(params);

      result.fold(
        onSuccess: (message) {
          // request a signature on the message using the Solana wallet
        },
        onFailure: (error) {
          // An error can be thrown if the network call to generate the message fails,
          // or if invalid metadata was passed in.
        },
      );
      ```

      ## Sign the SIWS message

      Using the message returned by `generateMessage`, request a signature from the user's connected Solana wallet.
      You should do this using the library your app uses to connect to Solana wallets (e.g. the Phantom SDK or Solana Mobile Wallet Adapter). Once
      the user successfully signs the message, pass the signature into the `login` function.

      ## Login with SIWS

      ```dart  theme={"system"}
      Future<Result<PrivyUser>> login({
        required String message,
        required String signature,
        required SiwsMessageParams params,
        WalletLoginMetadata? metadata,
      })
      ```

      ### Parameters

      <ParamField path="message" type="String" required>
        The message returned from "generateMessage".
      </ParamField>

      <ParamField path="signature" type="String" required>
        The signature of the SIWS message, signed by the user's wallet.
      </ParamField>

      <ParamField path="params" type="SiwsMessageParams" required>
        The same SiwsMessageParams passed into "generateMessage".
      </ParamField>

      <ParamField path="metadata" type="WalletLoginMetadata">
        (Optional) you can pass additional metadata that will be stored with the linked wallet.

        <Expandable defaultOpen="true">
          <ParamField path="walletClientType" type="WalletClientType">
            An enum specifying the type of wallet used to login. e.g. WalletClientType.phantom
          </ParamField>

          <ParamField path="connectorType" type="String">
            A string identifying how wallet was connected. e.g. "solana\_mobile\_wallet\_adapter"
          </ParamField>
        </Expandable>
      </ParamField>

      ### Returns

      <ResponseField name="PrivyUser" type="Result<PrivyUser>">
        A result type encapsulating the PrivyUser on success.
      </ResponseField>

      ### Usage

      ```dart  theme={"system"}
      final params = SiwsMessageParams(
        appDomain: domain,
        appUri: uri,
        walletAddress: walletAddress,
      );

      // optional metadata
      final metadata = WalletLoginMetadata(
        walletClientType: walletClient,
        connectorType: connectorType,
      );

      final result = await privy.siws.login(
        message: message,
        signature: signature,
        params: params,
        metadata: metadata,
      );

      result.fold(
        onSuccess: (privyUser) {
          // Login success
        },
        onFailure: (error) {
          // Login failure, either due to invalid signature or network error
        },
      );
      ```
    </Tab>
  </Tabs>
</View>
\n