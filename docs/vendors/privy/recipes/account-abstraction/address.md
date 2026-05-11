> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Storing smart account addresses

<Tip>
  Privy now allows you to natively use smart wallet for a better developer experience. Check out the
  docs [here](/wallets/using-wallets/evm-smart-wallets/overview).
</Tip>

Once you've used Privy's embedded wallet as a **signer** to create smart accounts, you can also store the user's smart account address on their user object.

At a high-level, this is accomplished by requesting a Sign-In With Ethereum (SIWE) signature from the user's smart account, and passing the resulting signature to Privy to verify that the smart account is associated with the authenticated user.

Read below to learn more!

<Tip>
  Storing a user's smart account address on the user object makes the address available in their [
  <b>`user` state in your client</b>](/user-management/users/the-user-object) and the user object
  you might [<b>query from your server</b>](/user-management/users/managing-users/querying-users).
  This enables you to easily associate smart account addresses with users.
</Tip>

## 1. Generate a SIWE message for the smart account

To start, import the `useLinkWithSiwe` hook from `@privy-io/react-auth`. This hook allows you to generate a SIWE message for an arbitrary wallet and pass the resulting signature for verification.

```tsx  theme={"system"}
import {useLinkWithSiwe} from '@privy-io/react-auth';
```

Then, call the `generateSiweMessage` method returned by the hook to generate a SIWE message for the smart account to sign. As parameters to this method, pass an object with the following fields:

| Parameter | Type     | Description                                                                                                                                                                                                                                      |
| --------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `address` | `string` | Required. The user's smart account address. Must be properly checksummed per [EIP-55](https://eips.ethereum.org/EIPS/eip-55).                                                                                                                    |
| `chainId` | `number` | Required. The chain ID of the smart account. Must be a [CAIP-2 formatted](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md) chain ID that correspond to a valid network where signatures from the smart account can be verified. |

<Info>
  Make sure the `chainId` you pass to `generateSiweMessage` and `linkWithSiwe` is{' '}
  <a href="https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md">CAIP-2 formatted</a>.
</Info>

As an example, you might generate a SIWE message for the smart account like so:

```tsx  theme={"system"}
const {generateSiweMessage} = useLinkWithSiwe();
const message = await generateSiweMessage({
  address: 'insert-smart-account-address',
  chainId: 'eip155:8453' // Replace with a CAIP-2 chain ID where signatures from the smart account can be verified
});
```

## 2. Request a `personal_sign` signature from the smart account

Next, with the `message` you generated in step (1), request a EIP191 `personal_sign` signature from the smart account.

The interface for requesting this signature may depend on which smart account provider ([ZeroDev](/recipes/account-abstraction/custom-implementation), [Pimlico](/recipes/account-abstraction/custom-implementation), [Safe](/recipes/account-abstraction/custom-implementation), [Biconomy](/recipes/account-abstraction/custom-implementation), [Alchemy](/recipes/account-abstraction/custom-implementation) your app uses; see the corresponding guides to understand the best way to request a signature from the wallet.

```tsx  theme={"system"}
// In this example, the `kernelClient` corresponds to a ZeroDev smart account. The interface for requesting
// may depend on your chosen smart account provider, so be sure to swap out this implementation for the
// correct one for your setup.
const signature = await kernelClient.signMessage({
  // This `message` is what you generated in step (1)
  message: message
});
```

## 3. Pass the signature to Privy

Lastly, pass the `signature` from the smart account to Privy using the `linkWithSiwe` method returned by the `useLinkWithSiwe` hook. As parameters to this method, include an object with the following fields:

| Parameter          | Type     | Description                                                                                                                                                                                       |
| ------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `message`          | `string` | Required. The SIWE message you generated with `generateSiweMessage`.                                                                                                                              |
| `chainId`          | `number` | Required. The [CAIP-2](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md) chain ID you passed to `generateSiweMessage`.                                                            |
| `signature`        | `string` | Required. The signature produced by the smart account.                                                                                                                                            |
| `walletClientType` | `string` | Recommended. A signature indicating the wallet client you'd like to associate with the smart account. We recommend using `'privy_smart_account'`.                                                 |
| `connectorType`    | `string` | Recommended. A signature indicating the connector type you'd like to associate with the smart account. We recommend using the snake\_cased name of your smart account provider, e.g. `'zerodev'`. |

As an example, you can pass the smart account's signature to Privy for verification like so:

```tsx  theme={"system"}
const {linkWithSiwe} = useLinkWithSiwe();

await linkWithSiwe({
  // The SIWE message generated from `generateSiweMessage`
  message: message,
  // The same `chainId` you passed to `generateSiweMessage`
  chainId: 'eip155:8453',
  // The signature from the smart account
  signature: signature,
  // You can replace this with whatever wallet client you'd like to associate with the smart account
  walletClientType: 'privy_smart_account',
  // You can replace this with whatever connector type you'd like to associate with the smart account
  connectorType: 'zerodev'
});
```

## 4. Get the smart account address

Once you've successfully linked the smart account to the user, you can easily get their smart account address from their Privy `user` object. Simply inspect the `linkedAccounts` array for the entry with:

* `type: 'wallet'`
* `walletClientType: 'privy_smart_account'`, or any other custom `walletClientType` you chose

As an example, you can get the smart account address like so!

```tsx  theme={"system"}
const {user} = usePrivy();
const address = user.linkedAccounts.find(
  (account): account is WalletWithMetadata =>
    account.type === 'wallet' && account.walletClientType === 'privy_smart_account'
);
```

**That's it!** You can also find the user's smart account when [querying Privy's API from your server](/user-management/users/managing-users/querying-users), and applying the same logic to parsing the `linked_accounts` array.
\n