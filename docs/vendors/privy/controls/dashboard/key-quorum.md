> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Create a key quorum

To enable manual approvals, first create a [key quorum](/controls/key-quorum/overview) of team members who serve as reviewers. Assign this group as an owner or signer on resources so that proposed changes, signatures, and transactions require their approval before taking effect.

<Steps>
  <Step title="Invite team members to the Privy account">
    Invite team members from the [Account](https://dashboard.privy.io/account) page of the Dashboard. Give each member the **Developer** or **Admin** role so they can be enrolled in a key quorum.
  </Step>

  <Step title="Enroll team members in MFA">
    Each key quorum member **must** set up biometric or TOTP MFA for their Dashboard account.

    Team members enroll in MFA by clicking the profile icon at the bottom left of the Dashboard, selecting **Account preferences**, then clicking **MFA enrollment**.

        <img src="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/dashboard-mfa-1.png?fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=6f5db8f2d38b584fc31c282ded958f6b" alt="images/dashboard-mfa-1.png" data-og-width="5529" width="5529" data-og-height="3949" height="3949" data-path="images/dashboard-mfa-1.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/dashboard-mfa-1.png?w=280&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=4e2cfd7e07e69ed1d5b4eb0d5f07100d 280w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/dashboard-mfa-1.png?w=560&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=8a97b2ed86598125225966f35ae93bb3 560w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/dashboard-mfa-1.png?w=840&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=30ec8e51b4cfc2a59af5a83695f7fbf0 840w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/dashboard-mfa-1.png?w=1100&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=9929c3de10b531a026be4c489325c0d4 1100w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/dashboard-mfa-1.png?w=1650&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=22a971291a3c5f37ea886395b9a385b3 1650w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/dashboard-mfa-1.png?w=2500&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=c3dd6e3401ce6e5c0b3fcd8151e00306 2500w" />
  </Step>

  <Step title="Create a key quorum of team members">
    Visit the [Authorization](https://dashboard.privy.io/apps?page=authorization-keys) page and click **New key**. In the modal, select **Register key quorum**.

    Set a **Name** for the quorum and select members from the **Team members** dropdown. Then set the **Authorization threshold** -- the number of reviewers who must approve an intent before it executes.

        <img src="https://mintcdn.com/privy-c2af3412/_NYQJC6EQbjpQkbE/images/create-key-quorum.png?fit=max&auto=format&n=_NYQJC6EQbjpQkbE&q=85&s=3617222dff3cb800129efe7784b1ba4c" alt="images/create-key-quorum.png" data-og-width="3686" width="3686" data-og-height="2633" height="2633" data-path="images/create-key-quorum.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/_NYQJC6EQbjpQkbE/images/create-key-quorum.png?w=280&fit=max&auto=format&n=_NYQJC6EQbjpQkbE&q=85&s=38682229b81b75ac4d06bb08776e93f4 280w, https://mintcdn.com/privy-c2af3412/_NYQJC6EQbjpQkbE/images/create-key-quorum.png?w=560&fit=max&auto=format&n=_NYQJC6EQbjpQkbE&q=85&s=534ee1bc5e20d27065ea09a970dfef1b 560w, https://mintcdn.com/privy-c2af3412/_NYQJC6EQbjpQkbE/images/create-key-quorum.png?w=840&fit=max&auto=format&n=_NYQJC6EQbjpQkbE&q=85&s=c95e974ed140fbc5ba83fc93aabb55fe 840w, https://mintcdn.com/privy-c2af3412/_NYQJC6EQbjpQkbE/images/create-key-quorum.png?w=1100&fit=max&auto=format&n=_NYQJC6EQbjpQkbE&q=85&s=5a80480f524eb9d05d1d90f296faaf53 1100w, https://mintcdn.com/privy-c2af3412/_NYQJC6EQbjpQkbE/images/create-key-quorum.png?w=1650&fit=max&auto=format&n=_NYQJC6EQbjpQkbE&q=85&s=f2295129511d9135a0d72d737f680732 1650w, https://mintcdn.com/privy-c2af3412/_NYQJC6EQbjpQkbE/images/create-key-quorum.png?w=2500&fit=max&auto=format&n=_NYQJC6EQbjpQkbE&q=85&s=c6ebdfb3fa7c6d7637c58a8bc4590708 2500w" />
  </Step>

  <Step Assign the quorum as the owner of resources>
    When creating wallets or policies that require manual approval, set the new key quorum as the `owner`. This assigns the key quorum as the resource's Owner, requiring its members to review and approve any proposed updates, signatures, or transactions. Separately, this key quorum can be set as a Signer on a wallet, enabling that quorum to sign and send transactions.

        <img src="https://mintcdn.com/privy-c2af3412/_NYQJC6EQbjpQkbE/images/create-wallet-with-owner.png?fit=max&auto=format&n=_NYQJC6EQbjpQkbE&q=85&s=f6cd08b2de31bc7a676667449620389d" alt="images/create-wallet-with-owner.png" data-og-width="3686" width="3686" data-og-height="2633" height="2633" data-path="images/create-wallet-with-owner.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/_NYQJC6EQbjpQkbE/images/create-wallet-with-owner.png?w=280&fit=max&auto=format&n=_NYQJC6EQbjpQkbE&q=85&s=5a7073f63837a5432389f36ff90aff13 280w, https://mintcdn.com/privy-c2af3412/_NYQJC6EQbjpQkbE/images/create-wallet-with-owner.png?w=560&fit=max&auto=format&n=_NYQJC6EQbjpQkbE&q=85&s=6138eb92ba9c162ec735a7b7727ca46e 560w, https://mintcdn.com/privy-c2af3412/_NYQJC6EQbjpQkbE/images/create-wallet-with-owner.png?w=840&fit=max&auto=format&n=_NYQJC6EQbjpQkbE&q=85&s=142d3cc4220c73e2ef2fd4105b396044 840w, https://mintcdn.com/privy-c2af3412/_NYQJC6EQbjpQkbE/images/create-wallet-with-owner.png?w=1100&fit=max&auto=format&n=_NYQJC6EQbjpQkbE&q=85&s=5a9b991c9523de4233f26aba1ad220a3 1100w, https://mintcdn.com/privy-c2af3412/_NYQJC6EQbjpQkbE/images/create-wallet-with-owner.png?w=1650&fit=max&auto=format&n=_NYQJC6EQbjpQkbE&q=85&s=235a975c662ed67ef7865eb9da24acf1 1650w, https://mintcdn.com/privy-c2af3412/_NYQJC6EQbjpQkbE/images/create-wallet-with-owner.png?w=2500&fit=max&auto=format&n=_NYQJC6EQbjpQkbE&q=85&s=3cbd7b6fa1cb68b61711156c75924ff3 2500w" />

    Alternatively, set the `owner_id` on a resource via the API when [creating a wallet](/api-reference/wallets/create) or [creating a policy](/api-reference/policies/create).
  </Step>
</Steps>

## Next steps

<CardGroup cols={2}>
  <Card title="Propose intents" icon="paper-plane" href="/controls/dashboard/intents">
    Propose intents to authorize a transaction or update a wallet or policy.
  </Card>

  <Card title="Review intents" icon="fingerprint" href="/controls/dashboard/approvals">
    Approve or reject intents in the Privy Dashboard.
  </Card>

  <Card title="Intent lifecycle" icon="arrows-spin" href="/controls/dashboard/intent-status">
    Learn more about the lifecycle of an intent.
  </Card>
</CardGroup>
\n