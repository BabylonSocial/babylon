> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Guest accounts

<Info>
  Privy enables developers to create Guest accounts for users, so that users can immediately use your app without going through a login flow.

  Guest accounts are available in @privy-io/react-auth\@1.77.0 and above.
</Info>

Privy guest accounts have powerful features:

* They are locally persisted, so guest users can leave and return to the same account on the same device.
* They have **fully functioning** embedded wallets that can transact and mint on-chain.
* They are upgradable to fully logged-in accounts by simply calling `login()`.
* They have stable user IDs that do not change once a user is fully logged in.
* They can be logged out and deleted as needed.

## Integration tips

* **Guest account creation:** If a user is not logged in at all (via guest or normal user account), we recommend showing guest account creation and normal user login side-by-side.
  * e.g. a “Continue as Guest” button next to a “Login or Create Account” button. This is so users do not create guest accounts unintentionally when they mean to log in with an existing account.
* **Guest account upgrade:** If a user is logged in as a guest, we recommend showing two options: upgrade or delete.
  * *Upgrade guest account*: When a guest upgrades to a full user, they must enter a new login credential. If they try to upgrade with a credential (e.g. email address) that already is associated with an existing account, they will see a “Could not link existing account” error message.
  * *Delete guest account*: If a guest prefers to use an existing account instead, they must delete their guest account first. We recommend surfacing a “delete” option explicitly so guests can opt-into abandoning their guest account in favor of an existing account.
* You can make use of [login and error callbacks](/authentication/user-authentication/login-methods/email) to customize your desired behavior when a user upgrades out of guest-mode.

## Please note

<Warning>
  Guest accounts are **valid for 30 days**. If the guest does not upgrade to a full user account
  within 30 days, the guest session will expire.
</Warning>

* User data and embedded wallets from guest sessions **cannot** be merged into an existing user account — guest accounts can only be *upgraded* into a new user account. If a guest user wants to log in with an existing account, you must delete the guest user session first.
* Note that Telegram is not available as an upgrade login method for guest accounts.

## Configure guest accounts

<Tip>
  Enable guest accounts in the [Privy
  Dashboard](https://dashboard.privy.io/apps?page=login-methods\&logins=advanced) before implementing
  this feature.
</Tip>

### Create guest accounts client-side

Use the `createGuestAccount` function from the `useGuestAccounts` hook in the React SDK to integrate guest accounts. The `createGuestAccount` function returns an [authenticated `User` object](/user-management/users/the-user-object).

```jsx  theme={"system"}
// createGuestAccount: () => Promise<User>
const {createGuestAccount} = useGuestAccounts();
```

`createGuestAccount` is an asynchronous call that will create and authenticate users as guests. If the user is already a guest, this call is idempotent. If the user is already *logged in* as a non-guest user, this will throw an error indicating as such.

### Check if a user is a guest

To check if a User is a guest account, use the `isGuest` property on the `User` object returned by the `usePrivy` hook.

```jsx  theme={"system"}
const {user} = usePrivy();

// isGuest: boolean
user.isGuest;
```

### Access a guest user ID

To access the guest’s user data including their stable user ID and wallet address, access the user object from the `usePrivy` hook.

```tsx  theme={"system"}
const {user} = usePrivy();

// Get the user's stable User ID and their wallet address.
user.id;
user.wallet.address;
```

### Access a guest user’s embedded wallet

To transact with the guest user’s embedded wallet, [use the appropriate wallet from the connected `wallets` array.](/wallets/wallets/get-a-wallet) All embedded wallet functionality that is available for logged-in users is also available to guest users.

```tsx  theme={"system"}
const {wallets} = useWallets();
const embeddedWallet = getEmbeddedConnectedWallet(wallets);

// Get the embedded wallet address or send a transaction.
embeddedWallet.address;
const provider = await embeddedWallet.getEthereumProvider()
provider.request({method: 'eth_sendTransaction', params: [...]});
```

### Upgrade a guest user to a logged-in user

Simply call `login()` to enable the guest user to upgrade their account to a logged-in account using any authentication method of their choice.

```tsx  theme={"system"}
// login: (options?) => void
const {login} = usePrivy();
```

### Enable a guest user to delete their guest session

Call `logout()` to enable the guest user to delete their guest session. This is an important interface to support so that users who start a guest session but would prefer to log in with a pre-existing account, are able to do so.

```tsx  theme={"system"}
// logout: (options?) => void
const {logout} = usePrivy();
```
\n