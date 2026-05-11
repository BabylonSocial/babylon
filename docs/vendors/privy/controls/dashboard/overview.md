> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Manual approvals

Manual approvals add a human review step before sensitive actions take effect. Team members can review, authorize, or reject proposed changes to wallets or policies or proposed transactions in the Privy Dashboard.

<Info>
  Manual approvals is an Enterprise feature. Reach out to [sales@privy.io](mailto:sales@privy.io) to
  request access for your app.
</Info>

<Tip>
  All authorizations performed through the Privy Dashboard are secured by biometric and/or TOTP MFA.
</Tip>

<img src="https://mintcdn.com/privy-c2af3412/dohNl2t3r3C-HNyO/images/manual-approvals-splash.png?fit=max&auto=format&n=dohNl2t3r3C-HNyO&q=85&s=30f501a5841d281608b294dd803f9d5e" alt="images/manual-approvals-splash.png" data-og-width="3686" width="3686" data-og-height="2633" height="2633" data-path="images/manual-approvals-splash.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/dohNl2t3r3C-HNyO/images/manual-approvals-splash.png?w=280&fit=max&auto=format&n=dohNl2t3r3C-HNyO&q=85&s=8e7fcd9e15a14de32517080bd4cca122 280w, https://mintcdn.com/privy-c2af3412/dohNl2t3r3C-HNyO/images/manual-approvals-splash.png?w=560&fit=max&auto=format&n=dohNl2t3r3C-HNyO&q=85&s=e712b98769709bba2b2d7a72e767a8bd 560w, https://mintcdn.com/privy-c2af3412/dohNl2t3r3C-HNyO/images/manual-approvals-splash.png?w=840&fit=max&auto=format&n=dohNl2t3r3C-HNyO&q=85&s=ca7532f9418cbd3a2f33d2c43c6d20cd 840w, https://mintcdn.com/privy-c2af3412/dohNl2t3r3C-HNyO/images/manual-approvals-splash.png?w=1100&fit=max&auto=format&n=dohNl2t3r3C-HNyO&q=85&s=a063e7b785d36414238e56268e5a9aae 1100w, https://mintcdn.com/privy-c2af3412/dohNl2t3r3C-HNyO/images/manual-approvals-splash.png?w=1650&fit=max&auto=format&n=dohNl2t3r3C-HNyO&q=85&s=f4079b7cb23f0eb5ebcaa7afcd8457ec 1650w, https://mintcdn.com/privy-c2af3412/dohNl2t3r3C-HNyO/images/manual-approvals-splash.png?w=2500&fit=max&auto=format&n=dohNl2t3r3C-HNyO&q=85&s=78e6eac6daef4ce2388c6770b4224b4a 2500w" />

## How it works

To set up manual approvals for your Privy account:

<Steps>
  <Step title="Create a group of reviewers">
    Create a [key quorum](/controls/key-quorum/overview) of team members from your Privy account in the Dashboard. Configure the members of the group and the approval threshold needed to reach consensus.

    This group of reviewers can later approve or reject proposed intents such as wallet or policy updates, signatures, and transactions via the Privy Dashboard.
  </Step>

  <Step title="Assign the review group as the owner of a resource">
    When creating a [wallet](/api-reference/wallets/create) or [policy](/api-reference/policies/create) via the Privy Dashboard or API, assign the key quorum as the [owner](/controls/authorization-keys/owners/overview). The quorum must then review and approve any proposed updates.

    For wallets, the quorum must also approve proposed signatures or transactions. Your app can alternatively add the quorum as a [signer](/controls/authorization-keys/owners/overview) on the wallet to give it permission to approve certain signatures and transactions without the ability to update the wallet itself.
  </Step>

  <Step title="Propose an intent for review">
    Via the Privy API or Dashboard, propose an **intent** such as updating a wallet, updating a policy, or executing a signature or transaction.

    The intent then enters a review queue for team members in the assigned key quorum.
  </Step>

  <Step title="Review and approve or reject the intent">
    Team members review the intent on the [Approvals](https://dashboard.privy.io/apps?page=approvals) page of the Dashboard. Each reviewer inspects the proposed change and decides to approve or reject it. Approvals are secured by biometric or TOTP MFA.

    Once enough team members approve (based on the quorum threshold), the proposed action executes.
  </Step>
</Steps>

<img src="https://mintcdn.com/privy-c2af3412/n0WBs_xVfDqajUiO/images/manual-approvals-overview-diagram.png?fit=max&auto=format&n=n0WBs_xVfDqajUiO&q=85&s=46b0c335c2ac33fd7334f85b2df6b148" alt="Manual approvals flow diagram" data-og-width="1356" width="1356" data-og-height="878" height="878" data-path="images/manual-approvals-overview-diagram.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/n0WBs_xVfDqajUiO/images/manual-approvals-overview-diagram.png?w=280&fit=max&auto=format&n=n0WBs_xVfDqajUiO&q=85&s=9f281253f70dbc6599cc87af5186e1a5 280w, https://mintcdn.com/privy-c2af3412/n0WBs_xVfDqajUiO/images/manual-approvals-overview-diagram.png?w=560&fit=max&auto=format&n=n0WBs_xVfDqajUiO&q=85&s=e215451219a86766cf02835775d3a1f2 560w, https://mintcdn.com/privy-c2af3412/n0WBs_xVfDqajUiO/images/manual-approvals-overview-diagram.png?w=840&fit=max&auto=format&n=n0WBs_xVfDqajUiO&q=85&s=ab539087072d82448bee3aa1046d6aa8 840w, https://mintcdn.com/privy-c2af3412/n0WBs_xVfDqajUiO/images/manual-approvals-overview-diagram.png?w=1100&fit=max&auto=format&n=n0WBs_xVfDqajUiO&q=85&s=f5bc0448789caa175600d50d62eaf37d 1100w, https://mintcdn.com/privy-c2af3412/n0WBs_xVfDqajUiO/images/manual-approvals-overview-diagram.png?w=1650&fit=max&auto=format&n=n0WBs_xVfDqajUiO&q=85&s=215e2a1db69333c93684d5c2fdafa249 1650w, https://mintcdn.com/privy-c2af3412/n0WBs_xVfDqajUiO/images/manual-approvals-overview-diagram.png?w=2500&fit=max&auto=format&n=n0WBs_xVfDqajUiO&q=85&s=3562661dc7ef98d8789e6abd3e517e9d 2500w" />

## Get started

Get started with manual approvals using the guides below.

<Columns cols={2}>
  <Card title="Set up reviewers" icon="users" href="/controls/dashboard/key-quorum">
    Create a key quorum of team members who review intents.
  </Card>

  <Card title="Propose intents" icon="paper-plane" href="/controls/dashboard/intents">
    Propose intents to authorize a transaction or update a wallet or policy.
  </Card>

  <Card title="Review intents" icon="fingerprint" href="/controls/dashboard/approvals">
    Approve or reject intents in the Privy Dashboard.
  </Card>

  <Card title="Intent lifecycle" icon="arrows-spin" href="/controls/dashboard/intent-status">
    Understand intent statuses from pending to executed.
  </Card>

  <Card title="Fetch intent" icon="code" href="/controls/dashboard/fetch-intent">
    Retrieve intent status and execution results via the API.
  </Card>

  <Card title="Intent webhooks" icon="bell" href="/controls/dashboard/intent-webhooks">
    Receive real-time notifications when intents are created or authorized.
  </Card>
</Columns>
\n