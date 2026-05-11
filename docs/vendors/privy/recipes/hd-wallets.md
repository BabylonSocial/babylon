> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Hierarchical deterministic (HD) wallets

Privy embedded wallets are **hierarchical deterministic (HD)** wallets. An HD wallet allows you to generate multiple addresses and private keys from a shared source of entropy: the wallet seed (or equivalently, a [BIP-39 mnemonic](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) encoding the seed, known as a seed *phrase*).

In kind, **Privy can be used to provision multiple embedded wallets for a single user.** Read more below to learn how!

<details>
  <summary>Read more about how HD wallets work.</summary>

  HD wallets use a shared source of entropy to derive the wallet seed; this entropy is protected by the Privy cryptosystem.

  Each wallet is generated from the seed and a unique path parameter, which has the format:

  ```
  m / purpose' / coin_type' / account' / change / address_index
  ```

  For Privy's embedded wallets, the path used for the `i`-th wallet is:

  ```
  m/44'/60'/0'/0/i for Ethereum
  m/44'/501'/i/0'  for Solana
  ```

  where `i` is 0-indexed. An HD wallet is said to have an index of `i` if it is derived from the `i`-th path above. You can read more about these derivation paths [here](https://help.myetherwallet.com/en/articles/5867305-hd-wallets-and-derivation-paths).
</details>

<View title="React" icon="react">
  ## Creating multiple HD wallets

  To create multiple HD wallets for a user, use the `createWallet` method:

  <Tabs>
    <Tab title="Ethereum">
      ```tsx  theme={"system"}
      import {useCreateWallet} from '@privy-io/react-auth';

      const {createWallet} = useCreateWallet();
      ```
    </Tab>

    <Tab title="Solana">
      ```tsx  theme={"system"}
      import {useCreateWallet} from '@privy-io/react-auth/solana';

      const {createWallet} = useCreateWallet();
      ```
    </Tab>
  </Tabs>

  ### Creating the user's first wallet

  If this is the first wallet you are creating for the user (e.g. the 0th index), you may call **`createWallet`** with no parameters:

  ```tsx  theme={"system"}
  // Creating the first wallet for a user
  await createWallet();
  ```

  ### Creating additional wallets

  There are two approaches to creating additional wallets.

  #### 1. Create an additional wallet with the next available index

  If the user already has an embedded wallet, and you are creating an additional embedded wallet, call `createWallet` with `createAdditional` set to `true`:

  <ParamField path="createAdditional" type="boolean">
    If `true`, will allow the user to create a wallet regardless if it is their first wallet or an
    additional wallet. If `false`, createWallet will succeed *only if the use is creating their first
    wallet.* Defaults to `false`.
  </ParamField>

  Once invoked, **`createWallet`** will return a Promise that resolves to the **`Wallet`** created for the user at the specified index, if it was successful. This method will reject with an error if:

  * the user is not `authenticated`
  * the user already has an embedded wallet and `createAdditional` was not set to `true`
  * if there is another error during wallet creation, such as the user exiting prematurely

  ```tsx  theme={"system"}
  // Creating additional embedded wallets for the user
  // You can also create the first wallet for the user using this syntax
  await createWallet({createAdditional: true});
  ```

  #### 2. Create an additional wallet with a specified HD wallet index

  To create a wallet at a specified HD wallet index, call `createWallet` with the preferred `walletIndex`.
  This method will either create a new wallet, or return the existing one if one already exists at the specified index.

  <ParamField path="walletIndex" type="number">
    The specified HD wallet index. Must be a positive number, and must be `0` for the user's first
    wallet.
  </ParamField>

  <Info>
    A wallet with HD index 0 must be created before creating a wallet at greater HD indices.
  </Info>

  ```tsx  theme={"system"}
  // Create an additional embedded wallet at index 5
  await createWallet({walletIndex: 5});
  ```

  An error can be thrown if:

  * the user is not `authenticated`
  * wallet creation fails or the wallet cannot be added to the user's account.
  * an invalid HD wallet index is supplied, i.e. `walletIndex` is less than 0, or if `walletIndex` is greater than 0 while user has no wallet with HD index 0.

  ## Using multiple HD wallets

  ### Getting a specific embedded wallet

  Once a user has one or more embedded wallets, the wallets are added to both [`linkedAccounts`](/user-management/users/the-user-object) array of the **`user`** object and the array of connected wallets returned by [`useWallets`](/wallets/wallets/get-a-wallet/get-connected-wallet).

  To find a specific embedded wallet for the user, search the `useWallets` array for a wallet with `walletClientType: 'privy'` and an `address` that matches your desired address:

  <Tabs>
    <Tab title="Ethereum">
      ```tsx  theme={"system"}
      import {useWallets} from '@privy-io/react-auth';

      // Ensure the wallet address is checksummed per EIP55
      const desiredAddress = 'insert-your-desired-address-in-EIP55-format';
      const {wallets} = useWallets();
      const desiredWallet = wallets.find(
        (wallet) => wallet.walletClientType === 'privy' && wallet.address === desiredAddress
      );
      ```
    </Tab>

    <Tab title="Solana">
      ```tsx  theme={"system"}
      import {useWallets} from '@privy-io/react-auth/solana';

      const desiredAddress = 'insert-your-desired-address';
      const {wallets} = useWallets();
      const desiredWallet = wallets.find(
        (wallet) => wallet.walletClientType === 'privy' && wallet.address === desiredAddress
      );
      ```
    </Tab>
  </Tabs>

  You can also get a list of all of the user's embedded wallets by filtering the `useWallets` array for entries with `walletClientType: 'privy'`:

  ```tsx  theme={"system"}
  const embeddedWallets = wallets.filter((wallet) => wallet.walletClientType === 'privy');
  ```

  ### Requesting signatures and transactions

  Your app can then use Privy's native signature and transaction methods, the wallet's EIP1193 provider, or a third-party library like `viem` or `ethers`, per the instructions below.

  #### Using Privy's native signature and transaction methods

  To use Privy's native `signMessage`, `signTypedData`, and `sendTransaction` methods with a specific embedded wallet, simply pass the address for your desired wallet as the final optional parameter to these methods:

  <Tabs>
    <Tab title="Ethereum">
      #### `signMessage`

      ```tsx  theme={"system"}
      const {signMessage} = usePrivy();
      const signature = await signMessage(
        {message: 'insert-message-to-sign'},
        {
          uiOptions: insertOptionalUIConfigOrUndefined,
          address: desiredWallet.address // Replace with the address of the desired embedded wallet
        }
      );
      ```

      #### `signTypedData`

      ```tsx  theme={"system"}
      const {signTypedData} = usePrivy();
      const signature = await signTypedData(insertTypedDataObject, {
        uiOptions: insertOptionalUIConfigOrUndefined,
        address: desiredWallet.address // Replace with the address of the desired embedded wallet
      });
      ```

      #### `sendTransaction`

      ```tsx  theme={"system"}
      const {sendTransaction} = usePrivy();
      const signature = await sendTransaction(insertTransactionRequest, {
        uiOptions: insertOptionalUIConfigOrUndefined,
        fundingConfig: insertOptionalUIConfigOrUndefined,
        address: desiredWallet.address // Replace with the address of the desired embedded wallet
      });
      ```
    </Tab>

    <Tab title="Solana">
      #### `signMessage`

      ```tsx  theme={"system"}
      import {useSignMessage} from '@privy-io/react-auth/solana';

      const {signMessage} = useSignMessage();
      const signature = await signMessage(
        {message: new TextEncoder().encode('insert-message-to-sign')},
        {
          uiOptions: insertOptionalUIConfigOrUndefined,
          address: desiredWallet.address // Replace with the address of the desired embedded wallet
        }
      );
      ```

      #### `sendTransaction`

      ```tsx  theme={"system"}
      import {useSendTransaction} from '@privy-io/react-auth/solana';

      const {sendTransaction} = useSendTransaction();
      const signature = await sendTransaction({
        transaction,
        uiOptions: insertOptionalUIConfigOrUndefined,
        fundWalletConfig: insertOptionalUIConfigOrUndefined,
        address: desiredWallet.address // Replace with the address of the desired embedded wallet
      });
      ```
    </Tab>
  </Tabs>

  #### Using the EIP1193 provider, viem, and ethers (EVM only)

  You can also request signatures and transactions from a specific embedded wallet using the wallet's [EIP1193 provider](/wallets/using-wallets/ethereum/web3-integrations) or a library like `viem` or `ethers`.

  To get the EIP1193 provider for a specific embedded wallet, first find the corresponding `ConnectedWallet` object from the `useWallets` array:

  ```tsx  theme={"system"}
  // Ensure the wallet address is checksummed per EIP55
  const address = 'insert-your-desired-address-in-EIP55-format';
  const {wallets} = useWallets();
  const wallet = wallets.find(
    (wallet) => wallet.walletClientType === 'privy' && wallet.address === address
  );
  ```

  Then, call the object's `getEthereumProvider` method to get an EIP1193 provider for that wallet:

  ```tsx  theme={"system"}
  const provider = await wallet.getEthereumProvider();
  ```

  You can then easily pass that EIP1193 provider to a library like [`viem`](/wallets/using-wallets/ethereum/web3-integrations#viem) or [`ethers`](/wallets/using-wallets/ethereum/web3-integrations#ethers) to use those libraries' interfaces to send requests to the wallet.

  ## Exporting HD wallets

  To export the private key for a specific HD wallet, simply pass the address of the wallet you'd like to export as an `address` parameter to the `exportWallet` method:

  <Tabs>
    <Tab title="Ethereum">
      ```tsx  theme={"system"}
      const {exportWallet} = usePrivy();
      await exportWallet({address: 'insert-your-desired-address'});
      ```
    </Tab>

    <Tab title="Solana">
      ```tsx  theme={"system"}
      import {useExportWallet} from '@privy-io/react-auth/solana';

      const {exportWallet} = useExportWallet();
      await exportWallet({address: 'insert-your-desired-address'});
      ```
    </Tab>
  </Tabs>

  If no `address` is passed to `exportWallet`, Privy will default to exporting the non-imported wallet at `walletIndex: 0`.

  ## Pregenerating multiple HD wallets (EVM only)

  Privy supports pregenerating multiple HD wallets in Ethereum when creating new users. With our user import endpoint, you can create a user with up to 10 pregenerated HD wallets. Simply call the import endpoint with `create_n_ethereum_wallets` set to the number of embedded wallets you want to generate for your user.

  <Info>
    Pregeneration endpoints have heavier rate limit of 240 users per minute. If you are being rate
    limited, responses will have status code 429. We suggest you setup exponential back-offs starting
    at 1 second to seamlessly recover.
  </Info>

  Below is a sample cURL command for pregenerating two new wallets for a user with Privy:

  ```bash  theme={"system"}
  $ curl --request POST https://auth.privy.io/api/v1/users \
  -u "<your-privy-app-id>:<your-privy-app-secret>" \
  -H "privy-app-id: <your-privy-app-id>" \
  -H 'Content-Type: application/json' \
  -d '{
    "create_n_ethereum_wallets": 2,
    "linked_accounts": [
      {
        "address": "batman@privy.io",
        "type": "email"
      }
    ]
  }'
  ```

  A successful response will include the new user object along with their Privy user ID and embedded wallet addresses, like below. The generated wallets will be available to the user upon sign in.

  Below is a sample successful response for generating two new wallets for a user with Privy:

  ```json  theme={"system"}
  {
    "id": "did:privy:clddy332f002tyqpq3b3lv327",
    "created_at": 1674788927,
    "linked_accounts": [
      {
        "address": "batman@privy.io",
        "type": "email"
      },
      {
        "address": "0x3DAF84b3f09A0E2092302F7560888dBc0952b7B7",
        "type": "wallet",
        "wallet_index": 0,
        "walletClient": "privy",
        "chain_type": "ethereum"
      },
      {
        "address": "0x1a235d54C58d0B5E339c784Fd98d4D71125fEb1c",
        "type": "wallet",
        "wallet_index": 1,
        "walletClient": "privy",
        "chain_type": "ethereum"
      }
    ]
  }
  ```
</View>

<View title="React Native" icon="react">
  <Tabs>
    <Tab title="Ethereum">
      ## Creating multiple HD wallets

      To create multiple Ethereum wallets for a user, use the `create` method from the `useEmbeddedEthereumWallet` hook:

      ```tsx  theme={"system"}
      import {useEmbeddedEthereumWallet} from '@privy-io/expo';

      const {create} = useEmbeddedEthereumWallet();
      ```

      As a parameter to `create`, pass an object containing a `createAdditional` boolean specifying if you would like to create an additional wallet, even if the user has an existing one.

      <ParamField path="createAdditional" type="boolean">
        If `true`, will allow the user to create a Ethereum wallet regardless if it is their first wallet
        or an additional wallet. If `false`, createWallet will succeed *only if the use is creating their
        first wallet.* Defaults to `false`.
      </ParamField>

      Once invoked, **`create`** will return a Promise that resolves to the newly created [wallet](/wallets/wallets/get-a-wallet/get-connected-wallet), if it was successful. This method will reject with an error if:

      * the user is not `authenticated`.
      * the user already has an embedded Ethereum wallet and `createAdditional` was not set to `true`.
      * if there is another error during wallet creation, such as the user exiting prematurely.

      ```tsx  theme={"system"}
      // Creating additional embedded wallets for the user
      // You can also create the first wallet for the user using this syntax
      await create({createAdditional: true});
      ```

      ## Using multiple HD wallets

      Once a user has one or more embedded wallets, the wallets are added to the `wallets` array returned by `useEmbeddedEthereumWallet`:

      ```tsx  theme={"system"}
      import {useEmbeddedEthereumWallet} from '@privy-io/expo';
      ...
      const {wallets} = useEmbeddedEthereumWallet();
      ```

      Refer to the [requests section](/wallets/wallets/get-a-wallet/get-connected-wallet) to learn how to interact with the wallets you create.

      ### Getting a specific embedded wallet

      To find a specific embedded wallet for the user, search the `wallets` array for a wallet with the `address` that matches your desired address:

      ```tsx  theme={"system"}
      const desiredAddress = 'insert-your-desired-wallet-address';
      const {wallets} = useEmbeddedEthereumWallet();
      const desiredWallet = wallets.find((wallet) => wallet.address === desiredAddress);
      ```

      You can alternatively search the wallets array by your desired HD index:

      ```tsx  theme={"system"}
      // Replace this with your desired HD index
      const desiredHdIndex = 0;
      const {wallets} = useEmbeddedEthereumWallet();
      const desiredWallet = wallets.find((wallet) => wallet.walletIndex === desiredHdIndex);
      ```
    </Tab>

    <Tab title="Solana">
      ## Creating multiple HD wallets

      To create multiple Solana wallets for a user, use the `create` method from the `useEmbeddedSolanaWallet` hook:

      ```tsx  theme={"system"}
      import {useEmbeddedSolanaWallet} from '@privy-io/expo';
      ...
      const {create} = useEmbeddedSolanaWallet();
      ```

      As an optional parameter to `create`, you may pass an object containing the following fields:

      <ParamField path="createAdditional" type="boolean">
        If `true`, will allow the user to create a Solana wallet regardless if it is their first wallet or
        an additional wallet. If `false`, createWallet will succeed *only if the use is creating their
        first wallet.* Defaults to `false`.
      </ParamField>

      Once invoked, **`create`** will return a Promise that resolves to the [provider](/wallets/wallets/get-a-wallet/get-connected-wallet) for the wallet created for the user, if it was successful. This method will reject with an error if:

      * the user is not `authenticated`
      * the user already has an embedded Solana wallet and `createAdditional` was not set to `true`
      * if there is another error during wallet creation, such as the user exiting prematurely

      ### Creating the user's first wallet

      If this is the first wallet you are creating for the user (e.g. the 0th index), you may call **`create`** with no parameters:

      ```tsx  theme={"system"}
      // Creating the first wallet for a user
      const provider = await create();
      ```

      ### Creating additional wallets

      If the user already has an embedded wallet, and you are creating an additional embedded wallet, **you must call `create` with `createAdditional` set to `true`**:

      ```tsx  theme={"system"}
      // Creating additional embedded wallets for the user
      // You can also create the first wallet for the user using this syntax
      const provider = await create({createAdditional: true});
      ```

      ## Using multiple HD wallets

      Once a user has one or more embedded wallets, the wallets are added to the `wallets` array returned by `useEmbeddedSolanaWallet`:

      ```tsx  theme={"system"}
      import {useEmbeddedSolanaWallet} from '@privy-io/expo';
      ...
      const {wallets} = useEmbeddedSolanaWallet();
      ```

      Each entry in the `wallets` array is an object with the following fields:

      <ParamField path="address" type="string">
        The address (base58-encoded public key) for the wallet.
      </ParamField>

      <ParamField path="publicKey" type="string">
        The address (base58-encoded public key) for the wallet.
      </ParamField>

      <ParamField path="walletIndex" type="number">
        The HD index for the wallet.
      </ParamField>

      <ParamField path="getProvider" type="() => Promise<PrivyEmbeddedSolanaWalletProvider>">
        Method to get a [provider](/wallets/wallets/get-a-wallet/get-connected-wallet) for the wallet for
        requesting signatures and transactions.
      </ParamField>

      ### Getting a specific embedded wallet

      To find a specific embedded wallet for the user, search the `wallets` array for a wallet with the `address` that matches your desired address:

      ```tsx  theme={"system"}
      const desiredAddress = 'insert-your-desired-wallet-address';
      const {wallets} = useEmbeddedSolanaWallet();
      const desiredWallet = wallets.find((wallet) => wallet.address === desiredAddress);
      ```

      You can alternatively search the wallets array by your desired HD index:

      ```tsx  theme={"system"}
      // Replace this with your desired HD index
      const desiredHdIndex = 0;
      const {wallets} = useEmbeddedSolanaWallet();
      const desiredWallet = wallets.find((wallet) => wallet.walletIndex === desiredHdIndex);
      ```

      ### Requesting signatures and transactions

      To request a signature or transaction from a specific embedded wallet, first find the corresponding wallet object from the `wallets` array:

      ```tsx  theme={"system"}
      const desiredAddress = 'insert-your-desired-wallet-address';
      const {wallets} = useEmbeddedSolanaWallet();
      const wallet = wallets.find((wallet) => wallet.address === desiredAddress);
      ```

      Then, call the object's `getProvider` method to get a [provider](/wallets/wallets/get-a-wallet/get-connected-wallet) for the wallet:

      ```tsx  theme={"system"}
      const provider = await wallet.getProvider();
      ```

      You can then easily request signatures from the [`provider`](/wallets/wallets/get-a-wallet/get-connected-wallet) using its [`request`](/wallets/using-wallets/solana/sign-a-message) method, like so:

      ```tsx  theme={"system"}
      const message = 'Hello world';
      const {signature} = await provider.request({
        method: 'signMessage',
        params: {
          message: message
        }
      });
      ```
    </Tab>
  </Tabs>
</View>
\n