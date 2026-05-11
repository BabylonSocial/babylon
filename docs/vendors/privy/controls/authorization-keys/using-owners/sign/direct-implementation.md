> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Implementing signing directly

If you are unable to use Privy's SDKs for signing, you can implement request signing directly in your service.

<Warning>
  Implementing request signing directly is an advanced integration. Wherever possible, we suggest
  [using Privy's SDKs to handle request
  signing.](/controls/authorization-keys/using-owners/sign/signing-on-the-server)
</Warning>

## Steps

At a high-level, directly implementing request signing requires the following steps:

<Steps>
  <Step title="Build signature payload">
    Generate a JSON payload containing the following fields. All fields are required unless otherwise specified.

    | Field                              | Type                                                                                                                                                                                                                                                  | Description                                                                                                                                                                                                       |   |   |   |
    | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | - | - | - |
    | `version`                          | `1`                                                                                                                                                                                                                                                   | Authorization signature version. Currently, `1` is the only version.                                                                                                                                              |   |   |   |
    | `method`                           | `'POST'  \| 'PUT'                                                                                                                                                                                                             \| 'PATCH' \| 'DELETE'` | HTTP method for the request. Signatures are not required on `'GET'` requests.                                                                                                                                     |   |   |   |
    | `url`                              | `string`                                                                                                                                                                                                                                              | The full URL for the request. Should not include a trailing slash.                                                                                                                                                |   |   |   |
    | `body`                             | `JSON`                                                                                                                                                                                                                                                | JSON body for the request.                                                                                                                                                                                        |   |   |   |
    | `headers`                          | `JSON`                                                                                                                                                                                                                                                | JSON object containing any Privy-specific headers, e.g. those that are prefixed with `'privy-'`. This should **not** include any other headers, such as authentication headers, `content-type`, or trace headers. |   |   |   |
    | `headers['privy-app-id']`          | `string`                                                                                                                                                                                                                                              | Privy app ID header (required).                                                                                                                                                                                   |   |   |   |
    | `headers['privy-idempotency-key']` | `string`                                                                                                                                                                                                                                              | Privy idempotency key header (optional). If the request does not contain an idempotency key, leave this field out of the payload.                                                                                 |   |   |   |
  </Step>

  <Step title="Canonicalize signature payload">
    Next, canonicalize the payload per [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785) and serialize it to a string. [This GitHub repository](https://github.com/cyberphone/json-canonicalization) links to various libraries for JSON canonicalization in different languages.
  </Step>

  <Step title="Sign signature payload">
    Sign the serialized JSON with ECDSA P-256 using the private key of your user key or authorization key and serialize it to a base64-encoded string.
  </Step>

  <Step title="Include the signature in request headers">
    Lastly, include the base64-encoded signature over the payload in the `privy-authorization-signature` header of your request to the Privy API.
  </Step>
</Steps>

## Code examples

View code examples for signing requests in various languages below.

<Tip>
  If the desired resource requires a user owner or user signer, make sure to [request the user
  key](/controls/authorization-keys/keys/create/user/request) before signing requests with it.
</Tip>

<View title="Vanilla TypeScript" icon="terminal">
  ```typescript  theme={"system"}
  import canonicalize from 'canonicalize'; // Support JSON canonicalization
  import crypto from 'crypto'; // Support P-256 signing

  // Replace this with your private key from the Dashboard
  const PRIVY_AUTHORIZATION_KEY = 'wallet-auth:insert-your-private-key-here';
  // ...

  function getAuthorizationSignature({url, body}: {url: string; body: object}) {
    const payload = {
      version: 1,
      method: 'POST',
      url,
      body,
      headers: {
      'privy-app-id': 'insert-your-app-id'
      // If your request includes an idempotency key, include that header here as well
      }
    };

    // JSON-canonicalize the payload and convert it to a buffer
    const serializedPayload = canonicalize(payload) as string;
    const serializedPayloadBuffer = Buffer.from(serializedPayload);

    // Replace this with your user or authorization key. We remove the 'wallet-auth:' prefix
    // from authorization keys before using it to sign requests
    const privateKeyAsString = PRIVY_AUTHORIZATION_KEY.replace('wallet-auth:', '');

    // Convert your private key to PEM format, and instantiate a node crypto KeyObject for it
    const privateKeyAsPem = `-----BEGIN PRIVATE KEY-----\n${privateKeyAsString}\n-----END PRIVATE KEY-----`;
    const privateKey = crypto.createPrivateKey({
      key: privateKeyAsPem,
      format: 'pem'
    });

    // Sign the payload buffer with your private key and serialize the signature to a base64 string
    const signatureBuffer = crypto.sign('sha256', serializedPayloadBuffer, privateKey);
    const signature = signatureBuffer.toString('base64');
    return signature;
  }

  const authorizationSignature = getAuthorizationSignature({
    // Replace with your desired path
    url: 'https://api.privy.io/v1/wallets/<wallet_id>/rpc',
    // Replace with your desired body
    body: {
      method: 'personal_sign',
      params: {
      message: 'Hello world',
        // ...
      },
    }
  });
  ```
</View>

<View title="Python" icon="python">
  ```python  theme={"system"}
  import json
  import base64
  from cryptography.hazmat.primitives import hashes, serialization
  from cryptography.hazmat.primitives.asymmetric import ec, utils

  # Replace this with your private key from the Dashboard

  PRIVY_AUTHORIZATION_KEY = "wallet-auth:your-authorization-private-key"

  def canonicalize(obj):
    """
    Simple JSON canonicalization function.
    Sorts dictionary keys and ensures consistent formatting.
    """
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))

  def get_authorization_signature(url, body):
    """
    Generate authorization signature for Privy API requests using ECDSA and hashlib.
    """
    # Construct the payload
    payload = {
      "version": 1,
      "method": "POST",
      "url": url,
      "body": body,
      "headers": {"privy-app-id": "insert-your-app-id"},
    }

    # Serialize the payload to JSON
    serialized_payload = canonicalize(payload)

    # Create ECDSA P-256 signing key from private key
    private_key_string = PRIVY_AUTHORIZATION_KEY.replace("wallet-auth:", "")
    private_key_pem = (
      f"-----BEGIN PRIVATE KEY-----\n{private_key_string}\n-----END PRIVATE KEY-----"
    )

    # Load the private key from PEM format
    private_key = serialization.load_pem_private_key(
      private_key_pem.encode("utf-8"), password=None
    )

    # Sign the message using ECDSA with SHA-256
    signature = private_key.sign(
      serialized_payload.encode("utf-8"), ec.ECDSA(hashes.SHA256())
    )

    # Convert the signature to base64 for easy transmission
    return base64.b64encode(signature).decode("utf-8")

  authorization_signature = get_authorization_signature(
    url="https://api.privy.io/v1/wallets",
    body={
      "chain_type": "ethereum",
    },
  )
  ```
</View>

<View title="Rust" icon="rust">
  <CodeGroup>
    ```rust signature.rs theme={"system"}
    use anyhow::{anyhow, Result};
    use p256::ecdsa::{signature::Signer, Signature, SigningKey};
    use base64::{engine::general_purpose::STANDARD, Engine as _};
    use serde_json::json;

    /// Signs the canonicalized JSON payload using ECDSA (P-256 + SHA-256).
    ///
    /// - `private_key_string` - A string containing your user or authorization key.
    /// For authorization keys, remove the "wallet-api:" prefix.
    /// - `payload` - JSON payload to sign, serialized to a string
    ///
    fn sign_payload(private_key_string: &str, payload: &str) -> Result<String> {
      let bytes = extract_32_byte_key_from_pkcs8_base64(private_key_string)?;
      let signing_key = SigningKey::from_slice(bytes.as_slice())?;

      // Sign the payload (SHA-256 is implied by ECDSA in P256's default)
      let signature: Signature = signing_key.sign(payload.as_bytes());

      // base64 encode the signature
      let signature_b64 = STANDARD.encode(signature.to_der());

      Ok(signature_b64)
    }

    /// Extracts the raw 32-byte private key from a base64-encoded PKCS#8 blob.
    /// Returns an error if `0x04 0x20` cannot be found or if the data is too short.
    fn extract_32_byte_key_from_pkcs8_base64(pkcs8_b64: &str) -> Result<[u8; 32]> {
      // 1. Decode base64
      let pkcs8_bytes = STANDARD.decode(pkcs8_b64)?;

      // 2. Search for the 2-byte pattern [0x04, 0x20]
      let pattern = [0x04, 0x20];
      let private_key_start = pkcs8_bytes
        .windows(pattern.len())
        .position(|window| window == pattern)
        .ok_or(anyhow!(
          "Invalid wallet authorization private key: marker not found"
        ))?;

      // 3. Extract the 32 bytes following 0x04, 0x20
      let start = private_key_start + 2;
      let end = start + 32;
      if end > pkcs8_bytes.len() {
        return Err(anyhow!(
          "Invalid wallet authorization private key: data too short"
        ));
      }

      let mut private_key_bytes = [0u8; 32];
      private_key_bytes.copy_from_slice(&pkcs8_bytes[start..end]);
      Ok(private_key_bytes)
    }

    /// Main function to generate the authorization signature.
    fn main() -> Result<()> {
      let privy_authorization_key = "wallet-auth:your-authorization-private-key";

      let private_key_string = privy_authorization_key.replace("wallet-auth:", "");

      let url = "https://api.privy.io/v1/wallets";
      let body = json!({
        "chain_type": "ethereum"
      });

      // --- Build the payload to sign ---
      let mut payload = json!({
        "version": 1,
        "method": "POST",
        "url": url,
        "body": body,
        "headers": {
          "privy-app-id": "insert-your-app-id"
        }
      });

      // --- Canonicalize (sort keys, minimal separators) and serialize ---
      payload.sort_all_objects();
      let serialized_payload = serde_json::to_string(&payload)?;
      println!("{}", serialized_payload);

      // --- Sign the serialized payload using P-256 ECDSA ---
      let authorization_signature = sign_payload(&private_key_string, &serialized_payload)?;
      println!("{}", authorization_signature);

      Ok(())
    }
    ```

    ```rust Cargo.toml theme={"system"}
    [dependencies]
    serde_json = {version = "1.0", features = ["preserve_order"]}
    p256 = "0.13"
    base64 = "0.22"
    anyhow = "1.0"
    ```
  </CodeGroup>
</View>

<View title="Go" icon="terminal">
  ```go  theme={"system"}
  import (
    "crypto/ecdsa"
    "crypto/elliptic"
    "crypto/rand"
    "crypto/x509"
    "encoding/base64"
    "encoding/json"
    "fmt"
    "hash/fnv"
    "strings"
    "crypto/sha256"
  )

  // SignPayload signs the canonicalized JSON payload using ECDSA (P-256 + SHA-256).
  //
  // privyAuthorizationKey - A string containing your user key or authorization key.
  // payload - JSON payload to sign, serialized to a string
  //
  // Returns the base64-encoded DER signature or an error.
  func SignPayload(privyAuthorizationKey string, payload string) (string, error) {
    privateKey, err := parsePrivateKeyFromAuthorizationKey(privyAuthorizationKey)
    if err != nil {
      return "", fmt.Errorf("failed to parse private key: %w", err)
    }

    // Hash the payload using SHA-256
    hash := sha256.Sum256([]byte(payload))

    // Sign the hash
    signature, err := ecdsa.SignASN1(rand.Reader, privateKey, hash[:])
    if err != nil {
      return "", fmt.Errorf("failed to sign payload: %w", err)
    }

    // Base64 encode the signature
    signatureB64 := base64.StdEncoding.EncodeToString(signature)
    return signatureB64, nil
  }

  // We parse the ecdsa key from the user or authorization key here
  func parsePrivateKeyFromAuthorizationKey(privyAuthorizationKey string) (*ecdsa.PrivateKey, error) {
    pkcs8B64 := strings.TrimPrefix(privyAuthorizationKey, "wallet-auth:")
    pkcs8Bytes, err := base64.StdEncoding.DecodeString(pkcs8B64)
    if err != nil {
      return nil, err
    }

    // This handles PKCS#8 parsing automatically
    key, err := x509.ParsePKCS8PrivateKey(pkcs8Bytes)
    if err != nil {
      return nil, err
    }

    // Type assert to ECDSA private key
    ecdsaKey, ok := key.(*ecdsa.PrivateKey)
    if !ok {
      return nil, fmt.Errorf("key provided is not an ECDSA private key")
    }

    return ecdsaKey, nil
  }

  // Utility function to verify the signature (for testing purposes)
  func VerifySignature(publicKey *ecdsa.PublicKey, payload, signatureB64 string) (bool, error) {
    // Decode the base64 signature
    signature, err := base64.StdEncoding.DecodeString(signatureB64)
    if err != nil {
      return false, fmt.Errorf("failed to decode signature: %w", err)
    }
    // Hash the payload
    hash := sha256.Sum256([]byte(payload))

    // Verify the signature
    valid := ecdsa.VerifyASN1(publicKey, hash[:], signature)
    return valid, nil
  }
  ```
</View>
\n