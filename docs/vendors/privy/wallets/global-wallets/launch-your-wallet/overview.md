> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Overview

**Providers** are apps that enable their users' embedded wallets to be used in other apps. Becoming a provider enables your users to use their embedded wallets and assets from your app elsewhere, allowing them to transact from an existing balance, aggregate assets, and more.

<Tip>
  Before sharing your users' wallets as a provider app, you must enable a **base domain** for your app.

  **Enabling a base domain helps secure your users' wallets in a cross-app context.** Read more about [security for cross-app wallets](/wallets/global-wallets/overview) and follow [this guide](/recipes/react/cookies) to set up a base domain!
</Tip>

## Configuring your app as a provider

To become a provider and share your users' embedded wallets with other apps, simply visit the **Privy Dashboard** and navigate to the **User management > [Global Wallet](https://dashboard.privy.io/apps?page=ecosystem)** section.

Under the [**My app**](https://dashboard.privy.io/apps?tab=app\&page=ecosystem) tab of this page, enable the **Make my wallet available for other apps to integrate** toggle. You should also upload a square logo image with aspect ratio 1:1 to be shared with other apps. We recommend a JPEG or PNG with size 180px by 180px for best results.

Once enabled, your app will show up as an available wallet provider that other apps can integrate via the [**Integrations**](https://dashboard.privy.io/apps?tab=integrations\&page=ecosystem) tab of this page.

You can also see apps that have actively integrated your wallets under the [**My ecosystem**](https://dashboard.privy.io/apps?tab=ecosystem\&page=ecosystem) tab.

## Transaction scanning

As an additional security feature, Privy is integrated with [Blockaid](https://www.blockaid.io/) transaction scanning to ensure that all transactions from your users' global wallets are safe and secure.

Transaction scanning has two levels of security; **validation** and **simulation**. With transaction validation, users will be notified if the transaction has been flagged by Blockaid as suspicious or malicious. Blockaid will also simulate the transaction with the wallet, showing the token and USD value or exposure difference if the transaction is approved.

<img src="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/transaction-scan.png?fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=7eb889f9851cd020bee447b17c5c6c19" alt="Transaction scanning UI" data-og-width="1843" width="1843" data-og-height="1317" height="1317" data-path="images/transaction-scan.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/transaction-scan.png?w=280&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=28df4a6091ad5c31ad1baf53e34df233 280w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/transaction-scan.png?w=560&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=c8842ddd2bd8ab35788b65d0f6631690 560w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/transaction-scan.png?w=840&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=0245286c07569e6e21873e78566e4289 840w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/transaction-scan.png?w=1100&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=a67efa132b70993a5d614e97c59ec3ec 1100w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/transaction-scan.png?w=1650&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=41ab81a1eb5f86f3ca47196fed12a7cc 1650w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/transaction-scan.png?w=2500&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=09880ff7f76264669ea2160662d1284d 2500w" />

To enable transaction scanning for your global wallet users, navigate to the [Global wallet > My app](https://dashboard.privy.io/apps?page=ecosystem) page of the Privy Dashboard and toggle the **Blockaid transaction simulation** setting on.

Privy has a default API key your app can use for testing but to prevent rate limiting your app should **configure its own Blockaid API key** in the dashboard.

## Read-only mode

When sharing your users' embedded wallets with other apps, your users are protected from any malicious developer. Usage of embedded wallets across apps are strictly domain-segregated and every user action requires explicit consent in a third-party app.

If you would like to limit the scope of your users' wallets to only be read-only in other apps, click the **Read-only mode** checkbox within the [**My app**](https://dashboard.privy.io/apps?tab=app\&page=ecosystem) tab. With this setting enabled, requester apps may see your user's wallet addresses, but not request signatures or transactions from them.

This may be particularly useful for setups where users verifying ownership of assets from your app in other apps, but not necessarily transacting with them.
\n