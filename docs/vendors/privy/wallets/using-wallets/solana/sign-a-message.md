> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

<Info>
  When using Privy's server-side SDKs to sign messages, you can use the authorization context to
  automatically sign requests. Learn more about [signing on the
  server](/controls/authorization-keys/using-owners/sign/signing-on-the-server).
</Info>

<View title="React" icon="react">
  Use the `signMessage` method exported from the `useSignMessage` hook to sign a message with a Solana wallet.

  ```tsx  theme={"system"}
  signMessage: ({
    message,
    options
  }: {
    message: Uint8Array;
    wallet: ConnectedStandardSolanaWallet;
    options?: {
      uiOptions?: SignMessageModalUIOptions;
    };
  }) =>
    Promise<{
      signature: Uint8Array;
    }>;
  ```

  ### Usage

  ```tsx  theme={"system"}
  import {useWallets, useSignMessage} from '@privy-io/react-auth/solana';
  import bs58 from 'bs58';

  const {wallets} = useWallets();
  const {signMessage} = useSignMessage();

  const selectedWallet = wallets[0];

  const message = 'Hello world';
  const signatureUint8Array = (
    await signMessage({
      message: new TextEncoder().encode(message),
      wallet: selectedWallet,
      options: {
        uiOptions: {
          title: 'Sign this message'
        }
      }
    })
  ).signature;
  const signature = bs58.encode(signatureUint8Array);
  ```

  ### Parameters

  <ParamField path="message" type="Uint8Array" required>
    Message to be signed as a Uint8Array.
  </ParamField>

  <ParamField path="wallet" type="string">
    The Solana wallet to use for signing the message.
  </ParamField>

  <ParamField path="options" type="{uiOptions?: SignMessageModalUIOptions}">
    Additional options for signing the message.

    <Expandable title="uiOptions">
      <ParamField path="uiOptions" type="SignMessageModalUIOptions">
        UI options to customize the transaction request modal.

        <Tip>
          To hide confirmation modals, set `options.uiOptions.showWalletUIs` to `false`. Learn more
          about configuring modal prompts [here](/recipes/react/manage-wallet-UIs).
        </Tip>
      </ParamField>
    </Expandable>
  </ParamField>

  ### Response

  <ResponseField name="signature" type="Uint8Array">
    The signature produced by the wallet.
  </ResponseField>

  <ResponseField name="signedMessage" type="Uint8Array">
    The original message that was signed.
  </ResponseField>
</View>

<View title="React Native" icon="react">
  Request a message signature on the wallets Ethereum provider.

  ```tsx  theme={"system"}
  import {useEmbeddedSolanaWallet} from '@privy-io/expo';

  const wallet = useEmbeddedSolanaWallet();
  const provider = await wallet.getProvider();

  const message = 'Hello world';
  const {signature} = await provider.request({
    method: 'signMessage',
    params: {message}
  });
  ```

  ### Parameters

  <ParamField path="method" type="'signMessage'" required>
    The method for the wallet request. For signing messages, this is `'signMessage'`.
  </ParamField>

  <ParamField path="params" type="Object" required>
    <Expandable title="properties" defaultOpen="true">
      <ParamField path="message" type="string" required>
        The string to sign with the wallet. If the message is a string, you should pass the string as
        the message directly. If the message is an array of bytes (Uint8Array), you should
        base64-encode the array as a string before passing it to message.
      </ParamField>

      <ParamField path="address" type="string">
        The address of the wallet to sign the message with.
      </ParamField>
    </Expandable>
  </ParamField>

  ### Returns

  <ResponseField name="signature" type="string">
    The signature produced by the wallet.
  </ResponseField>
</View>

<View title="Swift" icon="swift">
  Request a message signature on the wallet's Solana provider.

  ```swift  theme={"system"}
  guard let user = privy.user else {
      // If user is null, user is not authenticated
      return
  }

  // Retrieve list of user's embedded Solana wallets
  let solanaWallets = user.embeddedSolanaWallets

  // Grab the desired wallet. Here, we retrieve the first wallet
  guard let wallet = solanaWallets.first else {
      // No SOL wallets
      return
  }

  // Sign a Base64 encoded message
  let signature = try await wallet.provider.signMessage(message: "SGVsbG8hIEkgYW0gdGhlIGJhc2U2NCBlbmNvZGVkIG1lc3NhZ2UgdG8gYmUgc2lnbmVkLg==")

  print("Result signature: \(signature)")
  ```

  ### Parameters

  <ParamField path="message" type="string" required>
    The message to sign, as a base64-encoded string.
  </ParamField>

  ### Returns

  <ResponseField name="signature" type="string">
    The signature produced by the wallet.
  </ResponseField>
</View>

<View title="Android" icon="android">
  Use the `signMessage` method on the Solana wallet provider to sign a message with the wallet.

  ```kotlin  theme={"system"}
  // Get current auth state
  val user = privy.user

  // check if user is authenticated
  if (user != null) {
      // Retrieve list of user's Solana wallet
      val solanaWallet = user.embeddedSolanaWallets.first()

      if (solanaWallet != null) {
          // Sign a message
          val result = solanaWallet.provider.signMessage("SGVsbG8hIEkgYW0gdGhlIGJhc2U2NCBlbmNvZGVkIG1lc3NhZ2UgdG8gYmUgc2lnbmVkLg==")
      }
  }
  ```

  ### Parameters

  <ParamField path="message" type="string" required>
    The message to sign, as a base64-encoded string.
  </ParamField>

  ### Returns

  <ResponseField name="signature" type="string">
    The signature produced by the wallet.
  </ResponseField>
</View>

<View title="Unity" icon="unity">
  ### Usage

  ```csharp  theme={"system"}
  try {
      IEmbeddedSolanaWallet embeddedWallet = PrivyManager.Instance.User.EmbeddedSolanaWallets[0];
      IEmbeddedSolanaWalletProvider provider = embeddedWallet.EmbeddedSolanaWalletProvider;
      string signature = await provider.SignMessage("A message to sign");
      Debug.Log(signature);
  } catch (PrivyException.EmbeddedWalletException ex){
      Debug.LogError($"Could not sign message due to error: {ex.Error} {ex.Message}");
  } catch (Exception ex) {
      Debug.LogError($"Could not sign message exception {ex.Message}");
  }
  ```

  ### Parameters

  <ParamField path="message" type="string" required>
    The base64 encoded bytes of the message or transaction to sign.
  </ParamField>

  ### Returns

  <ResponseField name="signature" type="string">
    The base64 encoded signature of the message, produced by the wallet.
  </ResponseField>
</View>

<View title="Flutter" icon="flutter">
  Use the `signMessage` method on the Solana wallet provider to sign a message with the wallet.

  ```dart  theme={"system"}
  // Get the current user
  final user = privy.user;

  // Check if the user is authenticated
  if (user != null) {
    // Retrieve the user's Solana wallet
    final solanaWallet = user.embeddedSolanaWallets.first;

    if (solanaWallet != null) {
      // Sign a message
      final result = solanaWallet.provider.signMessage("SGVsbG8hIEkgYW0gdGhlIGJhc2U2NCBlbmNvZGVkIG1lc3NhZ2UgdG8gYmUgc2lnbmVkLg==")
    }
  }
  ```

  ### Parameters

  <ParamField path="message" type="string" required>
    The message to sign, as a base64-encoded string.
  </ParamField>

  ### Returns

  <ResponseField name="signature" type="string">
    The signature produced by the wallet.
  </ResponseField>
</View>

<View title="NodeJS" icon="node-js">
  Use the `signMessage` method on the solana interface to sign a message with an Solana wallet.

  ### Usage

  ```tsx  theme={"system"}
  const {signature, encoding} = await privy.wallets().solana().signMessage('insert-wallet-id', {
    message: 'Hello world'
  });
  ```

  ### Parameters and Returns

  Check out the [API reference](/api-reference/wallets/solana/sign-message) for more details.
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  <Warning>
    The `@privy-io/server-auth` library is deprecated. We recommend integrating `@privy-io/node` for
    the latest features and support.
  </Warning>

  Use the `signMessage` method on the ethereum client to sign a message with an Solana wallet.

  ```tsx  theme={"system"}
  signMessage: (message: string, options: {uiOptions: SignMessageModalUIOptions; address?: string}) =>
    Promise<{signature: string}>;
  ```

  ### Usage

  ```tsx  theme={"system"}
  const {signature, encoding} = await privy.walletApi.solana.signMessage({
    walletId: 'insert-wallet-id',
    message: 'Hello world'
  });
  ```

  ### Parameters

  <ParamField path="walletId" type="string" required>
    Unique ID of the wallet to take actions with.
  </ParamField>

  <ParamField path="message" type="string | Uint8Array" required>
    The string or bytes to sign with the wallet.
  </ParamField>

  <ParamField path="idempotencyKey" type="string">
    [Idempotency key](/api-reference/idempotency-keys) to identify a unique request.
  </ParamField>

  ### Returns

  <ResponseField name="signature" type="string">
    An encoded string serializing the signature produced by the user's wallet.
  </ResponseField>

  <ResponseField name="encoding" type="'hex'">
    The encoding format for the returned `signature`. Currently, only `'base64'` is supported for
    Solana.
  </ResponseField>
</View>

<View title="Java" icon="java">
  To sign a message from your wallet, use the `signMessage` method.
  It will sign your message, and return the signature to you.

  ### Usage

  ```java  theme={"system"}
  try {
      // Base64 encoded message
      String message = "SGVsbG8hIEkgYW0gdGhlIGJhc2U2NCBlbmNvZGVkIG1lc3NhZ2UgdG8gYmUgc2lnbmVkLg";

      // Example: If wallet's owner is an authorization private key
      AuthorizationContext authorizationContext = AuthorizationContext.builder()
          .addAuthorizationPrivateKey("authorization-key")
          .build();

      SolanaSignMessageRpcResponseData response = privyClient
          .wallets()
          .solana()
          .signMessage(
              walletId,
              message,
              authorizationContext
          );

      String signature = response.signature();
  } catch (APIException e) {
      String errorBody = e.bodyAsString();
      System.err.println(errorBody);
  } catch (Exception e) {
      System.err.println(e.getMessage());
  }
  ```

  ### Parameters

  When signing a message with your solana wallet, you can sign over a base64 string encoding.

  <ParamField type="String" body="message">
    The base64 encoded message to sign over.
  </ParamField>

  ### Returns

  The `SolanaSignMessageRpcResponseData` object contains a `signature()` field

  <ResponseField name="signature()" type="String">
    The signature produced by the wallet.
  </ResponseField>
</View>

<View title="Rust" icon="rust">
  Use the `sign_message` method on the Solana service to sign a message with a Solana wallet.

  ### Usage

  ```rust  theme={"system"}
  use privy_rs::{AuthorizationContext, PrivyClient};

  let client = PrivyClient::new("app_id".to_string(), "app_secret".to_string())?;
  let solana_service = client.wallets().solana();
  let auth_ctx = AuthorizationContext::new();

  // Base64 encode your message first
  let message = base64::encode("Hello, Solana!");
  let signature = solana_service
      .sign_message(
          &wallet_id,
          &message,
          &auth_ctx,
          Some("unique-request-id-456"),
      )
      .await?;

  println!("Message signed successfully");
  ```

  ### Parameters and Returns

  See the Rust SDK documentation for detailed parameter and return types, including embedded examples:

  * [SolanaService::sign\_message](https://docs.rs/privy-rs/latest/privy_rs/solana/struct.SolanaService.html#method.sign_message)

  For REST API details, see the [API reference](/api-reference/wallets/solana/sign-message).
</View>

<View title="Go" icon="golang">
  Use the `SignMessage` method on the Solana service to sign a message with a Solana wallet. The message must be a base64-encoded string.

  ### Usage

  ```go  theme={"system"}
  response, err := client.Wallets.Solana.SignMessage(
      context.Background(),
      "wallet-id",
      "SGVsbG8hIEkgYW0gdGhlIGJhc2U2NCBlbmNvZGVkIG1lc3NhZ2UgdG8gYmUgc2lnbmVkLg",
  )
  if err != nil {
      log.Fatalf("failed to sign message: %v", err)
  }

  fmt.Println("Signature:", response.Signature)
  ```

  ### Parameters and Returns

  See the [API reference](/api-reference/wallets/solana/sign-message) for more details.
</View>

<View title="REST API" icon="terminal">
  To sign a message make a POST request to

  ```bash  theme={"system"}
  https://api.privy.io/v1/wallets/<wallet_id>/rpc
  ```

  ### Parameters

  <ParamField path="method" type="'signMessage'" required>
    RPC method to execute with the wallet.
  </ParamField>

  <ParamField path="params" type="Object" required>
    Parameters for the RPC method to execute with the wallet.

    <Expandable title="properties" defaultOpen="true">
      <ParamField path="message" type="string" required>
        The message to sign with the wallet. If the message to sign is raw bytes, you must serialize
        the message as a base64 string.
      </ParamField>

      <ParamField path="encoding" type="'base64'" required>
        The encoding format for `message`. Currently, only `'base64'` is supported for Solana.
      </ParamField>
    </Expandable>
  </ParamField>

  ### Returns

  <ResponseField name="method" type="'signMessage'">
    The RPC method executed with the wallet.
  </ResponseField>

  <ResponseField name="data" type="Object">
    Outputs for the RPC method executed with the wallet.

    <Expandable title="properties" defaultOpen="true">
      <ResponseField name="signature" type="string">
        An encoded string serializing the signature produced by the user's wallet.
      </ResponseField>

      <ResponseField name="encoding" type="'base64'">
        The encoding format for the returned `signature`. Currently, only `'base64'` is supported for Solana.
      </ResponseField>
    </Expandable>
  </ResponseField>

  ### Usage

  ```bash  theme={"system"}
  $ curl --request POST https://api.privy.io/v1/wallets/<wallet_id>/rpc \
  -u "<your-privy-app-id>:<your-privy-app-secret>" \
  -H "privy-app-id: <your-privy-app-id>" \
  -H "privy-authorization-signature: <authorization-signature-for-request>" \
  -H 'Content-Type: application/json' \
  -d '{
    "chain_type": "solana",
    "method": "signMessage",
    "params": {
      "message": "Hello, Solana.",
      "encoding": "base64"
    }
  }'
  ```
</View>
\n