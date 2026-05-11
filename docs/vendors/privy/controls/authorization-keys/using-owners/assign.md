> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Owning resources with owners

To have an owner own a resource, you can pass an identifier for the owner in the `owner` field of the request to create or update a resource.

<Tabs>
  <Tab title="Users">
    To assign a user as the owner of a resource, in the request to create or update the resource, pass `{user_id: 'insert-user-id-of-owner'}` object in the `owner` field of your request.

    Refer to the following guides for:

    * [Creating a wallet with a user owner](/wallets/wallets/create/create-a-wallet#rest-api)
    * [Updating a wallet to have a user owner](/wallets/wallets/update-a-wallet#rest-api)
  </Tab>

  <Tab title="Authorization key">
    To assign an authorization key as the owner of a resource, in the request to create or update the resource, pass a `{public_key: 'insert-public-key'}` object in the `owner` field of your request.

    Refer to the following guides for:

    * [Creating a wallet with a authorization key owner](/wallets/wallets/create/create-a-wallet#rest-api)
    * [Updating a wallet to have an authorization key owner](/wallets/wallets/update-a-wallet#rest-api)
    * [Creating a policy with an authorization key owner](/controls/policies/create-a-policy#rest-api)
    * [Updating a policy to have an authorization key owner](/controls/policies/update-a-policy#rest-api)
  </Tab>

  <Tab title="Key quorums">
    To assign a key quorum as the owner a resource, in the request to create or update the resource, pass your key quorum ID in the `owner_id` field of your request.

    Refer to the following guides for:

    * [Creating a wallet with a key quorum owner](/wallets/wallets/create/create-a-wallet#rest-api)
    * [Updating a wallet to have a key quorum owner](/wallets/wallets/update-a-wallet#rest-api)
    * [Creating a policy with a key quorum owner](/controls/policies/create-a-policy#rest-api)
    * [Updating a policy to have a key quorum owner](/controls/policies/update-a-policy#rest-api)
  </Tab>
</Tabs>
\n