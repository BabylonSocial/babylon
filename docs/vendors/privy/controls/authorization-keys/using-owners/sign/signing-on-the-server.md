> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Signing on the server

Privy's server-side SDKs offer an abstraction called the [authorization context](/controls/authorization-keys/using-owners/sign/signing-on-the-server) to enable automatic request signing.

When an SDK method may require request signing (e.g. sending a transaction), your application can pass the authorization context to the SDK method with relevant inputs needed to sign the request.

Concretely, this includes:

* **Authorization private keys.** For authorization key-based signatures, the SDK will directly use these keys to compute P256 signatures over the request
* **User JWTs.** For user-based signatures, the SDK will request user signing keys given the provided JWTs and compute P256 signatures over the request.
* **Custom signing function.** If your application logic requires signing to occur in a separate service (e.g. KMS), you can pass a custom signing function that the SDK will invoke to sign requests.
* **Signatures.** If you compute signatures in your application separately from calling Privy's SDK, you can pass these signatures directly into the authorization context.

The SDK will compute all signatures given the parameters passed in the authorization context, and include all signatures in the underlying request to Privy's API.

## Using the authorization context

At a high-level, there are two steps to using the authorization context.

<Steps>
  <Step title="Build the authorization context">
    [Build the authorization
    context](/controls/authorization-keys/using-owners/sign/signing-on-the-server#1-build-the-authorization-context)
    with the private key(s), user(s), custom sign function that you'd like to sign your request.
    Include any signatures that you have already computed in the context as well.
  </Step>

  <Step title="Pass the authorization context to SDK methods">
    Once you've built the authorization context, [pass the populated context to SDK
    methods](/controls/authorization-keys/using-owners/sign/signing-on-the-server#2-pass-the-authorization-context-to-sdk-methods)
    that may require signatures, such as updating wallets or policies or sending transactions.
  </Step>
</Steps>

### 1. Build the authorization context

To build the authorization context with your signing inputs, follow the instructions below depending on your setup.

<AccordionGroup>
  <Accordion title="Signing with authorization keys">
    To sign a request with an authorization key, get the private key(s) that you saved locally when creating your signer in the Privy API or Dashboard.

    See the guide on [authorization keys](/controls/authorization-keys/keys/create/key) for more details.

    Then, add the private key(s) to the authorization context to automatically have them sign requests to the Privy API.

    <CodeGroup>
      ```java Java highlight={2} theme={"system"}
      AuthorizationContext authorizationContext = AuthorizationContext.builder()
          .addAuthorizationPrivateKey("authorization-key")
          .build();
      ```

      ```ts @privy-io/node highlight={2} theme={"system"}
      import {AuthorizationContext} from '@privy-io/node';

      const authorizationContext: AuthorizationContext = {
      authorization_private_keys: ['authorization-key']
      };
      ```

      ```rust Rust highlight={4} theme={"system"}
      use privy_rs::{AuthorizationContext, PrivateKey};

      let ctx = AuthorizationContext::new().push(
          PrivateKey("authorization-key".to_string())
      );
      ```

      ```go Go theme={"system"}
      import "github.com/privy-io/go-sdk/authorization"

      authCtx := &authorization.AuthorizationContext{
          PrivateKeys: []string{"authorization-key"},
      }
      ```
    </CodeGroup>
  </Accordion>

  <Accordion title="Signing with users">
    To sign requests with a user, add the user's valid JWT to the authorization context. The SDK will automatically request a signing key for the user given the JWT and sign the request with it.

    See the guide on [user owners and signers](/controls/authorization-keys/keys/create/user/request)
    for more details.

    <CodeGroup>
      ```java Java highlight={2} theme={"system"}
      AuthorizationContext authorizationContext = AuthorizationContext.builder()
          .addUserJwt("user-jwt")
          .build();
      ```

      ```ts @privy-io/node highlight={2} theme={"system"}
      import {AuthorizationContext} from '@privy-io/node';

      const authorizationContext: AuthorizationContext = {
      user_jwts: ['user-jwt']
      };
      ```

      ```rust Rust highlight={4} theme={"system"}
      use privy_rs::{AuthorizationContext, JwtUser, PrivyClient};

      let client = PrivyClient::new(app_id, app_secret)?;
      let jwt_user = JwtUser(client.clone(), "user-jwt".to_string());

      let ctx = AuthorizationContext::new().push(jwt_user);
      ```

      ```go Go theme={"system"}
      import "github.com/privy-io/go-sdk/authorization"

      authCtx := &authorization.AuthorizationContext{
          UserJwts: []string{"user-jwt-token"},
      }
      ```
    </CodeGroup>
  </Accordion>

  <Accordion title="Signing with a custom sign function">
    In case you are not able to pass an authorization private key or user JWT to the authorization context directly, you can instead pass a custom signing function that the SDK will invoke to automatically sign requests. As an example, you might implement a custom signing function that calls out to a KMS where your authorization keys are secured and returns the necessary signature.

    The sign functions should perform an ECDSA P-256 signature on the payload received, and return the
    base64-encoded signature.

    <CodeGroup>
      ```java Java theme={"system"}
      // This feature is not yet supported in the Java SDK.
      ```

      ```ts @privy-io/node highlight={1,9} {skip-check} theme={"system"}
      async function mySignFunction(payload: Uint8Array): Promise<string> {
        // Perform an ECDSA P-256 signature on the payload
        // This is an example using a fictitious KMS API call.
        const signature = await kms.sign(payload);
        return signature; // This should be a base64-encoded string
      }

      const authorizationContext: AuthorizationContext = {
        sign_functions: [mySignFunction]
      };
      ```

      ```rust Rust theme={"system"}
      //! This newtype is just a convenience blanket implementation.
      //! You can of course just implement the trait for your own types.
      //!
      //! See the API reference for details:
      //! https://docs.rs/privy_rs/latest/privy_rs/trait.IntoSignature.html
      //! https://docs.rs/privy_rs/latest/privy_rs/trait.IntoKey.html

      use privy_rs::{AuthorizationContext, FnSigner};

      // Create a custom signer using a closure with FnSigner wrapper
      let custom_signer = FnSigner(|message: &[u8]| async move {
          // Perform an ECDSA P-256 signature on the payload
          // This is an example using a fictitious KMS API call.
          let signature_bytes = kms_sign(message).await?;
          let signature_b64 = general_purpose::STANDARD.encode(&signature_bytes);
          Ok(Signature {
              signature: signature_b64,
              key_id: "custom-key".to_string()
          })
      });

      let ctx = AuthorizationContext::new().push(custom_signer);
      ```

      ```go Go theme={"system"}
      import "github.com/privy-io/go-sdk/authorization"

      // Implement the AuthorizationSigner interface
      type MySigner struct{}

      func (s *MySigner) Sign(ctx context.Context, payload []byte) (string, error) {
          // Custom signing logic
          return "signature", nil
      }

      authCtx := &authorization.AuthorizationContext{
          Signers: []authorization.AuthorizationSigner{&MySigner{}},
      }
      ```
    </CodeGroup>

    <Info>
      The binary payload received by the sign function is already formatted and ready to be signed.
      There is no need to canonicalize or serialize the payload before signing when using this method.
    </Info>
  </Accordion>

  <Accordion title="Signing with key quorums">
    You may combine the different signing mechanisms in the authorization context to produce a fully
    customizable key quorum.

    For instance:

    * You may want to keep a wallet under control of both a user and an authorization key,
      requiring both signatures to authorize an action. This would be a 2-of-2 key quorum, and can be
      built by combining both the "user jwt" and "authorization private key" properties, as shown below.
    * You may want to keep a wallet under control of several authorization keys. You can build the required authorization context by passing all authorization private keys into the "authorization private key" property.

    <CodeGroup>
      ```java Java theme={"system"}
      // Example: A 2-of-2 key quorum, of a user and an authorization private key
      AuthorizationContext authorizationContext = AuthorizationContext.builder()
          .addUserJwt("user-jwt")
          .addAuthorizationPrivateKey("authorization-key")
          .build();
      ```

      ```ts @privy-io/node theme={"system"}
      import {AuthorizationContext} from '@privy-io/node';

      // Example: A 2-of-2 key quorum, of a user and an authorization private key
      const authorizationContext: AuthorizationContext = {
        user_jwts: ['user-jwt'],
        authorization_private_keys: ['authorization-key']
      };
      ```

      ```rust Rust theme={"system"}
      // Example: A 2-of-2 key quorum, of a user and an authorization private key
      use privy_rs::{AuthorizationContext, JwtUser, PrivateKey, PrivyClient};

      let client = PrivyClient::new(app_id, app_secret)?;

      // Add user JWT for user-based authorization
      let jwt_user = JwtUser(client.clone(), "user-jwt".to_string());

      // Add private key for authorization key-based signing
      let auth_key = PrivateKey("authorization-key".to_string());

      let ctx = AuthorizationContext::new()
          .push(jwt_user)
          .push(auth_key);
      ```

      ```go Go theme={"system"}
      import "github.com/privy-io/go-sdk/authorization"

      authCtx := &authorization.AuthorizationContext{
          PrivateKeys: []string{"authorization-key"},
          UserJwts:    []string{"user-jwt-token"},
      }
      ```
    </CodeGroup>
  </Accordion>

  <Accordion title="Adding signatures directly">
    If your application computes the signature directly separately from the SDK, you can pass signatures directly into the authorization context.

    <CodeGroup>
      ```java Java highlight={2} theme={"system"}
      AuthorizationContext authorizationContext = AuthorizationContext.builder()
          .addSignature("signature-you-produced")
          .build();
      ```

      ```ts @privy-io/node highlight={3,5} theme={"system"}
      import {AuthorizationContext} from '@privy-io/node';

      const authorizationContext: AuthorizationContext = {
        signatures: ['signature-you-produced']
      };
      ```

      ```rust Rust highlight={3,13,18} theme={"system"}
      //! `p256::ecdsa::Signature` implements `IntoSignature`, so
      //! you can push it directly to the authorization context.

      use privy_rs::AuthorizationContext;
      use p256::{ecdsa::Signature, generic_array::GenericArray};
      use base64::{Engine as _, engine::general_purpose};

      let ctx = AuthorizationContext::new();

      // Option 1: Add a pre-computed signature from bytes
      let signature_bytes = general_purpose::STANDARD.decode("your-base64-signature")?;
      let signature = Signature::from_bytes(GenericArray::from_slice(&signature_bytes))?;
      let ctx = ctx.push(signature);

      // Option 2: Add a signature from DER format
      let der_bytes = &[/* your DER encoded signature bytes */];
      let signature = Signature::from_der(der_bytes)?;
      let ctx = ctx.push(signature);
      ```

      ```go Go theme={"system"}
      import "github.com/privy-io/go-sdk/authorization"

      authCtx := &authorization.AuthorizationContext{
          Signatures: []string{"pre-computed-signature"},
      }
      // Pass to SDK methods via: privy.WithAuthorizationContext(authCtx)
      ```
    </CodeGroup>
  </Accordion>
</AccordionGroup>

### 2. Pass the authorization context to SDK methods

Once you have built your authorization context, pass the context as a parameter to the SDK method that requires request signing. As an example, to send a request to sign a message that needs to be signed by an authorization context:

<CodeGroup>
  ```java Java theme={"system"}
  String message = "Hello, Ethereum.";

  // Example: If wallet's owner is an authorization private key
  AuthorizationContext authorizationContext = AuthorizationContext.builder()
      .addAuthorizationPrivateKey("authorization-key")
      .build();

  EthereumPersonalSignRpcResponseData response = privyClient
      .wallets()
      .ethereum()
      .signMessage(
          walletId,
          message.getBytes(StandardCharsets.UTF_8),
          authorizationContext
      );

  String signature = response.signature();
  ```

  ```ts @privy-io/node theme={"system"}
  import {PrivyClient, type AuthorizationContext} from '@privy-io/node';

  const privy = new PrivyClient({
    appId: 'insert-your-app-id',
    appSecret: 'insert-your-app-secret'
  });

  // Build your authorization context per step (1) above
  const authorizationContext: AuthorizationContext = {
    authorization_private_keys: ['authorization-key']
  };

  // Pass the authorization context to the SDK method as the `authorization_context` parameter
  const response = await privy.wallets().ethereum().signMessage('insert-wallet-id', {
    message: 'Hello, world!',
    authorization_context: authorizationContext
  });
  ```

  ```rust Rust theme={"system"}
  let ethereum_service = client.wallets().ethereum();
  let auth_ctx = AuthorizationContext::new();

  let signature = ethereum_service
      .sign_message(
          &wallet_id,
          "Hello, Ethereum!",
          &auth_ctx,
          Some("unique-request-id-123"),
      )
      .await?;

  println!("Message signed successfully");
  ```

  ```go Go theme={"system"}
  import (
      privy "github.com/privy-io/go-sdk"
      "github.com/privy-io/go-sdk/authorization"
  )

  authCtx := &authorization.AuthorizationContext{
      PrivateKeys: []string{"authorization-key"},
  }

  response, err := client.Wallets.Ethereum.SignMessage(
      context.Background(),
      walletID,
      "Hello, Privy!",
      privy.WithAuthorizationContext(authCtx),
  )
  ```
</CodeGroup>

The SDK will sign the request given the authorization context and automatically include the signature in the underlying request to the Privy API.
\n