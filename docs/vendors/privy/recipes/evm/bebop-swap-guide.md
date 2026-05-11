> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Swapping crypto using Privy and Bebop

> Learn how to integrate Bebop's swap functionality with Privy embedded wallets

Bebop enables applications to execute gasless or self-executed token swaps using a request-for-quote (RFQ) model that eliminates slippage. This guide demonstrates how to integrate Bebop's swap functionality with Privy embedded wallets.

## Prerequisites

Before implementing swaps, contact Bebop to receive the following credentials:

* **Auth Key** – Enables authenticated API calls with improved rate limits and pricing
* **Source ID** – Identifies the application as an integration partner for revenue tracking

## Setup token approvals

Bebop requires token approvals before executing swaps. Applications can use either standard ERC20 approvals or Permit2.

### Standard ERC20 approvals

To use standard ERC20 approvals, specify `approval_type=Standard` when requesting a quote from Bebop's API.

Before executing a swap, the application must grant the Bebop settlement contract (`0xbbbbbBB520d69a9775E85b458C58c648259FAD5F`) an allowance to spend the user's tokens.

<View title="React" icon="react">
  ```tsx  theme={"system"}
  import {maxUint256, erc20Abi, encodeFunctionData} from 'viem';
  import {useWallets} from '@privy-io/react-auth';

  const BEBOP_SETTLEMENT_ADDRESS = '0xbbbbbBB520d69a9775E85b458C58c648259FAD5F';
  const WETH_ADDRESS = '0x4200000000000000000000000000000000000006'; // WETH on Base

  async function approveToken() {
    const {wallets} = useWallets();
    const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');

    // Get EIP-1193 provider from Privy embedded wallet
    const provider = await embeddedWallet.getEthereumProvider();

    // Encode approval transaction data
    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'approve',
      args: [BEBOP_SETTLEMENT_ADDRESS, maxUint256]
    });

    // Submit approval transaction
    const txHash = await provider.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: embeddedWallet.address,
          to: WETH_ADDRESS,
          data,
          value: '0x0'
        }
      ]
    });

    return txHash;
  }
  ```
</View>

<View title="React Native" icon="react">
  ```tsx  theme={"system"}
  import {maxUint256, erc20Abi, encodeFunctionData} from 'viem';
  import {useEmbeddedEthereumWallet} from '@privy-io/expo';

  const BEBOP_SETTLEMENT_ADDRESS = '0xbbbbbBB520d69a9775E85b458C58c648259FAD5F';
  const WETH_ADDRESS = '0x4200000000000000000000000000000000000006'; // WETH on Base

  async function approveToken() {
    const wallet = useEmbeddedEthereumWallet();

    // Get EIP-1193 provider from Privy embedded wallet
    const provider = await wallet.getEthereumProvider();

    // Encode approval transaction data
    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'approve',
      args: [BEBOP_SETTLEMENT_ADDRESS, maxUint256]
    });

    // Submit approval transaction
    const txHash = await provider.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: wallet.address,
          to: WETH_ADDRESS,
          data,
          value: '0x0'
        }
      ]
    });

    return txHash;
  }
  ```
</View>

<View title="Node.js" icon="node-js">
  ```typescript  theme={"system"}
  import {maxUint256, erc20Abi, encodeFunctionData} from 'viem';
  import {PrivyClient} from '@privy-io/node';

  const BEBOP_SETTLEMENT_ADDRESS = '0xbbbbbBB520d69a9775E85b458C58c648259FAD5F';
  const WETH_ADDRESS = '0x4200000000000000000000000000000000000006'; // WETH on Base

  const privy = new PrivyClient({
    appId: process.env.PRIVY_APP_ID,
    appSecret: process.env.PRIVY_APP_SECRET
  });

  async function approveToken(walletId: string) {
    // Encode approval transaction data
    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'approve',
      args: [BEBOP_SETTLEMENT_ADDRESS, maxUint256]
    });

    // Submit approval transaction
    const response = await privy
      .wallets()
      .ethereum()
      .sendTransaction(walletId, {
        caip2: 'eip155:8453', // Base
        params: {
          transaction: {
            to: WETH_ADDRESS,
            data,
            chain_id: 8453
          }
        }
      });

    return response.hash;
  }
  ```
</View>

<View title="Python" icon="python">
  ```python  theme={"system"}
  from privy import PrivyClient
  from viem import encode_function_data
  from viem.constants import MAX_UINT256

  BEBOP_SETTLEMENT_ADDRESS = "0xbbbbbBB520d69a9775E85b458C58c648259FAD5F"
  WETH_ADDRESS = "0x4200000000000000000000000000000000000006"  # WETH on Base

  client = PrivyClient(
      app_id=os.environ["PRIVY_APP_ID"],
      app_secret=os.environ["PRIVY_APP_SECRET"],
  )

  def approve_token(wallet_id: str) -> str:
      # Encode approval transaction data
      erc20_abi = [
          {
              "inputs": [
                  {"name": "spender", "type": "address"},
                  {"name": "amount", "type": "uint256"}
              ],
              "name": "approve",
              "outputs": [{"name": "", "type": "bool"}],
              "stateMutability": "nonpayable",
              "type": "function"
          }
      ]

      data = encode_function_data(
          abi=erc20_abi,
          function_name="approve",
          args=[BEBOP_SETTLEMENT_ADDRESS, MAX_UINT256]
      )

      # Submit approval transaction
      tx = client.wallets.rpc(
          wallet_id=wallet_id,
          method="eth_sendTransaction",
          caip2="eip155:8453",  # Base
          params={
              "transaction": {
                  "to": WETH_ADDRESS,
                  "data": data,
              },
          },
      )

      return tx["hash"]
  ```
</View>

<Info>
  Applications can also use Permit2 for approvals. Consult Bebop's documentation for implementation
  details.
</Info>

## Request a quote

After configuring approvals, request a quote from Bebop's API. The RFQ model guarantees the quoted price with zero slippage.

The following example requests a quote to swap 1 WETH for USDC on Base:

<View title="TypeScript" icon="terminal">
  ```typescript  theme={"system"}
  import axios from 'axios';
  import {parseEther} from 'viem';

  const BEBOP_SOURCE_ID = process.env.BEBOP_SOURCE_ID || ''; // Source ID issued by Bebop
  const BEBOP_AUTH_KEY = process.env.BEBOP_AUTH_KEY || ''; // Auth key issued by Bebop

  const tokensToSell = ['0x4200000000000000000000000000000000000006']; // WETH on Base
  const sellAmounts = [parseEther('1')]; // 1 WETH
  const tokensToBuy = ['0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913']; // USDC on Base

  interface Chain {
    chainId: number;
    name: string;
  }

  const chain: Chain = {
    chainId: 8453,
    name: 'base'
  };

  async function getSwapQuote(walletAddress: string): Promise<any> {
    const {data: quote} = await axios.get(`https://api.bebop.xyz/pmm/${chain.name}/v3/quote`, {
      params: {
        buy_tokens: tokensToBuy.toString(),
        sell_tokens: tokensToSell.toString(),
        sell_amounts: sellAmounts.toString(),
        taker_address: walletAddress,
        gasless: false,
        approval_type: 'Standard',
        source: BEBOP_SOURCE_ID
      },
      headers: {
        'source-auth': BEBOP_AUTH_KEY
      }
    });

    if (quote.error) {
      throw new Error(`Quote error: ${quote.error}`);
    }

    return quote.tx;
  }
  ```
</View>

<View title="Python" icon="python">
  ```python  theme={"system"}
  import requests
  import os

  BEBOP_SOURCE_ID = os.environ.get("BEBOP_SOURCE_ID", "")  # Source ID issued by Bebop
  BEBOP_AUTH_KEY = os.environ.get("BEBOP_AUTH_KEY", "")  # Auth key issued by Bebop

  TOKENS_TO_SELL = ["0x4200000000000000000000000000000000000006"]  # WETH on Base
  SELL_AMOUNTS = ["1000000000000000000"]  # 1 WETH in wei
  TOKENS_TO_BUY = ["0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"]  # USDC on Base

  chain = {
      "chain_id": 8453,
      "name": "base"
  }

  def get_swap_quote(wallet_address: str) -> dict:
      """Request a swap quote from Bebop API"""
      url = f"https://api.bebop.xyz/pmm/{chain['name']}/v3/quote"

      params = {
          "buy_tokens": ",".join(TOKENS_TO_BUY),
          "sell_tokens": ",".join(TOKENS_TO_SELL),
          "sell_amounts": ",".join(SELL_AMOUNTS),
          "taker_address": wallet_address,
          "gasless": False,
          "approval_type": "Standard",
          "source": BEBOP_SOURCE_ID
      }

      headers = {
          "source-auth": BEBOP_AUTH_KEY
      }

      response = requests.get(url, params=params, headers=headers)
      quote = response.json()

      if "error" in quote:
          raise Exception(f"Quote error: {quote['error']}")

      return quote["tx"]
  ```
</View>

## Execute the swap

Once Bebop returns a quote, the application can execute the swap by broadcasting the transaction using Privy's embedded wallet provider.

<View title="React" icon="react">
  ```tsx  theme={"system"}
  import {useWallets} from '@privy-io/react-auth';

  async function executeSwap(rawTransaction) {
    const {wallets} = useWallets();
    const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
    const provider = await embeddedWallet.getEthereumProvider();

    const txHash = await provider.request({
      method: 'eth_sendTransaction',
      params: [rawTransaction]
    });

    return txHash;
  }

  // Complete swap flow
  async function performSwap() {
    try {
      const {wallets} = useWallets();
      const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');

      // Request quote from Bebop
      const transaction = await getSwapQuote(embeddedWallet.address);

      // Execute transaction onchain
      const txHash = await executeSwap(transaction);

      return txHash;
    } catch (error) {
      console.error('Swap failed:', error);
      throw error;
    }
  }
  ```
</View>

<View title="React Native" icon="react">
  ```tsx  theme={"system"}
  import {useEmbeddedEthereumWallet} from '@privy-io/expo';

  async function executeSwap(rawTransaction, wallet) {
    const provider = await wallet.getEthereumProvider();

    const txHash = await provider.request({
      method: 'eth_sendTransaction',
      params: [rawTransaction]
    });

    return txHash;
  }

  // Complete swap flow
  async function performSwap() {
    try {
      const wallet = useEmbeddedEthereumWallet();

      // Request quote from Bebop
      const transaction = await getSwapQuote(wallet.address);

      // Execute transaction onchain
      const txHash = await executeSwap(transaction, wallet);

      return txHash;
    } catch (error) {
      console.error('Swap failed:', error);
      throw error;
    }
  }
  ```
</View>

<View title="Node.js" icon="node-js">
  ```typescript {skip-check} theme={"system"}
  import {PrivyClient} from '@privy-io/node';

  const privy = new PrivyClient({
    appId: process.env.PRIVY_APP_ID,
    appSecret: process.env.PRIVY_APP_SECRET
  });

  async function executeSwap(walletId: string, rawTransaction: any) {
    const response = await privy
      .wallets()
      .ethereum()
      .sendTransaction(walletId, {
        caip2: rawTransaction.caip2 || 'eip155:8453', // Base
        params: {
          transaction: {
            to: rawTransaction.to,
            data: rawTransaction.data,
            value: rawTransaction.value,
            chain_id: 8453
          }
        }
      });

    return response.hash;
  }

  // Complete swap flow
  async function performSwap(walletId: string) {
    try {
      // Get wallet address
      const wallet = await privy.wallets().get(walletId);

      // Request quote from Bebop
      const transaction = await getSwapQuote(wallet.address);

      // Execute transaction onchain
      const txHash = await executeSwap(walletId, transaction);

      return txHash;
    } catch (error) {
      console.error('Swap failed:', error);
      throw error;
    }
  }
  ```
</View>

<View title="Python" icon="python">
  ```python  theme={"system"}
  from privy import PrivyClient
  import os

  client = PrivyClient(
      app_id=os.environ["PRIVY_APP_ID"],
      app_secret=os.environ["PRIVY_APP_SECRET"],
  )

  def execute_swap(wallet_id: str, raw_transaction: dict) -> str:
      tx = client.wallets.rpc(
          wallet_id=wallet_id,
          method="eth_sendTransaction",
          caip2=raw_transaction.get("caip2", "eip155:8453"),  # Base
          params={
              "transaction": {
                  "to": raw_transaction["to"],
                  "data": raw_transaction["data"],
                  "value": raw_transaction.get("value", "0x0"),
              },
          },
      )

      return tx["hash"]

  # Complete swap flow
  def perform_swap(wallet_id: str) -> str:
      try:
          # Get wallet address
          wallet = client.wallets.get(wallet_id)

          # Request quote from Bebop
          transaction = get_swap_quote(wallet.address)

          # Execute transaction onchain
          tx_hash = execute_swap(wallet_id, transaction)

          return tx_hash
      except Exception as error:
          print(f"Swap failed: {error}")
          raise
  ```
</View>

## Fee monetization

Bebop embeds fees directly in quotes, which are collected by market makers and distributed to integration partners monthly. The source ID must be included in all requests to ensure proper revenue tracking.

Bebop can optionally hedge collected fees to stablecoins (such as ETH to USDC) to prevent applications from accumulating unwanted token inventory.

<Tip>Contact Bebop to configure fee hedging preferences and review revenue distribution terms.</Tip>
\n