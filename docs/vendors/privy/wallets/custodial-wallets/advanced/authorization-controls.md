> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Authorization and controls

Custodial wallets support authorization controls in the same way as non-custodial wallets. You can add owners, signers, and [policies](/wallets/custodial-wallets/advanced/authorization-controls#policy-enforcement) to existing or new custodial wallets to control who can initiate transactions and modify wallet configuration.

## Meaning of `owner` for custodial wallets

For custodial wallets, the `owner` field has a different meaning than for non-custodial wallets.
Unlike non-custodial wallets, the owner for custodial wallets cannot export the wallet's private key or unilaterally execute transactions without the custodian's approval.

The `owner` field represents the authorized controller who can configure wallet policies and additional signers, as well as initiate wallet operations. The owner does **not** have the ability to export the wallet's private key. All transactions are still mediated through the custody provider's infrastructure.

### Configuration guidance

You may require an additional authorization key to sign over each transaction request by adding an owner and/or signer to the custodial wallet. This ensures integrity of the transaction request and adds an additional layer of security beyond API key authentication.

<Tip>
  You can configure just an owner, or an owner with additional signers. We recommend the latter if
  you plan to rotate keys in the future. Additional signers can also be added after the wallet is
  created.

  For detailed information on using public keys as authorization keys, see the [authorization keys documentation](/controls/authorization-keys/overview).
</Tip>

## Setting authorization controls on a custodial wallet

To create a custodial wallet with an owner, provide the `owner` argument with a public key as part of [wallet creation](/wallets/custodial-wallets/create-custodial-wallet).

You can update an existing custodial wallet's owner, signers, or policies using the `PATCH /wallets/{id}` endpoint. See the [wallets API reference](/wallets/wallets/update-a-wallet) for details.

<Tip>
  When providing the `public_key` input, make sure to include `\n` to indicate newlines in the
  public key string.
</Tip>

## Additional signers

You may also set [additional signers](/wallets/using-wallets/signers/overview) on a custodial wallet, which are authorized keys that can initiate transaction requests for the wallet according to set signer-specific policies.

## Signing transaction requests

Once a custodial wallet has an owner or signer, all requests to Privy's `/wallets/{id}/rpc` endpoint require an [authorization signature](/controls/authorization-keys/using-owners/sign/overview) in the `privy-authorization-signature` header.

## Policy enforcement

Custodial wallets support the same robust policy engine available for all Privy wallets.

<Tip>
  View the complete [Policies documentation](/controls/policies/overview) to learn about all available policy options and configuration.
</Tip>

## Next steps

<CardGroup>
  <Card title="Webhooks" icon="webhook" href="/wallets/custodial-wallets/advanced/webhooks">
    Monitor wallet events and transaction status
  </Card>

  <Card title="Send funds" icon="paper-plane" href="/wallets/custodial-wallets/sending-funds">
    Execute transactions from custodial wallets
  </Card>
</CardGroup>
\n