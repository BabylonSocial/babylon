> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Review and approve proposed intents

After a team member proposes an intent, reviewers in the corresponding key quorum can review and approve it in the Privy Dashboard.

To view intents, visit the [Approvals](https://dashboard.privy.io/apps?page=approvals) page. The page lists all intents, their type, corresponding resource, and approval progress.

<img src="https://mintcdn.com/privy-c2af3412/dohNl2t3r3C-HNyO/images/manual-approvals-splash.png?fit=max&auto=format&n=dohNl2t3r3C-HNyO&q=85&s=30f501a5841d281608b294dd803f9d5e" alt="images/manual-approvals-splash.png" data-og-width="3686" width="3686" data-og-height="2633" height="2633" data-path="images/manual-approvals-splash.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/dohNl2t3r3C-HNyO/images/manual-approvals-splash.png?w=280&fit=max&auto=format&n=dohNl2t3r3C-HNyO&q=85&s=8e7fcd9e15a14de32517080bd4cca122 280w, https://mintcdn.com/privy-c2af3412/dohNl2t3r3C-HNyO/images/manual-approvals-splash.png?w=560&fit=max&auto=format&n=dohNl2t3r3C-HNyO&q=85&s=e712b98769709bba2b2d7a72e767a8bd 560w, https://mintcdn.com/privy-c2af3412/dohNl2t3r3C-HNyO/images/manual-approvals-splash.png?w=840&fit=max&auto=format&n=dohNl2t3r3C-HNyO&q=85&s=ca7532f9418cbd3a2f33d2c43c6d20cd 840w, https://mintcdn.com/privy-c2af3412/dohNl2t3r3C-HNyO/images/manual-approvals-splash.png?w=1100&fit=max&auto=format&n=dohNl2t3r3C-HNyO&q=85&s=a063e7b785d36414238e56268e5a9aae 1100w, https://mintcdn.com/privy-c2af3412/dohNl2t3r3C-HNyO/images/manual-approvals-splash.png?w=1650&fit=max&auto=format&n=dohNl2t3r3C-HNyO&q=85&s=f4079b7cb23f0eb5ebcaa7afcd8457ec 1650w, https://mintcdn.com/privy-c2af3412/dohNl2t3r3C-HNyO/images/manual-approvals-splash.png?w=2500&fit=max&auto=format&n=dohNl2t3r3C-HNyO&q=85&s=78e6eac6daef4ce2388c6770b4224b4a 2500w" />

### Reviewing and approving intents

Open the **Pending** tab to find intents awaiting review.

Select an intent to view its details: who proposed it, what resource it affects, when it expires, and how many reviewers have approved so far.

The intent detail view also shows a preview of the proposed action:

* For wallet and policy updates, a diff comparing the current state to the proposed state.
* For signatures and transactions, a preview of the transaction to sign and/or broadcast.

Once a reviewer has carefully inspected the proposal and confirmed the changes, they can click the **Approve** button and complete MFA to submit their approval.

<Warning>
  Review an intent carefully before approving. Approvals cannot be revoked after submission.
</Warning>

<Info>
  Under the hood, each approval generates an [authorization
  signature](/api-reference/authorization-signatures) over the request. Privy accumulates signatures
  and executes the intent once the threshold is met.
</Info>

#### Intent execution

If the latest approval meets the authorization threshold, **the intent executes automatically as soon as the approval is granted.**

For example, if your app creates an intent to execute a transaction with a wallet that is owned by a key quorum with an authorization threshold of 3, and 2 approvals have already been provided, Privy will automatically execute the transaction upon the 3rd approval.

### Rejecting intents

For intents proposed via the Dashboard, the creator can reject it from the [Approvals](https://dashboard.privy.io/apps?page=approvals) page by selecting **Cancel proposal**. This prevents other team members from approving the intent.

Any intent proposed via the REST API can be deleted by any team member from the [Approvals](https://dashboard.privy.io/apps?page=approvals) page using **Cancel proposal**.

### Viewing intents

The [Approvals](https://dashboard.privy.io/apps?page=approvals) page shows all intents for the app, not just those pending review.

<Tip>
  Click the link icon at the top of an intent modal to copy a deeplink. Share this link with other
  team members for easy access.
</Tip>

<Card title="Intent lifecycle" icon="arrows-spin" horizontal href="/controls/dashboard/intent-status">
  Learn more about the lifecycle of an intent.
</Card>
\n