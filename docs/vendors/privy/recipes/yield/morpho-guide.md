> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Integrating Morpho with Privy

Create a seamless yield-earning experience with Privy's embedded wallets and Morpho's vaults. This guide shows you how to build a Next.js app where users can approve, deposit, check balances, and withdraw USDC with yield—all without external wallets or complex onboarding.

## Resources

<CardGroup cols={2}>
  <Card title="Morpho Docs" icon="arrow-up-right-from-square" href="https://docs.morpho.org/" arrow>
    Official documentation for Morpho protocol and smart contracts.
  </Card>

  <Card title="Privy Wallets" icon="wallet" href="/wallets/overview" arrow>
    Privy Wallets are a powerful tool for helping users interact with DeFi.
  </Card>
</CardGroup>

***

## Getting started with Privy

If you have not set up Privy yet, start by following the Privy React [quickstart guide](/basics/react/quickstart) to integrate Privy's authentication and wallet functionality.

Optionally, after completing the React quickstart, integrate viem by following the [viem integration guide](/wallets/connectors/ethereum/integrations/viem).

***

## Using Morpho Vaults with Privy

Morpho vaults are smart contracts that let users earn yield by depositing assets into automated, yield-optimizing pools. Now we'll integrate Morpho vaults into the app.

### Configure and deposit into a Morpho vault

Morpho offers multiple vaults, each with different strategies and underlying assets. You can discover vaults on the [Morpho App](https://app.morpho.org/base/earn) or via the [Morpho API](https://api.morpho.org/graphql). For this example, we'll use the Steakhouse USDC Vault on Base:

<Steps>
  <Step title="1. Configure the vault">
    ```tsx  theme={"system"}
    const MORPHO_VAULT_ADDRESS = '0xbeeF010f9cb27031ad51e3333f9aF9C6B1228183';
    const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
    const BASE_CHAIN_ID = 8453;
    ```
  </Step>

  <Step title="2. Approve the vault to spend USDC">
    Use viem's `encodeFunctionData` to encode the approval, and Privy's `useSendTransaction` to send it:

    ```tsx  theme={"system"}
    import {encodeFunctionData, maxUint256, erc20Abi} from 'viem';
    import {useSendTransaction} from '@privy-io/react-auth';

    const {sendTransaction} = useSendTransaction();

    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'approve',
      args: [MORPHO_VAULT_ADDRESS as `0x${string}`, maxUint256]
    });

    const tx = await sendTransaction({
      to: USDC_ADDRESS as `0x${string}`,
      data,
      chainId: BASE_CHAIN_ID
    });
    ```
  </Step>

  <Step title="3. Deposit USDC into the Vault">
    Use viem to encode the deposit and Privy's `useSendTransaction` to fund the vault:

    ```tsx  theme={"system"}
    import {encodeFunctionData, parseUnits, parseAbi} from 'viem';
    import {useSendTransaction} from '@privy-io/react-auth';

    const {sendTransaction} = useSendTransaction();

    const vaultAbi = parseAbi([
      'function deposit(uint256 assets, address receiver) external returns (uint256 shares)'
    ]);
    const depositAmount = parseUnits('100', 6); // 100 USDC
    const data = encodeFunctionData({
      abi: vaultAbi,
      functionName: 'deposit',
      args: [depositAmount, address]
    });

    const tx = await sendTransaction({
      to: MORPHO_VAULT_ADDRESS as `0x${string}`,
      data,
      chainId: BASE_CHAIN_ID
    });
    ```
  </Step>
</Steps>

***

### Read the vault share balance

Query the vault's `balanceOf` function to determine how much the user can withdraw.

```tsx  theme={"system"}
import {publicClient} from './viem';
import {parseAbi} from 'viem';

const balanceAbi = parseAbi([
  'function balanceOf(address account) external view returns (uint256)'
]);

const userShares = await publicClient.readContract({
  address: MORPHO_VAULT_ADDRESS as `0x${string}`,
  abi: balanceAbi,
  functionName: 'balanceOf',
  args: [address]
});
```

***

### Withdraw from the Vault

Users have options to withdraw a specific amount of USDC or redeem all shares (full exit).

<Tabs>
  <Tab title="Withdraw a specific USDC amount">
    ```tsx  theme={"system"}
    import {encodeFunctionData, parseUnits, parseAbi} from 'viem';
    import {useSendTransaction} from '@privy-io/react-auth';

    const {sendTransaction} = useSendTransaction();

    const withdrawAbi = parseAbi([
      'function withdraw(uint256 assets, address receiver, address owner) external returns (uint256 shares)'
    ]);
    const withdrawAmount = parseUnits('50', 6); // 50 USDC
    const data = encodeFunctionData({
      abi: withdrawAbi,
      functionName: 'withdraw',
      args: [withdrawAmount, address, address]
    });
    const tx = await sendTransaction({
      to: MORPHO_VAULT_ADDRESS as `0x${string}`,
      data,
      chainId: BASE_CHAIN_ID
    });
    ```
  </Tab>

  <Tab title="Redeem all shares (full exit)">
    ```tsx  theme={"system"}
    import {encodeFunctionData, parseAbi} from 'viem';
    import {useSendTransaction} from '@privy-io/react-auth';

    const {sendTransaction} = useSendTransaction();

    const redeemAbi = parseAbi([
      'function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets)'
    ]);
    const data = encodeFunctionData({
      abi: redeemAbi,
      functionName: 'redeem',
      args: [userShares, address, address]
    });
    const tx = await sendTransaction({
      to: MORPHO_VAULT_ADDRESS as `0x${string}`,
      data,
      chainId: BASE_CHAIN_ID
    });
    ```
  </Tab>
</Tabs>

***

### Get real-time vault data

You can fetch live vault information using Morpho's GraphQL API:

```tsx  theme={"system"}
const fetchVaultData = async () => {
  const query = `
    query {
      vaultByAddress(
        address: "${MORPHO_VAULT_ADDRESS}"
        chainId: ${BASE_CHAIN_ID}
      ) {
        state {
          sharePriceUsd
          apy
        }
        asset {
          priceUsd
        }
      }
    }
  `;
  const response = await fetch('https://api.morpho.org/graphql', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({query})
  });
  return response.json();
};
```

***

## Key integration tips

1. **Always approve first**: Users need ERC-20 approval before any deposit.
2. **Use `deposit()` and `redeem()`**: These cover most use cases effectively.
3. **Handle decimals correctly**: USDC uses 6 decimals, vault shares use 18.
4. **Check liquidity**: During high utilization, withdrawals may be limited.
5. **Monitor gas**: Complex vaults may require more gas for transactions.

***

## Conclusion

With Privy, setting up secure, user-friendly access to Morpho contracts is fast and easy. For advanced use cases, refer to the [Morpho Docs](https://docs.morpho.org/), or reach out to us in [Slack](https://privy.io/slack)

<Check>Your app is now ready to interact with Morpho using Privy embedded wallets!</Check>
\n