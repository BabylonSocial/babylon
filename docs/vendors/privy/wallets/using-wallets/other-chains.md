> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Other chains

For chains supported at the [Tier 2 level](/wallets/overview/chains), you can invoke Privy's raw sign functionality to sign over a hash, e.g. the hash of a transaction. You can then use the returned signature to submit and send your transaction.

Alternatively, you can provide the `bytes` to hash with a specific `encoding` and a `hash_function`, and get the same response.

For examples of how to use raw sign for a specific chain, see [this recipe](/recipes/use-tier-2).

<View title="REST API" icon="terminal">
  Sign a raw hash or `bytes` (with `encoding` and `hash_function`) along the blockchain’s cryptographic curve using the wallet’s private key. Make a `POST` request to

  ```bash  theme={"system"}
  https://api.privy.io/v1/wallets/{wallet_id}/raw_sign
  ```

  ## Usage

  ```bash  theme={"system"}
  curl --request POST \
  --url https://api.privy.io/v1/wallets/{wallet_id}/raw_sign \
  --header 'Authorization: Basic Y20xNWh4eDUyMDVlNWx2NHVkdmE3enBqejoybWhVOWhhVTFQYjhYNXV1cVdxQVRIdW5xTWIyUlBKRm5GSHRzWDVzbXNkdUJRUDZtTW05YldmalBwS3hocjJQZHNHY0Q5NkFUeDc5em03WWhicUZLWkM4' \
  --header 'Content-Type: application/json' \
  --header 'privy-app-id: <privy-app-id>' \
  --data '{
  "params": {
      "hash": "0x0775aeed9c9ce6e0fbc4db25c5e4e6368029651c905c286f813126a09025a21e"
      }
  }'
  ```

  A successful response will look like:

  ```json  theme={"system"}
  {
      "data": {
          "signature": "0x0775aeed9c9ce6e0fbc4db25c5e4e6368029651c905c286f813126a09025a21e",
          "encoding": "hex"
      }
  }
  ```

  Alternatively, you can provide bytes to hash with a specific encoding and hash function, and gets a similar response.

  ```bash  theme={"system"}
  curl --request POST \
  --url https://api.privy.io/v1/wallets/{wallet_id}/raw_sign \
  --header 'Authorization: Basic Y20xNWh4eDUyMDVlNWx2NHVkdmE3enBqejoybWhVOWhhVTFQYjhYNXV1cVdxQVRIdW5xTWIyUlBKRm5GSHRzWDVzbXNkdUJRUDZtTW05YldmalBwS3hocjJQZHNHY0Q5NkFUeDc5em03WWhicUZLWkM4' \
  --header 'Content-Type: application/json' \
  --header 'privy-app-id: <privy-app-id>' \
  --data '{
  "params": {
      "bytes": "0a0234ea220809701d7a17a77e04408093e981a6335a66080112620a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412310a15417009bf59e27d2031a23a61e1590289fc3d21b3cd121541132b98ed6fb80a2d45f177cdef091ae2d9dc115418e80770a0bee581a633",
      "encoding": "hex",
      "hash_function": "sha256"
      }
  }'
  ```

  ## Authorization

  <ParamField header="Authorization" type="string" required>
    App secret authentication.
  </ParamField>

  ## Headers

  <ParamField header="privy-app-id" type="string" required>
    ID of your Privy app.
  </ParamField>

  <ParamField header="privy-authorization-signature" type="string">
    Request authorization signature. If multiple signatures are required, they should be comma
    separated.
  </ParamField>

  ## Path

  <ParamField path="wallet_id" type="string" required>
    ID of the wallet.
  </ParamField>

  ## Body

  <ParamField body="params" type="object" required>
    <Expandable title="child attributes" defaultOpen="true">
      **Option 1: Sign a pre-computed hash**

      <ParamField body="hash" type="string">
        The hex-encoded hash to sign, prefixed with `0x`. Use this option when you have already computed the hash.
      </ParamField>

      **Option 2: Hash bytes before signing**

      <ParamField body="bytes" type="string">
        The bytes to hash and sign. Use this option to provide raw data that will be decoded using the specified `encoding` then hashed using the specified `hash_function`.
      </ParamField>

      <ParamField body="encoding" type="string" initialValue="utf-8">
        The encoding scheme for the bytes. Required when using `bytes`. Available options: `utf-8`, `hex`
      </ParamField>

      <ParamField body="hash_function" type="string" initialValue="keccak256">
        The hash function to hash the bytes. Required when using `bytes`. Available options: `keccak256`, `sha256`
      </ParamField>

      <Note>
        You must provide either `hash` OR the combination of `bytes`, `encoding`, and `hash_function`. These parameter sets are mutually exclusive.
      </Note>
    </Expandable>
  </ParamField>

  ## Response

  <ParamField header="data" type="object" required>
    <Expandable title="child attributes" defaultOpen="true">
      <ParamField body="signature" type="string">
        The signature, prefixed with `0x`.
      </ParamField>

      <ParamField body="encoding" type="string">
        The encoding of the signature.
      </ParamField>
    </Expandable>
  </ParamField>

  <ParamField header="error" type="object">
    <Expandable title="child attributes" defaultOpen="true">
      <ParamField body="code" type="string">
        The error code.
      </ParamField>

      <ParamField body="message" type="string">
        The error message.
      </ParamField>
    </Expandable>
  </ParamField>
</View>

<View title="NodeJS" icon="node-js">
  Use the `rawSign` method on the `wallets()` interface to sign a hash or `bytes` (with `encoding` and `hash_function`) with a wallet.

  ### Usage

  ```tsx  theme={"system"}
  const {signature, encoding} = await privy.wallets().rawSign('insert-wallet-id', {
    params: { hash: '0x0775aeed9c9ce6e0fbc4db25c5e4e6368029651c905c286f813126a09025a21e' },
  });
  ```

  Alternatively, you can provide bytes to hash with a specific encoding and hash function, and gets a similar response.

  ```tsx  theme={"system"}
  const {signature, encoding} = await privy.wallets().rawSign('insert-wallet-id', {
    params: {
      bytes: "0a0234ea220809701d7a17a77e04408093e981a6335a66080112620a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412310a15417009bf59e27d2031a23a61e1590289fc3d21b3cd121541132b98ed6fb80a2d45f177cdef091ae2d9dc115418e80770a0bee581a633",
      encoding: "hex",
      hash_function: "sha256"
    },
  });
  ```

  ### Parameters and Returns

  Check out the [API reference](/api-reference/wallets/raw-sign) for more details.
</View>

<View title="Java" icon="java">
  To sign a raw hash or `bytes` (with `encoding` and `hash_function`) from your wallet, use the `rawSign` method.
  It will sign your hash, and return the signature to you.

  ### Usage

  ```java  theme={"system"}
  try {
      RawSignRequest request = RawSignRequest.builder()
          .params(
              RawSignRequestParams.builder()
                  .hash("0x0775aeed9c9ce6e0fbc4db25c5e4e6368029651c905c286f813126a09025a21e")
                  .build()
          )
          .build();

      // Alternatively, you can provide bytes to hash with a specific encoding and hash function, and gets a similar response.
      /*
        RawSignRequest request = RawSignRequest.builder()
            .params(
                RawSignRequestParams.builder()
                    .bytes("0a0234ea220809701d7a17a77e04408093e981a6335a66080112620a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412310a15417009bf59e27d2031a23a61e1590289fc3d21b3cd121541132b98ed6fb80a2d45f177cdef091ae2d9dc115418e80770a0bee581a633")
                    .encoding("hex")
                    .hashFunction("sha256")
                    .build()
            )
            .build();
      */

      // Example: If wallet's owner is an authorization private key
      AuthorizationContext authorizationContext = AuthorizationContext.builder()
          .addAuthorizationPrivateKey("authorization-key")
          .build();

      WalletRawSignResponse response = privyClient
          .wallets()
          .rawSign(
              walletId,
              request,
              authorizationContext
          );

      if (response.rawSignResponse().isPresent()) {
          RawSignResponse rawSignResponse = response.rawSignResponse().get();
          if (rawSignResponse.data().isPresent()) {
              RawSignResponseData data = rawSignResponse.data().get();
              String signature = data.signature();
          }
      }
  } catch (APIException e) {
      String errorBody = e.bodyAsString();
      System.err.println(errorBody);
  } catch (Exception e) {
      System.err.println(e.getMessage());
  }
  ```

  ### Parameters

  <ParamField type="RawSignRequest" body="request" required>
    <Expandable defaultOpen="true">
      <ParamField body="params" type="RawSignRequestParams" required>
        <Expandable defaultOpen="true">
          **Option 1: Sign a pre-computed hash**

          <ParamField body="hash" type="String">
            The hex-encoded hash to sign, prefixed with `0x`. Use this option when you have already computed the hash.
          </ParamField>

          **Option 2: Hash bytes before signing**

          <ParamField body="bytes" type="String">
            The bytes to hash and sign. Use this option to provide raw data that will be decoded using the specified `encoding` then hashed using the specified `hash_function`.
          </ParamField>

          <ParamField body="encoding" type="String" initialValue="utf-8">
            The encoding scheme for the bytes. Required when using `bytes`. Available options: `utf-8`, `hex`
          </ParamField>

          <ParamField body="hashFunction" type="String" initialValue="keccak256">
            The hash function to hash the bytes. Required when using `bytes`. Available options: `keccak256`, `sha256`
          </ParamField>

          <Note>
            You must provide either `hash` OR the combination of `bytes`, `encoding`, and `hash_function`. These parameter sets are mutually exclusive.
          </Note>
        </Expandable>
      </ParamField>
    </Expandable>
  </ParamField>

  ### Returns

  The `WalletRawSignResponse` object contains a `rawSignResponse()` field

  <ResponseField name="rawSignResponse()" type="Optional<RawSignResponse>">
    <Expandable defaultOpen="true">
      <ResponseField name="data()" type="Optional<RawSignResponseData>">
        <Expandable defaultOpen="true">
          <ResponseField name="signature()" type="String">
            The signature produced by the wallet, prefixed with `0x`.
          </ResponseField>
        </Expandable>
      </ResponseField>
    </Expandable>
  </ResponseField>
</View>

<View title="Go" icon="golang">
  Use the `RawSign` method on the `Wallets` service to sign a raw payload with a wallet on any supported chain.

  ### Usage

  ```go  theme={"system"}
  response, err := client.Wallets.RawSign(
      context.Background(),
      "wallet-id",
      privy.WalletRawSignParams{
          Params: privy.WalletRawSignParamsParamsUnion{
              OfHash: &privy.WalletRawSignParamsParamsHash{
                  Hash: "0x6503b027a625549f7be691646404f275f149d17a119a6804b855bac3030037aa",
              },
          },
      },
  )
  if err != nil {
      log.Fatalf("failed to sign: %v", err)
  }

  fmt.Println("Signature:", response.Data.Signature)
  ```

  ### Parameters and Returns

  See the [API reference](/api-reference/wallets/raw-sign) for more details.
</View>

<View title="React" icon="react">
  Sign a raw hash or `bytes` (with `encoding` and `hash_function`) along the blockchain's cryptographic curve using the wallet's private key.

  ```typescript  theme={"system"}
  signRawHash: ({address: string, chainType: CurveSigningChainType, hash: HexString}) =>
    Promise<{signature: HexString}>;
  ```

  ### Usage

  ```typescript  theme={"system"}
  import {useSignRawHash} from '@privy-io/react-auth/extended-chains';

  const {signRawHash} = useSignRawHash();

  const {signature} = await signRawHash({
    address: 'insert-wallet-address',
    chainType: 'cosmos', // or 'stellar', 'sui', etc.
    hash: '0x1acab030f479bda7829de07e9db4138cec5d38574df17d65af1617b7268541c0'
  });

  // Alternatively, you can provide bytes to hash with a specific encoding and hash function, and gets a similar response.
  /*
    const {signature} = await signRawHash({
      address: 'insert-wallet-address',
      chainType: 'cosmos', // or 'stellar', 'sui', etc.
      bytes: '0a0234ea220809701d7a17a77e04408093e981a6335a66080112620a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412310a15417009bf59e27d2031a23a61e1590289fc3d21b3cd121541132b98ed6fb80a2d45f177cdef091ae2d9dc115418e80770a0bee581a633',
      encoding: 'hex',
      hash_function: 'sha256'
  });
  */

  console.log(signature);
  // 0x4d349c0c04abec47f2af0929b6dd5abcef2f29cb90b596772af928b3ef6e34316108eab1c47fac6d1d5ec51da59bd9124a80c4d353e130a8e675a3ad952e4c46
  ```

  ### Parameters

  <ParamField path="opts.address" type="string" required>
    The address of the wallet to use for signing the raw hash.
  </ParamField>

  <ParamField path="opts.chainType" type="CurveSigningChainType" required>
    The chain type of the wallet to use for signing the raw hash.
  </ParamField>

  **Option 1: Sign a pre-computed hash**

  <ParamField path="opts.hash" type="HexString">
    The raw hash to sign over, hex-encoded and prefixed with `0x`. Use this option when you have already computed the hash.
  </ParamField>

  **Option 2: Hash bytes before signing**

  <ParamField path="opts.bytes" type="string">
    The bytes to hash and sign. Use this option to provide raw data that will be decoded using the specified `encoding` then hashed using the specified `hash_function`.
  </ParamField>

  <ParamField path="opts.encoding" type="'utf-8' | 'hex'" initialValue="utf-8">
    The encoding scheme for the bytes. Required when using `bytes`.
  </ParamField>

  <ParamField path="opts.hashFunction" type="'keccak256' | 'sha256'" initialValue="keccak256">
    The hash function to hash the bytes. Required when using `bytes`.
  </ParamField>

  <Note>
    You must provide either `hash` OR the combination of `bytes`, `encoding`, and `hash_function`. These parameter sets are mutually exclusive.
  </Note>

  ### Returns

  <ResponseField path="output" type="Promise<{signature: HexString}>">
    <Expandable title="child properties" defaultOpen="true">
      <ResponseField name="signature" type="HexString">
        The signature produced by the wallet. Hex-encoded and prefixed with `0x`.
      </ResponseField>
    </Expandable>
  </ResponseField>
</View>

<View title="React Native" icon="react">
  Sign a raw hash or `bytes` (with `encoding` and `hash_function`) along the blockchain's cryptographic curve using the wallet's private key.

  ```typescript  theme={"system"}
  signRawHash: ({address: string, chainType: CurveSigningChainType, hash: HexString}) =>
    Promise<{signature: HexString}>;
  ```

  ### Usage

  ```typescript  theme={"system"}
  import {useSignRawHash} from '@privy-io/expo/extended-chains';

  const {signRawHash} = useSignRawHash();

  const {signature} = await signRawHash({
    address: 'insert-wallet-address',
    chainType: 'cosmos', // or 'stellar', 'sui', etc.
    hash: '0x1acab030f479bda7829de07e9db4138cec5d38574df17d65af1617b7268541c0'
  });

  // Alternatively, you can provide bytes to hash with a specific encoding and hash function, and gets a similar response.
  /*
    const {signature} = await signRawHash({
      address: 'insert-wallet-address',
      chainType: 'cosmos', // or 'stellar', 'sui', etc.
      bytes: '0a0234ea220809701d7a17a77e04408093e981a6335a66080112620a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412310a15417009bf59e27d2031a23a61e1590289fc3d21b3cd121541132b98ed6fb80a2d45f177cdef091ae2d9dc115418e80770a0bee581a633',
      encoding: 'hex',
      hash_function: 'sha256'
  });
  */

  console.log(signature);
  // 0x4d349c0c04abec47f2af0929b6dd5abcef2f29cb90b596772af928b3ef6e34316108eab1c47fac6d1d5ec51da59bd9124a80c4d353e130a8e675a3ad952e4c46
  ```

  ### Parameters

  <ParamField path="opts.address" type="string" required>
    The address of the wallet to use for signing the raw hash.
  </ParamField>

  <ParamField path="opts.chainType" type="CurveSigningChainType" required>
    The chain type of the wallet to use for signing the raw hash.
  </ParamField>

  **Option 1: Sign a pre-computed hash**

  <ParamField path="opts.hash" type="HexString">
    The raw hash to sign over, hex-encoded and prefixed with `0x`. Use this option when you have already computed the hash.
  </ParamField>

  **Option 2: Hash bytes before signing**

  <ParamField path="opts.bytes" type="string">
    The bytes to hash and sign. Use this option to provide raw data that will be decoded using the specified `encoding` then hashed using the specified `hash_function`.
  </ParamField>

  <ParamField path="opts.encoding" type="'utf-8' | 'hex'" initialValue="utf-8">
    The encoding scheme for the bytes. Required when using `bytes`.
  </ParamField>

  <ParamField path="opts.hashFunction" type="'keccak256' | 'sha256'" initialValue="keccak256">
    The hash function to hash the bytes. Required when using `bytes`.
  </ParamField>

  <Note>
    You must provide either `hash` OR the combination of `bytes`, `encoding`, and `hash_function`. These parameter sets are mutually exclusive.
  </Note>

  ### Returns

  <ResponseField path="output" type="Promise<{signature: HexString}>">
    <Expandable title="child properties" defaultOpen="true">
      <ResponseField name="signature" type="HexString">
        The signature produced by the wallet. Hex-encoded and prefixed with `0x`.
      </ResponseField>
    </Expandable>
  </ResponseField>
</View>
\n