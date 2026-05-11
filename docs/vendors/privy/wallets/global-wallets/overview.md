> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

Privy embedded wallets can be made interoperable across apps, making it easy for you to launch your own **global wallet**. In this setup, global wallets foster a cross-app ecosystem where users can easily port their wallets from one app to another, including by integrating wallet connector solutions like RainbowKit and wagmi.

Using **global wallets**, users can seamlessly move assets between different apps and can easily prove ownership of, sign messages, or send transactions with their existing wallets.

<img src="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Crossapp.png?fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=a56d26b5b4a09624aec9726697762e15" alt="images/Crossapp.png" data-og-width="1229" width="1229" data-og-height="878" height="878" data-path="images/Crossapp.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Crossapp.png?w=280&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=ff90ec080f30d4dbd0ec397494f8c1b7 280w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Crossapp.png?w=560&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=4b7095a1dcf66834819db1b5542cca7d 560w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Crossapp.png?w=840&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=46e068b15d5f129648be4cb95a17e3a6 840w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Crossapp.png?w=1100&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=80600c0a3e6cf3a7ef4a705ea654dba8 1100w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Crossapp.png?w=1650&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=66ca9b9acca1b5eab60d1333af98ccee 1650w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Crossapp.png?w=2500&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=71e9d1e635d27328a99ee3f7fe7895f9 2500w" />

## Providers and requesters

Suppose that Alice is logged in to **App A** and wants to connect with her **App B** wallet to prove she owns an asset. In this setup:

* App A is the **requester app**: it *requests* access to a third-party wallet.
* App B is the **provider app**: it *provides* access to embedded wallets generated on its app.

The **provider** and **requester** nomenclature will be used throughout this documentation and the SDK interfaces.

## Choosing your role

Apps can be a provider, a requester, or both, depending on the cross-app wallet experience they want to enable. Use the flowchart below to determine which role fits the app's needs.

```mermaid  theme={"system"}
%%{init: {'theme':'base', 'themeVariables': {'primaryColor':'#e1f5ff','primaryTextColor':'#1a1a1a','primaryBorderColor':'#0066cc','lineColor':'#666666','secondaryColor':'#d4f1d4','tertiaryColor':'#fff4d4','noteBkgColor':'#f0e5ff','noteTextColor':'#1a1a1a'}}}%%
flowchart TD
    Start([What does the app need?]) --> Question1{Does the app have users<br/>with embedded wallets?}

    Question1 -->|No| Requester1[Integrate as a<br/>REQUESTER]
    Question1 -->|Yes| Question2{Should users access<br/>their wallets from<br/>this app in other apps?}

    Question2 -->|Yes| Provider[Become a PROVIDER<br/>Share app ID]
    Question2 -->|No| Question3{Should the app accept<br/>wallets from other apps?}

    Question3 -->|No| Neither[No global wallet<br/>integration needed]
    Question3 -->|Yes| Both[Configure as BOTH<br/>Provider + Requester]

    Requester1 --> RequesterDetails[Requester integration<br/>━━━━━━━━━━━━━━━<br/>✓ Reference provider app IDs<br/>✓ Users login/link wallets<br/>✓ 2 lines of code RainbowKit<br/>✓ No Privy SDK required]

    Provider --> ProviderQ{Allow transactions or<br/>just address verification?}

    ProviderQ -->|Just verification| ProviderRO[Provider: Read-only mode<br/>━━━━━━━━━━━━━━━<br/>✓ Enable in Dashboard<br/>✓ Set read-only mode<br/>✓ Users prove ownership<br/>✗ No signatures/transactions]

    ProviderQ -->|Allow transactions| ProviderFull[Provider: Full mode<br/>━━━━━━━━━━━━━━━<br/>✓ Enable in Dashboard<br/>✓ Full transaction mode<br/>✓ Enable Blockaid scanning<br/>✓ Users explicitly consent]

    Both --> BothDetails[Dual integration<br/>━━━━━━━━━━━━━━━<br/>As provider:<br/>✓ Share app ID<br/>✓ Users port wallets out<br/><br/>As requester:<br/>✓ Accept partner wallets<br/>✓ Reduce onboarding friction]

    classDef startClass fill:#e1f5ff,stroke:#0066cc,stroke-width:2px,color:#1a1a1a
    classDef providerClass fill:#d4f1d4,stroke:#2d8659,stroke-width:2px,color:#1a1a1a
    classDef requesterClass fill:#fff4d4,stroke:#cc9900,stroke-width:2px,color:#1a1a1a
    classDef bothClass fill:#f0e5ff,stroke:#8855cc,stroke-width:2px,color:#1a1a1a
    classDef neitherClass fill:#f5f5f5,stroke:#999999,stroke-width:2px,color:#1a1a1a
    classDef providerFullClass fill:#a8e6a8,stroke:#2d8659,stroke-width:2px,color:#1a1a1a

    class Start startClass
    class Provider,ProviderRO providerClass
    class Requester1,RequesterDetails requesterClass
    class Both,BothDetails bothClass
    class Neither neitherClass
    class ProviderFull providerFullClass
```

### Provider vs. requester comparison

| Feature                | Provider                            | Requester                          |
| ---------------------- | ----------------------------------- | ---------------------------------- |
| **Setup**              | Enable toggle in Dashboard          | Reference provider app IDs in code |
| **Code required**      | Dashboard configuration only        | 2 lines with RainbowKit            |
| **Privy SDK needed**   | Yes                                 | Optional                           |
| **User flow**          | Users consent to share wallets      | Users link or login with wallets   |
| **Security control**   | Set read-only mode, enable Blockaid | Inherits provider's settings       |
| **Dashboard location** | My app tab                          | Integrations tab                   |
| **Use case**           | Enable cross-app wallet ecosystem   | Reduce onboarding friction         |

<Accordion title="When to become a provider">
  An app should become a provider if it:

  * Has existing users with embedded wallets that could be valuable in other apps
  * Wants to build network effects by enabling users to leverage their wallets across partner apps
  * Wants to increase user retention through cross-app utility
  * Wants to control security settings like read-only mode or Blockaid transaction scanning

  **Setup:** Navigate to Dashboard > Global Wallet > My app and enable the toggle.
</Accordion>

<Accordion title="When to integrate as a requester">
  An app should integrate as a requester if it:

  * Wants to reduce onboarding friction by letting users sign in with existing wallets
  * Does not want to manage wallet creation, recovery, or infrastructure
  * Wants users to bring assets and identity from other apps
  * Wants quick integration using standard wallet connectors like RainbowKit or ConnectKit

  **Setup:** Reference provider app IDs and use `toPrivyWallet()` or Privy hooks.
</Accordion>

<Accordion title="When to be both provider and requester">
  An app should configure both roles if it:

  * Wants maximum wallet interoperability in both directions
  * Is building a partnership ecosystem with other apps
  * Wants users to both import wallets from partners and export wallets to partners
  * Wants to tap into other ecosystems while building its own

  **Setup:** Enable provider settings in Dashboard and integrate requester code for partner wallets.
</Accordion>

## User consent and security

<Info>Privy requires that users explicitly confirm all wallet actions in a cross-app context.</Info>

**Global wallets are built to safeguard user privacy and security.** No app developer can view user assets or learn about their address without both:

* The provider app opting into cross-app flows.
* The user explicitly consenting to share their wallet information with the requester app.

By enabling cross-app functionality, the provider's Privy app (hosted on an isolated subdomain) acts as an OAuth-compliant authentication provider. This means requesting apps can initiate the connection, and if the user approves:

* Users are granted a custom access token to make future requests to the provider wallet
* The user's wallet addresses are then attached to the requester's user object as a new cross-app linked account
* If the provider allows for the wallet to be used for signatures and transactions, the requester can request signatures and transactions using the custom access token. Providers can also choose to make their wallets available in read-only mode.

Privy enables the provider to opt into cross-app wallets in **read-only** mode, enabling the requester app to view the user's wallet address but not prompt the user to transact. If transactions are enabled, the user will always be redirected to the isolated subdomain to explicitly approve them, in addition to needing to be logged in to the provider site and holding the custom access token.

Concretely, this means that when a requester app requests a signature or transaction from a user's cross-app wallet, Privy will open up a pop-up to the isolated subdomain, where **the user must confirm the action explicitly.** This means requesters cannot customize wallet prompts when interacting with a provider wallet, and cannot prompt users to export private keys from a provider wallet.
\n