> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Create a custodial wallet

Privy enables you to create custodial wallets that are managed through licensed custody partners. Custodial wallets provide institutional-grade custody controls while maintaining the same programmability and policy enforcement as standard embedded wallets.

## Usage

<Tabs>
  <Tab title="REST API">
    To create a custodial wallet via REST API, make a `POST` request to:

    ```bash  theme={"system"}
    https://api.privy.io/v1/custodial_wallets
    ```

    ### Body

    <ParamField path="chain_type" type="'ethereum'" required>
      The blockchain type for the custodial wallet. An `ethereum` type wallet will create a custodial wallet on Base.
    </ParamField>

    <ParamField path="provider" type="'bridge'" required>
      The custodian of the wallet.
    </ParamField>

    <ParamField path="provider_user_id" type="string" required>
      The user ID of the beneficiary of the custodial wallet, provided by the licensing provider after KYC.
    </ParamField>

    <ParamField path="owner" type="{user_id: string} | {public_key: string}">
      The entity that can authorize transactions from the custodial wallet and configure additional signers.
    </ParamField>

    <ParamField path="additional_signers" type="{signer_id: string, override_policy_ids: string[]}[]">
      Additional signers for the custodial wallet. Each signer can have a list of policy IDs that override the base policy IDs set on the wallet.
    </ParamField>

    <ParamField path="policy_ids" type="string[]">
      List of policy IDs to enforce on the wallet.
    </ParamField>

    ### Example

    ```bash  theme={"system"}
    curl --request POST https://api.privy.io/v1/custodial_wallets \
      -u "<your-privy-app-id>:<your-privy-app-secret>" \
      -H "privy-app-id: <your-privy-app-id>" \
      -H 'Content-Type: application/json' \
      -d '{
        "chain_type": "ethereum",
        "provider": "bridge",
        "provider_user_id": "user_xxxxx",
        "owner": {
          "public_key": "-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEbL2Fl6Um/Ne6hXJl1i7oCU4tqmnR\nFWd4b9xVc6cGYFaqGgvEb/4+GCFsJu+bX+uvQvGvbXQCijIWpmIHwpRpkg==\n-----END PUBLIC KEY-----"
        }
      }'
    ```

    ### Response

    The response will include the following fields:

    <ResponseField name="id" type="string">
      Unique ID of the created wallet. This will be the primary identifier when using the wallet in the future.
    </ResponseField>

    <ResponseField name="address" type="string">
      Address of the created wallet.
    </ResponseField>

    <ResponseField name="chain_type" type="string">
      Chain type of the created wallet.
    </ResponseField>

    <ResponseField name="provider" type="string">
      The custodian of the wallet.
    </ResponseField>

    <ResponseField name="owner_id" type="string">
      The key quorum ID of the owner of the wallet. If an `owner` was passed in, this field will be populated.
    </ResponseField>

    <ResponseField name="additional_signers" type="string[]">
      The key quorum IDs of the additional signers for the wallet.
    </ResponseField>

    <ResponseField name="policy_ids" type="string[]">
      List of policy IDs for policies that are enforced on the wallet.
    </ResponseField>

    <ResponseField name="created_at" type="number">
      The creation date of the wallet, in milliseconds since midnight, January 1, 1970 UTC.
    </ResponseField>

    ```json  theme={"system"}
    {
      "id": "p12aj1whizzmklph0b36xk6n",
      "address": "0x9f284C7Eaf97b0f9B5542d83Af7F785D12E803a",
      "chain_type": "ethereum",
      "provider": "bridge",
      "owner_id": "owner_xxxxx",
      "additional_signers": [],
      "policy_ids": [],
      "created_at": 1733923425155
    }
    ```
  </Tab>
</Tabs>

## Next steps

Now that you have created a custodial wallet, you can [send funds from a custodial wallet](/wallets/custodial-wallets/sending-funds).

<CardGroup cols={3}>
  <Card title="Send funds" icon="paper-plane" href="/wallets/custodial-wallets/sending-funds">
    Execute transactions and send funds from custodial wallets
  </Card>

  <Card title="Transaction lifecycle" icon="clock" href="/wallets/custodial-wallets/transaction-lifecycle">
    Learn about the transaction lifecycle for custodial wallets
  </Card>

  <Card title="Authorization controls" icon="shield-halved" href="/wallets/custodial-wallets/advanced/authorization-controls">
    Configure policies and additional security measures for custodial wallets
  </Card>
</CardGroup>
\n