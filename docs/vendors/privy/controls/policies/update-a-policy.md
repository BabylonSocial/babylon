> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Update a policy

You can update a policy by updating rules one at a time, or by updating the whole policy at once. You can do this using the Privy Dashboard, the NodeJS SDK, or the REST API.

If a policy has an owner, the owner's signature is required to modify the policy, see [setting authorization signatures](/api-reference/authorization-signatures).

## Updating policy rules individually

You can create, get, update, and delete individual rules in a policy. We recommend this over updating the whole policy at once, especially if you find yourself updating the same policy over time. This way, you can ensure there would be no race conditions when updating the policy.

### Add a rule to a policy

<View title="NodeJS" icon="node-js">
  Use the **`PrivyClient`**'s **`createRule`** method in the `policies()` interface to add a rule to a policy.

  ```tsx  theme={"system"}
  const rule = await client.policies().createRule('insert-policy-id', {
    name: 'Allow list USDT',
    method: 'eth_sendTransaction',
    conditions: [
      {
        field_source: 'ethereum_transaction',
        field: 'to',
        operator: 'eq',
        value: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
      }
    ],
    action: 'ALLOW'
  });
  ```
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  <Warning>
    The `@privy-io/server-auth` library is deprecated. We recommend integrating `@privy-io/node` for
    the latest features and support.
  </Warning>

  Use the **`PrivyClient`**'s **`addRuleToPolicy`** method to add a rule to a policy.

  ```tsx  theme={"system"}
  const rule = await client.walletApi.addRuleToPolicy({
    policyId: 'fmfdj6yqly31huorjqzq38zc',
    name: 'Allowlist USDT',
    method: 'eth_sendTransaction',
    conditions: [
      {
        fieldSource: 'ethereum_transaction',
        field: 'to',
        operator: 'eq',
        value: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
      }
    ],
    action: 'ALLOW'
  });
  ```
</View>

<View title="Rust" icon="rust">
  Use the **`PrivyClient`**'s **`create_rule`** method in the `policies()` interface to add a rule to a policy.

  ```rust  theme={"system"}
  use privy_rs::{PrivyClient, generated::types::*};

  let client = PrivyClient::new(app_id, app_secret)?;

  let usdt_condition = PolicyRuleCondition {
      field_source: "ethereum_transaction".to_string(),
      field: "to".to_string(),
      operator: "eq".to_string(),
      value: serde_json::Value::String("0xdAC17F958D2ee523a2206206994597C13D831ec7".to_string()),
  };

  let request = CreatePolicyRuleBody {
      name: "Allow list USDT".to_string(),
      method: "eth_sendTransaction".to_string(),
      action: PolicyRuleAction::Allow,
      conditions: vec![usdt_condition],
  };

  let rule = client
      .policies()
      .create_rule("insert-policy-id", request, &authorization_context)
      .await?;

  println!("Created rule: {}", rule.id);
  ```

  ### Parameters and Returns

  See the Rust SDK documentation for detailed parameter and return types, including embedded examples:

  * [PoliciesClient::create\_rule](https://docs.rs/privy-rs/latest/privy_rs/subclients/struct.PoliciesClient.html#method.create_rule)

  For REST API details, see the [API reference](/api-reference/policies/rules/create).
</View>

<View title="REST API" icon="terminal">
  To add a rule to a policy, make a `POST` request to:

  ```sh  theme={"system"}
  https://api.privy.io/v1/policies/<policy_id>/rules
  ```

  Replacing `<policy_id>` with the ID of your desired policy.

  In the request body, include the following fields:

  <Expandable title="body attributes" defaultOpen="true">
    <ParamField path="name" type="string">
      Name to assign to the rule.
    </ParamField>

    <ParamField path="method" type="'personal_sign' | 'eth_signTypedData_v4' | 'eth_signTransaction' | 'eth_sendTransaction' | 'signTransaction' | 'signAndSendTransaction' | '*'">
      RPC method to apply the `conditions` to. Must correspond to the `chain_type` of the parent policy.
    </ParamField>

    <ParamField path="conditions" type="Condition[]">
      A set of boolean conditions that define the action the rule allows or denies.
    </ParamField>

    <ParamField path="action" type="'ALLOW' | 'DENY'">
      Whether the rule should allow or deny a wallet request if it satisfies all of the rule's
      `conditions`.
    </ParamField>
  </Expandable>

  **Body**

  Here is an example of a request body:

  ```bash  theme={"system"}
  $ curl --request POST https://api.privy.io/v1/policies/fmfdj6yqly31huorjqzq38zc/rules \
  -u "<your-privy-app-id>:<your-privy-app-secret>" \
  -H "privy-app-id: <your-privy-app-id>" \
  -H "privy-authorization-signature: <authorization-signature-for-request>" \
  -H 'Content-Type: application/json' \
  -d '{
        "name": "Allowlist USDT",
        "method": "eth_sendTransaction",
        "conditions": [
            {
                "field_source": "ethereum_transaction",
                "field": "to",
                "operator": "eq",
                "value": "0xdAC17F958D2ee523a2206206994597C13D831ec7"
            }
        ],
        "action": "ALLOW"
  }'
  ```

  **Response**

  If the rule is added successfully, the response will include the full rule object, like below:

  ```json  theme={"system"}
  {
    "name": "Allowlist USDT",
    "method": "eth_sendTransaction",
    "conditions": [
      {
        "field_source": "ethereum_transaction",
        "field": "to",
        "operator": "eq",
        "value": "0xdAC17F958D2ee523a2206206994597C13D831ec7"
      }
    ],
    "action": "ALLOW",
    "id": "allow-list-usdt-18381838"
  }
  ```
</View>

### Edit a rule in a policy

<View title="NodeJS" icon="node-js">
  Use the **`PrivyClient`**'s **`updateRule`** method in the `policies()` interface to update a rule in a policy.

  ```tsx  theme={"system"}
  const rule = await client.policies().updateRule('insert-rule-id', {
    policy_id: 'insert-policy-id',
    name: 'Allow list USDT',
    method: 'eth_sendTransaction',
    conditions: [
      {
        field_source: 'ethereum_transaction',
        field: 'to',
        operator: 'eq',
        value: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
      }
    ],
    action: 'ALLOW'
  });
  ```
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  <Warning>
    The `@privy-io/server-auth` library is deprecated. We recommend integrating `@privy-io/node` for
    the latest features and support.
  </Warning>

  Use the **`PrivyClient`**'s **`updateRuleInPolicy`** method to update a rule in a policy.

  ```tsx  theme={"system"}
  const rule = await client.walletApi.updateRuleInPolicy({
    policyId: 'fmfdj6yqly31huorjqzq38zc',
    ruleId: 'allow-list-usdt-18381838',
    name: 'Allowlist USDT',
    method: 'eth_sendTransaction',
    conditions: [
      {
        fieldSource: 'ethereum_transaction',
        field: 'to',
        operator: 'eq',
        value: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
      }
    ],
    action: 'ALLOW'
  });
  ```
</View>

<View title="Rust" icon="rust">
  Use the **`PrivyClient`**'s **`update_rule`** method in the `policies()` interface to update a rule in a policy.

  ```rust  theme={"system"}
  use privy_rs::{PrivyClient, generated::types::*};

  let client = PrivyClient::new(app_id, app_secret)?;

  let usdt_condition = PolicyRuleCondition {
      field_source: "ethereum_transaction".to_string(),
      field: "to".to_string(),
      operator: "eq".to_string(),
      value: serde_json::Value::String("0xdAC17F958D2ee523a2206206994597C13D831ec7".to_string()),
  };

  let request = UpdatePolicyRuleBody {
      policy_id: "insert-policy-id".to_string(),
      name: "Allow list USDT".to_string(),
      method: "eth_sendTransaction".to_string(),
      action: PolicyRuleAction::Allow,
      conditions: vec![usdt_condition],
  };

  let rule = client
      .policies()
      .update_rule("insert-rule-id", request, &authorization_context)
      .await?;

  println!("Updated rule: {}", rule.id);
  ```

  ### Parameters and Returns

  See the Rust SDK documentation for detailed parameter and return types, including embedded examples:

  * [PoliciesClient::update\_rule](https://docs.rs/privy-rs/latest/privy_rs/subclients/struct.PoliciesClient.html#method.update_rule)

  For REST API details, see the [API reference](/api-reference/policies/rules/update).
</View>

<View title="REST API" icon="terminal">
  To add a rule to a policy, make a `PATCH` request to:

  ```sh  theme={"system"}
  https://api.privy.io/v1/policies/<policy_id>/rules/<rule_id>
  ```

  Replacing `<policy_id>` with the ID of your desired policy.

  In the request body, include the following fields:

  <Expandable title="body attributes" defaultOpen="true">
    <ParamField path="name" type="string">
      Name to assign to the rule.
    </ParamField>

    <ParamField path="method" type="'personal_sign' | 'eth_signTypedData_v4' | 'eth_signTransaction' | 'eth_sendTransaction' | 'signTransaction' | 'signAndSendTransaction' | '*'">
      RPC method to apply the `conditions` to. Must correspond to the `chain_type` of the parent policy.
    </ParamField>

    <ParamField path="conditions" type="Condition[]">
      A set of boolean conditions that define the action the rule allows or denies.
    </ParamField>

    <ParamField path="action" type="'ALLOW' | 'DENY'">
      Whether the rule should allow or deny a wallet request if it satisfies all of the rule's
      `conditions`.
    </ParamField>
  </Expandable>

  **Body**

  Here is an example of a request body:

  ```bash  theme={"system"}
  $ curl --request PATCH https://api.privy.io/v1/policies/fmfdj6yqly31huorjqzq38zc/rules/allow-list-usdt-18381838 \
  -u "<your-privy-app-id>:<your-privy-app-secret>" \
  -H "privy-app-id: <your-privy-app-id>" \
  -H "privy-authorization-signature: <authorization-signature-for-request>" \
  -H 'Content-Type: application/json' \
  -d '{
        "name": "Allowlist USDT",
        "method": "eth_sendTransaction",
        "conditions": [
            {
                "field_source": "ethereum_transaction",
                "field": "to",
                "operator": "eq",
                "value": "0xdAC17F958D2ee523a2206206994597C13D831ec7"
            }
        ],
        "action": "ALLOW"
  }'
  ```

  **Response**

  If the rule is added successfully, the response will include the full rule object, like below:

  ```json  theme={"system"}
  {
    "name": "Allowlist USDT",
    "method": "eth_sendTransaction",
    "conditions": [
      {
        "field_source": "ethereum_transaction",
        "field": "to",
        "operator": "eq",
        "value": "0xdAC17F958D2ee523a2206206994597C13D831ec7"
      }
    ],
    "action": "ALLOW",
    "id": "allow-list-usdt-18381838"
  }
  ```
</View>

### Delete a rule from a policy

<View title="NodeJS" icon="node-js">
  Use the **`PrivyClient`**'s **`deleteRule`** method in the `policies()` interface to delete a rule from a policy.

  ```tsx  theme={"system"}
  const rule = await client.policies().deleteRule('insert-rule-id', {
    policy_id: 'insert-policy-id'
  });
  ```
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  <Warning>
    The `@privy-io/server-auth` library is deprecated. We recommend integrating `@privy-io/node` for
    the latest features and support.
  </Warning>

  Use the **`PrivyClient`**'s **`deleteRuleFromPolicy`** method to delete a rule from a policy.

  ```ts  theme={"system"}
  import {PrivyClient} from '@privy-io/server-auth';

  const client = new PrivyClient('insert-app-id', 'insert-app-secret');

  const rule = await client.walletApi.deleteRuleFromPolicy({
    policyId: 'fmfdj6yqly31huorjqzq38zc',
    ruleId: 'allow-list-usdt-18381838'
  });
  ```
</View>

<View title="Rust" icon="rust">
  Use the **`PrivyClient`**'s **`delete_rule`** method in the `policies()` interface to delete a rule from a policy.

  ```rust  theme={"system"}
  use privy_rs::PrivyClient;

  let client = PrivyClient::new(app_id, app_secret)?;

  let request = DeletePolicyRuleBody {
      policy_id: "insert-policy-id".to_string(),
  };

  let response = client
      .policies()
      .delete_rule("insert-rule-id", request, &authorization_context)
      .await?;

  println!("Rule deleted successfully");
  ```

  ### Parameters and Returns

  See the Rust SDK documentation for detailed parameter and return types, including embedded examples:

  * [PoliciesClient::delete\_rule](https://docs.rs/privy-rs/latest/privy_rs/subclients/struct.PoliciesClient.html#method.delete_rule)

  For REST API details, see the [API reference](/api-reference/policies/rules/delete).
</View>

<View title="REST API" icon="terminal">
  To delete a rule from a policy, make a `DELETE` request to:

  ```sh  theme={"system"}
  https://api.privy.io/v1/policies/<policy_id>/rules/<rule_id>
  ```

  Replacing `<policy_id>` with the ID of your desired policy and `<rule_id>` with the ID of the rule you want to delete.

  **Response**

  If the rule is deleted successfully, the response will be

  ```sh  theme={"system"}
  {success: true}
  ```
</View>

## Update a whole policy

<View title="NodeJS" icon="node-js">
  Use the **`PrivyClient`**'s **`update`** method from the `policies()` interface to update an existing policy.

  ```tsx  theme={"system"}
  const policy = await client.policies().update('fmfdj6yqly31huorjqzq38zc', {
    name: 'Transactions must be <= 5ETH',
    rules: [
      {
        name: 'Transactions must be <= 5ETH',
        method: 'eth_sendTransaction',
        action: 'ALLOW',
        conditions: [
          {
            field_source: 'ethereum_transaction',
            field: 'value',
            operator: 'lte',
            value: '0x2386F26FC10000'
          }
        ]
      }
    ]
  });
  ```
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  <Warning>
    The `@privy-io/server-auth` library is deprecated. We recommend integrating `@privy-io/node` for
    the latest features and support.
  </Warning>

  Use the **`PrivyClient`**'s **`updatePolicy`** method to update an existing policy.

  ```tsx  theme={"system"}
  const policy = await client.walletApi.updatePolicy({
    id: 'fmfdj6yqly31huorjqzq38zc',
    name: 'Transactions must be <= 5ETH',
    rules: [
      {
        name: 'Transactions must be <= 5ETH',
        method: 'eth_sendTransaction',
        action: 'ALLOW',
        conditions: [
          {
            fieldSource: 'ethereum_transaction',
            field: 'value',
            operator: 'lte',
            value: '0x2386F26FC10000'
          }
        ]
      }
    ]
  });
  ```
</View>

<View title="Java" icon="java">
  You can update a policy using the Java SDK by using the `policies().update()` method.

  <Tip>
    If the policy has an owner, the owner's signature is required to modify the policy. Use an
    [authorization context](/controls/authorization-keys/using-owners/sign/signing-on-the-server) to
    pass into the `update()` method and sign the request.
  </Tip>

  ```java  theme={"system"}
  try {
      PolicyRule valueUnder5Eth = PolicyRule.builder()
          .name("Transactions must be <= 5ETH")
          .method(PolicyRuleMethod.ETH_SEND_TRANSACTION)
          .action(Action.ALLOW)
          .conditions(List.of(
              EthereumTransactionCondition.builder()
                  .fieldSource(EthereumTransactionConditionFieldSource.ETHEREUM_TRANSACTION)
                  .field(EthereumTransactionConditionField.VALUE)
                  .operator(ConditionOperator.LTE)
                  .value(ConditionValue.of("0x2386F26FC10000"))
                  .build()
          ))
          .build();

      PolicyUpdateRequestBody updateRequest = PolicyUpdateRequestBody.builder()
        .name("Transactions must be <= 5ETH")
        .rules(List.of(valueUnder5Eth))
        .build();

      // Example: If wallet's owner is an authorization private key
      AuthorizationContext authorizationContext = AuthorizationContext.builder()
          .addAuthorizationPrivateKey("authorization-key")
          .build();

      PolicyUpdateResponse response = privyClient
          .policies()
          .update(
              "fmfdj6yqly31huorjqzq38zc",
              updateRequest,
              authorizationContext
          );

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

  When updating a policy, you may specify the following values on the `PolicyUpdateRequestBody` builder:

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
    The owner of the policy.
  </ParamField>

  <ParamField path="ownerId" type="String">
    The key quorum ID of the owner of the policy.
  </ParamField>

  ### Returns

  The `PolicyUpdateResponse` object contains an optional `policy()` field that contains the updated
  policy if the policy was updated successfully.

  <ResponseField name="policy()" type="Optional<Policy>">
    The updated policy.

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
  Use the **`PrivyClient`**'s **`update`** method from the `policies()` interface to update an existing policy.

  ```rust  theme={"system"}
  use privy_rs::{PrivyClient, generated::types::*};

  let client = PrivyClient::new(app_id, app_secret)?;

  let value_condition = PolicyRuleCondition {
      field_source: "ethereum_transaction".to_string(),
      field: "value".to_string(),
      operator: "lte".to_string(),
      value: serde_json::Value::String("0x2386F26FC10000".to_string()),
  };

  let value_rule = PolicyRule {
      name: "Transactions must be <= 5ETH".to_string(),
      method: "eth_sendTransaction".to_string(),
      action: PolicyRuleAction::Allow,
      conditions: vec![value_condition],
  };

  let request = UpdatePolicyBody {
      name: Some("Transactions must be <= 5ETH".to_string()),
      rules: Some(vec![value_rule]),
      owner_id: None,
      owner: None,
  };

  let policy = client
      .policies()
      .update("fmfdj6yqly31huorjqzq38zc", request, &authorization_context)
      .await?;

  println!("Updated policy: {}", policy.name);
  ```

  ### Parameters and Returns

  See the Rust SDK documentation for detailed parameter and return types, including embedded examples:

  * [PoliciesClient::update](https://docs.rs/privy-rs/latest/privy_rs/subclients/struct.PoliciesClient.html#method.update)

  For REST API details, see the [API reference](/api-reference/policies/update).
</View>

<View title="Go" icon="golang">
  To update a policy with the Go SDK, use the `Update` method on the `Policies` service. An authorization context is required.

  ### Usage

  ```go  theme={"system"}
  import "github.com/privy-io/go-sdk/authorization"

  authCtx := &authorization.AuthorizationContext{
      PrivateKeys: []string{"authorization-key"},
  }

  policy, err := client.Policies.Update(
      context.Background(),
      "policy-id",
      privy.PolicyUpdateParams{
          Name: privy.String("updated-policy"),
      },
      privy.WithAuthorizationContext(authCtx),
  )
  if err != nil {
      log.Fatalf("failed to update policy: %v", err)
  }

  fmt.Println("Updated policy:", policy.ID)
  ```

  ### Parameters and Returns

  See the [API reference](/api-reference/policies/update) for more details.
</View>

<View title="REST API" icon="terminal">
  To update an existing policy, make a `PATCH` request to:

  ```sh  theme={"system"}
  https://api.privy.io/v1/policies/<policy_id>
  ```

  Replacing `<policy_id>` with the ID of your desired policy.

  <Tip>
    In the request headers, make sure to include Privy's [required authentication
    headers](/basics/rest-api/setup#authentication) and [headers that may be required for your app's
    wallet API setup](/basics/rest-api/quickstart#2-sign-a-message).
  </Tip>

  ## **Body**

  In the request body, include the following fields:

  <ParamField path="name" type="string">
    (Optional) New name to assign to policy.
  </ParamField>

  <ParamField path="rules" type="Rule">
    (Optional) New list of `Rule` objects describing what rules to apply to each RPC method (e.g.
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

  Any fields not included in the `PATCH` request body will remain unchanged from the original policy.

  ## **Response**

  If the policy is updated successfully, the response will include the full updated policy object.

  <ResponseField name="id" type="string">
    Unique ID for the policy.
  </ResponseField>

  <ResponseField name="version" type="'1.0'">
    Version of the policy. Currently, 1.0 is the only version.
  </ResponseField>

  <ResponseField name="name" type="string">
    Updated name of the policy.
  </ResponseField>

  <ResponseField name="chain_type" type="'ethereum'">
    Chain type for wallets that the policy will be applied to.
  </ResponseField>

  <ResponseField name="rules" type="Rule">
    Updated list of `Rule` objects describing what rules to apply to each RPC method (e.g.
    `'eth_sendTransaction'`) that the wallet can take. [Learn more about
    `Rules`](/controls/policies/overview#rules).
  </ResponseField>

  <ResponseField type="string | null" name="owner_id">
    The key quorum ID of the owner of the policy, whose signature is required to modify the policy.
  </ResponseField>

  ## Example

  As an example, a sample request to update the `rules` of a policy with ID `fmfdj6yqly31huorjqzq38zc` might look like the following:

  ```bash  theme={"system"}
  $ curl --request PATCH https://api.privy.io/v1/policies/fmfdj6yqly31huorjqzq38zc \
  -u "<your-privy-app-id>:<your-privy-app-secret>" \
  -H "privy-app-id: <your-privy-app-id>" \
  -H "privy-authorization-signature: <authorization-signature-for-request>" \
  -H 'Content-Type: application/json' \
  -d '{
      "rules": [{
        "name": "Allowlist USDT",
        "method": "eth_sendTransaction",
        "conditions": [
            {
                "field_source": "ethereum_transaction",
                "field": "to",
                "operator": "eq",
                "value": "0xdAC17F958D2ee523a2206206994597C13D831ec7"
            }
        ],
        "action": "ALLOW"
      }]
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
        "name": "Allowlist USDT",
        "method": "eth_sendTransaction",
        "conditions": [
          {
            "field_source": "ethereum_transaction",
            "field": "to",
            "operator": "eq",
            "value": "0xdAC17F958D2ee523a2206206994597C13D831ec7"
          }
        ],
        "action": "ALLOW",
        "id": "allow-list-usdt-18381838"
      }
    ],
    "owner_id": "fmfdj6yqly31huorjqzq38zc"
  }
  ```
</View>
\n