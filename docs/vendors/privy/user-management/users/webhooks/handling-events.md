> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Handling events

> Respond to webhook events triggered by user actions in your application

[Webhooks](/api-reference/webhooks/overview) notify your app in real time when users take actions.
Privy sends a signed payload to a configured backend endpoint for each event.

## User events

These events fire when users interact with accounts in your app.

<CardGroup cols={2}>
  <Card title="User created" icon="user-plus" href="/api-reference/webhooks/user/created">
    Fires when a new user is created.
  </Card>

  <Card title="User authenticated" icon="right-to-bracket" href="/api-reference/webhooks/user/authenticated">
    Fires when a user logs in.
  </Card>

  <Card title="Account linked" icon="link" href="/api-reference/webhooks/user/linked_account">
    Fires when a user links a new login method.
  </Card>

  <Card title="Account unlinked" icon="link-slash" href="/api-reference/webhooks/user/unlinked_account">
    Fires when a user unlinks a login method.
  </Card>

  <Card title="Account updated" icon="pen-to-square" href="/api-reference/webhooks/user/updated_account">
    Fires when a user updates their email or phone number.
  </Card>

  <Card title="Account transferred" icon="arrow-right-arrow-left" href="/api-reference/webhooks/user/transferred_account">
    Fires when a user transfers their account.
  </Card>
</CardGroup>

## Wallet events

These events fire for embedded wallet actions.

<CardGroup cols={2}>
  <Card title="Wallet created" icon="wallet" href="/api-reference/webhooks/user/wallet_created">
    Fires when an embedded or smart wallet is created.
  </Card>

  <Card title="Private key exported" icon="key" href="/api-reference/webhooks/wallet/private_key_export">
    Fires when a user exports their private key.
  </Card>

  <Card title="Recovery set up" icon="shield" href="/api-reference/webhooks/wallet/recovery_setup">
    Fires when a user sets up wallet recovery.
  </Card>

  <Card title="Wallet recovered" icon="rotate-right" href="/api-reference/webhooks/wallet/recovered">
    Fires when a user recovers their embedded wallet.
  </Card>
</CardGroup>

## MFA events

<CardGroup cols={2}>
  <Card title="MFA enabled" icon="shield-check" href="/api-reference/webhooks/mfa/enabled">
    Fires when a user enables multi-factor authentication.
  </Card>

  <Card title="MFA disabled" icon="shield-xmark" href="/api-reference/webhooks/mfa/disabled">
    Fires when a user disables multi-factor authentication.
  </Card>
</CardGroup>

## Next steps

<CardGroup cols={2}>
  <Card title="Webhooks overview" icon="book" href="/api-reference/webhooks/overview">
    Set up endpoints, verify payloads, and configure retries.
  </Card>

  <Card title="Wallet webhooks" icon="wallet" href="/wallets/gas-and-asset-management/assets/overview">
    Monitor transactions, deposits, and withdrawals.
  </Card>
</CardGroup>
\n