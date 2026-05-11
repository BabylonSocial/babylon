> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Configuring funding methods

To enable various funding flows for your users, visit the and select your app from the **App Dropdown** in the sidebar. Then, navigate to the [Account Funding](https://dashboard.privy.io/apps?page=funding) page for your selected app.

<img src="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/funding/config-funding.png?fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=05f3b82931eb42e2f75df17f1e7c3eb6" alt="Fundingupdate PNG" data-og-width="1843" width="1843" data-og-height="1317" height="1317" data-path="images/funding/config-funding.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/funding/config-funding.png?w=280&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=737f2440881b2f0a60b4cf2dfb62cca2 280w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/funding/config-funding.png?w=560&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=fd4ecc46ce52e27aa5c427642fe0f1cf 560w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/funding/config-funding.png?w=840&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=c58720c8c97d4372cf166ad74d9b6642 840w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/funding/config-funding.png?w=1100&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=755f499baa5c783e2045d0338d449615 1100w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/funding/config-funding.png?w=1650&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=20b7e0ddafaf0dcbe0bade9b2bb1ea9b 1650w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/funding/config-funding.png?w=2500&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=f2ec010e91b359103bb2f91d1ec1925d 2500w" />

## Enable funding methods

<Tip>
  Set up Privy UIs in your app with [this guide](/authentication/user-authentication/ui-component),
  as they are required to be integrated in your app for Privy's funding flows.
</Tip>

To enable funding in your app, select which funding methods you would like to allow by selecting the corresponding option in the Dashboard.

Privy will present the options you enable here for your users to select from during a funding flow.

<Info>
  We are actively working on bringing **Transfer from external wallet** to React Native, but this is
  currently **not** yet supported. Enabling this method on your dashboard will not provide this
  option to users.
</Info>

## Set a default chain and amount

Once you have selected your funding methods, you can select the chain your users will use. When EVM is selected you'll need to select a **default network**. Both for EVM or Solana you'll need an **amount** that users should fund their wallets with. Users can update the amount manually if they choose, before confirming.

During funding flows, Privy will prompt users to fund their wallets with the **native currency of your default chain** (e.g. ETH on Ethereum Mainnet, POL on Polygon, SOL on Solana) with the funding amount you specify here.

<Tip>
  You can also prompt users to fund their wallets with USDC or other ERC20 tokens by setting a
  funding asset [in code](/wallets/funding/prompting-users-to-fund/evm).
</Tip>

You can always change these values in the Dashboard later or even override them in your app's code.

## \[For bank transfer method] Set provider API keys

If using the bank transfer funding method, you will be prompted to set your onramp provider API keys in the Dashboard. For Bridge, you can request API access through [Bridge's website](https://bridge.xyz/).

<img src="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/funding/bridge.png?fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=7c9bc691f29634777c9872ef445f4171" alt="Bridge keys PNG" data-og-width="1843" width="1843" data-og-height="1317" height="1317" data-path="images/funding/bridge.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/funding/bridge.png?w=280&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=5b27b846917b54e8d9a7a6b613569254 280w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/funding/bridge.png?w=560&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=b8a2422a32657b4c4d8916a505c4d185 560w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/funding/bridge.png?w=840&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=8b66c0759e37e2f07c53b9aaba0fd8a8 840w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/funding/bridge.png?w=1100&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=9e6aaceddf39709593c9ebdc31ae089e 1100w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/funding/bridge.png?w=1650&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=c6e1a4d515b6b42c225ae4180faa48fb 1650w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/funding/bridge.png?w=2500&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=ae4da1651e414b3442ffc62de529306f 2500w" />
\n