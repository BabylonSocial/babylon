> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Using passkeys with wallets

Passkeys provide a secure way to authorize actions on Privy wallets. This guide shows how to integrate your existing passkey implementation as an authorization mechanism for Privy wallets, combining modern authentication with powerful onchain actions.

## Overview

Authorization keys provide a way to ensure that actions taken by your app's wallets can only be authorized by an explicit user request. When you specify an `owner` of a resource, all requests to update that resource **must be signed** with this key. This security measure verifies that each request comes from your authorized passkey owner and helps prevent unauthorized operations.

## Setting up passkeys

If you need a passkey implementation set up for your application, we recommend using the [simpleWebAuthn SDKs](https://simplewebauthn.dev/docs), which provides simple passkey registration and authentication flows.

<Accordion title="Sample passkey registration flow">
  If you have not already done so, install the dependencies necessary for a simple passkey integration.
  `sh npm install @simplewebauthn/server @simplewebauthn/browser `

  ### Server-side registration endpoints

  First, create the registration begin endpoint:

  ```typescript {skip-check} theme={"system"}
  // /api/register-passkey/begin
  import {generateRegistrationOptions} from '@simplewebauthn/server';
  import type {NextApiRequest, NextApiResponse} from 'next';
  import {passkeyStorage} from '@/lib/passkey-storage';

  // This would typically come from your database
  const rpName = 'Your App Name';
  const rpID = 'yourdomain.com';
  const origin = 'https://yourdomain.com';

  export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
      return res.status(405).json({error: 'Method not allowed'});
    }

    try {
      const {userId} = req.body;

      if (!userId) {
        return res.status(400).json({error: 'userId is required'});
      }

      // Generate registration options
      const options = await generateRegistrationOptions({
        rpName,
        rpID,
        userID: Buffer.from(userId),
        userName: `user-${userId}`, // This would typically be the user's email or username
        attestationType: 'none', // For demo purposes, we don't need attestation
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred'
        },
        supportedAlgorithmIDs: [-7] // ES256
      });

      // Store the options temporarily (in production, store in database with expiration)
      passkeyStorage.set(userId, {options});

      // Clean up old entries (older than 5 minutes)
      // passkeyStorage.cleanup();

      return res.status(200).json(options);
    } catch (error) {
      console.error('Error generating registration options:', error);
      return res.status(500).json({error: 'Internal server error'});
    }
  }
  ```

  Next, create the registration verify endpoint:

  ```typescript {skip-check} theme={"system"}
  // /api/register-passkey/verify
  import {verifyRegistrationResponse} from '@simplewebauthn/server';
  import type {NextApiRequest, NextApiResponse} from 'next';
  import {passkeyStorage} from '@/lib/passkey-storage';

  const rpID = 'yourdomain.com';
  const origin = 'https://yourdomain.com';

  export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
      return res.status(405).json({error: 'Method not allowed'});
    }

    try {
      const {userId, attestationResponse} = req.body;

      if (!userId || !attestationResponse) {
        return res.status(400).json({error: 'userId and attestationResponse are required'});
      }

      // Retrieve the stored registration options
      const storedData = passkeyStorage.get(userId);
      if (!storedData) {
        return res.status(400).json({error: 'Registration options not found or expired'});
      }

      const {options} = storedData;

      // Verify the registration response
      const verification = await verifyRegistrationResponse({
        response: attestationResponse,
        expectedRPID: rpID,
        expectedOrigin: origin,
        expectedChallenge: options.challenge,
        requireUserVerification: false // For demo purposes
      });

      if (verification.verified) {
        // Registration successful - store the passkey credentials
        // In production, you would store this in your database
        const {credentialID, credentialPublicKey} = verification.registrationInfo;

        // Clean up temporary storage
        passkeyStorage.delete(userId);

        return res.status(200).json({
          verified: true,
          credentialID: Buffer.from(credentialID).toString('base64'),
          publicKey: Buffer.from(credentialPublicKey).toString('base64')
        });
      } else {
        return res.status(400).json({error: 'Registration verification failed'});
      }
    } catch (error) {
      console.error('Error verifying registration:', error);
      return res.status(500).json({error: 'Internal server error'});
    }
  }
  ```

  ### Client-side registration

  ```typescript  theme={"system"}
  import {startRegistration} from '@simplewebauthn/browser';

  // Client-side registration
  async function registerPasskey(userId: string) {
    // Step 1: Get registration options from server
    const optionsResponse = await fetch('/api/register-passkey/begin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({userId})
    });

    const options = await optionsResponse.json();

    // Step 2: Start the registration process in the browser
    const attestationResponse = await startRegistration(options);

    // Step 3: Send the response to your server for verification
    const verificationResponse = await fetch('/api/register-passkey/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        attestationResponse
      })
    });

    const verification = await verificationResponse.json();

    if (verification.verified) {
      // Passkey registration successful!
      return {
        credentialID: verification.credentialID,
        publicKey: verification.publicKey
      };
    } else {
      throw new Error('Passkey registration failed');
    }
  }
  ```
</Accordion>

## Creating and registering wallets with passkey authorization

Follow these steps to create a wallet and register it with a user's passkey for authorization.

1. Retrieve the user's passkey P-256 PEM-formatted public key and send it to your backend.

<Accordion title="Converting WebAuthn public key to PEM format (if using simpleWebAuthn)">
  After registering a passkey, you'll need to convert the WebAuthn public key from COSE format to PEM format that Privy expects:

  ```typescript  theme={"system"}
  const coseToJwk = require('cose-to-jwk');

  async function convertCoseToPem(coseKey: Uint8Array): Promise<string> {
    // Convert COSE to JWK format
    const jwk = coseToJwk(coseKey);

    // Import the JWK using Web Crypto API
    const cryptoKey = await crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      true, // extractable
      ['verify'] // only need verify for public keys
    );

    // Export the key in SPKI format (DER-encoded)
    const spkiDer = await crypto.subtle.exportKey('spki', cryptoKey);

    // Convert to base64 and format as PEM
    const base64Key = Buffer.from(spkiDer).toString('base64');

    // Split into 64-character lines
    const lines = [];
    for (let i = 0; i < base64Key.length; i += 64) {
      lines.push(base64Key.slice(i, i + 64));
    }

    // Create PEM format
    const pemKey = `-----BEGIN PUBLIC KEY-----\n${lines.join('\n')}\n-----END PUBLIC KEY-----`;

    return pemKey;
  }
  ```

  Use this function after successful passkey registration to get the PEM-formatted public key that Privy requires.
</Accordion>

2. From your backend, call the Privy API to create a wallet with that P-256 public key as the owner. You can do this via the Privy SDK (below) or by hitting the [Privy API](/api-reference/wallets/create) directly.

<CodeGroup>
  ```ts @privy-io/node theme={"system"}
  import {PrivyClient} from '@privy-io/node';

  // Note: Privy expects the public key to be base64 encoded. Browsers return the key in base64url format, so be sure to convert it to base64 before passing it to the Privy SDK.
  const passkeyP256PublicKey = 'your-p256-public-key';

  const privy = new PrivyClient({appId: 'your-app-id', appSecret: 'your-app-secret'});

  const wallet = await privy.wallets().create({
    owner: {
      public_key: passkeyP256PublicKey
    },
    chain_type: 'ethereum' // or another supported chain type
  });
  ```

  ```ts @privy-io/server-auth theme={"system"}
  import {PrivyClient} from '@privy-io/server-auth';

  // Note: Privy expects the public key to be base64 encoded. Browsers return the key in base64url format, so be sure to convert it to base64 before passing it to the Privy SDK.
  const passkeyP256PublicKey = 'your-p256-public-key';

  const privy = new PrivyClient('your-app-id', 'your-app-secret');

  const wallet = await privy.walletApi.createWallet({
    owner: {
      publicKey: passkeyP256PublicKey
    },
    chainType: 'ethereum' // or another supported chain type
  });
  ```
</CodeGroup>

3. Associate the returned wallet ID with the user on your backend for use in future requests.

## Sending transactions with passkey authorization

Below are the steps necessary to create a transaction request, have the user sign it with their passkey using WebAuthn, and submit the signed request to Privy:

1. **Create and format the transaction request payload**

Create your transaction and format it into the required request payload structure:

```typescript  theme={"system"}
import canonicalize from 'canonicalize';
import {startAuthentication} from '@simplewebauthn/browser';

// Your transaction details
const transaction = {
  to: '0x...',
  value: '1000000000000000000', // 1 ETH in wei
  chain_id: 1, // Ethereum mainnet
  data: '0x',
  gas_limit: '21000',
  nonce: 42,
  type: 2
};

const serverWallet = {id: 'your-wallet-id'}; // The wallet created earlier

// Format the request payload for Privy API
const requestPayload = {
  version: 1,
  method: 'POST',
  url: `https://api.privy.io/v1/wallets/${serverWallet.id}/rpc`,
  body: {
    method: 'eth_sendTransaction',
    params: {
      transaction: {
        to: transaction.to,
        value: transaction.value,
        chain_id: transaction.chain_id,
        data: transaction.data,
        gas_limit: transaction.gas_limit,
        nonce: transaction.nonce,
        type: 2
      }
    }
  },
  headers: {
    'privy-app-id': process.env.NEXT_PUBLIC_PRIVY_APP_ID!
  }
};

// Canonicalize the payload for consistent signing
const canonicalPayload = canonicalize(requestPayload) as string;

// Convert to base64url as required by Privy's specification
function base64UrlEncode(str: string) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const payloadBase64Url = base64UrlEncode(canonicalPayload);
```

2. **Sign the payload with the user's passkey**

Use the WebAuthn authentication flow to sign the formatted payload:

```typescript  theme={"system"}
import {startAuthentication} from '@simplewebauthn/browser';

// Sign the payload using simpleWebAuthn
const authResponse = await startAuthentication({
  optionsJSON: {
    challenge: '$PAYLOAD_BASE64_URL',
    allowCredentials: [], // Empty to discover available credentials
    userVerification: 'preferred',
    rpId: 'yourdomain.com', // Must match the rpID from registration
    timeout: 60000 // 60 seconds
  }
});

// Extract the WebAuthn response components
const signature = authResponse.response.signature;
const authenticatorData = authResponse.response.authenticatorData;
const clientDataJSON = authResponse.response.clientDataJSON;
```

3. **Format the authorization signature**

Create the specially formatted authorization signature that Privy expects:

```typescript {skip-check} theme={"system"}
// Format the authorization signature for Privy
const authorizationSignature = `webauthn:${authenticatorData}:${clientDataJSON}:${signature}`;
```

4. **Send the transaction to Privy**

<Tabs>
  <Tab title="Direct API">
    Send the transaction request with the WebAuthn authorization signature using direct API calls:

    ```typescript  theme={"system"}
    import fetch from 'node-fetch'; // or use global fetch

    const accessToken = 'your-access-token'; // Your app's access token
    const serverWallet = {id: 'your-wallet-id'}; // The wallet created earlier
    const authorizationSignature = 'formatted-authorization-signature'; // From previous step
    const transaction = {
      to: '0x...',
      value: '1000000000000000000', // 1 ETH in wei
      chain_id: 1, // Ethereum mainnet
      data: '0x',
      gas_limit: '21000',
      nonce: 42,
      type: 2
    };

    // Send the transaction to Privy API
    const response = await fetch(`https://api.privy.io/v1/wallets/${serverWallet.id}/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'privy-app-id': process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
        'privy-authorization-signature': authorizationSignature,
        Authorization: `Bearer ${accessToken}` // Your app's access token
      },
      body: JSON.stringify({
        method: 'eth_sendTransaction',
        params: {
          transaction: {
            to: transaction.to,
            value: transaction.value,
            chain_id: transaction.chain_id,
            data: transaction.data,
            gas_limit: transaction.gas_limit,
            nonce: transaction.nonce,
            type: 2
          }
        }
      })
    });

    const result = await response.json();
    console.log('Transaction result:', result);
    ```
  </Tab>

  <Tab title="Node SDK">
    Send the transaction request using the Privy Node SDK:

    <CodeGroup>
      ```typescript @privy-io/node theme={"system"}
      import {PrivyClient} from '@privy-io/node';

      const privy = new PrivyClient({appId: 'your-app-id', appSecret: 'your-app-secret'});

      const serverWallet = {id: 'your-wallet-id'}; // The wallet created earlier
      const authorizationSignature = 'formatted-authorization-signature'; // From previous step
      const transaction = {
        to: '0x...',
        value: '1000000000000000000', // 1 ETH in wei
        chain_id: 1, // Ethereum mainnet
        data: '0x',
        gas_limit: '21000',
        nonce: 42,
        type: 2
      };

      // Sign the transaction using the Privy SDK
      const result = await privy
        .wallets()
        .ethereum()
        .signMessage({
          wallet_id: serverWallet.id,
          authorization: authorizationSignature,
          rpc: {
            method: 'eth_signTransaction',
            params: {
              transaction: {
                to: transaction.to,
                value: transaction.value,
                chain_id: transaction.chain_id,
                data: transaction.data,
                gas_limit: transaction.gas_limit,
                nonce: transaction.nonce,
                type: 2
              }
            }
          }
        });

      console.log('Signed transaction:', result);
      ```
    </CodeGroup>
  </Tab>
</Tabs>

**That's it! Your users can now securely authorize transactions on wallets using their passkeys with WebAuthn standard authentication.** 🎉

## Signing messages with passkey authorization

Similar to transactions, you can also sign messages using passkey authorization. Below are the steps to create a message signing request and submit it with passkey authorization:

<Note>
  When signing messages, it's important to use `utf-8` encoding for the message and include
  `chain_type: 'ethereum'` in the request payload. These parameters ensure proper signature
  generation and verification.
</Note>

1. **Create and format the message signing request payload**

Create your message and format it into the required request payload structure:

```typescript  theme={"system"}
import canonicalize from 'canonicalize';
import {startAuthentication} from '@simplewebauthn/browser';

// Your message to sign
const message = 'Hello, Privy!';

const serverWallet = {id: 'your-wallet-id'}; // The wallet created earlier

// Format the request payload for Privy API
const requestPayload = {
  version: 1,
  method: 'POST',
  url: `https://api.privy.io/v1/wallets/${serverWallet.id}/rpc`,
  body: {
    method: 'personal_sign',
    chain_type: 'ethereum',
    params: {
      message: message,
      encoding: 'utf-8'
    }
  },
  headers: {
    'privy-app-id': process.env.NEXT_PUBLIC_PRIVY_APP_ID!
  }
};

// Canonicalize the payload for consistent signing
const canonicalPayload = canonicalize(requestPayload) as string;

// Convert to base64url as required by Privy's specification
function base64UrlEncode(str: string) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const payloadBase64Url = base64UrlEncode(canonicalPayload);
```

2. **Sign the payload with the user's passkey**

Use the WebAuthn authentication flow to sign the formatted payload:

```typescript  theme={"system"}
import {startAuthentication} from '@simplewebauthn/browser';

// Sign the payload using simpleWebAuthn
const authResponse = await startAuthentication({
  optionsJSON: {
    challenge: payloadBase64Url,
    allowCredentials: [], // Empty to discover available credentials
    userVerification: 'preferred',
    rpId: 'yourdomain.com', // Must match the rpID from registration
    timeout: 60000 // 60 seconds
  }
});

// Extract the WebAuthn response components
const signature = authResponse.response.signature;
const authenticatorData = authResponse.response.authenticatorData;
const clientDataJSON = authResponse.response.clientDataJSON;
```

3. **Format the authorization signature**

Create the specially formatted authorization signature that Privy expects:

```typescript  theme={"system"}
// Format the authorization signature for Privy
const authorizationSignature = `webauthn:${authenticatorData}:${clientDataJSON}:${signature}`;
```

4. **Send the message signing request to Privy**

<Tabs>
  <Tab title="Direct API">
    Send the message signing request with the WebAuthn authorization signature using direct API calls:

    ```typescript  theme={"system"}
    import fetch from 'node-fetch'; // or use global fetch

    const accessToken = 'your-access-token'; // Your app's access token
    const serverWallet = {id: 'your-wallet-id'}; // The wallet created earlier
    const authorizationSignature = 'formatted-authorization-signature'; // From previous step
    const message = 'Hello, Privy!';

    // Send the message signing request to Privy API
    const response = await fetch(`https://api.privy.io/v1/wallets/${serverWallet.id}/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'privy-app-id': process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
        'privy-authorization-signature': authorizationSignature,
        Authorization: `Bearer ${accessToken}` // Your app's access token
      },
      body: JSON.stringify({
        method: 'personal_sign',
        chain_type: 'ethereum',
        params: {
          message: message,
          encoding: 'utf-8'
        }
      })
    });

    const result = await response.json();
    console.log('Signature:', result.data.signature);
    console.log('Encoding:', result.data.encoding);
    ```
  </Tab>

  <Tab title="Node SDK">
    Send the message signing request using the Privy Node SDK:

    <CodeGroup>
      ```typescript @privy-io/node theme={"system"}
      import {PrivyClient} from '@privy-io/node';

      const privy = new PrivyClient({appId: 'your-app-id', appSecret: 'your-app-secret'});

      const serverWallet = {id: 'your-wallet-id'}; // The wallet created earlier
      const authorizationSignature = 'formatted-authorization-signature'; // From previous step
      const message = 'Hello, Privy!';

      // Sign the message using the Privy SDK
      const result = await privy
        .wallets()
        .ethereum()
        .signMessage({
          wallet_id: serverWallet.id,
          authorization: authorizationSignature,
          rpc: {
            method: 'personal_sign',
            chain_type: 'ethereum',
            params: {
              message: message,
              encoding: 'utf-8'
            }
          }
        });

      console.log('Signature:', result.signature);
      console.log('Encoding:', result.encoding);
      ```
    </CodeGroup>

    <Note>
      The Node SDK automatically includes the `chain_type` parameter when making RPC calls. Make sure to
      account for this parameter when generating the authorization signature by including it in the
      canonical payload used for the WebAuthn challenge.
    </Note>
  </Tab>
</Tabs>
\n