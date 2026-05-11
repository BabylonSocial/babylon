> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Integrating Sky Savings with Privy

Sky Savings allows apps to earn the Sky Savings Rate by depositing USDS into the sUSDS vault. The sUSDS vault follows the ERC-4626 standard — your app deposits USDS and receives sUSDS shares that automatically accrue yield.

## Resources

<CardGroup cols={2}>
  <Card title="Sky Developer Docs" icon="arrow-up-right-from-square" href="https://developers.skyeco.com" arrow>
    Official documentation for the Sky protocol and smart contracts.
  </Card>

  <Card title="Privy Wallets" icon="wallet" href="/wallets/overview" arrow>
    Privy Wallets are a powerful tool for helping users interact with DeFi.
  </Card>
</CardGroup>

***

## Getting USDS

### Swap on a DEX

Your app can swap any supported token for USDS on any major decentralized exchange using a DEX aggregator or router.

### Convert DAI to USDS

On Ethereum, your app can convert DAI to USDS at a 1:1 rate through the [DaiUsds converter contract](https://etherscan.io/address/0x3225737a9bbb6473cb4a45b7244aca2befdb276a#writeContract). First, approve the converter to spend DAI, then call `daiToUsds`.

```tsx  theme={"system"}
import {encodeFunctionData, maxUint256, erc20Abi, parseUnits} from 'viem';
import {useSendTransaction} from '@privy-io/react-auth';

const {sendTransaction} = useSendTransaction();

const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
const DAI_USDS_CONVERTER = '0x3225737a9Bbb6473CB4a45b7244ACa2BEFdB276A';
const CHAIN_ID = 1; // Ethereum Mainnet

// Step 1: Approve the converter to spend DAI
const approveData = encodeFunctionData({
  abi: erc20Abi,
  functionName: 'approve',
  args: [DAI_USDS_CONVERTER as `0x${string}`, maxUint256]
});

await sendTransaction({
  to: DAI_ADDRESS as `0x${string}`,
  data: approveData,
  chainId: CHAIN_ID
});

// Step 2: Convert DAI to USDS
const converterAbi = [
  {
    type: 'function',
    name: 'daiToUsds',
    inputs: [
      {name: 'usr', type: 'address'},
      {name: 'wad', type: 'uint256'}
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  }
] as const;
const amount = parseUnits('100', 18); // 100 DAI
const convertData = encodeFunctionData({
  abi: converterAbi,
  functionName: 'daiToUsds',
  args: [address, amount]
});

await sendTransaction({
  to: DAI_USDS_CONVERTER as `0x${string}`,
  data: convertData,
  chainId: CHAIN_ID
});
```

***

## Using Sky Savings with Privy

### Deposit USDS into Sky Savings

<Steps>
  <Step title="1. Configure addresses">
    Set up the sUSDS vault and USDS token addresses. The example below uses Ethereum Mainnet:

    ```tsx  theme={"system"}
    const SUSDS_VAULT_ADDRESS = '0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD';
    const USDS_ADDRESS = '0xdC035D45d973E3EC169d2276DDab16f1e407384F';
    const CHAIN_ID = 1; // Ethereum Mainnet
    ```
  </Step>

  <Step title="2. Approve the sUSDS vault to spend USDS">
    Use viem's `encodeFunctionData` to encode the approval, and Privy's `useSendTransaction` to send it:

    ```tsx  theme={"system"}
    import {encodeFunctionData, maxUint256, erc20Abi} from 'viem';
    import {useSendTransaction} from '@privy-io/react-auth';

    const {sendTransaction} = useSendTransaction();

    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'approve',
      args: [SUSDS_VAULT_ADDRESS as `0x${string}`, maxUint256]
    });

    const tx = await sendTransaction({
      to: USDS_ADDRESS as `0x${string}`,
      data,
      chainId: CHAIN_ID
    });
    ```
  </Step>

  <Step title="3. Deposit USDS into the vault">
    Use viem to encode the deposit and Privy's `useSendTransaction` to fund the vault:

    ```tsx  theme={"system"}
    import {encodeFunctionData, parseUnits} from 'viem';
    import {useSendTransaction} from '@privy-io/react-auth';

    const {sendTransaction} = useSendTransaction();

    const erc4626Abi = [
      {
        type: 'function',
        name: 'deposit',
        inputs: [
          {name: 'assets', type: 'uint256'},
          {name: 'receiver', type: 'address'}
        ],
        outputs: [{name: 'shares', type: 'uint256'}],
        stateMutability: 'nonpayable'
      }
    ] as const;
    const depositAmount = parseUnits('100', 18); // 100 USDS (18 decimals)
    const data = encodeFunctionData({
      abi: erc4626Abi,
      functionName: 'deposit',
      args: [depositAmount, address]
    });

    const tx = await sendTransaction({
      to: SUSDS_VAULT_ADDRESS as `0x${string}`,
      data,
      chainId: CHAIN_ID
    });
    ```
  </Step>
</Steps>

***

### Check balance

Call the vault's `balanceOf` function to get the user's sUSDS shares, then call `convertToAssets` to see the current USDS value including accrued yield.

```tsx  theme={"system"}
import {publicClient} from './viem';

const erc4626Abi = [
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{name: 'account', type: 'address'}],
    outputs: [{name: '', type: 'uint256'}],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'convertToAssets',
    inputs: [{name: 'shares', type: 'uint256'}],
    outputs: [{name: '', type: 'uint256'}],
    stateMutability: 'view'
  }
] as const;

const userShares = await publicClient.readContract({
  address: SUSDS_VAULT_ADDRESS as `0x${string}`,
  abi: erc4626Abi,
  functionName: 'balanceOf',
  args: [address]
});

const usdsValue = await publicClient.readContract({
  address: SUSDS_VAULT_ADDRESS as `0x${string}`,
  abi: erc4626Abi,
  functionName: 'convertToAssets',
  args: [userShares]
});
```

***

### Withdraw from the vault

Your app can withdraw a specific amount of USDS or redeem all shares for a full exit.

<Tabs>
  <Tab title="Withdraw a specific USDS amount">
    ```tsx  theme={"system"}
    import {encodeFunctionData, parseUnits} from 'viem';
    import {useSendTransaction} from '@privy-io/react-auth';

    const {sendTransaction} = useSendTransaction();

    const withdrawAbi = [
      {
        type: 'function',
        name: 'withdraw',
        inputs: [
          {name: 'assets', type: 'uint256'},
          {name: 'receiver', type: 'address'},
          {name: 'owner', type: 'address'}
        ],
        outputs: [{name: 'shares', type: 'uint256'}],
        stateMutability: 'nonpayable'
      }
    ] as const;
    const withdrawAmount = parseUnits('50', 18); // 50 USDS
    const data = encodeFunctionData({
      abi: withdrawAbi,
      functionName: 'withdraw',
      args: [withdrawAmount, address, address]
    });
    const tx = await sendTransaction({
      to: SUSDS_VAULT_ADDRESS as `0x${string}`,
      data,
      chainId: CHAIN_ID
    });
    ```
  </Tab>

  <Tab title="Redeem all shares (full exit)">
    ```tsx  theme={"system"}
    import {encodeFunctionData} from 'viem';
    import {useSendTransaction} from '@privy-io/react-auth';

    const {sendTransaction} = useSendTransaction();

    const redeemAbi = [
      {
        type: 'function',
        name: 'redeem',
        inputs: [
          {name: 'shares', type: 'uint256'},
          {name: 'receiver', type: 'address'},
          {name: 'owner', type: 'address'}
        ],
        outputs: [{name: 'assets', type: 'uint256'}],
        stateMutability: 'nonpayable'
      }
    ] as const;
    const data = encodeFunctionData({
      abi: redeemAbi,
      functionName: 'redeem',
      args: [userShares, address, address]
    });
    const tx = await sendTransaction({
      to: SUSDS_VAULT_ADDRESS as `0x${string}`,
      data,
      chainId: CHAIN_ID
    });
    ```
  </Tab>
</Tabs>

***

## Key integration tips

1. **Always approve first**: Your app must grant ERC-20 approval to the sUSDS vault before any deposit.
2. **USDS uses 18 decimals**: Unlike USDC (6 decimals), USDS uses 18 decimals — use `parseUnits('100', 18)` for amounts.
3. **Use `convertToAssets` for real-time balances**: This ERC-4626 method converts sUSDS shares to their current USDS value, including accrued yield.
4. **Supported chains**: Sky Savings supports Ethereum, Base, Arbitrum, OP Mainnet, and Unichain.

***

## Conclusion

Privy makes it straightforward to build secure, user-friendly access to Sky Savings. For advanced use cases, refer to the [Sky Developer Docs](https://developers.skyeco.com), or reach out in [Slack](https://privy.io/slack).

<Check>Your app is now ready to interact with Sky Savings using Privy embedded wallets!</Check>
\n