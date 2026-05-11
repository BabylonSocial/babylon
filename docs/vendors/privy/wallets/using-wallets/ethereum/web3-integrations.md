> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Interfacing with common libraries

<Info>
  If you are looking to integrate Privy with a Solana library instead, please see our [Solana web3
  integrations guide](/wallets/using-wallets/solana/kit-integrations).
</Info>

<View title="React" icon="react">
  <Tip>
    Privy is fully compatible with popular web3 libraries for interfacing wallets, including [`viem`](https://viem.sh/), [`wagmi`](https://wagmi.sh/), [`ethers`](https://docs.ethers.org/), and [`web3js`](https://web3js.readthedocs.io/en/v1.10.0/).
  </Tip>

  Read below to learn how to best integrate Privy alongside these libraries.

  ## Viem

  Viem represents connected wallets as either an [**account**](https://viem.sh/docs/accounts/local.html) object, which can sign with the wallet, or a [**wallet client**](https://viem.sh/docs/clients/wallet.html) object, which can also send transactions from the wallet.

  ### Getting an account

  To get an account for a user's connected wallet, import the `toViemAccount` method and the `useWallets` hook from the React SDK.

  ```tsx  theme={"system"}
  import {toViemAccount, useWallets} from '@privy-io/react-auth';
  ```

  Then, pass the `ConnectedWallet` object for your user's wallet to the method, which will return a `LocalAccount` instance.

  ```tsx  theme={"system"}
  const {wallets} = useWallets();

  const wallet = wallets.find((wallet) => (wallet.address === 'your-desired-address'));
  const account = await toViemAccount({wallet});
  ```

  You can then use the `account` to sign messages, typed data payloads, and transactions.

  ### Getting a wallet client

  To get a viem wallet client for a user's connected wallet, first import your desired network from the **`viem/chains`** package and import the **`createWalletClient`** method and **`custom`** transport from **`viem`**:

  ```tsx  theme={"system"}
  import {createWalletClient, custom} from 'viem';
  // Replace `sepolia` with your desired network
  import {sepolia} from 'viem/chains';
  ```

  Then, find your desired wallet from the **`wallets`** array and switch its network to the chain you imported, using the wallet's **`switchChain`** method:

  ```tsx  theme={"system"}
  const {wallets} = useWallets();
  const wallet = wallets[0]; // Replace this with your desired wallet
  await wallet.switchChain(sepolia.id);
  ```

  Lastly, get the wallet's EIP1193 provider using the wallet's **`getEthereumProvider`** method and pass it to viem's **`createWalletClient`** method like so:

  ```tsx  theme={"system"}
  const provider = await wallet.getEthereumProvider();
  const walletClient = createWalletClient({
      account: wallet.address as Hex,
      chain: sepolia,
      transport: custom(provider),
  });
  ```

  You can then use the [**wallet client**](https://viem.sh/docs/clients/wallet) to get information about the wallet or request signatures and transactions.

  ## Wagmi

  Privy is fully compatible with **`wagmi`**. Please see our [**wagmi guide**](/wallets/connectors/ethereum/integrations/wagmi) for setting up the integration.

  ## Ethers

  ### Ethers v5

  ```tsx  theme={"system"}
  const privyProvider = await wallet.getEthereumProvider();
  const provider = new ethers.providers.Web3Provider(privyProvider);
  ```

  ### Ethers v6

  ```tsx  theme={"system"}
  const provider = await wallet.getEthereumProvider();
  const ethersProvider = new ethers.BrowserProvider(provider);
  const signer = ethersProvider.getSigner();
  ```

  ## Web3.js

  Web3.js represents connected wallets as a [**Web3**](https://docs.web3js.org/guides/web3_providers_guide/#providers-types) object, which you can use to get information about the current wallet or the request signatures and transactions.

  To get a Web3js provider for a user's connected wallet, first [find your desired wallet](/wallets/wallets/get-a-wallet/get-connected-wallet) from the **`wallets`** array and switch it to your desired network, using the wallet's **`switchChain`** method:

  ```ts  theme={"system"}
  const {wallets} = useWallets();
  const wallet = wallets[0]; // Replace this with your desired wallet
  await wallet.switchChain(sepolia.id);
  ```

  Then, get the wallet's EIP1193 provider using the wallet's **`getEthereumProvider`** method and pass it to Web3js's **`Web3`** constructor like so:

  ```ts  theme={"system"}
  const provider = await wallet.getEthereumProvider();
  const web3 = new Web3(provider);
  ```

  You can then use the [**Web3 provider**](https://docs.web3js.org/guides/web3_providers_guide/) to get information about the wallet or request signatures and transactions.
</View>

<View title="React Native" icon="react">
  <Tip>
    Privy is fully compatible with popular web3 libraries for interfacing wallets, including [`viem`](https://viem.sh/), [`ethers`](https://docs.ethers.org/), and [`web3js`](https://web3js.readthedocs.io/en/v1.10.0/).
  </Tip>

  <Warning>
    Third-party libraries may require additional shims to be used in a React Native environment.
  </Warning>

  ### Integrating with `viem`

  First, import the necessary methods, objects, and networks from `viem`:

  ```ts  theme={"system"}
  import {createWalletClient, custom} from 'viem';
  // Replace 'mainnet' with your desired network
  import {mainnet} from 'viem/chains';
  ```

  Next, get an EIP-1193 provider for the user's embedded wallet, and switch its network to your desired network:

  ```ts  theme={"system"}
  const provider = await wallet.getProvider();
  await provider.request({
      method: 'wallet_switchEthereumChain',
      // Replace '0x1' with the chain ID of your desired network
      params: [{chainId: '0x1'}],
  });
  ```

  Lastly, initialize a viem Wallet Client from the EIP-1193 provider:

  ```ts  theme={"system"}
  const walletClient = createWalletClient({
      // Replace this with your desired network that you imported from viem
      chain: mainnet,
      transport: custom(provider),
  });
  ```

  You can now use methods implemented by viem's [Wallet Client](https://viem.sh/docs/clients/wallet.html), including [`signMessage`](https://viem.sh/docs/actions/wallet/signMessage.html#signmessage), [`signTypedData`](https://viem.sh/docs/actions/wallet/signTypedData.html#signtypeddata), and [`sendTransaction`](https://viem.sh/docs/actions/wallet/sendTransaction.html#sendtransaction)!

  ### Integrating with `ethers`

  First, import `ethers`:

  ```ts  theme={"system"}
  import {ethers} from 'ethers';
  ```

  Next, get an EIP-1193 provider for the user's embedded wallet, and switch its network to your desired network:

  ```ts  theme={"system"}
  await provider.request({
      method: 'wallet_switchEthereumChain',
      // Replace '0x1' with the chain ID of your desired network
      params: [{chainId: '0x1'}],
  });
  ```

  Lastly, initialize an ethers provider and signer from this EIP-1193 provider:

  ```ts  theme={"system"}
  const ethersProvider = new ethers.providers.Web3Provider(provider);
  const ethersSigner = ethersProvider.getSigner();
  ```

  You can then use methods implemented by ethers' [providers](https://docs.ethers.org/v5/api/providers/) and [signers](https://docs.ethers.org/v5/api/signer/), including [`signMessage`](https://docs.ethers.org/v5/api/signer/#Signer-signMessage) and [`sendTransaction`](https://docs.ethers.org/v5/api/signer/#Signer-sendTransaction).

  ### Integrating with `web3.js`

  First, import `web3`:

  ```ts  theme={"system"}
  import {Web3} from 'web3';
  ```

  Next, get an EIP-1193 provider for the user's embedded wallet, and switch its network to your desired network:

  ```ts  theme={"system"}
  await wallet.provider.request({
      method: 'wallet_switchEthereumChain',
      // Replace '0x1' with the chain ID of your desired network
      params: [{chainId: '0x1'}],
  });
  ```

  Lastly, initialize an ethers provider and signer from this EIP-1193 provider:

  ```ts  theme={"system"}
  const web3 = new Web3(wallet.getEthereumProvider());
  ```

  You can then use interfaces by web3.js for [signing messages](https://docs.web3js.org/guides/wallet/signing), [sending transactions](https://docs.web3js.org/guides/wallet/transactions), and [more](https://docs.web3js.org/guides/web3_eth/eth).
</View>

<View title="NodeJS" icon="node-js">
  ### Viem

  [`viem`](https://viem.sh/docs/accounts/local.html) is a popular TypeScript library on EVM for executing onchain actions with wallets. Privy's wallets on EVM natively integrate with `viem`, allowing you to use the library's interfaces for signing messages, signing typed data, sending transactions, and more.

  To integrate with `viem`, first install version `2^` of the library as a peer dependency:

  ```sh  theme={"system"}
  npm i viem@latest
  ```

  Then, use Privy's `createViemAccount` method to initialize an instance of a viem [`Account`](https://viem.sh/docs/accounts/local) for an EVM wallet. As a parameter to this method, pass an object with the following:

  | Field      | Type          | Description                                |
  | ---------- | ------------- | ------------------------------------------ |
  | `privy`    | `PrivyClient` | Instance of the Privy client for your app. |
  | `walletId` | `string`      | ID of the wallet.                          |
  | `address`  | `0x${string}` | Ethereum address of the wallet.            |

  As an example, you can initialize an `Account` like so:

  ```tsx  theme={"system"}
  import {PrivyClient} from '@privy-io/node';
  import {createViemAccount} from '@privy-io/node/viem';

  // Initialize your Privy client
  const privy = new PrivyClient(...);
  // Create a viem account instance for a wallet
  const account = await createViemAccount(privy, {
      walletId: 'insert-wallet-id',
      address: 'insert-address'
  });
  ```

  <Tip>
    If your wallet requires an [authorization context](/controls/authorization-keys/using-owners/sign/signing-on-the-server),
    you should pass it to the `createViemAccount` method like so:

    ```tsx  theme={"system"}
    const serverWalletAccount = await createViemAccount(privy, {
      walletId: 'insert-wallet-id',
      address: 'insert-address',
      authorizationContext: {
        authorization_private_keys: ['your authorization private key']
      }
    });
    ```
  </Tip>

  From the returned `Account`, you can then initialize a viem [`WalletClient`](https://viem.sh/docs/clients/wallet) to sign messages and execute transactions with the wallet like so:

  ```tsx  theme={"system"}
  import {createWalletClient, http, parseEther} from 'viem';
  import {base} from 'viem/chains';

  const client = createWalletClient({
      account, // `Account` instance from above
      chain: base, // Replace with your desired network
      transport: http()
  });

  const hash = await client.sendTransaction({
      to: '0x59D3eB21Dd06A211C89d1caBE252676e2F3F2218',
      value: parseEther('0.001')
  });
  ```
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  <Warning>
    The `@privy-io/server-auth` library is deprecated. We recommend integrating `@privy-io/node` for
    the latest features and support.
  </Warning>

  ### Viem

  [`viem`](https://viem.sh/docs/accounts/local.html) is a popular TypeScript library on EVM for executing onchain actions with wallets. Privy's wallets on EVM natively integrate with `viem`, allowing you to use the library's interfaces for signing messages, signing typed data, sending transactions, and more.

  To integrate with `viem`, first install version `2^` of the library as a peer dependency:

  ```sh  theme={"system"}
  npm i viem@latest
  ```

  Then, use Privy's `createViemAccount` method to initialize an instance of a viem [`Account`](https://viem.sh/docs/accounts/local) for an EVM wallet. As a parameter to this method, pass an object with the following:

  | Field      | Type          | Description                                |
  | ---------- | ------------- | ------------------------------------------ |
  | `walletId` | `string`      | ID of the wallet.                          |
  | `address`  | `0x${string}` | Ethereum address of the wallet.            |
  | `privy`    | `PrivyClient` | Instance of the Privy client for your app. |

  As an example, you can initialize an `Account` like so:

  ```tsx  theme={"system"}
  import {PrivyClient} from '@privy-io/server-auth';
  import {createViemAccount} from '@privy-io/server-auth/viem';

  // Initialize your Privy client
  const privy = new PrivyClient(...);
  // Create a viem account instance for a wallet
  const account = await createViemAccount({
      walletId: 'insert-wallet-id',
      address: 'insert-address',
      privy
  });
  ```

  From the returned `Account`, you can then initialize a viem [`WalletClient`](https://viem.sh/docs/clients/wallet) to sign messages and execute transactions with the wallet like so:

  ```tsx  theme={"system"}
  import {createWalletClient, http, parseEther} from 'viem';
  import {base} from 'viem/chains';

  const client = createWalletClient({
      account, // `Account` instance from above
      chain: base, // Replace with your desired network
      transport: http()
  });

  const hash = await client.sendTransaction({
      to: '0x59D3eB21Dd06A211C89d1caBE252676e2F3F2218',
      value: parseEther('0.001')
  });
  ```

  ### Ethers

  Ethers is a popular TypeScript library for interacting with the Ethereum blockchain. Privy's wallets on EVM natively integrate with ethers, allowing you to use the library's interfaces for signing messages, signing typed data, sending transactions, and more.

  To integrate with `ethers`, first install version 6^ of the library as a peer dependency:

  ```sh  theme={"system"}
  npm i ethers@latest
  ```

  Then, use Privy's `createEthersSigner` method to initialize an instance of an ethers [`Wallet`](https://docs.ethers.org/v6/api/wallet/) for an EVM wallet. As a parameter to this method, pass an object with the following:

  | Field         | Type                     | Description                                |
  | ------------- | ------------------------ | ------------------------------------------ |
  | `walletId`    | `string`                 | ID of the wallet.                          |
  | `address`     | `0x${string}`            | Ethereum address of the wallet.            |
  | `provider`    | `ethers.JsonRpcProvider` | Instance of the ethers provider.           |
  | `privyClient` | `PrivyClient`            | Instance of the Privy client for your app. |

  ```typescript  theme={"system"}
  import {ethers, TransactionRequest} from 'ethers';

  import {PrivyClient} from '@privy-io/server-auth';
  import {createEthersSigner} from '@privy-io/server-auth/ethers';

  // Initialize your Privy client
  const privyClient = new PrivyClient(...);

  // Initialize your ethers provider
  const provider = new ethers.JsonRpcProvider('https://base.llamarpc.com');

  // Get your wallet
  const walletId = 'insert-wallet-id';
  const wallet = await privyClient.walletApi.getWallet({id: walletId});
  const address = wallet.address;

  // Create an ethers signer
  const signer = createEthersSigner({
      walletId,
      address,
      provider,
      privyClient,
  });
  ```

  Once you have an ethers signer, you can use it to sign messages and send transactions with the wallet like so:

  ```typescript  theme={"system"}
  const transaction: TransactionRequest = {
      to: TO_ADDRESS,
      value: 100,
      chainId: 8453,
  };

  const signedMessage = await signer.signMessage('foobar');
  const signedTransaction = await signer.signTransaction(transaction);
  const result = await signer.sendTransaction(transaction);
  ```
</View>

<View title="Python" icon="python">
  ### Integrating with [`eth-account`](https://pypi.org/project/eth-account/)

  Privy EVM wallets natively integrate with the Python `eth-account` library, allowing you to use the library's interfaces for signing messages, signing typed data, sending transactions, and more.

  To integrate with `eth-account`, first install the library as a dependency:

  ```sh  theme={"system"}
  pip install privy-eth-account
  ```

  Then, use Privy's `create_eth_account` function to initialize an instance of an Account for an EVM wallet. As parameters to this function, pass:

  | Parameter   | Type              | Description                                     |
  | ----------- | ----------------- | ----------------------------------------------- |
  | `client`    | `PrivyHTTPClient` | Instance of the Privy HTTP client for your app. |
  | `address`   | `str`             | Ethereum address of the wallet.                 |
  | `wallet_id` | `str`             | ID of the wallet.                               |

  Here's an example showing how to integrate with `eth-account`:

  ```Python  theme={"system"}
  from privy_eth_account import create_eth_account, PrivyHTTPClient
  from eth_account.messages import encode_typed_data, encode_defunct

  # Initialize your Privy client
  client = PrivyHTTPClient(
      app_id="YOUR_APP_ID",
      app_secret="YOUR_APP_SECRET",
      authorization_key="YOUR_AUTHORIZATION_KEY"
  )

  # Create an account instance for a wallet
  wallet_id = "insert-wallet-id"
  wallet_address = "insert-wallet-address"
  account = create_eth_account(client, wallet_address, wallet_id)
  ```

  Once you created an account instance, you can use it to sign messages, sign transactions, and sign typed data:

  ### Sign a message

  ```Python  theme={"system"}
  # Signing a message (personal_sign)
  message = encode_defunct(text="Hello, Privy!")
  signed_message = account.sign_message(message)
  print(f"Signed message: {signed_message}")
  ```

  ### Sign a transaction

  ```Python  theme={"system"}
  # Signing a transaction
  transaction = {
      "to": "0x123...789",
      "value": 100,
      "chain_id": 8453
  }
  signed_tx = account.sign_transaction(transaction)
  print(f"Signed transaction: {signed_tx}")
  ```

  ### Signing EIP-712 Typed Data

  ```Python  theme={"system"}
  # Example EIP-712 typed data
  # Structure your typed data as a full message
  full_message = {
      "domain": {
          "name": "My App",
          "version": "1",
          "chainId": 8453,
          "verifyingContract": "0xCc9c3D98163F4F6Af884e259132e15D6d27A5c57",
          "salt": "pepper"
      },
      "types": {
          'EIP712Domain': [
              {'name': 'name', 'type': 'string'},
              {'name': 'version', 'type': 'string'},
              {'name': 'chainId', 'type': 'uint256'},
              {'name': 'verifyingContract', 'type': 'address'},
              {'name': 'salt', 'type': 'string'}
          ],
          'Person': [
              {'name': 'name', 'type': 'string'},
              {'name': 'wallet', 'type': 'address'}
          ],
          'Mail': [
              {'name': 'from', 'type': 'Person'},
              {'name': 'to', 'type': 'Person'},
              {'name': 'contents', 'type': 'string'}
          ]
      },
      "message": {
          "from": {
              "name": "Alice",
              "wallet": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
          },
          "to": {
              "name": "Bob",
              "wallet": "0xCc9c3D98163F4F6Af884e259132e15D6d27A5c57"
          },
          "contents": "Hello, Bob!"
      },
      "primaryType": "Mail"
  }

  # Sign the typed data using the full_message parameter
  signed_typed_data = account.sign_typed_data(full_message=full_message)
  print(f"Signed typed data: {signed_typed_data}")
  ```
</View>

<View title="Rust" icon="rust">
  ### Alloy

  [`alloy`](https://alloy.rs/) is a comprehensive Rust library for Ethereum that provides type-safe, high-performance blockchain interactions. Privy's Rust SDK integrates seamlessly with alloy, allowing you to leverage alloy's powerful types and utilities while using Privy for wallet management and signing.

  <Callout>
    Coming soon.
  </Callout>
</View>
\n