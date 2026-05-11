> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Users

Users can be owners and/or signers in Privy.

<Tip>
  You can create user self-custodial wallets by setting a user as the owner of the wallet, whether
  you use your own existing authentication provider or Privy as your authentication provider.
</Tip>

When you make a request to the Privy API with a valid **access token** for a user, Privy returns a **user key** for the user. Requests to the Privy API to update or take actions with a resource owned by this user must be signed by the user key.

To ensure the security of user keys:

* User keys are **time-bound**, meaning they can only sign requests for a limited window before they expire, and a new user key must be requested.
* When returning a user's key, Privy encrypts the key under a public-private keypair that your app generates. This ensures that only your server can decrypt the user's key.

At a high-level, the flow to request user authentication keys is as follows:

<Steps>
  <Step title="Configure authentication settings">
    In the [Privy Dashboard](/controls/authorization-keys/keys/create/user/authentication), configure your authentication settings from your authentication provider. In particular, register the JWKS.json endpoint that will be used to verify your user's access token.

    <Tip>
      If you are using Privy as your authentication provider, you can skip this step.
    </Tip>
  </Step>

  <Step title="Generate a keypair to encrypt user  keys">
    Generate a public-private keypair (ECH P-256) that will be used to encrypt the user key. Make sure to save both the public and private keys.
  </Step>

  <Step title="Request a user key from the Privy API">
    Make a request to the Privy API with the user's access token and the public key you generated. Privy will return a user key for the user, encrypted under the public key you provided, which you can decrypt with the corresponding private key.
  </Step>
</Steps>
\n