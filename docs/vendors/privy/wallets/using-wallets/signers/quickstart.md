> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Enabling users or servers to execute transactions

A common setup for Privy apps is to configure wallets such that both users and apps themselves can execute transactions from user wallets. This serves a variety of use cases:

* Allowing apps to execute limit orders on behalf of a user, even when a user is offline
* Allowing apps to rebalance user portfolios based on market data, even when the user is offline
* Creating Telegram trading bots or other agents controlled by your app's server that can execute transactions on behalf of users

You can accomplish these use cases via [signers](/wallets/using-wallets/signers/overview), which enable user to grant specific permissions to your app to transact on their behalf. Follow the guide below to learn how to integrate signers for your use case.

<Tip>
  View an [implementation of session
  signers](https://github.com/privy-io/examples/blob/main/privy-next-starter/src/components/sections/session-signers.tsx)
  in Privy's NextJS starter repo to learn about how to use signers end-to-end.
</Tip>

## 0. Prerequisites

Prior to following this guide, follow the quickstart for Privy's [React SDK](/basics/react/quickstart) or [React Native SDK](/basics/react-native/quickstart) to get your app instrumented with Privy's basic functionality.

<Tip>
  If you plan to use this setup as part of a Telegram trading bot, check out the guide to integrate
  [Telegram seamless login](/recipes/react/seamless-telegram) with the React SDK for a smoother user
  experience when signing into Telegram mini-apps.
</Tip>

## 1. Create an app authorization key

To allow your app to be send transactions from user wallets, you must first create an **app authorization key**. Your app's server will sign API requests with this key to authorize sending transactions from user wallets.

Create an authorization key locally on your machine like so:

```sh  theme={"system"}
openssl ecparam -name prime256v1 -genkey -noout -out private.pem && \
openssl ec -in private.pem -pubout -out public.pem
```

Retrieve the public key from the `public.pem` file and the private key from the `private.pem` file in your working directory.

**Make sure to save both files securely.** Privy does not store your private key and cannot help you recover it.

## 2. Register the app authorization key in a key quorum

Next, register the public key you created with Privy so that Privy can appropriately verify signed requests from your app.

To do so, visit the [**Authorization keys**](https://dashboard.privy.io/apps?authorization-keys) page of the Privy Dashboard and click the **New key** button in the top right. Then, click the **Register key quorum instead** option.

In the modal that pops up, enter the public key you generated in step 1 in the **Public keys** field. Set the **Authorization threshold** to 1, to allow that single key to sign on behalf of the key quorum, and set the **Quorum name** to a human readable name of your choice.

Save the `id` of the key quorum that is created. You will need this value later.

This creates a 1-of-1 [key quorum](/controls/quorum-approvals/overview) that can be granted permission to execute actions from a user's wallet.

<Tip>
  You can also register the public key with Privy programmatically via the [REST
  API](/api-reference/key-quorums/create).
</Tip>

## 3. Configure your Privy app to create embedded wallets on login

Next, configure your Privy app to automatically create embedded wallets when users login.

This ensures that all users have an embedded wallet, regardless of whether they login via a web app, a Telegram mini app, or a native mobile app.

<Tabs>
  <Tab title="React (web apps and Telegram mini apps)">
    In your `PrivyProvider` component, set the `config.embeddedWallets.ethereum.createOnLogin` property to `'all-users'` to automatically create embedded wallets for users, regardless of what login method they use.

    ```tsx  theme={"system"}
    <PrivyProvider
      appId="your-privy-app-id"
      config={{
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'all-users'
          }
        }
      }}
    >
      {children}
    </PrivyProvider>
    ```
  </Tab>

  <Tab title="React Native (mobile apps)">
    In your `PrivyProvider` component, set the `config.embeddedWallets.ethereum.createOnLogin` property to `'all-users'` to automatically create embedded wallets for users, regardless of what login method they use.

    ```tsx  theme={"system"}
    <PrivyProvider
      appId="your-privy-app-id"
      clientId="your-app-client-id"
      config={{
        embedded: {
          ethereum: {
            createOnLogin: 'all-users'
          }
        }
      }}
    >
      {children}
    </PrivyProvider>
    ```
  </Tab>
</Tabs>

## 4. (Optional) Create a policy for your signer

If you'd like your signer to only have specific permissions on users' wallets, [create a policy](/controls/policies/overview) for your signer based on the transaction it needs to execute. For example, you might create a policy that [expires the signer's permissions after a certain date](/controls/policies/example-policies/timebound), or limits only allows transacting under a certain amount with a specific contract, in order to execute a limit order when a user is offline. You can also create multiple policies to allow your signer to execute a set of actions.

Once you've created your desired policy for the signer, make sure to save the policy ID. You will need this when adding your signer to users' wallets.

<Tip>
  See example policies for [Ethereum](/controls/policies/example-policies/ethereum) and
  [Solana](/controls/policies/example-policies/solana) that you can modify for your use case.
</Tip>

## 5. Add a signer to the user's wallet

Once a user logs in, an embedded wallet will automatically be created for them.

Once a user has an embedded wallet, add the key quorum you created in step 3 as a [signer](/wallets/using-wallets/signers/overview) to the user's wallet. This allows your app to sign transaction requests from the user's wallet via your app's authorization key.

<Tabs>
  <Tab title="React (web apps and Telegram mini apps)">
    Once a user logs in, you can use the [`addSigners`](/wallets/using-wallets/signers/add-signers) method of `useSigners` hook to add your app's authorization key as a signer on the wallet.

    ```tsx  theme={"system"}
    import {useSigners} from '@privy-io/react-auth';

    ...

    const {addSigners} = useSigners();
    // Call this method after a user logs in and has an embedded wallet
    await addSigners({
        address: 'insert-user-embedded-wallet-address',
        signers: [{
            signerId: 'insert-key-quorum-id-from-step-2',
            // Replace the `policyIds` array with an array of valid policy IDs if you'd like the signer to only be able to execute certain transaction requests allowed by a policy. If you'd like the signer to have full permission, pass an empty array ([]).
            policyIds: ['insert-policy-id-1', 'insert-policy-id-2']
        }]
    })
    ```

    <AccordionGroup>
      <Accordion title="Add a signer to a user's wallet immediately after they login.">
        If you'd like to immediately add your signer to a user's wallet when they login, use the `onComplete` callback of the `useLogin` hook:

        ```tsx  theme={"system"}
        import {useLogin} from '@privy-io/react-auth';

        const {login} = useLogin({
          onComplete: () => {
            console.log(
              "Execute any logic you'd like to run after a user logs in, such as adding a signer"
            );
          }
        });
        ```

        All together, you can add a signer after a user logs in like so:

        ```tsx  theme={"system"}
        import {useLogin} from '@privy-io/react-auth';
        import {useSigners} from '@privy-io/react-auth';

        ...

        const {addSigners} = useSigners();
        const {login} = useLogin({
            onComplete: (user, isNewUser) => {
                if (isNewUser) {
                  await addSigners({
                    address: user.wallet.address,
                    signers: [{
                        signerId: 'insert-key-quorum-id-from-step-2',
                        // Replace the empty `policyIds` array with an array of valid policy IDs if you'd like the signer to only be able to execute certain transaction requests allowed by a policy
                        policyIds: []
                    }]
                 });
                }
            }
        })

        // Call login somewhere in your app
        ```
      </Accordion>

      <Accordion title="Add a signer for limit orders.">
        If your app offers limit orders to users, we recommend the following flow for using signers to execute limit orders.

        <Steps>
          <Step title="Create your limit order policy">
            Create a policy that allows your signer to execute the limit order from the user's wallet.
          </Step>

          <Step title="Add your signer">
            Add your signer to the user's wallet via the `addSessionSigner` method, using the policy from step 1.
          </Step>

          <Step title="Execute the limit order">
            When the conditions to execute the limit order are met, see step 6 of this guide to learn how to send transactions with your signer.
          </Step>
        </Steps>
      </Accordion>
    </AccordionGroup>
  </Tab>

  <Tab title="React Native (mobile apps)">
    Once a user logs in, you can use the [`addSigners`](/wallets/using-wallets/signers/add-signers#react-native) method of `useSigners` hook to add your app's authorization key as a signer on the wallet.

    ```tsx  theme={"system"}
    import {useSigners} from '@privy-io/expo';

    ...

    const {addSigners} = useSigners();
    // Call this method after a user logs in and has an embedded wallet
    await addSigners({
        address: 'insert-user-embedded-wallet-address',
        signers: [{
            signerId: 'insert-key-quorum-id-from-step-2',
            // Replace the empty `policyIds` array with an array of valid policy IDs if you'd like the signer to only be able to execute certain transaction requests allowed by a policy
            policyIds: []
        }]
    })
    ```

    <Accordion title="Add a signer for limit orders.">
      If your app offers limit orders to users, when a user places an order, we recommend:

      1. Create a policy that allows your signer to execute the limit order from the user's wallet.
      2. Add your signer to the user's wallet via the `addSessionSigner` method, using the policy from step 1.
      3. When the conditions to execute the limit order are met, execute the transaction with your signer. See step 6 of this guide to learn how to use signers to execute transactions via the NodeJS SDK or REST API.
    </Accordion>
  </Tab>
</Tabs>

## 6. Send transactions from the user's wallet

That's it! Now, both users and your app can send transactions from a user's wallet.

### User-initiated transactions

Users can send transactions from your app's frontend by taking actions in a web app (via Privy's React SDK), a mobile app (via Privy's React Native SDK), or a Telegram mini-app (via Privy's React SDK).

Follow the guides below to learn how to send [transactions](/wallets/using-wallets/ethereum/send-a-transaction) from these environments.

#### Ethereum

<CardGroup>
  <Card title="React" href="/wallets/using-wallets/ethereum/send-a-transaction">
    Send Ethereum transactions from a web app or a Telegram mini-app using Privy's React SDK.
  </Card>

  <Card title="React Native" href="/wallets/using-wallets/ethereum/send-a-transaction#react-native">
    Send Ethereum transactions from a mobile app or a Telegram mini-app using Privy's React Native
    SDK.
  </Card>
</CardGroup>

#### Solana

<CardGroup>
  <Card title="React" href="/wallets/using-wallets/solana/send-a-transaction">
    Send Solana transactions from a web app or a Telegram mini-app using Privy's React SDK.
  </Card>

  <Card title="React Native" href="/wallets/using-wallets/solana/send-a-transaction#react-native">
    Send Solana transactions from a mobile app or a Telegram mini-app using Privy's React Native
    SDK.
  </Card>
</CardGroup>

### App-initiated transactions

Your app can also now initiate transactions from users' wallets via Privy's NodeJS SDK or REST API. This allows your app to send transactions from users' wallets even when the user is offline, allowing for various use cases:

* Executing limit orders
* Rebalancing portfolios
* Having a Telegram trading bot execute transactions on behalf of users

Follow the guides below to send transactions from your app's server using your app's authorization key.

<Info>
  Using Privy's REST API directly is an advanced integration. If your app uses a JavaScript or
  TypeScript backend, we strongly recommend using Privy's [NodeJS
  SDK](/basics/nodeJS-server-auth/setup).
</Info>

<Tabs>
  <Tab title="NodeJS (server-auth)">
    To start, initialize your `PrivyClient` with the private key of the authorization key you created in step 1. Pass this value into the `walletApi.authorizationPrivateKey` field of the third positional parameter to the client's constructor.

    ```tsx  theme={"system"}
    const privy = new PrivyClient('insert-your-app-id', 'insert-your-app-secret', {
        walletApi: {
            authorizationPrivateKey: 'insert-the-private-key-from-step-1'
        }
    })
    ```

    Next, follow the guides to send transactions on [Ethereum](/wallets/using-wallets/ethereum/send-a-transaction#nodejs) and [Solana](/wallets/using-wallets/solana/send-a-transaction#nodejs) with the NodeJS SDK.
  </Tab>

  <Tab title="REST API">
    Since your app is a signer on the user's wallet, your app must sign transaction requests to Privy's API with the private key of the authorization key you generated in step 1. Your app must then include this signature in the `privy-authorization-signature` header of the request.

    Follow [this guide](/controls/authorization-keys/using-owners/sign) to learn how to sign requests to Privy's API with your app's authorization key.

    Once you've learned and implemented how to sign requests, you can now follow the guides to send transactions on [Ethereum](/wallets/using-wallets/ethereum/send-a-transaction#rest-api) and [Solana](/wallets/using-wallets/solana/send-a-transaction#rest-api) with the NodeJS SDK.
  </Tab>
</Tabs>

<Tip>
  **Building a Telegram trading bot?** Check out the [Telegram trading bot
  recipe](/recipes/telegram-bot) to learn how to have your app initiate transactions on behalf of
  users with a trading bot.
</Tip>
\n