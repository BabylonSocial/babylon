> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Sponsoring transactions on Ethereum

Privy makes it easy to create **smart wallets** for your users to sponsor gas fees for transactions on Ethereum. This is done by using a [paymaster](https://www.alchemy.com/docs/wallets/resources/terms#paymaster) to pay for users' gas fees.

<View title="NodeJS" icon="node-js">
  This guide explains how to use smart wallets from your server to sponsor gas fees for transactions on Ethereum. Using wallets as smart wallets gives your application all the benefits of account abstraction, including gas sponsorship, with the flexibility of wallets.

  In this setup, an embedded wallet created on your wallet is the signer for the smart wallet. Note that the wallet's address is not the smart wallet address in this case - it simply authorizes actions taken by the smart wallet. All transactions and assets are tied to the smart wallet.

  <Note>
    This guide uses Kernel as the smart wallet contract provider, but your implementation can use any
    smart wallet provider.
  </Note>

  ### 0: Install necessary dependencies

  This guide uses Privy's server SDK to create the wallet, Pimlico's `permissionless` package, and `viem`. Install these packages with the following command:

  ```sh  theme={"system"}
  npm i @privy-io/node permissionless viem
  ```

  ### 1: Create a wallet

  Create a `privy` client and use the `create` method from [Privy's SDK](/wallets/wallets/create/create-a-wallet) to create a wallet. If you already have a wallet you wish to use, you can skip this step.

  ```ts  theme={"system"}
  import {PrivyClient} from '@privy-io/node';

  // Initialize your Privy client
  const privy = new PrivyClient({
    appId: 'your privy app id',
    appSecret: 'your privy app secret'
  });

  // Create a wallet
  const {
    id: walletId,
    address,
    chain_type: chainType
  } = await privy.wallets().create({chain_type: 'ethereum'});
  ```

  ### 2: Get a `viem` `LocalAccount` for the wallet

  Create a viem `LocalAccount` object representing the wallet. Use the `createViemAccount` method from [Privy's SDK](/wallets/using-wallets/ethereum/web3-integrations#node-js).

  ```tsx  theme={"system"}
  import {createViemAccount} from '@privy-io/node/viem';

  // Create a viem account instance for a wallet
  const serverWalletAccount = await createViemAccount(privy, {
    walletId,
    address
  });
  ```

  <Tip>
    If your wallet requires an [authorization context](/controls/authorization-keys/using-owners/sign/signing-on-the-server),
    you should pass it to the `createViemAccount` method like so:

    ```tsx  theme={"system"}
    const serverWalletAccount = await createViemAccount(privy, {
      walletId,
      address,
      authorizationContext: {
        authorization_private_keys: ['your authorization private key']
      }
    });
    ```
  </Tip>

  ### 3: Create a smart wallet

  Use [`permissionless`](https://docs.pimlico.io/references/permissionless/) to create a smart wallet with the wallet as the signer. Learn more about creating smart wallet accounts in the `permissionless` [docs](https://docs.pimlico.io/references/permissionless/how-to/accounts/use-kernel-account).

  ```tsx  theme={"system"}
  import {toKernelSmartAccount} from 'permissionless/accounts';
  import {entryPoint07Address} from 'viem/account-abstraction';

  const kernelSmartAccount = await toKernelSmartAccount({
    client: publicClient,
    entryPoint: {
      address: entryPoint07Address,
      version: '0.7'
    },
    owner: serverWalletAccount
  });
  ```

  ### 4: Create a client for the smart wallet

  You can use this smart wallet client to request signatures and transactions from the smart wallet. Learn more about making transactions on the client in the `permissonless` [docs](https://docs.pimlico.io/references/permissionless/how-to/accounts/use-kernel-account).

  ```tsx  theme={"system"}
  import {createSmartAccountClient, walletClientToCustomSigner} from 'permissionless';
  import {createPublicClient, http} from 'viem';

  const bundlerUrl = 'your bundler URL';
  const paymasterUrl = 'your paymaster URL';

  // Create a viem public client for RPC calls
  const publicClient = createPublicClient({
    chain: sepolia, // Replace this with the chain of your choice
    transport: http() // Optionally include an RPC override
  });

  // Create the paymaster client to sponsor gas fees on transactions
  const paymasterClient = createPimlicoClient({
    transport: http(paymasterUrl),
    entryPoint: kernelSmartAccount.entryPoint
  });

  // Create the SmartAccountClient for requesting signatures and transactions (RPCs)
  const smartAccountClient = createSmartAccountClient({
    account: kernelSmartAccount,
    chain: sepolia,
    paymaster: paymasterClient,
    bundlerTransport: http(bundlerUrl),
    userOperation: {
      estimateFeesPerGas: async () => (await paymasterClient.getUserOperationGasPrice()).fast
    }
  });
  ```
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  <Warning>
    The `@privy-io/server-auth` library is deprecated. We recommend integrating `@privy-io/node` for
    the latest features and support.
  </Warning>

  This guide explains how to use smart wallets from your server to sponsor gas fees for transactions on Ethereum. Using wallets as smart wallets gives your application all the benefits of account abstraction, including gas sponsorship, with the flexibility of wallets.

  In this setup, an embedded wallet created on your wallet is the signer for the smart wallet. Note that the wallet's address is not the smart wallet address in this case - it simply authorizes actions taken by the smart wallet. All transactions and assets are tied to the smart wallet.

  <Note>
    This guide uses Kernel as the smart wallet contract provider, but your implementation can use any
    smart wallet provider.
  </Note>

  ### 0: Install necessary dependencies

  This guide uses Privy's server SDK to create the wallet, Pimlico's `permissionless` package, and `viem`. Install these packages with the following command:

  ```sh  theme={"system"}
  npm i @privy-io/server-auth permissionless viem
  ```

  ### 1: Create a wallet

  Create a `privy` client and use the `create` method from [Privy's SDK](/wallets/wallets/create/create-a-wallet) to create a wallet. If you already have a wallet you wish to use, you can skip this step.

  ```ts  theme={"system"}
  import {PrivyClient} from '@privy-io/server-auth';

  // Initialize your Privy client
  const privy = new PrivyClient('your privy app id', 'your privy app secret');

  // Create a wallet
  const {
    id: walletId,
    address,
    chainType
  } = await privy.walletApi.createWallet({chainType: 'ethereum'});
  ```

  ### 2: Get a `viem` `LocalAccount` for the wallet

  Create a viem `LocalAccount` object representing the wallet. Use the `createViemAccount` method from [Privy's SDK](/wallets/using-wallets/ethereum/web3-integrations#node-js).

  ```tsx  theme={"system"}
  import {createViemAccount} from '@privy-io/server-auth/viem';

  // Create a viem account instance for a wallet
  const serverWalletAccount = await createViemAccount({
    walletId,
    address,
    privy
  });
  ```

  ### 3: Create a smart wallet

  Use [`permissionless`](https://docs.pimlico.io/references/permissionless/) to create a smart wallet with the wallet as the signer. Learn more about creating smart wallet accounts in the `permissionless` [docs](https://docs.pimlico.io/references/permissionless/how-to/accounts/use-kernel-account).

  ```tsx  theme={"system"}
  import {toKernelSmartAccount} from 'permissionless/accounts';
  import {entryPoint07Address} from 'viem/account-abstraction';

  const kernelSmartAccount = await toKernelSmartAccount({
    client: publicClient,
    entryPoint: {
      address: entryPoint07Address,
      version: '0.7'
    },
    owner: serverWalletAccount
  });
  ```

  ### 4: Create a client for the smart wallet

  You can use this smart wallet client to request signatures and transactions from the smart wallet. Learn more about making transactions on the client in the `permissonless` [docs](https://docs.pimlico.io/references/permissionless/how-to/accounts/use-kernel-account).

  ```tsx  theme={"system"}
  import {createSmartAccountClient, walletClientToCustomSigner} from 'permissionless';
  import {createPublicClient, http} from 'viem';

  const bundlerUrl = 'your bundler URL';
  const paymasterUrl = 'your paymaster URL';

  // Create a viem public client for RPC calls
  const publicClient = createPublicClient({
    chain: sepolia, // Replace this with the chain of your choice
    transport: http() // Optionally include an RPC override
  });

  // Create the paymaster client to sponsor gas fees on transactions
  const paymasterClient = createPimlicoClient({
    transport: http(paymasterUrl),
    entryPoint: kernelSmartAccount.entryPoint
  });

  // Create the SmartAccountClient for requesting signatures and transactions (RPCs)
  const smartAccountClient = createSmartAccountClient({
    account: kernelSmartAccount,
    chain: sepolia,
    paymaster: paymasterClient,
    bundlerTransport: http(bundlerUrl),
    userOperation: {
      estimateFeesPerGas: async () => (await paymasterClient.getUserOperationGasPrice()).fast
    }
  });
  ```
</View>

<View title="React" icon="react">
  ### Gas sponsorship with paymasters

  With smart wallets, your app can pay for gas fees simply by registering a paymaster URL in the Privy Dashboard.

  Follow this guide to [setup smart wallets](/wallets/using-wallets/evm-smart-wallets/overview).

  Privy routes transaction requests to the registered paymaster, which pays gas instead of the user's wallet. This allows users to transact on-chain *instantly* –– even if they do not have a balance in their smart wallet.
</View>

<View title="React Native" icon="react">
  ### Gas sponsorship with paymasters

  With smart wallets, your app can pay for gas fees simply by registering a paymaster URL in the Privy Dashboard.

  Follow this guide to [setup smart wallets](/wallets/using-wallets/evm-smart-wallets/overview).

  Privy routes transaction requests to the registered paymaster, which pays gas instead of the user's wallet. This allows users to transact on-chain *instantly* –– even if they do not have a balance in their smart wallet.
</View>
\n