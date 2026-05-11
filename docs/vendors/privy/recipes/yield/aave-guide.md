> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Integrating Aave with Privy

Create a seamless DeFi lending experience with Privy's embedded wallets and Aave protocol. This guide shows you how to build an app where users can supply tokens directly to Aave, deploy yield-bearing vaults, and manage deposits—all without external wallets or complex onboarding.

## Resources

<CardGroup cols={2}>
  <Card title="Aave Docs" icon="arrow-up-right-from-square" href="https://docs.aave.com/" arrow>
    Official documentation for Aave protocol and smart contracts.
  </Card>

  <Card title="Privy Wallets" icon="wallet" href="/wallets/overview" arrow>
    Privy Wallets are a powerful tool for helping users interact with DeFi.
  </Card>
</CardGroup>

***

## Integrate with Aave protocol

There are two ways to integrate Aave into your application:

* **Supply directly to Aave**: Directly supply tokens into Aave's liquidity pools to earn interest. Your tokens become available for borrowers and you earn yield from interest payments.
* **Create a managed Aave vault**: Create ERC-4626 compliant vaults that hold aTokens (Aave's interest-bearing tokens). Vaults allow applications to manage supplied tokens on behalf of users and earn a percentage of the yield generated.

For this walkthrough, we'll demonstrate using **Base Sepolia** and the **WETH lending pool**. The same patterns work across all Aave-supported networks and assets—explore the complete list of available pools and addresses in the [BGD Labs Address Book](https://github.com/bgd-labs/aave-address-book).

### Install and configure the Aave SDK

<View title="React" icon="react">
  ### Installation

  ```bash  theme={"system"}
  npm install @aave/react@latest @privy-io/react-auth@latest
  ```

  ### Setup

  Below is a minimal setup for Privy provider with Aave provider setup. To customize your Privy provider, follow the instructions in the [Privy Quickstart](/basics/get-started/dashboard/create-new-app) to get your app set up with Privy.

  ```tsx  theme={"system"}
  // App.tsx
  import {PrivyProvider} from '@privy-io/react-auth';
  import {AaveProvider, AaveClient} from '@aave/react';

  const client = AaveClient.create();

  export function App() {
    return (
      <PrivyProvider appId="your-privy-app-id">
        <AaveProvider client={client}>{/* Your application components */}</AaveProvider>
      </PrivyProvider>
    );
  }
  ```

  ### Supply directly to Aave protocol

  This approach lets users deposit tokens directly into Aave's lending pools to earn interest. When you supply tokens, they become available for other users to borrow, and you earn yield from the borrowing fees. This is the simplest way to start earning on idle assets.

  <Steps>
    <Step title="1. Execute the supply transaction">
      The Aave SDK returns transaction objects that you execute with Privy's `sendTransaction`:

      ```tsx  theme={"system"}
      import {useSupply, bigDecimal} from '@aave/react';
      import {useSendTransaction, useWallets} from '@privy-io/react-auth';

      const {wallets} = useWallets();
      const {sendTransaction} = useSendTransaction();
      const [supply] = useSupply();

      const supplyToken = async () => {
        const result = await supply({
          market: '0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27',
          amount: {native: bigDecimal(0.1)}, // Supply 0.1 ETH
          sender: wallets[0].address,
          chainId: 84532
        });

        if (result.isErr()) {
          throw new Error(`Supply failed: ${result.error}`);
        }

        const plan = result.value;

        // Handle approval if required
        if (plan.__typename === 'ApprovalRequired') {
          await sendTransaction(
            {
              to: plan.approval.to,
              value: BigInt(plan.approval.value),
              data: plan.approval.data,
              chainId: plan.approval.chainId
            },
            {address: wallets[0].address}
          );

          // Execute supply transaction
          return await sendTransaction(
            {
              to: plan.originalTransaction.to,
              value: BigInt(plan.originalTransaction.value),
              data: plan.originalTransaction.data,
              chainId: plan.originalTransaction.chainId
            },
            {address: wallets[0].address}
          );
        }

        // Direct supply transaction
        if (plan.__typename === 'TransactionRequest') {
          return await sendTransaction(
            {
              to: plan.to,
              value: BigInt(plan.value),
              data: plan.data,
              chainId: plan.chainId
            },
            {address: wallets[0].address}
          );
        }

        throw new Error(`Unhandled plan type: ${plan.__typename}`);
      };
      ```
    </Step>
  </Steps>

  ***

  ### Create a managed Aave vault

  Aave Vaults are ERC-4626 compliant yield-bearing vaults that allow users to supply and withdraw ERC-20 tokens supported by Aave V3. Vaults enable applications to manage supplied tokens on behalf of users and earn a percentage of revenue.

  <Steps>
    <Step title="1. Get reserve information for vault deployment">
      ```tsx  theme={"system"}
      import {useAaveReserve, useVaultDeploy, bigDecimal} from '@aave/react';
      import {useSendTransaction, useWallets} from '@privy-io/react-auth';

      const {wallets} = useWallets();
      const {sendTransaction} = useSendTransaction();
      const [deployVault] = useVaultDeploy();

      // Get reserve data for WETH on Base Sepolia (needed for vault deployment)
      const {data: reserve} = useAaveReserve({
        market: '0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27', // Base Sepolia Pool
        underlyingToken: '0x4200000000000000000000000000000000000006', // WETH
        chainId: 84532,
        suspense: true
      });
      ```
    </Step>

    <Step title="2. Deploy a new vault">
      ```tsx  theme={"system"}
      const deploy = async () => {
        const result = await deployVault({
          market: reserve.market.address,
          chainId: 84532,
          underlyingToken: reserve.underlyingToken.address,
          deployer: wallets[0].address,
          initialFee: bigDecimal(3), // 3% performance fee
          shareName: 'Aave WETH Vault Shares',
          shareSymbol: 'avWETH',
          initialLockDeposit: bigDecimal(1) // 1 WETH initial deposit
        });

        if (result.isErr()) {
          throw new Error(`Deployment failed: ${result.error}`);
        }

        const plan = result.value;

        // Handle approval if required
        if (plan.__typename === 'ApprovalRequired') {
          await sendTransaction(
            {
              to: plan.approval.to,
              value: BigInt(plan.approval.value),
              data: plan.approval.data,
              chainId: plan.approval.chainId
            },
            {address: wallets[0].address}
          );

          return await sendTransaction(
            {
              to: plan.originalTransaction.to,
              value: BigInt(plan.originalTransaction.value),
              data: plan.originalTransaction.data,
              chainId: plan.originalTransaction.chainId
            },
            {address: wallets[0].address}
          );
        }

        if (plan.__typename === 'TransactionRequest') {
          return await sendTransaction(
            {
              to: plan.to,
              value: BigInt(plan.value),
              data: plan.data,
              chainId: plan.chainId
            },
            {address: wallets[0].address}
          );
        }

        throw new Error(`Unhandled plan type: ${plan.__typename}`);
      };
      ```
    </Step>

    <Step title="3. Deposit into a vault">
      ```tsx  theme={"system"}
      import {useVault, useVaultDeposit} from '@aave/react';

      const {data: vault} = useVault({
        by: {address: '0x36b22e03bc9f8d08109ca4bb36241e3bfb7077fa'}, // vault address to deposit tokens
        chainId: 84532
      });

      const [deposit] = useVaultDeposit();

      const depositTokens = async () => {
        const result = await deposit({
          chainId: vault.chainId,
          vault: vault.address,
          amount: {
            currency: vault.usedReserve.underlyingToken.address,
            value: bigDecimal(100) // 100 tokens
          },
          depositor: wallets[0].address
        });

        if (result.isErr()) {
          throw new Error(`Deposit failed: ${result.error}`);
        }

        const plan = result.value;

        // Handle approval if required
        if (plan.__typename === 'ApprovalRequired') {
          await sendTransaction(
            {
              to: plan.approval.to,
              value: BigInt(plan.approval.value),
              data: plan.approval.data,
              chainId: plan.approval.chainId
            },
            {address: wallets[0].address}
          );

          return await sendTransaction(
            {
              to: plan.originalTransaction.to,
              value: BigInt(plan.originalTransaction.value),
              data: plan.originalTransaction.data,
              chainId: plan.originalTransaction.chainId
            },
            {address: wallets[0].address}
          );
        }

        if (plan.__typename === 'TransactionRequest') {
          return await sendTransaction(
            {
              to: plan.to,
              value: BigInt(plan.value),
              data: plan.data,
              chainId: plan.chainId
            },
            {address: wallets[0].address}
          );
        }

        throw new Error(`Unhandled plan type: ${plan.__typename}`);
      };
      ```
    </Step>
  </Steps>
</View>

<View title="NodeJS" icon="node-js">
  ### Installation

  ```bash  theme={"system"}
  npm install @aave/client@latest @privy-io/server-auth@latest
  ```

  ### Setup

  ```tsx  theme={"system"}
  import {PrivyClient} from '@privy-io/server-auth';
  import {AaveClient} from '@aave/client';

  // Initialize Privy SDK client
  const privyClient = new PrivyClient('insert-your-app-id', 'insert-your-app-secret');

  // Get Privy wallet details
  const walletId = 'privy-wallet-id';
  const walletAddress = 'privy-wallet-address';

  // Initialize Aave SDK client
  const aaveClient = AaveClient.create();
  ```

  <Info>
    If you haven't created a wallet yet, you can create one by following the [Node.js
    Quickstart](/basics/nodeJS-server-auth/quickstart#1-creating-a-wallet).
  </Info>

  ### Supply directly to Aave protocol

  This approach lets users deposit tokens directly into Aave’s lending pools to earn interest. When you supply tokens, they become available for other users to borrow, and you earn yield from the borrowing fees. This is the simplest way to start earning on idle assets.

  <Steps>
    <Step title="1. Execute the supply transaction">
      We use Aave Client Actions to generate the payload for our transaction and use the `sendWith` method from the Aave SDK, which handles sending the transaction. It also automatically sends a token approval transaction if needed to complete the supply transaction.

      ```tsx  theme={"system"}
      import {supply} from '@aave/client/actions';
      import {sendWith} from '@aave/client/privy';
      import {bigDecimal} from '@aave/client';

      const supplyToken = async () => {
        const result = await supply(aaveClient, {
          market: '0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27',
          amount: {
            erc20: {
              currency: '0x4200000000000000000000000000000000000006', // WETH
              value: bigDecimal(1) // 1 WETH
            }
          },
          sender: walletAddress,
          chainId: 84532
        }).andThen(sendWith(privyClient, walletId));

        if (result.isOk()) {
          console.log('Transaction sent with hash:', result.value);
          return result.value;
        } else {
          throw new Error(`Supply failed: ${result.error}`);
        }
      };
      ```
    </Step>
  </Steps>

  ### Create a managed Aave vault

  Aave Vaults are ERC-4626 compliant yield-bearing vaults that allow users to supply and withdraw ERC-20 tokens supported by Aave V3. Vaults enable applications to manage supplied tokens on behalf of users and earn a percentage of revenue.

  <Steps>
    <Step title="1. Get reserve information for vault deployment">
      ```tsx  theme={"system"}
      import {reserve} from '@aave/client/actions';

      // Get reserve details (needed for vault deployment)
      const reserveDetails = await reserve(aaveClient, {
        market: '0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27', // Base Sepolia Pool
        underlyingToken: '0x4200000000000000000000000000000000000006', // WETH
        chainId: 84532
      });
      ```
    </Step>

    <Step title="2. Deploy a new vault">
      ```tsx  theme={"system"}
      import {vaultDeploy} from '@aave/client/actions';
      import {sendWith} from '@aave/client/privy';

      const deploy = async () => {
        const result = await vaultDeploy(aaveClient, {
          market: reserveDetails?.value?.market.address,
          chainId: reserveDetails?.value?.market.chain.chainId,
          underlyingToken: reserveDetails?.value?.underlyingToken.address,
          deployer: walletAddress,
          // owner: "0x1234...", // Optional: set a different owner
          initialFee: bigDecimal(3), // 3% performance fee
          shareName: 'Aave WETH Vault Shares',
          shareSymbol: 'avWETH',
          initialLockDeposit: bigDecimal(1) // 1 WETH initial deposit
        }).andThen(sendWith(privyClient, walletId));

        if (result.isOk()) {
          console.log('Transaction sent with hash:', result.value);
          return result.value;
        } else {
          throw new Error(`Deployment failed: ${result.error}`);
        }
      };
      ```
    </Step>

    <Step title="3. Deposit into a vault">
      ```tsx  theme={"system"}
      import {vaultDeposit, vault} from '@aave/client/actions';
      import {sendWith} from '@aave/client/privy';

      const depositTokens = async () => {
        const vaultDetails = await vault(aaveClient, {
          by: {address: vaultAddress},
          chainId: 84532,
          user: walletAddress
        });

        const result = await vaultDeposit(aaveClient, {
          chainId: vaultDetails?.value?.chainId,
          vault: vaultDetails?.value?.address,
          amount: {
            currency: vaultDetails?.value?.usedReserve.underlyingToken.address,
            value: bigDecimal(100) // 100 tokens (USDC, WETH)
          },
          depositor: walletAddress
        }).andThen(sendWith(privyClient, walletId));

        if (result.isOk()) {
          console.log('Transaction sent with hash:', result.value);
          return result.value;
        } else {
          throw new Error(`Deposit failed: ${result.error}`);
        }
      };
      ```
    </Step>
  </Steps>
</View>

## Key integration tips

1. **In NodeJS**: the `sendWith` method from the Aave SDK is feature-rich and streamlines complex transaction flows. It automatically handles token approvals when required and then sends the main Aave transaction, making the overall process more seamless.

2. **Handle transaction plans**: The Aave SDK returns various plan types (actions) like `TransactionRequest` and `ApprovalRequired` which can be used to handle different transaction scenarios accordingly. This allows for flexible handling of different approval and execution patterns.

3. **Add error handling**: Production applications should wrap all async functions in try/catch blocks to handle common blockchain errors like user rejection, insufficient funds, network issues, and contract failures. Consider implementing user-friendly error messages and retry mechanisms for failed transactions.

***

## Conclusion

With Privy and the Aave, building powerful DeFi lending experiences becomes seamless and secure. Users can interact with Aave protocol seamlessly through embedded wallets without needing external wallet management.
\n