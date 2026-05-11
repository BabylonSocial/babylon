> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Authorization signatures

> Securing Privy API requests with authorization signatures

## Overview

[Owners](/controls/overview) provide an additional layer of security for actions taken by your app’s wallets. This primitive helps ensure that only actions explicitly authorized by your server are executed on user wallets.

When you specify an owner of a resource, all requests to update that resource must be signed with the associated key (user, authorization key, or key quorum). Requests to take actions with a wallet must also be signed by the wallet’s owner. This security measure verifies that each request comes from your authorized backend systems and helps prevent unauthorized operations.

<Tip>
  Authorization signatures are an important security measure and we strongly recommend registering
  authorization keys for all production resources.
</Tip>

<Info>
  Learn more about [owners](/controls/authorization-keys/owners/overview) and [authorization
  signatures](/controls/authorization-keys/keys/overview).
</Info>

### When are they necessary?

Authorization signatures are necessary in the following cases.

#### Updating wallets and policies

All critical resources, such as wallets and policies, have an `owner_id` field, which indicates the authorization key or quorum whose signatures are required in order to modify the given resource.

This means, if the `owner_id` is set, authorization signatures are required for all `PATCH` and `DELETE` requests to the resource. This includes:

* `PATCH /v1/wallets/[wallet_id]`
* `PATCH /v1/policies/[policy_id]`
* `DELETE /v1/policies/[policy_id]`

Signatures from the wallet's owner are required to take actions on a wallet by default. If an `owner_id` is set, authorization signatures are required for:

* `POST /v1/wallets/<wallet_id>/rpc`

#### Executing actions with wallets

Executing actions with wallets requires authorization signature(s) from the wallet's owner, if the wallet has an owner. This includes:

* `POST /v1/wallets/[wallet_id]/rpc`

#### Updating key quorums

Though key quorums do not have owners, updating or deleting a key quorum requires a satisfying set of signatures from the *existing* key quorum that meet the authorization threshold. This includes:

* `PATCH /v1/key_quorums/[key_quorum_id]`
* `DELETE /v1/key_quorum/[key_quorum_id]`

Signatures from the wallet's owner are required to take actions on a wallet by default. If an `owner_id` is set, authorization signatures are required for:

## Usage

At a high-level, the flow of using authorization signatures is as follows:

<Steps>
  <Step title="Get your private keys">
    Get the private keys that you will use to sign your request. This might be retrieved from the
    private keys you saved locally (app owners and key quorum owners) or requested from the Privy
    API using a user JWT (user owners).
  </Step>

  <Step title="Construct your request">
    Construct the request that you intend to make to Privy. This might be updating or deleting
    wallets, updating or deleting policies, updating or deleting key quorums, or taking actions with
    wallets.
  </Step>

  <Step title="Sign the request">Format and sign the request with your private key(s).</Step>

  <Step title="Include the signature as a request header">
    Finally, when making your request to Privy, include the authorization signature(s) as a string
    in the `privy-authorization-signature` header.
  </Step>
</Steps>

### Getting authorization keys

To start, get the private keys for the authorization key(s) that owner your resource.

If the owner of your resource is an authorization key, get the private key(s) that you saved locally when creating your owner in the Privy API or Dashboard. Privy does not save these private key(s) and cannot help you recover them.

If the owner of your resource is a user, request a time-bound user key to take actions with or update the resource. Follow the guide below to learn how to request user keys given a user's access token.

<CardGroup cols={1}>
  <Card title="Using user owners" href="/controls/authorization-keys/keys/create/user/overview">
    Request keys for user owners.
  </Card>
</CardGroup>

<CardGroup cols={1}>
  <Card title="Get user keys" href="/controls/authorization-keys/keys/create/user/overview">
    Request a user key with a user's access token to sign requests to the Privy API.
  </Card>
</CardGroup>

### Signing requests

Next, sign the request with your authorization key(s). Make sure to correctly format your request before signing the request.

If the owner of your resource is a key quorum, make sure to sign the request with enough authorization keys to meet the authorization threshold.

Follow this guide for instructions on how to correctly sign your request:

<CardGroup cols={1}>
  <Card title="Sign requests" href="/controls/authorization-keys/using-owners/sign">
    Learn how to sign requests to the Privy API.
  </Card>
</CardGroup>

### Setting required headers

Once you have collected your authorization signature(s), set the following header on your request to the Privy API.

<ParamField header="privy-authorization-signature" type="string">
  The authorization signature. If multiple signatures are required, include them as a
  comma-delimited string.
</ParamField>

<Tip>
  If you are using Privy's SDKs, the appropriate authorization signature header is added
  automatically to your requests.
</Tip>
\n