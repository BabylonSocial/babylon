> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

You can create a policy using the Privy Dashboard, the NodeJS SDK, or the REST API.

Policies optionally have owners, which represent the signatures required to modify the policy after creation, see [setting authorization signatures](/api-reference/authorization-signatures).

<Tip>
  We highly recommend specifying owners for your policies to further restrict the parties that can
  modify them. Without an owner, the policies can be updated by your app secret alone.
</Tip>

<View title="NodeJS" icon="node-js">
  Use the **`PrivyClient`**'s **`create`** method from the `policies()` interface to create a new policy.

  ```tsx  theme={"system"}
  const policy = await privy.policies().create({
    name: 'Allow list certain smart contracts',
    version: '1.0',
    chain_type: 'ethereum',
    rules: [
      {
        name: 'Allow list USDC',
        method: 'eth_sendTransaction',
        action: 'ALLOW',
        conditions: [
          {
            field_source: 'ethereum_transaction',
            field: 'to',
            operator: 'eq',
            value: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
          }
        ]
      }
    ],
    owner_id: 'fmfdj6yqly31huorjqzq38zc'
  });
  ```
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  <Warning>
    The `@privy-io/server-auth` library is deprecated. We recommend integrating `@privy-io/node` for
    the latest features and support.
  </Warning>

  Use the **`PrivyClient`**'s **`createPolicy`** method to create a new policy.

  ```tsx  theme={"system"}
  const policy = await privy.walletApi.createPolicy({
    name: 'Allowlist certain smart contracts',
    version: '1.0',
    chainType: 'ethereum',
    rules: [
      {
        name: 'Allowlist USDC',
        method: 'eth_sendTransaction',
        action: 'ALLOW',
        conditions: [
          {
            fieldSource: 'ethereum_transaction',
            field: 'to',
            operator: 'eq',
            value: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
          }
        ]
      }
    ],
    ownerId: 'fmfdj6yqly31huorjqzq38zc'
  });
  ```
</View>

<View title="Java" icon="java">
  You can create a policy using the Java SDK by using the `policies().create()` method.

  ```java  theme={"system"}
  try {
      // Create a policy rule to allow USDC transfers
      PolicyRule allowUsdc = PolicyRule.builder()
          .name("Allowlist USDC")
          .method(PolicyRuleMethod.ETH_SEND_TRANSACTION)
          .action(Action.ALLOW)
          .conditions(List.of(
              EthereumTransactionCondition.builder()
                  .fieldSource(EthereumTransactionConditionFieldSource.ETHEREUM_TRANSACTION)
                  .field(EthereumTransactionConditionField.TO)
                  .operator(ConditionOperator.EQ)
                  .value(ConditionValue.of("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"))
                  .build()
          ))
          .build();

      // Create a policy that contains your rules
      PolicyCreateRequestBody policy = PolicyCreateRequestBody.builder()
        .version(Version.ONE_DOT0)
        .name("Allowlist certain smart contracts")
        .chainType(PolicyChainType.ETHEREUM)
        .rules(List.of(
            allowUsdc
        ))
        .build();

      PolicyCreateResponse response = privyClient
          .policies()
          .create(policy);

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

  When defining a policy, you may specify the following values on the `PolicyCreateRequestBody` builder:

  <Expandable title="parameters" defaultOpen="true">
    <ParamField path="version" type="Version">
      Version of the policy.
    </ParamField>

    <ParamField path="name" type="String">
      Name to assign to policy.
    </ParamField>

    <ParamField path="chainType" type="PolicyChainType">
      Chain type for wallets that the policy will be applied to.
    </ParamField>

    <ParamField path="rules" type="List<PolicyRule>">
      A list of `Rule` objects describing what rules to apply to each RPC method (e.g.
      `'eth_sendTransaction'`) that the wallet can take. [Learn more about
      `Rules`](/controls/policies/overview#rules).
    </ParamField>

    <ParamField path="owner" type="OwnerInput">
      The owner of the policy. You should specify either an `owner` or an `ownerId`, but not both.
    </ParamField>

    <ParamField path="ownerId" type="String">
      The key quorum ID of the owner of the policy. You should specify either an `owner` or an
      `ownerId`, but not both.
    </ParamField>
  </Expandable>

  ### Returns

  The `PolicyCreateResponse` object contains an optional `policy()` field that contains the created
  policy if the policy was created successfully.

  <ResponseField name="policy()" type="Optional<Policy>">
    The created policy.

    <Expandable title="Policy" defaultOpen="true">
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
  Use the **`PrivyClient`**'s **`create`** method from the `policies()` interface to create a new policy.

  ```rust  theme={"system"}
  use privy_rs::{PrivyClient, generated::types::*};

  let client = PrivyClient::new(app_id, app_secret)?;

  // Create policy rules
  let usdc_condition = PolicyRuleCondition {
      field_source: "ethereum_transaction".to_string(),
      field: "to".to_string(),
      operator: "eq".to_string(),
      value: serde_json::Value::String("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913".to_string()),
  };

  let allow_usdc_rule = PolicyRule {
      name: "Allow list USDC".to_string(),
      method: "eth_sendTransaction".to_string(),
      action: PolicyRuleAction::Allow,
      conditions: vec![usdc_condition],
  };

  let request = CreatePolicyBody {
      name: "Allow list certain smart contracts".to_string(),
      version: "1.0".to_string(),
      chain_type: "ethereum".to_string(),
      rules: vec![allow_usdc_rule],
      owner_id: Some("fmfdj6yqly31huorjqzq38zc".to_string()),
      owner: None,
  };

  let policy = client
      .policies()
      .create(request, &authorization_context)
      .await?;

  println!("Created policy: {}", policy.id);
  ```

  ### Parameters and Returns

  See the Rust SDK documentation for detailed parameter and return types, including embedded examples:

  * [PoliciesClient::create](https://docs.rs/privy-rs/latest/privy_rs/subclients/struct.PoliciesClient.html#method.create)

  For REST API details, see the [API reference](/api-reference/policies/create).
</View>

<View title="Go" icon="golang">
  To create a policy with the Go SDK, use the `New` method on the `Policies` service.

  ### Usage

  ```go  theme={"system"}
  policy, err := client.Policies.New(context.Background(), privy.PolicyNewParams{
      Name:      "Allow list certain smart contracts",
      ChainType: privy.PolicyNewParamsChainTypeEthereum,
      Version:   privy.PolicyNewParamsVersion1_0,
      OwnerID:   privy.String("fmfdj6yqly31huorjqzq38zc"),
      Rules: []privy.PolicyNewParamsRule{
          {
              Name:   "Allow list USDC",
              Method: "eth_sendTransaction",
              Action: "ALLOW",
              Conditions: []privy.PolicyNewParamsRuleConditionUnion{
                  {
                      OfEthereumTransaction: &privy.PolicyNewParamsRuleConditionEthereumTransaction{
                          Field:    "to",
                          Operator: "eq",
                          Value: privy.PolicyNewParamsRuleConditionEthereumTransactionValueUnion{
                              OfString: privy.String("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"),
                          },
                      },
                  },
              },
          },
      },
  })
  if err != nil {
      log.Fatalf("failed to create policy: %v", err)
  }

  fmt.Println("Created policy:", policy.ID)
  ```

  ### Parameters and Returns

  See the [API reference](/api-reference/policies/create) for more details.
</View>

<View title="REST API" icon="terminal">
  To create a new policy, make a `POST` request to:

  ```sh  theme={"system"}
  https://api.privy.io/v1/policies
  ```

  <Tip>
    In the request headers, make sure to include Privy's [required authentication
    headers](/basics/rest-api/setup#authentication) and [headers that may be required for your app's
    wallet API setup](/basics/rest-api/quickstart#2-sign-a-message). You can also include an
    [idempotency key](/api-reference/idempotency-keys) header.
  </Tip>

  ## **Body**

  In the request body, include the following:

  <Expandable title="body attributes" defaultOpen="true">
    <ParamField path="version" type="'1.0'">
      Version of the policy. Currently, 1.0 is the only version.
    </ParamField>

    <ParamField path="name" type="string">
      Name to assign to policy.
    </ParamField>

    <ParamField path="chain_type" type="'ethereum'">
      Chain type for wallets that the policy will be applied to.
    </ParamField>

    <ParamField path="rules" type="Rule">
      A list of `Rule` objects describing what rules to apply to each RPC method (e.g.
      `'eth_sendTransaction'`) that the wallet can take. [Learn more about
      `Rules`](/controls/policies/overview#rules).
    </ParamField>

    <ParamField type="{public_key: string} | null" path="owner">
      The P-256 public key of the owner of the policy. If you provide this, do not specify an owner\_id
      as it will be generated automatically.

      View [this guide](/controls/authorization-keys/owners/overview) to learn more about owners.
    </ParamField>

    <ParamField type="string | null" path="owner_id">
      The key quorum ID of the owner of the policy. If you provide this, do not specify an owner.

      View [this guide](/controls/authorization-keys/owners/overview) to learn more about owners.
    </ParamField>
  </Expandable>

  Once you have successfully created a policy, you can assign that policy to a wallet at [creation](/wallets/wallets/create/create-a-wallet#param-policy-ids).

  ## **Response**

  If the policy is created successfully, the response will include the request body as well as an additional unique `id` field for the policy.

  <Expandable title="response" defaultOpen="true">
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
  </Expandable>

  ## Example

  As an example, a sample request to create a new `eth_sendTransaction` policy might look like the following:

  ```bash  theme={"system"}
  $ curl --request POST https://api.privy.io/v1/policies \
  -u "<your-privy-app-id>:<your-privy-app-secret>" \
  -H "privy-app-id: <your-privy-app-id>" \
  -H "privy-authorization-signature: <authorization-signature-for-request>" \
  -H 'Content-Type: application/json' \
  -d '{
      "version": "1.0",
      "name": "Allowlist certain smart contracts",
      "chain_type": "ethereum",
      "rules": [{
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
      }],
      "owner": {
        "public_key": "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEx4aoeD72yykviK+f/ckqE2CItVIG1rCnvC3/XZ1HgpOcMEMialRmTrqIK4oZlYd1RfxU3za/C9yjhboIuoPD3g=="
      }
  }'
  ```

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