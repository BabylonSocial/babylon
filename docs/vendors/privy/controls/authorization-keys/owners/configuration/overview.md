> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

At a high-level, you should determine the minimal permissions your users, your app, and any third parties require for your wallets. Then, **configure each wallet with appropriate owners and additional signers to reflect your desired permissions**.

## Permissions

Owners and signers differ in the permissions over wallets as outlined below.

|                                 | Owners | Signers |
| ------------------------------- | ------ | ------- |
| Sign messages                   | ✅      | ✅       |
| Send transactions               | ✅      | ✅       |
| Update policies                 | ✅      | ❌       |
| Update owners                   | ✅      | ❌       |
| Update signers                  | ✅      | ❌       |
| Export wallet                   | ✅      | ❌       |
| Can be configured with policies | ✅      | ✅       |

View common use cases around configuring owners and signers for wallets in the following guides.

<CardGroup cols={2}>
  <Card title="Self-custodial user wallets" icon="user" href="/controls/authorization-keys/owners/configuration/user">
    Create self-custodial user wallets and enable offline actions, server-side transactions, and
    more.
  </Card>

  <Card title="Programmable controls" icon="server" href="/controls/authorization-keys/owners/configuration/programmable">
    Create wallets with custom approval configurations and give scoped controls to third-parties.
  </Card>
</CardGroup>
\n