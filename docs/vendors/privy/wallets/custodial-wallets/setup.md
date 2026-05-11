> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Setup

<Info>
  Custodial wallets are an Enterprise plan feature. If you would like to upgrade your account,
  please reach out to [sales@privy.io](mailto:sales@privy.io).
</Info>

In order to create and use Privy custodial wallets, you must go through the setup process with the custodian and enable Privy to create custodial wallets on your behalf. The following steps outlines the process for using Bridge as the custodian.

## Onboard with the custodian

If you don’t already have a Bridge account, request access at Bridge [here](https://apidocs.bridge.xyz/get-started/introduction/quick-start/get-set-up-with-bridge).

### KYC the wallet beneficiaries

A prerequisite for creating custodial wallets is that the wallet beneficiary must have been KYC'd by the custodian.
Register your users with Bridge either [directly via the API or via KYC links](https://apidocs.bridge.xyz/get-started/introduction/quick-start/create-your-first-customer). The `customerId` of each beneficiary will be used as the `provider_user_id` when creating custodial wallets.

<Tip>
  If you have already KYC'ed your users with Bridge, you do not need to KYC them again. Simply use
  the `customerId` for the user as the `provider_user_id` when creating custodial wallets.
</Tip>

## Enabling custodial wallets on your Privy app

### Request access

First, share your Privy app ID with the Privy team to get custodial wallets enabled on your account. You can find your app ID in the [Privy Dashboard](https://dashboard.privy.io/apps?page=settings).

### Generate and register Bridge API keys with Privy

<Info>
  If you have already registered a Bridge API key with Privy for the onramp integration, you can
  skip this step.
</Info>

1. Get a Bridge API from the [Bridge dashboard](https://dashboard.bridge.xyz/).
2. Register the API key in the Privy dashboard: [Configuration > Integrations > Bridge > Production API key](https://dashboard.privy.io/apps?plugin=integrations\&page=integrations).

<img src="https://mintcdn.com/privy-c2af3412/4VSuXLv7V33ygiNl/images/bridge-api-keys-prod.png?fit=max&auto=format&n=4VSuXLv7V33ygiNl&q=85&s=55bf03e062917e2f5f7c1f38d380cd0f" alt="Bridge API key registration" data-og-width="5529" width="5529" data-og-height="3949" height="3949" data-path="images/bridge-api-keys-prod.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/4VSuXLv7V33ygiNl/images/bridge-api-keys-prod.png?w=280&fit=max&auto=format&n=4VSuXLv7V33ygiNl&q=85&s=498b886241750d755357a26552d017e2 280w, https://mintcdn.com/privy-c2af3412/4VSuXLv7V33ygiNl/images/bridge-api-keys-prod.png?w=560&fit=max&auto=format&n=4VSuXLv7V33ygiNl&q=85&s=2287e6541e95d0662c6e26f097037a8b 560w, https://mintcdn.com/privy-c2af3412/4VSuXLv7V33ygiNl/images/bridge-api-keys-prod.png?w=840&fit=max&auto=format&n=4VSuXLv7V33ygiNl&q=85&s=b3d7115f83b1e731fb5def722c98aa4c 840w, https://mintcdn.com/privy-c2af3412/4VSuXLv7V33ygiNl/images/bridge-api-keys-prod.png?w=1100&fit=max&auto=format&n=4VSuXLv7V33ygiNl&q=85&s=84a63d84b645cc7eaaf6032d62e50dac 1100w, https://mintcdn.com/privy-c2af3412/4VSuXLv7V33ygiNl/images/bridge-api-keys-prod.png?w=1650&fit=max&auto=format&n=4VSuXLv7V33ygiNl&q=85&s=4835ffff68791be4bfa06f4be9831dd3 1650w, https://mintcdn.com/privy-c2af3412/4VSuXLv7V33ygiNl/images/bridge-api-keys-prod.png?w=2500&fit=max&auto=format&n=4VSuXLv7V33ygiNl&q=85&s=a88d2cfd6c30be7cc4a11a5019999bf5 2500w" />

### Turn on custodial wallets for your specific app in the Privy dashboard

Visit [Wallets > Advanced ](https://dashboard.privy.io/apps?tab=wallets\&page=wallets) and turn on the **Custodial wallets** toggle. Select Bridge as the provider.

<img src="https://mintcdn.com/privy-c2af3412/EJYJ39KM0lLQxnl9/images/custodial_wallets_toggle.png?fit=max&auto=format&n=EJYJ39KM0lLQxnl9&q=85&s=3b123ae8aaabe90213bac7a872fb8787" alt="Custodial wallets setup" data-og-width="5529" width="5529" data-og-height="3949" height="3949" data-path="images/custodial_wallets_toggle.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/EJYJ39KM0lLQxnl9/images/custodial_wallets_toggle.png?w=280&fit=max&auto=format&n=EJYJ39KM0lLQxnl9&q=85&s=94359071f7749646c9eb5d0d529c00aa 280w, https://mintcdn.com/privy-c2af3412/EJYJ39KM0lLQxnl9/images/custodial_wallets_toggle.png?w=560&fit=max&auto=format&n=EJYJ39KM0lLQxnl9&q=85&s=66001df88a74c76ec7f466b9db13bcd9 560w, https://mintcdn.com/privy-c2af3412/EJYJ39KM0lLQxnl9/images/custodial_wallets_toggle.png?w=840&fit=max&auto=format&n=EJYJ39KM0lLQxnl9&q=85&s=d447dbab45c8ab47a37bc901cc69272b 840w, https://mintcdn.com/privy-c2af3412/EJYJ39KM0lLQxnl9/images/custodial_wallets_toggle.png?w=1100&fit=max&auto=format&n=EJYJ39KM0lLQxnl9&q=85&s=621d25ea9f318fc4706ef19394a498bd 1100w, https://mintcdn.com/privy-c2af3412/EJYJ39KM0lLQxnl9/images/custodial_wallets_toggle.png?w=1650&fit=max&auto=format&n=EJYJ39KM0lLQxnl9&q=85&s=ead0b6571f3549bf6dc84fb0ad2a052a 1650w, https://mintcdn.com/privy-c2af3412/EJYJ39KM0lLQxnl9/images/custodial_wallets_toggle.png?w=2500&fit=max&auto=format&n=EJYJ39KM0lLQxnl9&q=85&s=fd25e962328c629dd7d94f79745bf318 2500w" />

<Info>
  If you don't see the custodial wallet settings, access to custodial wallets has not been granted
  to your Privy account. Please make sure you've reached out to the Privy team and that they have
  granted access.
</Info>

You're all set! You can now create and use custodial wallets in your Privy app.

### Next steps

Now that you have enabled custodial wallets on your Privy account, you can [create a custodial wallet](/wallets/custodial-wallets/create-custodial-wallet).

<CardGroup cols={3}>
  <Card title="Create a custodial wallet" icon="wallet" href="/wallets/custodial-wallets/create-custodial-wallet">
    Learn how to create and provision custodial wallets
  </Card>

  <Card title="Send funds" icon="paper-plane" href="/wallets/custodial-wallets/sending-funds">
    Execute transactions and send funds from custodial wallets
  </Card>

  <Card title="Transaction lifecycle" icon="clock" href="/wallets/custodial-wallets/transaction-lifecycle">
    Learn about the transaction lifecycle for custodial wallets
  </Card>
</CardGroup>
\n