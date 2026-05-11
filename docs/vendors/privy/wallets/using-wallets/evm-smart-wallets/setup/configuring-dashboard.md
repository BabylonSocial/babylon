> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Configure smart wallets in the dashboard

<Tip>
  Enable smart wallets in the [Privy Dashboard](https://dashboard.privy.io/apps?page=smart-wallets)
  before implementing this feature.
</Tip>

## 1. Enable smart wallets

First, enable the smart wallets toggle and select a smart wallet type. Privy currently supports [Kernel](https://zerodev.app/), [Biconomy](https://www.biconomy.io/smart-accounts), [Light Account](https://www.alchemy.com/account-contracts), [Safe](https://safe.global/), [Thirdweb](https://thirdweb.com/contracts) and the [Coinbase Smart Wallet](https://github.com/coinbase/smart-wallet) as smart wallet types.

<img src="https://mintcdn.com/privy-c2af3412/zeEEdrxSbmZQCA-7/images/wallets/configure-smart-wallets.png?fit=max&auto=format&n=zeEEdrxSbmZQCA-7&q=85&s=53ae6c45633e66dafc817bea19ea6ad4" alt="Sample enable smart wallets" data-og-width="3686" width="3686" data-og-height="2633" height="2633" data-path="images/wallets/configure-smart-wallets.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/zeEEdrxSbmZQCA-7/images/wallets/configure-smart-wallets.png?w=280&fit=max&auto=format&n=zeEEdrxSbmZQCA-7&q=85&s=5547a01691757237475ef0a1702769ef 280w, https://mintcdn.com/privy-c2af3412/zeEEdrxSbmZQCA-7/images/wallets/configure-smart-wallets.png?w=560&fit=max&auto=format&n=zeEEdrxSbmZQCA-7&q=85&s=6fe0676570a1e359b460d260c1958817 560w, https://mintcdn.com/privy-c2af3412/zeEEdrxSbmZQCA-7/images/wallets/configure-smart-wallets.png?w=840&fit=max&auto=format&n=zeEEdrxSbmZQCA-7&q=85&s=72ac1821c5b6ce3bade5b75ea24d7605 840w, https://mintcdn.com/privy-c2af3412/zeEEdrxSbmZQCA-7/images/wallets/configure-smart-wallets.png?w=1100&fit=max&auto=format&n=zeEEdrxSbmZQCA-7&q=85&s=2d005df361c5dc800ee8a26c2eeab83f 1100w, https://mintcdn.com/privy-c2af3412/zeEEdrxSbmZQCA-7/images/wallets/configure-smart-wallets.png?w=1650&fit=max&auto=format&n=zeEEdrxSbmZQCA-7&q=85&s=719ad71983b6ee708d06c6f02f5d7fd5 1650w, https://mintcdn.com/privy-c2af3412/zeEEdrxSbmZQCA-7/images/wallets/configure-smart-wallets.png?w=2500&fit=max&auto=format&n=zeEEdrxSbmZQCA-7&q=85&s=a14bdcd98c06b1bcc994c417245232db 2500w" />

<Info>
  If you modify your smart wallet type after users have already created smart wallets, Privy will
  provision the original smart wallet type for existing users to ensure they can access the accounts
  they already use.
</Info>

## 2. Configure the supported networks

Next, configure the networks for your smart wallets. You should do this for *any* network that your app plans to use smart wallets on.

<img src="https://mintcdn.com/privy-c2af3412/zeEEdrxSbmZQCA-7/images/wallets/configure-smart-wallets-configure-chain.png?fit=max&auto=format&n=zeEEdrxSbmZQCA-7&q=85&s=af3c0c9712235a26d2afa9fa3ee7c2d1" alt="Sample enable smart wallets" data-og-width="3686" width="3686" data-og-height="2633" height="2633" data-path="images/wallets/configure-smart-wallets-configure-chain.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/zeEEdrxSbmZQCA-7/images/wallets/configure-smart-wallets-configure-chain.png?w=280&fit=max&auto=format&n=zeEEdrxSbmZQCA-7&q=85&s=93b69f44673eec477978f0da39fcd9f3 280w, https://mintcdn.com/privy-c2af3412/zeEEdrxSbmZQCA-7/images/wallets/configure-smart-wallets-configure-chain.png?w=560&fit=max&auto=format&n=zeEEdrxSbmZQCA-7&q=85&s=90d793779ceb9951f4add2987bd1c041 560w, https://mintcdn.com/privy-c2af3412/zeEEdrxSbmZQCA-7/images/wallets/configure-smart-wallets-configure-chain.png?w=840&fit=max&auto=format&n=zeEEdrxSbmZQCA-7&q=85&s=c3fe83a10f6c5fd6c06c2972818e9ad3 840w, https://mintcdn.com/privy-c2af3412/zeEEdrxSbmZQCA-7/images/wallets/configure-smart-wallets-configure-chain.png?w=1100&fit=max&auto=format&n=zeEEdrxSbmZQCA-7&q=85&s=99a8cd9476e50f685efc5f0ea5d2517d 1100w, https://mintcdn.com/privy-c2af3412/zeEEdrxSbmZQCA-7/images/wallets/configure-smart-wallets-configure-chain.png?w=1650&fit=max&auto=format&n=zeEEdrxSbmZQCA-7&q=85&s=2615cbfb3699d5bae4d1c1c490c98452 1650w, https://mintcdn.com/privy-c2af3412/zeEEdrxSbmZQCA-7/images/wallets/configure-smart-wallets-configure-chain.png?w=2500&fit=max&auto=format&n=zeEEdrxSbmZQCA-7&q=85&s=d45ff0dc5ee5369de4faabc80add1622 2500w" />

For each configured network, you can optionally provide a bundler URL and/or a paymaster URL.

#### Bundler

The **bundler URL** specifies the node you want to use bundle operations from multiple users into a single transaction. If a bundler URL is not set for a network, Privy defaults to Pimlico's public bundler (`https://public.pimlico.io/v2/{chainId}/rpc`).

<Tip>
  **We strongly recommend setting your own bundler URL when taking smart wallets to production**, to
  give you more control over bundler rate limits. Privy's default bundler is heavily rate limited
  and is not suitable for production usage.
</Tip>

#### Paymaster

The **paymaster URL** specifies the paymaster used to sponsor gas fees for the smart wallets on the network. If a paymaster URL is set, Privy will use that paymaster to sponsor gas fees for your users' transactions. If a paymaster URL is not set, your users' smart wallets must have a balance of the network's native currency to pay for gas fees for transactions.

For additional security, we strongly recommend setting **Allowed domains** for your paymaster and/or bundler through your provider's dashboard, to restrict usage of these URLs to only your website.

#### Recommended providers

If you are looking to set up a paymaster or bundler for your app, we suggest the following providers:

| Provider | Get started                                                                                                                      |
| -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Pimlico  | [https://dashboard.pimlico.io](https://dashboard.pimlico.io)                                                                     |
| ZeroDev  | [https://dashboard.zerodev.app/](https://dashboard.zerodev.app/)                                                                 |
| Alchemy  | [https://dashboard.alchemy.com/](https://dashboard.alchemy.com/)                                                                 |
| Biconomy | [https://dashboard.biconomy.io/](https://dashboard.biconomy.io/)                                                                 |
| Thirdweb | [https://thirdweb.com](https://thirdweb.com)                                                                                     |
| Coinbase | [https://www.coinbase.com/developer-platform/products/paymaster](https://www.coinbase.com/developer-platform/products/paymaster) |

<Tip>
  If using **Alchemy** for your paymaster, please provide your Alchemy gas policy ID. Each gas
  policy ID is tied to a specific chain and Alchemy project.
</Tip>

<Tip>
  If using **Biconomy** as a paymaster with `@privy-io/react-auth`, you can override our default
  paymaster context in the `SmartAccountsProvider`. View more in [our setup
  notes](/wallets/using-wallets/evm-smart-wallets/usage).
</Tip>

#### Custom chains

If you do not see the chain you wish to configure on the drop down, you can configure a custom chain. Before configuring a custom chain on the Privy dashboard, please ensure the chain is supported by your smart wallet provider. Custom chain configuration requires an EIP155 chain ID, chain name, paymaster URL, bundler URL, and RPC URL; none of these values can be defaulted as they are in supported chains.
\n