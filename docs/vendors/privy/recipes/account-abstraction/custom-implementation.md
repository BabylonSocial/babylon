> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Custom account abstraction implementation

<Tip>
  Privy now allows you to natively use smart wallet for a better developer experience. Check out the
  docs [here](/wallets/using-wallets/evm-smart-wallets/overview).
</Tip>

<View title="ZeroDev" icon="terminal">
  ## Account abstraction with ZeroDev

  [ZeroDev](https://zerodev.app/) is a toolkit for creating [ERC-4337](https://eips.ethereum.org/EIPS/eip-4337)-compatible smart wallets for your users, using the user's EOA as the smart wallet's signer. This allows you to easily add [Account Abstraction](https://ethereum.org/en/roadmap/account-abstraction/) features into your app.

  **You can easily integrate ZeroDev alongside Privy to create smart wallets from your user's embedded or external wallets, allowing you to enhance your app with gas sponsorship, batched transactions, and more!**

  Read below to learn how to configure your app to create smart wallets for *all* your users!

  <details>
    <summary><b>What is an EOA?</b></summary>

    An [**EOA, or externally-owned account**](https://ethereum.org/en/developers/docs/accounts/), is any Ethereum account that is controlled by a private key. Privy's embedded wallets and most external wallets (MetaMask, Coinbase Wallet, Rainbow Wallet, etc.) are EOAs.

    EOAs differ from **contract accounts**, which are instead controlled by smart contract code and do not have their own private key. ZeroDev's smart wallet is a contract account. Contract accounts have [enhanced capabilities, such as gas sponsorship and batched transactions](https://ethereum.org/en/roadmap/account-abstraction/).

    Since they do not have their own private key, contract accounts cannot *directly* produce signatures and initiate transaction flows. Instead, each contract account is generally "managed" by an EOA, which authorizes actions taken by the contract account via a signature; this EOA is called a **signer**.

    In this integration, the user's EOA (from Privy) serves as the signer for their smart wallet (from ZeroDev). The smart wallet (ZeroDev) holds all assets and submits all transactions to the network, but the signer (Privy) is responsible for producing signatures and "kicking off" transaction flows.
  </details>

  <details>
    <summary><b>How much does deploying a smart wallet for a user cost?</b></summary>

    The transaction to deploy a ZeroDev smart wallet requires approximately 258522 in gas. At time of writing, this corresponds to:

    * 0.0168 ETH (28 USD) on **Ethereum Mainnet**
    * 0.04 POL (0.024 USD) on **Polygon**
    * 0.00005 ETH (0.08 USD) on **Arbitrum**

    The exact deployment cost you see will vary depending on the current gas price.

    **Importantly, ZeroDev deploys smart wallets lazily, ensuring that you do not pay deployment costs for functionally unused wallets.**

    When you first initialize a ZeroDev smart wallet for a user, ZeroDev does not yet deploy the wallet, but instead *predicts* the smart wallet's address (via the [`CREATE2`](https://docs.openzeppelin.com/cli/2.8/deploying-with-create2) opcode). This allows you to associate a smart wallet with your user, without any upfront deployment costs.

    ZeroDev only *deploys* the smart wallet to the predicted address when the user sends their first transaction with the smart wallet. This ensures that you only ever pay deployment costs for wallets that are actually used to transact on-chain.
  </details>

  ### 1. Install the required dependencies from Privy and ZeroDev

  In your app's repository, install the required dependencies from Privy and ZeroDev, as well as the [`permissionless`](https://www.npmjs.com/package/permissionless), and [`viem`](https://www.npmjs.com/package/viem) libraries:

  ```sh  theme={"system"}
  npm i @privy-io/react-auth @zerodev/sdk @zerodev/ecdsa-validator permissionless viem
  ```

  ### 2. Sign up for a ZeroDev account and get your project ID

  Visit the [**ZeroDev dashboard**](https://dashboard.zerodev.app/) and sign up for a new account if you do not have one already. Set up a new project for your required chain(s) and retrieve your ZeroDev **project ID**, as well as your **paymaster and bundler URLs** for the project.

  Within this Dashboard, you can also configure [settings for gas sponsorship and other ZeroDev features](https://docs.zerodev.app/sdk/getting-started/tutorial)!

  ### 2. Configure your app's Privy settings

  First, follow the instructions in the [**Privy Quickstart**](/basics/react/quickstart) to get your app set up with a basic Privy integration.

  Next, set **Add confirmation modals** to "off" in your app's \[**Embedded wallets**] {/* TODO: add link */} page in the Privy [**dashboard**](https://dashboard.privy.io). This will configure Privy to *not* show its default UIs when your user must sign messages or send transactions. Instead, we recommend you use your own custom UIs for showing users the [user operations](https://www.alchemy.com/overviews/user-operations)s they sign.

  Lastly, update the **`config.embeddedWallets.createOnLogin`** property of your **`PrivyProvider`** to `'users-without-wallets'`.This will configure Privy to create an embedded wallet for users logging in via a web2 method (email, phone, socials), ensuring that *all* of your users have a wallet that can be used as an EOA.

  Your **`PrivyProvider`** should then look like:

  ```tsx  theme={"system"}
  <PrivyProvider
      appId='insert-your-privy-app-id'
      config={{
          embeddedWallets: {
              createOnLogin: 'users-without-wallets',
          }
          ...insertTheRestOfYourPrivyProviderConfig
      }}
  >
      {/* Your app's components */}
  </PrivyProvider>
  ```

  ### 3. Create a smart account for your user

  You'll now create a smart account for your user, using the Privy embedded wallet (an EOA) as the signer.

  To do so, when the user logs in, first find the user's embedded wallet from Privy's **`useWallets`** hook, and get its [EIP1193 provider](/wallets/using-wallets/ethereum/web3-integrations). You can find embedded wallet by finding the only entry in the **`useWallets`** array with a **`walletClientType`** of `'privy'`.

  ```tsx  theme={"system"}
  import {useWallets} from '@privy-io/react-auth';
  import {sepolia} from 'viem/chains'; // Replace this with the chain used by your application
  import {createWalletClient, custom} from 'viem';
  ...
  // Find the embedded wallet and get its EIP1193 provider
  const {wallets} = useWallets();
  const embeddedWallet = wallets.find((wallet) => (wallet.walletClientType === 'privy'));
  const provider = await embeddedWallet.getEthereumProvider();
  ```

  Next, pass the returned EIP1193 `provider` to the [`toSimpleSmartAccount`](https://docs.pimlico.io/references/permissionless/reference/accounts/toSimpleSmartAccount#tosimplesmartaccount) method from `permissionless` to create a SmartAccount. This signer corresponds to the user's embedded wallet and authorizes actions for the user's smart account.

  ```ts {skip-check} theme={"system"}
  import {createSmartAccountClient} from 'permissionless';
  import {toSimpleSmartAccount} from 'permissionless/accounts';
  import {createPublicClient, http, zeroAddress} from 'viem';
  import {sepolia} from 'viem/chains';
  import {createPimlicoClient} from 'permissionless/clients/pimlico';
  import {entryPoint07Address} from 'viem/account-abstraction';

  const publicClient = createPublicClient({
    chain: sepolia, // or whatever chain you are using
    transport: http()
  });

  const pimlicoUrl = `https://api.pimlico.io/v2/sepolia/rpc?apikey=<PIMLICO_API_KEY>`;
  const pimlicoClient = createPimlicoClient({
    transport: http(pimlicoUrl),
    entryPoint: {
      address: entryPoint07Address,
      version: '0.7'
    }
  });

  // Use the EIP1193 `provider` from Privy to create a `SmartAccount`
  const kernelSmartAccount = await toKernelSmartAccount({
    owners: [provider],
    client: publicClient,
    entryPoint: {
      address: entryPoint07Address,
      version: '0.7'
    }
  });
  ```

  Finally, using the `SmartAccount` from above, initialize a smart account client for the user like so:

  ```tsx  theme={"system"}
  import {sepolia} from 'viem/chains'; // Replace this with the chain used by your application
  import {createPublicClient, http} from 'viem';
  import {ENTRYPOINT_ADDRESS_V07} from 'permissionless';
  import {createZeroDevPaymasterClient, createKernelAccount, createKernelAccountClient} from "@zerodev/sdk";
  import {signerToEcdsaValidator} from "@zerodev/ecdsa-validator";

  ...

  // Initialize a viem public client on your app's desired network
  const publicClient = createPublicClient({
    transport: http(sepolia.rpcUrls.default.http[0]),
  })

  // Create a ZeroDev ECDSA validator from the `smartAccountSigner` from above and your `publicClient`
  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    signer: kernelSmartAccount,
    entryPoint: ENTRYPOINT_ADDRESS_V07,
  })

  // Create a Kernel account from the ECDSA validator
  const account = await createKernelAccount(publicClient, {
    plugins: {
      sudo: ecdsaValidator,
    },
    entryPoint: ENTRYPOINT_ADDRESS_V07,
  });

  // Create a Kernel account client to send user operations from the smart account
  const kernelClient = createKernelAccountClient({
    account,
    chain: sepolia,
    entryPoint: ENTRYPOINT_ADDRESS_V07,
    bundlerTransport: http('insert-your-bundler-RPC-from-the-dashboard'),
    middleware: {
      sponsorUserOperation: async ({ userOperation }) => {
        const zerodevPaymaster = createZeroDevPaymasterClient({
          chain: sepolia,
          entryPoint: ENTRYPOINT_ADDRESS_V07,
          transport: http('insert-your-paymaster-RPC-to-the-dashboard'),
        })
        return zerodevPaymaster.sponsorUserOperation({
          userOperation,
          entryPoint: ENTRYPOINT_ADDRESS_V07,
        })
      }
    }
  })
  ```

  The `kernelClient` is a drop-in replacement for a `viem` [Wallet Client](https://viem.sh/docs/clients/wallet.html), and requests to the smart account can be made using [`viem`'s API](https://docs.zerodev.app/sdk/core-api/send-transactions).

  <Tip>
    You can also store the user's smart account address on Privy's user object. See [this
    guide](./address.md) for more.
  </Tip>

  <details>
    <summary><b>Want to see this code end-to-end?</b></summary>
    You can find the code snippets above pasted in an end-to-end example below.

    ```tsx  theme={"system"}
    /**
     * This example assumes your app is wrapped with the `PrivyProvider` and
     * is configured to create embedded wallets for users upon login. Aside from
     * the imports, all of the code in this snippet must be used within a React component
     * or context.
     */
    import {createSmartAccountClient} from 'permissionless';
    import {toSimpleSmartAccount} from 'permissionless/accounts';
    import {createPublicClient, http, zeroAddress} from 'viem';
    import {sepolia} from 'viem/chains';
    import {createPimlicoClient} from 'permissionless/clients/pimlico';
    import {entryPoint07Address} from 'viem/account-abstraction';
    import {useWallets} from '@privy-io/react-auth';
    import {
      createZeroDevPaymasterClient,
      createKernelAccount,
      createKernelAccountClient
    } from '@zerodev/sdk';
    import {signerToEcdsaValidator} from '@zerodev/ecdsa-validator';

    const {wallets} = useWallets();
    const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
    const provider = await embeddedWallet.getEthereumProvider();

    // Initialize a viem public client on your app's desired network
    const publicClient = createPublicClient({
      chain: sepolia, // or whatever chain you are using
      transport: http()
    });

    const pimlicoUrl = `https://api.pimlico.io/v2/sepolia/rpc?apikey=<PIMLICO_API_KEY>`;
    const pimlicoClient = createPimlicoClient({
      transport: http(pimlicoUrl),
      entryPoint: {
        address: entryPoint07Address,
        version: '0.7'
      }
    });

    // Use the EIP1193 `provider` from Privy to create a `SmartAccount`
    const kernelSmartAccount = await toKernelSmartAccount({
      owners: [provider],
      client: publicClient,
      entryPoint: {
        address: entryPoint07Address,
        version: '0.7'
      }
    });

    // Create a ZeroDev ECDSA validator from the `smartAccountSigner` from above and your `publicClient`
    const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
      signer: smartAccountSigner,
      entryPoint: entryPoint07Address
    });

    // Create a Kernel account from the ECDSA validator
    const account = await createKernelAccount(publicClient, {
      plugins: {
        sudo: ecdsaValidator
      },
      entryPoint: entryPoint07Address
    });

    // Create a Kernel client to send user operations from the smart account
    const kernelClient = createKernelAccountClient({
      account,
      chain: sepolia,
      entryPoint: entryPoint07Address,
      bundlerTransport: http('insert-your-bundler-RPC-from-the-dashboard'),
      middleware: {
        // See https://docs.zerodev.app/sdk/core-api/sponsor-gas
        sponsorUserOperation: async ({userOperation}) => {
          const zerodevPaymaster = createZeroDevPaymasterClient({
            chain: sepolia,
            entryPoint: entryPoint07Address,
            transport: http('insert-your-paymaster-RPC-from-the-dashboard')
          });
          return zerodevPaymaster.sponsorUserOperation({
            userOperation,
            entryPoint: entryPoint07Address
          });
        }
      }
    });
    ```

    Note: if your app uses React, we suggest that you store the user's `kernelClient` in a [React context](https://react.dev/learn/passing-data-deeply-with-context) that wraps your application. This allows you to easily access the smart account from your app's pages and components.
  </details>

  ### 4. Send user operations (transactions) from the smart account

  Now that your users have Kernel (ZeroDev) smart accounts, they can now send [**UserOperations**](https://eips.ethereum.org/EIPS/eip-4337) from their smart account. This is the AA analog to sending a transaction.

  **To send a user operation from a user's smart account, use the Kernel client's [`sendTransaction`](https://docs.zerodev.app/sdk/core-api/send-transactions#sending-transactions-1) method.**

  ```tsx  theme={"system"}
  const txHash = await kernelClient.sendTransaction({
    to: 'TO_ADDRESS',
    value: VALUE, // default to 0
    data: '0xDATA' // default to 0x
  });
  ```

  This is a drop-in replacement for viem's [`sendTransaction`](https://viem.sh/docs/actions/wallet/sendTransaction.html) method, and will automatically apply any smart account configurations (e.g. gas sponsorship) you configure in the `middleware` before sending the transaction.

  **That's it! You've configured your app to create smart wallets for all of your users, and can seamlessly add in AA features like gas sponsorship, batched transactions, and more.** 🎉
</View>

<View title="Safe" icon="terminal">
  ## Account Abstraction with Safe

  [Safe Smart Accounts](https://safe.global/) is a product by [Safe](https://safe.global/wallet) for creating [ERC-4337](https://eips.ethereum.org/EIPS/eip-4337)-compatible smart accounts for your users, using the user's EOA as the smart account's signer. The product builds off of the smart contract infrastructure powering the widely-used [Safe wallet](https://safe.global/wallet) and allows you to easily add [Account Abstraction](https://ethereum.org/en/roadmap/account-abstraction/) and other Safe features into your app.

  <details>
    <summary><b>What is an EOA?</b></summary>

    An [**EOA, or externally-owned account**](https://ethereum.org/en/developers/docs/accounts/), is any Ethereum account that is controlled by a private key. Privy's embedded wallets and most external wallets (MetaMask, Coinbase Wallet, Rainbow Wallet, etc.) are EOAs.

    EOAs differ from **contract accounts**, which are instead controlled by smart contract code and do not have their own private key. Safe's smart wallet is a contract account. Contract accounts have [enhanced capabilities, such as gas sponsorship and batched transactions](https://ethereum.org/en/roadmap/account-abstraction/).

    Since they do not have their own private key, contract accounts cannot *directly* produce signatures and initiate transaction flows. Instead, each contract account is generally "managed" by an EOA, which authorizes actions taken by the contract account via a signature; this EOA is called a **signer**.

    In this integration, the user's EOA (from Privy) serves as the signer for their smart wallet (from Safe). The smart wallet (Safe) holds all assets and submits all transactions to the network, but the signer (Privy) is responsible for producing signatures and "kicking off" transaction flows.
  </details>

  **To create Safe smart accounts for your users, simply follow our Pimlico integration guide.** Safe does not operate its own paymaster and bundler infrastructure, and developers generally compose the Safe smart account with paymasters or bundlers from Pimlico.

  **When integrating Safe alongside Pimlico, the only change from the default Pimlico setup is to replace the [`toSimpleSmartAccount`](https://docs.pimlico.io/references/permissionless/reference/accounts/toSimpleSmartAccount#usage) method with [`toSafeSmartAccount`](https://docs.pimlico.io/references/permissionless/reference/accounts/toSafeSmartAccount#usage).** This modifies the setup to deploy a Safe smart account for the user instead of a simple smart account.

  For example, when initializing the smart account from a `viem` wallet client for the user's Privy embedded wallet, you should update your code as follows:

  ```tsx  theme={"system"}
  import {createSmartAccountClient} from 'permissionless';
  import {toSimpleSmartAccount} from 'permissionless/accounts'; // [!code --]
  import {toSafeSmartAccount} from 'permissionless/accounts'; // [!code ++]

  import {createPimlicoClient} from 'permissionless/clients/pimlico';
  import {createPublicClient, http} from 'viem';
  import {entryPoint07Address} from 'viem/account-abstraction';

  // Create a viem public client for RPC calls
  const publicClient = createPublicClient({
    chain: sepolia, // Replace this with the chain of your app
    transport: http()
  });

  // Initialize the smart account for the user
  const simpleSmartAccount = await toSimpleSmartAccount({
    // [!code --]
    client: publicClient, // [!code --]
    owner: privyClient.account, // [!code --]
    factoryAddress: '0x9406Cc6185a346906296840746125a0E44976454' // [!code --]
  }); // [!code --]
  const safeSmartAccount = await toSafeSmartAccount({
    // [!code ++]
    owners: [privyClient.account], // [!code ++]
    safeVersion: '1.4.1', // [!code ++]
    entryPoint: {
      // [!code ++]
      address: ENTRYPOINT_ADDRESS_V07, // [!code ++]
      version: '0.7' // [!code ++]
    } // [!code ++]
  }); // [!code ++]

  // Create the Paymaster for gas sponsorship using the API key from your Pimlico dashboard
  const pimlicoPaymaster = createPimlicoClient({
    transport: http('https://api.pimlico.io/v2/sepolia/rpc?apikey=YOUR_PIMLICO_API_KEY')
  });

  // Create the SmartAccountClient for requesting signatures and transactions (RPCs)
  const smartAccountClient = createSmartAccountClient({
    account: simpleSmartAccount, // [!code --]
    account: safeSmartAccount, // [!code ++]
    chain: sepolia, // Replace this with the chain for your app
    bundlerTransport: http('https://api.pimlico.io/v1/sepolia/rpc?apikey=YOUR_PIMLICO_API_KEY'),
    paymaster: pimlicoPaymaster // If your app uses a paymaster for gas sponsorship
  });
  ```

  <Tip>
    You can also store the user's smart account address on Privy's user object. See [this guide](/recipes/account-abstraction/address) for more.
  </Tip>
</View>

<View title="Pimlico" icon="terminal">
  ## Account Abstraction with permissionless.js and Pimlico

  [**`permissionless.js`**](https://www.npmjs.com/package/permissionless) is a modular and extensible TypeScript library originally created by [**Pimlico**](https://pimlico.io) for deploying and managing ERC-4337 smart accounts. You can use this library for all major smart account implementations, including [Safe](https://docs.pimlico.io/guides/how-to/accounts/use-safe-account), [Kernel](https://docs.pimlico.io/references/permissionless/how-to/accounts/use-kernel-account), [Biconomy](https://docs.pimlico.io/guides/how-to/accounts/use-nexus-account), [SimpleAccount](https://docs.pimlico.io/guides/how-to/accounts/use-simple-account), and more.

  **You can easily integrate [`permissionless.js`](https://www.npmjs.com/package/permissionless) alongside Privy to create smart wallets from your user's embedded or external wallets, allowing you to enhance your app with gas sponsorship, batched transactions, and more.**

  Just follow the steps below!

  <Tip>
    Want to see an end-to-end integration of Privy with `permissionless.js`? Check out [**our example
    app**](https://github.com/privy-io/examples/tree/main/examples/privy-next-permissionless)!
  </Tip>

  <details>
    <summary><b>What is an EOA?</b></summary>

    An [**EOA, or externally-owned account**](https://ethereum.org/en/developers/docs/accounts/), is any Ethereum account that is controlled by a private key. Privy's embedded wallets and most external wallets (MetaMask, Coinbase Wallet, Rainbow Wallet, etc.) are EOAs.

    EOAs differ from **contract accounts**, which are instead controlled by smart contract code and do not have their own private key. Smart wallets are contract accounts. Contract accounts have [enhanced capabilities, such as gas sponsorship and batched transactions](https://ethereum.org/en/roadmap/account-abstraction/).

    Since they do not have their own private key, contract accounts cannot *directly* produce signatures and initiate transaction flows. Instead, each contract account is generally "managed" by an EOA, which authorizes actions taken by the contract account via a signature; this EOA is called a **signer**.

    In this integration, the user's EOA (from Privy) serves as the signer for their smart wallet (from permissionless). The smart wallet holds all assets and submits all transactions to the network, but the signer (Privy) is responsible for producing signatures and "kicking off" transaction flows.
  </details>

  ### 1. Install Privy and `permissionless.js`

  In your project, install the necessary dependencies from Privy, Pimlico, and [`viem`](https://viem.sh/):

  ```bash  theme={"system"}
  npm i @privy-io/react-auth permissionless viem
  ```

  ### 2. Sign up for a Pimlico account and create an API key.

  To send transactions from smart accounts, you will need access to a [**bundler**](https://www.alchemy.com/overviews/what-is-a-bundler). We also recommend using [**paymaster**](https://www.alchemy.com/overviews/what-is-a-paymaster) to sponsor your user's transactions.

  To get a **bundler** and **paymaster** for your application, [**sign up for a Pimlico account**](https://dashboard.pimlico.io/) and copy down your API key for the rest of this guide!

  ### 3. Configure your app's `PrivyProvider`

  First, follow the instructions in the [**Privy Quickstart**](/basics/react/quickstart) to get your app set up with Privy.

  Next, set **Add confirmation modals** to "off" in your app's **Embedded wallets** page in the Privy [**dashboard**](https://dashboard.privy.io). This will configure Privy to *not* show its default UIs when your user must sign messages or send transactions. Instead, we recommend you use your own custom UIs for showing users the [`UserOperation`](https://www.alchemy.com/overviews/user-operations)s they sign.

  Then, update the **`config.embeddedWallets.createOnLogin`** property of your **`PrivyProvider`** to `'users-without-wallets'`.This will configure Privy to create an embedded wallet for users logging in via a web2 method (email, phone, socials), ensuring that *all* of your users have a wallet that can be used as an EOA.

  Your **`PrivyProvider`** should then look like:

  ```tsx  theme={"system"}
  <PrivyProvider
      appId='insert-your-privy-app-id'
      config={{
          /* Replace this with your desired login methods */
          loginMethods: ['email', 'wallet'],
          /* Replace this with your desired appearance configuration */
          appearance: {
              theme: 'light',
              accentColor: '#676FFF',
              logo: 'your-logo-url'
          }
          embeddedWallets: {
              createOnLogin: 'users-without-wallets',
              showWalletUIs: false
          }
      }}
  >
      {/* Your app's components */}
  </PrivyProvider>
  ```

  ### 4. Create a smart account for your user

  You'll now create a smart account for your user, using the Privy embedded wallet (an EOA) as the signer.

  To do so, when the user logs in, **find the user's embedded wallet from Privy's `useWallets` hook, and create a viem [`WalletClient`](https://viem.sh/docs/clients/wallet.html) for it**. You can find embedded wallet by finding the only entry in the **`useWallets`** array with a **`walletClientType`** of `'privy'`.

  ```tsx  theme={"system"}
  import {useWallets} from '@privy-io/react-auth';
  import {sepolia} from 'viem/chains'; // Replace this with the chain used by your application
  import {createWalletClient, custom} from 'viem';

  ...

  // Find the embedded wallet and get its EIP1193 provider
  const {wallets} = useWallets();
  const embeddedWallet = wallets.find((wallet) => (wallet.walletClientType === 'privy'));
  const eip1193provider = await embeddedWallet.getEthereumProvider();

  // Create a viem WalletClient from the embedded wallet's EIP1193 provider
  // This will be used as the signer for the user's smart account
  const privyClient = createWalletClient({
    account: embeddedWallet.address,
    chain: sepolia, // Replace this with the chain used by your application
    transport: custom(eip1193provider)
  });
  ```

  Next, using the **`privyClient`** from above, create a **`SmartAccountClient`** which represents the user's smart account. In creating the smart account, you can also specify which smart account implementation you'd like to use. Possible options include: [Safe](https://docs.pimlico.io/guides/how-to/accounts/use-safe-account), [Kernel](https://docs.pimlico.io/guides/how-to/accounts/use-kernel-account), [Biconomy](https://www.biconomy.io/), and [SimpleAccount](https://docs.pimlico.io/guides/how-to/accounts/use-simple-account) (the original smart account implementation).

  If your app also uses a **paymaster** to sponsor gas on behalf of users, you can also specify which paymaster to use by calling the **`createPimlicoClient`** method from `permissionless` with the RPC URL in your Pimlico Dashboard.

  ```ts {skip-check} theme={"system"}
  import {createSmartAccountClient} from 'permissionless';
  import {toSimpleSmartAccount} from 'permissionless/accounts';
  import {createPimlicoClient} from 'permissionless/clients/pimlico';
  import {createPublicClient, http} from 'viem';
  import {sepolia} from 'viem/chains';
  import {entryPoint07Address} from 'viem/account-abstraction';
  import {useWallets} from '@privy-io/react-auth';

  const {wallets} = useWallets();
  const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
  const provider = await embeddedWallet.getEthereumProvider();

  // Create a viem public client for RPC calls
  const publicClient = createPublicClient({
    chain: sepolia, // Replace this with the chain of your app
    transport: http()
  });

  // Initialize the smart account for the user
  const simpleSmartAccount = await toSimpleSmartAccount({
    client: publicClient,
    owner: {request: provider.request},
    entryPoint: {
      address: entryPoint07Address,
      version: '0.7'
    }
  });

  // Create the Paymaster for gas sponsorship using the API key from your Pimlico dashboard
  const pimlicoPaymaster = createPimlicoClient({
    transport: http('https://api.pimlico.io/v2/sepolia/rpc?apikey=YOUR_PIMLICO_API_KEY')
  });

  // Create the SmartAccountClient for requesting signatures and transactions (RPCs)
  const smartAccountClient = createSmartAccountClient({
    account: simpleSmartAccount,
    chain: sepolia, // Replace this with the chain for your app
    bundlerTransport: http('https://api.pimlico.io/v1/sepolia/rpc?apikey=YOUR_PIMLICO_API_KEY'),
    paymaster: pimlicoPaymaster // If your app uses a paymaster for gas sponsorship
  });
  ```

  When using the snippets above, make sure replace `YOUR_PIMLICO_API_KEY` with your Pimlico API key that you created in step 2!

  <Tip>
    You can also store the user's smart account address on Privy's user object. See [this
    guide](./address.md) for more.
  </Tip>

  <details>
    <summary><b>Want to see this code end-to-end?</b></summary>
    You can find the code snippets above pasted in an end-to-end example below.

    ```tsx  theme={"system"}
    /**
     * This example assumes your app is wrapped with the `PrivyProvider` and
     * is configured to create embedded wallets for users upon login. Aside from
     * the imports, all of the code in this snippet must be used within a React component
     * or context.
     */
    import {useWallets} from '@privy-io/react-auth';
    import {sepolia} from 'viem/chains'; // Replace this with the chain used by your application
    import {createWalletClient, createPublicClient, custom, http} from 'viem';
    import {entryPoint07Address} from 'viem/account-abstraction';
    import {createSmartAccountClient, walletClientToCustomSigner} from "permissionless";
    import {createPimlicoClient} from "permissionless/clients/pimlico";
    import {toSimpleSmartAccount} from "permissionless/accounts";

    ...

    // Find the embedded wallet and get its EIP1193 provider
    const {wallets} = useWallets();
    const embeddedWallet = wallets.find((wallet) => (wallet.walletClientType === 'privy'));
    const eip1193provider = await embeddedWallet.getEthereumProvider();

    // Create a viem WalletClient from the embedded wallet's EIP1193 provider
    const privyClient = createWalletClient({
      account: embeddedWallet.address,
      chain: sepolia, // Replace this with the chain used by your application
      transport: custom(eip1193provider)
    });

    // Create a viem public client for RPC calls
    const publicClient = createPublicClient({
      chain: sepolia, // Replace this with the chain of your app
      transport: http()
    })

    // Initialize the smart account for the user using the embedded wallet as the signer
    const customSigner = walletClientToCustomSigner(privyClient);
    const simpleSmartAccount = await toSimpleSmartAccount({
      client: publicClient,
      owner: eip1193provider,
      entryPoint: {
        address: entryPoint07Address,
        version: "0.7"
      },
    })

    // Create the Paymaster for gas sponsorship using the API key from your Pimlico dashboard
    const pimlicoPaymaster = createPimlicoClient({
      transport: http(
        "https://api.pimlico.io/v2/sepolia/rpc?apikey=YOUR_PIMLICO_API_KEY",
      ),
    })

    // Create the SmartAccountClient for requesting signatures and transactions
    const smartAccountClient = createSmartAccountClient({
        account: simpleSmartAccount,
        chain: sepolia, // Replace this with the chain for your app
        transport: http("https://api.pimlico.io/v1/sepolia/rpc?apikey=YOUR_PIMLICO_API_KEY"),
        paymaster: pimlicoPaymaster // If your app uses a paymaster for gas sponsorship
    })
    ```

    Note: if your app uses React, we suggest that you store the user's `SmartAccountClient` in a [React context](https://react.dev/learn/passing-data-deeply-with-context) that wraps your application. This allows you to easily access the smart account from your app's pages and components.
  </details>

  ### 5. Send transactions from the smart account

  You can now send transactions using the **`sendTransaction`** method on the [**`SmartAccountClient`**](https://docs.pimlico.io/references/permissionless/reference/clients/smartAccountClient) object, like so:

  ```ts {skip-check} theme={"system"}
  const txHash = await smartAccountClient.sendTransaction({
    account: smartAccountClient.account,
    to: 'zero-address',
    data: '0x',
    value: BigInt(0)
  });
  ```

  You can also request signatures, typed data signatures, and more from the smart account! The [**`SmartAccountClient`**](https://docs.pimlico.io/references/permissionless/reference/clients/smartAccountClient) functions as a drop-in replacement for [`viem`'s wallet client](https://viem.sh/docs/clients/wallet#wallet-client) - you can use the same interfaces with the [**`SmartAccountClient`**](https://docs.pimlico.io/references/permissionless/reference/clients/smartAccountClient) object!

  **That's it! Once you've created smart accounts for your users, you can easily add AA features into your application like gas sponsorship, batched transactions, and more.** 🎉 To learn more about what you can do with smart accounts, check out the [**`permissionless.js` guide**](https://docs.pimlico.io/guides/how-to/signers/privy).
</View>

<View title="Biconomy" icon="terminal">
  ## Account abstraction with Biconomy

  <Info>
    Biconomy has an updated guide for using the new [Biconomy
    Nexus](https://www.biconomy.io/post/nexus-modular-smart-account) smart accounts. Please refer to
    the [Biconomy guide](https://docs.biconomy.io/tutorials/signers/privy) for the most up-to-date
    information.
  </Info>

  [Biconomy](https://www.biconomy.io/) is a toolkit for creating [ERC-4337](https://eips.ethereum.org/EIPS/eip-4337)-compatible smart accounts for your users, using the user's EOA as the smart account's signer. This allows you to easily add [Account Abstraction](https://ethereum.org/en/roadmap/account-abstraction/) features into your app.

  **You can easily integrate Biconomy alongside Privy to create smart wallets from your user's embedded or external wallets, allowing you to enhance your app with [gas sponsorship](https://docs.biconomy.io/dashboard/paymaster) and more!**

  Read below to learn how to configure your app to create smart wallets for *all* your users!

  <Tip>
    Want to see an end-to-end integration of Privy with Biconomy? Check out **an example
    [app](https://aaprivy.vercel.app/) and [repo](https://github.com/bcnmy/biconomy_privy_example)**!
  </Tip>

  <details>
    <summary><b>What is an EOA?</b></summary>

    An [**EOA, or externally-owned account**](https://ethereum.org/en/developers/docs/accounts/), is any Ethereum account that is controlled by a private key. Privy's embedded wallets and most external wallets (MetaMask, Coinbase Wallet, Rainbow Wallet, etc.) are EOAs.

    EOAs differ from **contract accounts**, which are instead controlled by smart contract code and do not have their own private key. Biconomy's smart wallet is a contract account. Contract accounts have [enhanced capabilities, such as gas sponsorship and batched transactions](https://ethereum.org/en/roadmap/account-abstraction/).

    Since they do not have their own private key, contract accounts cannot *directly* produce signatures and initiate transaction flows. Instead, each contract account is generally "managed" by an EOA, which authorizes actions taken by the contract account via a signature; this EOA is called a **signer**.

    In this integration, the user's EOA (from Privy) serves as the signer for their smart wallet (from Biconomy). The smart wallet (Biconomy) holds all assets and submits all transactions to the network, but the signer (Privy) is responsible for producing signatures and "kicking off" transaction flows.
  </details>

  ### 1. Install Privy and Biconomy

  In your app's repository, install the [**`@privy-io/react-auth`**](https://www.npmjs.com/package/@privy-io/react-auth) SDK from Privy and the [**`@biconomy/account`**](https://docs.biconomy.io/Account/integration#installation) SDK from Biconomy:

  ```sh  theme={"system"}
  npm i @privy-io/react-auth @biconomy/account
  ```

  ### 2. Configure your app's `PrivyProvider`

  First, follow the instructions in the [**Privy Quickstart**](/basics/react/quickstart) to get your app set up with Privy.

  Next, set **Add confirmation modals** to "off" in your app's **Embedded wallets** page in the Privy [**dashboard**](https://dashboard.privy.io). This will configure Privy to *not* show its default UIs when your user must sign messages or send transactions. Instead, we recommend you use your own custom UIs for showing users the [`UserOperation`](https://www.alchemy.com/overviews/user-operations)s they sign.

  Then, update the **`config.embeddedWallets.createOnLogin`** property of your **`PrivyProvider`** to `'users-without-wallets'`.This will configure Privy to create an embedded wallet for users logging in via a web2 method (email, phone, socials), ensuring that *all* of your users have a wallet that can be used as an EOA.

  Your **`PrivyProvider`** should then look like:

  ```tsx  theme={"system"}
  <PrivyProvider
      appId='insert-your-privy-app-id'
      config={{
          embeddedWallets: {
              createOnLogin: 'users-without-wallets',
          }
          ...insertTheRestOfYourPrivyProviderConfig
      }}
  >
      {/* Your app's components */}
  </PrivyProvider>
  ```

  ### 3. Configure your Biconomy bundler and paymaster

  Go to the [**Biconomy Dashboard**](https://dashboard.biconomy.io/) and configure a **Paymaster** and a **Bundler** for your app. Make sure these correspond to the desired network for your user's smart accounts.

  <figure style="width: 100%; display: flex; flex-direction: column; align-items: center;">
    <img src="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/biconomy-paymaster.png?fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=ebaf688fd3e3abafbabfe704b4aaf395" style="width: 80%;" alt="Pregenerate user wallets" data-og-width="3824" width="3824" data-og-height="1920" height="1920" data-path="images/biconomy-paymaster.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/biconomy-paymaster.png?w=280&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=90427164fac4c460e0265bebaca4ead5 280w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/biconomy-paymaster.png?w=560&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=bfc392d6e28a685a6139ce6e837e680f 560w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/biconomy-paymaster.png?w=840&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=eb023e2326eb9c9b7a9d24a78d181ce6 840w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/biconomy-paymaster.png?w=1100&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=c4d4d634b9096f91c3e1fd12f0a4b66d 1100w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/biconomy-paymaster.png?w=1650&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=ea98698da960fd215492e8001eeb8054 1650w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/biconomy-paymaster.png?w=2500&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=3cced7762e0436dddfb0c3f006f616e1 2500w" />

    <figcaption>Configuring your Biconomy Paymaster</figcaption>
  </figure>

  Once you've configured a **Paymaster**, you can also deposit funds into your app's gas tank and configure specific policies for [**gas sponsorship**](https://docs.biconomy.io/dashboard/paymaster).

  Save the bundler URL and paymaster API key for your project, as you will need those values later.

  ### 4. Initialize your users' smart accounts

  When users log into your app, Privy provisions each user an embedded wallet, which is an EOA. In order to leverage the features of Biconomy's account abstraction, each user also needs a Biconomy smart account. **You can provision Biconomy smart accounts for each user by assigning their embedded wallet as a signer for their smart account**.

  To start, after a user logs in, **find the user's embedded wallet from Privy's `useWallets` hook, and switch its network to your app's target network**. You can find embedded wallet by finding the only entry in the **`useWallets`** array with a **`walletClientType`** of `'privy'`.

  ```tsx  theme={"system"}
  import {useWallets} from '@privy-io/react-auth';
  ...
  // Find the embedded wallet
  const {wallets} = useWallets();
  const embeddedWallet = wallets.find((wallet) => (wallet.walletClientType === 'privy'));
  // Switch the embedded wallet to your target network
  // Replace '80001' with your desired chain ID.
  await embeddedWallet.switchChain(80001);
  ```

  Next, using your paymaster API key and bundler URL from the Biconomy Dashboard, **initialize the user's smart account using Biconomy's [`createSmartAccountClient`](https://docs.biconomy.io/Account/methods#createsmartaccountclient) method**:

  ```tsx  theme={"system"}
  import { createSmartAccountClient } from "@biconomy/account";
  ...
  // Get an ethers provider and signer for the user's embedded wallet
  const provider = await embeddedWallet.getEthereumProvider();
  const ethersProvider = new ethers.providers.Web3Provider(provider);
  const ethersSigner = ethersProvider.getSigner()

  const smartAccount = await createSmartAccountClient({
      signer: ethersSigner,
      bundlerUrl: 'your-bundler-url-from-the-biconomy-dashboard',
      biconomyPaymasterApiKey: 'your-paymaster-api-key-from-the-biconomy-dashboard'
  });
  ```

  <Tip>
    You can also store the user's smart account address on Privy's user object. See [this
    guide](./address.md) for more.
  </Tip>

  <details>
    <summary><b>Want to see this code end-to-end?</b></summary>
    You can find the code snippets above pasted in an end-to-end example below.

    ```tsx  theme={"system"}
    import {createSmartAccountClient} from '@biconomy/account';

    import {useWallets} from '@privy-io/react-auth';

    // Find the embedded wallet and switch it to your target network
    const {wallets} = useWallets();
    const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
    await embeddedWallet.switchChain(80001);

    const provider = await embeddedWallet.getEthereumProvider();
    const ethersProvider = new ethers.providers.Web3Provider(provider);
    const ethersSigner = ethersProvider.getSigner();

    // Initialize your smart account
    const smartAccount = await createSmartAccountClient({
      signer: ethersSigner,
      bundlerUrl: 'your-bundler-url-from-the-biconomy-dashboard',
      biconomyPaymasterApiKey: 'your-paymaster-api-key-from-the-biconomy-dashboard'
    });
    ```

    Note: if your app uses React, we suggest that you store the user's Biconomy `smartAccount` in a React context that wraps your application. This allows you to easily access the smart account from your app's pages and components.
  </details>

  ## 5. Send transactions from the smart account

  Now that your users have Biconomy smart accounts, they can now send transaction from their smart account.

  To send a transaction from a user's smart account, use Biconomy's [**`sendTransaction`**](https://docs.biconomy.io/Account/methods#sendtransaction-) method. An example of sending a transaction to mint an NFT gaslessly is below:

  ```tsx  theme={"system"}
  // Initialize an ethers JsonRpcProvider for your network
  const provider = new ethers.providers.JsonRpcProvider(`insert-rpc-url-for-your-network`);
  // Initialize an ethers contract instance for your NFT
  const nft = new ethers.Contract('insert-your-NFT-address', insertYourNftAbi, provider);

  // Construct a Transaction for the minting transaction
  const mintTransaction = await nft.populateTransaction.mint!('insert-the-smart-account-address');
  // `smartAccount` is the Biconomy smart account we initialized above
  const mintTx = {
    to: 'insert-your-NFT-address',
    data: mintTransaction.data
  };

  // Send transaction to mempool, to mint NFT gaslessly
  const userOpResponse = await smartAccount.sendTransaction(mintTx, {
    paymasterServiceData: {mode: PaymasterMode.SPONSORED}
  });

  const {transactionHash} = await userOpResponse.waitForTxHash();
  console.log('Transaction Hash', transactionHash);

  const userOpReceipt = await userOpResponse.wait();
  if (userOpReceipt.success == 'true') {
    console.log('UserOp receipt', userOpReceipt);
    console.log('Transaction receipt', userOpReceipt.receipt);
  }
  ```

  **That's it! You've configured your app to create smart wallets for all of your users, and can seamlessly add in AA features like [gas sponsorship](https://docs.biconomy.io/dashboard/paymaster) and more.** 🎉
</View>

<View title="AccountKit" icon="terminal">
  ## Account Abstraction with AccountKit

  [AccountKit](https://accountkit.alchemy.com/) is a toolkit by [Alchemy](https://www.alchemy.com/) for creating [ERC-4337](https://eips.ethereum.org/EIPS/eip-4337)-compatible smart accounts for your users, using the user's EOA as the smart account's signer. This allows you to easily add [Account Abstraction](https://ethereum.org/en/roadmap/account-abstraction/) features into your app.

  **You can easily integrate AccountKit alongside Privy to create smart wallets from your user's embedded or external wallets, allowing you to enhance your app with gas sponsorship, batched transactions, and more!**

  Read below to learn how to configure your app to create smart wallets for *all* your users!

  <details>
    <summary><b>What is an EOA?</b></summary>

    An [**EOA, or externally-owned account**](https://ethereum.org/en/developers/docs/accounts/), is any Ethereum account that is controlled by a private key. Privy's embedded wallets and most external wallets (MetaMask, Coinbase Wallet, Rainbow Wallet, etc.) are EOAs.

    EOAs differ from **contract accounts**, which are instead controlled by smart contract code and do not have their own private key. AccountKit's smart wallet is a contract account. Contract accounts have [enhanced capabilities, such as gas sponsorship and batched transactions](https://ethereum.org/en/roadmap/account-abstraction/).

    Since they do not have their own private key, contract accounts cannot *directly* produce signatures and initiate transaction flows. Instead, each contract account is generally "managed" by an EOA, which authorizes actions taken by the contract account via a signature; this EOA is called a **signer**.

    In this integration, the user's EOA (from Privy) serves as the signer for their smart wallet (from AccountKit). The smart wallet (AccountKit) holds all assets and submits all transactions to the network, but the signer (Privy) is responsible for producing signatures and "kicking off" transaction flows.
  </details>

  ### 1. Install Privy and AccountKit

  Install the [**`@privy-io/react-auth`**](https://www.npmjs.com/package/@privy-io/react-auth) SDK from Privy, the [**`@account-kit/privy-integration`**](https://www.alchemy.com/docs/wallets/third-party/signers/privy) SDKs from Alchemy, and [**`viem`**](https://viem.sh/):

  ```sh  theme={"system"}
  npm i @privy-io/react-auth @account-kit/privy-integration viem
  ```

  ### 2. Configure your app's `PrivyProvider`

  First, follow the instructions in the [**Privy Quickstart**](/basics/react/quickstart) to get your app set up with Privy.

  Next, set **Add confirmation modals** to "off" in your app's **Embedded wallets** page in the Privy [**dashboard**](https://dashboard.privy.io). This will configure Privy to *not* show its default UIs when your user must sign messages or send transactions. Instead, we recommend you use your own custom UIs for showing users the [`UserOperation`](https://www.alchemy.com/overviews/user-operations)s they sign.

  Then, update the **`config.embeddedWallets.createOnLogin`** property of your **`PrivyProvider`** to `'users-without-wallets'`.This will configure Privy to create an embedded wallet for users logging in via a web2 method (email, phone, socials), ensuring that *all* of your users have a wallet that can be used as an EOA.

  Lastly, add the `AlchemyProvider` as a child of your `PrivyProvider`, passing in your Alchemy API key and gas policy ID.

  Your **`PrivyProvider`** should then look like:

  ```tsx  theme={"system"}
  <PrivyProvider
      appId='insert-your-privy-app-id'
      config={{
          /* Replace this with your desired login methods */
          loginMethods: ['email', 'wallet'],
          /* Replace this with your desired appearance configuration */
          appearance: {
              theme: 'light',
              accentColor: '#676FFF',
              logo: 'your-logo-url'
          }
          embeddedWallets: {
              createOnLogin: 'users-without-wallets',
              showWalletUIs: false
          },
          // Import your desired chain from `viem/chains` and pass it to `defaultChain`
          defaultChain: sepolia,
      }}
  >
    <AlchemyProvider apiKey="your-alchemy-api-key" policyId="your-gas-policy-id">
      {/* Your app's components */}
    </AlchemyProvider>
  </PrivyProvider>
  ```

  Just like that, your app is now configured to create smart accounts for all of your users automatically upon login!

  ### 3. Send gasless transactions with Alchemy's AccountKit SDK

  Now that your users have smart accounts created for them automatically, you can use Alchemy's AccountKit SDK to send gasless transactions from their smart accounts.

  ```tsx  theme={"system"}
  import {useAlchemySendTransaction} from '@account-kit/privy-integration';

  function SendButtons() {
    const {sendTransaction, isLoading} = useAlchemySendTransaction();

    const single = async () => await sendTransaction({to: '0x...', data: '0x...', value: '0x0'});

    const batch = async () =>
      await sendTransaction([
        {to: '0x...', data: '0x...'},
        {to: '0x...', data: '0x...'}
      ]);

    return (
      <>
        <button onClick={single} disabled={isLoading}>
          Send
        </button>
        <button onClick={batch} disabled={isLoading}>
          Send Batch
        </button>
      </>
    );
  }
  ```

  **That's it! You've configured your app to create smart wallets for all of your users, and can seamlessly add in AA features like gas sponsorship, batched transactions, and more.** 🎉 To learn more about using Alchemy's AccountKits with Privy, check out the [full guide from Alchemy](https://www.alchemy.com/docs/wallets/third-party/signers/privy).
</View>
\n