> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Smart wallets

Privy makes it easy to create **smart wallets** for your users. Smart wallets are **programmable, onchain accounts** that incorporate the features of [account abstraction](https://ethereum.org/en/roadmap/account-abstraction/). With just a few lines of code, you can create smart wallets for your users to sponsor gas payments, send batched transactions, and more.

<Tip>
  We recommend using our native gas sponsorship offering to sponsor transactions on EVM and Solana.
  [Learn more](/wallets/gas-and-asset-management/gas/overview)
</Tip>

<Info>
  Please note that this native smart wallet integration is only available in the React and React
  Native SDKs. To configure smart wallets with wallets created using server-side SDKs or APIs,
  follow [this guide](/wallets/gas-and-asset-management/gas/ethereum).
</Info>

<img src="https://mintcdn.com/privy-c2af3412/zeEEdrxSbmZQCA-7/images/wallets/smart-wallets.png?fit=max&auto=format&n=zeEEdrxSbmZQCA-7&q=85&s=af4dd0c0e048cb8fe71daf516ee1e85e" alt="Sample enable smart wallets" data-og-width="3686" width="3686" data-og-height="2633" height="2633" data-path="images/wallets/smart-wallets.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/zeEEdrxSbmZQCA-7/images/wallets/smart-wallets.png?w=280&fit=max&auto=format&n=zeEEdrxSbmZQCA-7&q=85&s=d6f39a99d7265206c1f03df225c7632a 280w, https://mintcdn.com/privy-c2af3412/zeEEdrxSbmZQCA-7/images/wallets/smart-wallets.png?w=560&fit=max&auto=format&n=zeEEdrxSbmZQCA-7&q=85&s=e393540f7fb8aa33022537e1e1de5c84 560w, https://mintcdn.com/privy-c2af3412/zeEEdrxSbmZQCA-7/images/wallets/smart-wallets.png?w=840&fit=max&auto=format&n=zeEEdrxSbmZQCA-7&q=85&s=d08157333f7faffcf534818a60ec73d4 840w, https://mintcdn.com/privy-c2af3412/zeEEdrxSbmZQCA-7/images/wallets/smart-wallets.png?w=1100&fit=max&auto=format&n=zeEEdrxSbmZQCA-7&q=85&s=1992e7c79d49c685b7405f25f053b1c8 1100w, https://mintcdn.com/privy-c2af3412/zeEEdrxSbmZQCA-7/images/wallets/smart-wallets.png?w=1650&fit=max&auto=format&n=zeEEdrxSbmZQCA-7&q=85&s=46315712f250c0870ae829bdd26e6caf 1650w, https://mintcdn.com/privy-c2af3412/zeEEdrxSbmZQCA-7/images/wallets/smart-wallets.png?w=2500&fit=max&auto=format&n=zeEEdrxSbmZQCA-7&q=85&s=efbe6022bc7646202af09cb1379fd4d1 2500w" />

To set up with smart wallets, start by [enabling smart wallets in the Privy Dashboard](/wallets/using-wallets/evm-smart-wallets/setup/configuring-dashboard). This will configure your app to create smart wallets for your users controlled by Privy embedded signers.

### Native ERC-4337 support with embedded signers

Under the hood, a smart wallet is an [ERC-4337](https://www.erc4337.io/)-compatible smart contract deployed onchain. This smart contract can be programmed to support features like transaction batching, gas sponsorship, delegating permissions, and more.

When using a smart wallet, a user's assets are held by the smart contract itself. This smart contract is controlled by an **embedded signer** (an externally-owned account) secured by Privy's self-custodial wallet infrastructure. Privy automatically takes care of creating signers for users and generating smart contract wallets controlled by these signers.

Your app can customize which ERC-4337 account *implementation* powers your users' smart wallets, between Kernel (ZeroDev), Safe, LightAccount (Alchemy), Biconomy, Thirdweb, and the Coinbase Smart Wallet.

<Info>
  Privy partners with the ERC-4337 account providers above to ensure a smooth experience. If you'd
  like us to add support for another, please [reach out](https://privy.io/slack)!
</Info>

### Gas sponsorship with paymasters

With smart wallets, your app can pay for gas fees by registering a paymaster URL in the Privy Dashboard. Privy routes transaction requests to the registered paymaster, which pays gas instead of the user's wallet. This allows users to transact on-chain *instantly* –– even if they do not have a balance in their smart wallet.

### Future-proofed for the latest standards

Privy works closely with the teams building the next generation of account abstraction standards on top of ERC-4337, such as permissions & session keys ([ERC-7715](https://ethereum-magicians.org/t/erc-7715-grant-permissions-from-wallets/20100)), smart wallet modules ([ERC-7579](https://erc7579.com/)), and smart account discovery ([ERC-7555](https://ethereum-magicians.org/t/erc-7555-single-sign-on-for-account-discovery/16536)) across different applications. As these standards become ratified, Privy will incorporate native support for these features.
\n