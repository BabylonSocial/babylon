> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Swapping crypto using Privy and 0x

To enable crypto asset swapping (e.g. convert USDC to ETH), you can integrate with the exchange of your choice. In this case, we use [0x](https://0x.org/) which offers a huge amount of swapping pairs and great rates. This guide will enable a Privy wallet to convert USDC to ETH.

This guide assumes that the Privy wallet has already been created and funded with ETH to pay for transaction fees. Code examples are in Javascript.

## Step 1: Register with 0x and retrieve API keys

Go the 0x dashboard and create an account. Save your API keys in your local `.env` file.

## Step 2: Approve the Permit2 contract to enable asset movement from your wallet

In order to facilitate a sale of USDC, 0x needs to be able to move USDC from your wallet to the buyer based on the trade. To do so, the wallet owner (user) must approve of this via a signature, which is then verified onchain. All of this can be done invisibly for the user.

This is a one time action that won’t have to be done again for any future swapping for this wallet.

```tsx  theme={"system"}
import {maxUint256, erc20Abi, encodeFunctionData, createPublicClient, http} from 'viem';

const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

// USDC contract on Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

// Provider is an instance of an EIP-1193 provider exposed from a Privy SDK
const provider = await wallet.getProvider();

// get Privy wallet

// prepre transaction to give USDC approval
const data = encodeFunctionData({
  abi: erc20Abi,
  functionName: 'approve',
  args: [PERMIT2_ADDRESS, maxUint256]
});

// execute transaction
const tx = await provider.request({
  method: 'eth_sendTransaction',
  params: [
    {
      from: wallets[0].address,
      to: USDC_ADDRESS,
      data
    }
  ]
});
```

## Step 3: Get quote from 0x

Next, you want to fetch a quote from 0x to sell your USDC for ETH.

```tsx  theme={"system"}
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

// Base network chain ID
const CHAIN_ID = 8453;
const USDC_DECIMALS = 6;

const amountInUSD = 100;
const formattedAmount = 100 * 10 ** 6;
const quoteResponse = await fetch(
  `https://api.0x.org/swap/permit2/quote?chainId=${CHAIN_ID}&sellToken=${USDC_ADDRESS}&buyToken=${ETH_ADDRESS}&sellAmount=${formattedAmount}&taker=${wallet.address}`,
  {
    headers: {
      '0x-api-key': process.env.API_KEY_0X,
      '0x-version': 'v2'
    }
  }
);
```

## Step 4: Prepare the transaction and execute

Finally, you will prepare the transaction to fulfill the order and execute the swap. The user should see additional ETH in their wallet in exchange for their USDC.

```tsx  theme={"system"}
import {numberToHex, concat} from 'viem';

// Provider is an instance of an EIP-1193 provider exposed from a Privy SDK
const provider = await wallet.getProvider();

// Sign an off-chain signature for the permit
const signature = await provider.request({
  method: 'eth_signTypedData_v4',
  params: [wallet.address, quoteResult.permit2.eip712]
});
const signatureLengthInHex = numberToHex(size(signature), {
  signed: false,
  size: 32
});

// Pack the transaction for the trade fulfillment, including the off-chain signature
const transactionData = concat([quoteResult.transaction.data, signatureLengthInHex, signature]);
const params = {
  from: wallet.address,
  to: quoteResult.transaction.to,
  data: transactionData,
  gas: !!quoteResult.transaction.gas ? BigInt(quoteResult.transaction.gas) : undefined
};

// send the signed permit to be on-chain
const tx = await provider.request({
  method: 'eth_sendTransaction',
  params: [params]
});
```
\n