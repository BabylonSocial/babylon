> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

<View title="NodeJS" icon="node-js">
  Use the **`PrivyClient`**'s **`get`** method from the `policies()` interface to get a policy by its ID.

  ```tsx  theme={"system"}
  const policy = await privy.policies().get('fmfdj6yqly31huorjqzq38zc');
  ```
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  <Warning>
    The `@privy-io/server-auth` library is deprecated. We recommend integrating `@privy-io/node` for
    the latest features and support.
  </Warning>

  Use the **`PrivyClient`**'s **`getPolicy`** method to get a policy by its ID.

  ```tsx  theme={"system"}
  const policy = await privy.getPolicy({
    id: 'fmfdj6yqly31huorjqzq38zc'
  });
  ```
</View>

<View title="Java" icon="java">
  You can get a policy using the Java SDK by using the `policies().retrieve()` method.

  ```java  theme={"system"}
  try {
      PolicyRetrieveResponse response = privyClient
          .policies()
          .retrieve("fmfdj6yqly31huorjqzq38zc");

      if (response.policy().isPresent()) {
        Policy policy = response.policy().get();
        String policyId = policy.id();
      }
  } catch (APIException e) {
      String errorBody = e.bodyAsString();
      System.err.println(errorBody);
  } catch (Exception e) {
      System.err.println(e.getMessage());
  }
  ```

  ### Parameters

  <ParamField path="id" type="String">
    The ID of the policy to retrieve.
  </ParamField>

  ### Returns

  The `PolicyRetrieveResponse` object contains an optional `policy()` field that contains the retrieved
  policy if the policy was retrieved successfully.

  <ResponseField name="policy()" type="Optional<Policy>">
    The retrieved policy.

    <Expandable title="Policy">
      <ResponseField name="version" type="Version">
        Version of the policy.
      </ResponseField>

      <ResponseField name="name" type="String">
        Name of the policy.
      </ResponseField>

      <ResponseField name="chainType" type="PolicyChainType">
        Chain type of the wallets that the policy will be applied to.
      </ResponseField>

      <ResponseField name="id" type="String">
        Unique ID of the policy.
      </ResponseField>

      <ResponseField name="ownerId" type="String">
        The key quorum ID of the owner of the policy.
      </ResponseField>

      <ResponseField name="createdAt" type="Double">
        The Unix time of when the policy was created.
      </ResponseField>

      <ResponseField name="rules" type="List<PolicyRule>">
        A list of `Rule` objects describing what rules to apply to each RPC method (e.g.
        `'eth_sendTransaction'`) that the wallet can take. [Learn more about
        `Rules`](/controls/policies/overview#rules).
      </ResponseField>
    </Expandable>
  </ResponseField>
</View>

<View title="Rust" icon="rust">
  Use the **`PrivyClient`**'s **`get`** method from the `policies()` interface to get a policy by its ID.

  ```rust  theme={"system"}
  use privy_rs::PrivyClient;

  let client = PrivyClient::new(app_id, app_secret)?;

  let policy = client
      .policies()
      .get("fmfdj6yqly31huorjqzq38zc")
      .await?;

  println!("Policy: {}", policy.name);
  println!("Rules: {:?}", policy.rules);
  ```

  ### Parameters and Returns

  See the Rust SDK documentation for detailed parameter and return types, including embedded examples:

  * [PoliciesClient::get](https://docs.rs/privy-rs/latest/privy_rs/subclients/struct.PoliciesClient.html#method.get)

  For REST API details, see the [API reference](/api-reference/policies/get).
</View>

<View title="Go">
  To get a policy with the Go SDK, use the `Get` method on the `Policies` service.

  ### Usage

  ```go  theme={"system"}
  policy, err := client.Policies.Get(context.Background(), "policy-id")
  if err != nil {
      log.Fatalf("failed to get policy: %v", err)
  }

  fmt.Println("Policy:", policy.ID, policy.Name)
  ```

  ### Parameters and Returns

  See the [API reference](/api-reference/policies/get) for more details.
</View>

<View title="REST API" icon="terminal">
  To get a policy by its ID, make a `GET` request to:

  ```bash  theme={"system"}
  https://api.privy.io/v1/policies/<policy_id>
  ```

  Replacing `<policy_id>` with the ID of your desired policy.

  ## **Response**

  A successful response will return the following fields:

  <ResponseField name="id" type="string">
    Unique ID for the policy.
  </ResponseField>

  <ResponseField name="version" type="'1.0'">
    Version of the policy. Currently, 1.0 is the only version.
  </ResponseField>

  <ResponseField name="name" type="string">
    Name to assign to policy.
  </ResponseField>

  <ResponseField name="chain_type" type="'ethereum'">
    Chain type for wallets that the policy will be applied to.
  </ResponseField>

  <ResponseField name="rules" type="Rule[]">
    A list of `Rule` objects describing what rules to apply to each RPC method (e.g.
    `'eth_sendTransaction'`) that the wallet can take. [Learn more about
    `Rules`](/controls/policies/overview#rules).
  </ResponseField>

  <ResponseField type="string | null" name="owner_id">
    The key quorum ID of the owner of the policy, whose signature is required to modify the policy.
  </ResponseField>

  ## Example

  A sample request to fetch a policy with ID `fmfdj6yqly31huorjqzq38zc` looks like:

  ```bash  theme={"system"}
  curl --request GET https://api.privy.io/v1/policies/fmfdj6yqly31huorjqzq38zc \
  -u "<your-privy-app-id>:<your-privy-app-secret>" \
  -H "privy-app-id: <your-privy-app-id>"
  ```

  ## Response

  A successful response will look like the following:

  ```json  theme={"system"}
  {
    "id": "fmfdj6yqly31huorjqzq38zc",
    "name": "Allowlist certain smart contracts",
    "version": "1.0",
    "chain_type": "ethereum",
    "rules": [
      {
        "name": "Allowlist USDC",
        "method": "eth_sendTransaction",
        "conditions": [
          {
            "field_source": "ethereum_transaction",
            "field": "to",
            "operator": "eq",
            "value": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
          }
        ],
        "action": "ALLOW"
      }
    ],
    "owner_id": "fmfdj6yqly31huorjqzq38zc"
  }
  ```
</View>
\n