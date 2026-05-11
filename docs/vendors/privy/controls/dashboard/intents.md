> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Propose intents for review

For resources owned by a key quorum of team members, propose **intents** to make changes such as wallet updates, policy updates, signatures, or transactions.

Once a team member submits an intent, it is queued for manual review by the team members in the assigned key quorum. Team members can then review the proposed change in the Dashboard and decide to approve or reject it. Once enough reviewers approve, the intent executes.

<img src="https://mintcdn.com/privy-c2af3412/dohNl2t3r3C-HNyO/images/manual-approvals-flow.png?fit=max&auto=format&n=dohNl2t3r3C-HNyO&q=85&s=bf4359a7219d82a28ee7a14ea73195b6" alt="Manual approvals flow chart" data-og-width="1356" width="1356" data-og-height="1309" height="1309" data-path="images/manual-approvals-flow.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/dohNl2t3r3C-HNyO/images/manual-approvals-flow.png?w=280&fit=max&auto=format&n=dohNl2t3r3C-HNyO&q=85&s=3b04b2c190729eab854920bedb51f901 280w, https://mintcdn.com/privy-c2af3412/dohNl2t3r3C-HNyO/images/manual-approvals-flow.png?w=560&fit=max&auto=format&n=dohNl2t3r3C-HNyO&q=85&s=49bd60b4062198a27b5bb70921e76408 560w, https://mintcdn.com/privy-c2af3412/dohNl2t3r3C-HNyO/images/manual-approvals-flow.png?w=840&fit=max&auto=format&n=dohNl2t3r3C-HNyO&q=85&s=bbac6aea2dda0e4bc14b1ba3dea81468 840w, https://mintcdn.com/privy-c2af3412/dohNl2t3r3C-HNyO/images/manual-approvals-flow.png?w=1100&fit=max&auto=format&n=dohNl2t3r3C-HNyO&q=85&s=212fa0212cf9b8feed3d27f5a9f682a6 1100w, https://mintcdn.com/privy-c2af3412/dohNl2t3r3C-HNyO/images/manual-approvals-flow.png?w=1650&fit=max&auto=format&n=dohNl2t3r3C-HNyO&q=85&s=f722ad8631af2932018484e6eb1247ae 1650w, https://mintcdn.com/privy-c2af3412/dohNl2t3r3C-HNyO/images/manual-approvals-flow.png?w=2500&fit=max&auto=format&n=dohNl2t3r3C-HNyO&q=85&s=8f0c99f708c8bda20f89d2d6764908a3 2500w" />

There are two ways to propose intents:

* **Dashboard:** From the **Wallets** and **Policies** pages, create an intent to update an existing wallet or policy owned by a key quorum of your team members.
* **REST API:** Create an intent to update a wallet, update a policy, or execute a signature or transaction.

<Info>
  Intents expire 72 hours after creation. Reviewers must [approve](/controls/dashboard/approvals)
  them within this window.
</Info>

Learn more about proposing intents for the following flows.

<Columns cols={3}>
  <Card title="Authorize transaction" icon="paper-plane" href="/controls/dashboard/intents#authorize-a-transaction">
    Propose an RPC intent to send a transaction
  </Card>

  <Card title="Update wallet" icon="wallet" href="/controls/dashboard/intents#update-wallet">
    Propose a wallet intent for review
  </Card>

  <Card title="Update policy" icon="file" href="/controls/dashboard/intents#update-policy">
    Propose a policy intent for review
  </Card>
</Columns>

***

## Authorize a transaction

Propose an intent to authorize and execute a signature or transaction via the REST API. The Dashboard does not currently support proposing RPC intents.

### REST API

To propose an RPC intent, make a `POST` request to

```sh  theme={"system"}
https://api.privy.io/v1/intents/wallets/{wallet_id}/rpc
```

This endpoint accepts the same request body as the synchronous [**RPC**](/api-reference/wallets/ethereum/eth-send-transaction) endpoint but does **not** require authorization signatures in the request. Instead, the intent is queued for manual review and executes once enough reviewers approve.

From the response, note the returned `intent_id`. Use this ID to check approval progress and execution results.

View the full API reference for this endpoint below.

<Card title="Create an intent to execute a signature or transaction" icon="arrow-right" horizontal href="/api-reference/intents/rpc-intent">
  View API reference for submitting an RPC intent.
</Card>

***

## Update wallet

Propose an intent to update a wallet via the Dashboard or REST API.

### Dashboard

Visit the [**Wallets**](https://dashboard.privy.io/apps?page=wallets) page and select the target wallet.

Click **Update wallet**, make the desired changes, then select **Propose changes** to submit the intent for review.

### REST API

To propose a wallet intent, make a `PATCH` request to

```sh  theme={"system"}
https://api.privy.io/v1/intents/wallets/{wallet_id}
```

This endpoint accepts the same request body as the synchronous [**Update wallet**](/api-reference/wallets/update) endpoint but does **not** require authorization signatures in the request. Instead, the intent is queued for manual review and executes once enough reviewers approve.

From the response, note the returned `intent_id`. Use this ID to check approval progress and execution results.

View the full API reference for this endpoint below:

<Card title="Create an intent to update a wallet" icon="arrow-right" horizontal href="/api-reference/intents/update-wallet">
  View API reference for submitting a wallet intent.
</Card>

***

## Update policy

Propose an intent to update a policy via the Dashboard or REST API.

### Dashboard

Visit the [**Policies**](https://dashboard.privy.io/apps?page=policies) page and select the target policy.

Make the desired changes and click **Propose changes** to submit the intent for review.

### REST API

To propose a policy intent, make a `PATCH` request to

```sh  theme={"system"}
https://api.privy.io/v1/intents/policies/{policy_id}
```

This endpoint accepts the same request body as the synchronous [**Update policy**](/api-reference/policies/update) endpoint but does **not** require authorization signatures in the request. Instead, the intent is queued for manual review and executes once enough reviewers approve.

From the response, note the returned `intent_id`. Use this ID to check approval progress and execution results.

View the full API reference for this endpoint below:

<Card title="Create an intent to update a policy" icon="arrow-right" horizontal href="/api-reference/intents/update-policy">
  View API reference for submitting a policy intent.
</Card>

***

## Update policy rules

Propose an intent to add, edit, or remove rules for a policy via the Dashboard or REST API.

### Dashboard

Visit the [**Policies**](https://dashboard.privy.io/apps?page=policies) page, select a policy, and navigate to its rules.

Make the desired changes and click **Propose changes** to submit the intent for review.

### REST API

Each rule action uses a different HTTP method and endpoint:

| Action        | Method   | Endpoint                                           |
| ------------- | -------- | -------------------------------------------------- |
| Add a rule    | `POST`   | `/v1/intents/policies/{policy_id}/rules`           |
| Update a rule | `PATCH`  | `/v1/intents/policies/{policy_id}/rules/{rule_id}` |
| Delete a rule | `DELETE` | `/v1/intents/policies/{policy_id}/rules/{rule_id}` |

Each endpoint accepts the same request body as its synchronous counterpart ([create](/api-reference/policies/rules/create), [update](/api-reference/policies/rules/update), [delete](/api-reference/policies/rules/delete)) but does **not** require authorization signatures in the request. Instead, the intent is queued for manual review and executes once enough reviewers approve.

From the response, note the returned `intent_id`. Use this ID to check approval progress and execution results.

View the full API reference for this endpoint below:

<Card title="Create an intent to add a rule" icon="arrow-right" horizontal href="/api-reference/intents/create-rule">
  View API reference for submitting a rule intent.
</Card>

***

## Update key quorum

Your app can also propose an update to the key quorum itself -- changing its name, members, or authorization threshold.

This intent must be approved by a sufficient number of members of the existing quorum in order to be executed.

### Dashboard

Visit the [**Authorization**](https://dashboard.privy.io/apps?page=authorization-keys) page and select the target key quorum.

Select **Update key quorum**, make the desired changes, and select **Propose changes** to submit the intent for review.

### REST API

To propose a key quorum intent, make a `PATCH` request to

```sh  theme={"system"}
https://api.privy.io/v1/intents/key_quorums/{key_quorum_id}
```

This endpoint accepts the same request body as the synchronous [**Update key quorum**](/api-reference/key-quorums/update) endpoint but does **not** require authorization signatures in the request. Instead, the intent is queued for manual review and executes once enough reviewers approve.

From the response, note the returned `intent_id`. Use this ID to check approval progress and execution results.

View the full API reference for this endpoint below.

<Card title="Create an intent to update a key quorum" icon="arrow-right" horizontal href="/api-reference/intents/update-key-quorum">
  View API reference for submitting a key quorum intent.
</Card>

## Next steps

<CardGroup cols={2}>
  <Card title="Review intents" icon="fingerprint" href="/controls/dashboard/approvals">
    Approve or reject intents in the Privy Dashboard.
  </Card>

  <Card title="Intent lifecycle" icon="arrows-spin" href="/controls/dashboard/intent-status">
    Learn more about the lifecycle of an intent.
  </Card>
</CardGroup>
\n