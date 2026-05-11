> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Migrating existing users to Privy

Privy makes it easy for you to import existing user accounts from your existing auth setup by creating new users with Privy.

At a high-level, your migration workflow involves two key components: **creating user accounts** and **ensuring users have continuous ownership over any assets stored in their wallets, including embedded wallets.** From these two pieces, you can easily switch over from a custom provider or add Privy to your existing auth flow.

## Importing user data

**You can easily create users and their accounts with Privy and can even pre-generate Privy embedded wallets for them.**

Privy supports both:

* [just-in-time migration](#just-in-time-migration) so you can map your existing users to new Privy users as they log in
* [proactive migration](#proactive-migration) to import user data into Privy all at once

### Just-in-time migration

The simplest option is to "lazily" transfer your existing users to Privy. When an existing user logs in to your app via Privy for the first time, add their Privy DID to your internal users database to create a mapping between your existing user entry and [their Privy user object](/user-management/users/the-user-object).

Namely, we suggest:

1. In your internal users database, add a `PrivyDID` column.
2. In the [**`onComplete`**](/authentication/user-authentication/ui-component) callback from Privy's `useLogin` hook, if the **`isNewUser`** flag is `true`, make a request to your backend with the user's Privy DID (`user.id`) and any account data you need to identify that user from your existing DB.

For example, the request to your backend for a new user might include a body like:

```json  theme={"system"}
{
  "address": user.wallet?.address,
  "email": user.email?.address,
  "privyDID": user.id
}
```

3. When your backend receives the request from step (2), find the corresponding entry in your internal user database, matching on their wallet address, email address, or any other relevant account data.

<Steps>
  <Step>
    If entry does not have a `PrivyDID`, add the Privy DID from your request to the `PrivyDID`
    column in your database.
  </Step>

  <Step>
    If the entry already has a "Privy DID" in your database, it should match the Privy DID included
    in your request. There is nothing more to do.
  </Step>

  <Step>
    If there is no user matching the account information in the request, you can assume it is a new
    user in your internal database, and create an entry for them with their `PrivyDID`.
  </Step>
</Steps>

In this way, you can maintain a mapping between your existing user data and the corresponding Privy user object.

Your user data will be updated as your users login to your app using Privy.

### Proactive migration

If your existing users database associates multiple linked accounts (e.g. email, wallet, Discord, etc.) to a single user, we recommend that you proactively migrate them to Privy using the [**create a batch of users**](/user-management/migrating-users-to-privy/create-or-import-a-batch-of-users) endpoint. This ensures you can migrate your users and preserve the links between their different accounts in Privy.

Please see the instructions [here](/user-management/migrating-users-to-privy/create-or-import-a-batch-of-users) for more.

## Ensuring continuous asset ownership

Once you've migrated your user data to Privy, you should next migrate user assets if necessary to ensure the transition is seamless for your users. This can be done by transferring over user addresses to Privy (migrating the wallet) or having them transfer assets to their new accounts (migrating the assets).

The best path depends on your current setup and whether you need users to keep their existing wallets. We generally recommend transferring assets if you can.

<Tip>
  In most cases, migrating assets and/or wallets is only necessary if you are coming from another
  **embedded wallet** provider. If your users currently use external wallets to store their assets,
  you can simply import their address to Privy.
</Tip>

### If you are able to transfer assets

<AccordionGroup>
  <Accordion title="Migrating from a custodial system">
    If you are able to submit transactions on behalf of your users, you can set up batch
    transactions on your backend, sponsoring gas on behalf of your users to transfer their assets
    into pregenerated Privy wallets.
  </Accordion>

  <Accordion title="Migrating from a non-custodial system">
    When they next log in, prompt your users to run a one-time transfer to migrate their assets over
    to their new account.
  </Accordion>
</AccordionGroup>

### If you need to transfer wallets instead of transferring assets

<AccordionGroup>
  <Accordion title="Migrating from a custodial system (where you have access to user keys)">
    You can import user keys to Privy easily if you have access to them. This enables you to
    smoothly move your users' keys so they are managed by Privy's non-custodial system.
  </Accordion>

  <Accordion title="Migrating from a non-custodial system">
    We recommend you prompt your user to export their keys so they can use them with an external
    wallet (like MetaMask).
  </Accordion>
</AccordionGroup>

<Tip>
  Privy's system is non-custodial. This means neither you nor Privy will have any access to your
  user's private keys after the migration.
</Tip>
\n