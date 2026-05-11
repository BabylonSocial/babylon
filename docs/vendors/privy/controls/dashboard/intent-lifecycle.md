> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Lifecycle of an intent

Every intent moves through a series of statuses from creation to resolution. Understanding these statuses helps your team track proposals and build automation around intent outcomes.

## Status overview

| Status                      | Description                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------- |
| [**Pending**](#pending)     | Awaiting review. Reviewers have not yet met the approval threshold.                                  |
| [**Granted**](#granted)     | Authorized by the currently logged in dashboard user. Awaiting more approvals to satisfy the quorum. |
| [**Executed**](#executed)   | Enough reviewers approved and the action completed successfully.                                     |
| [**Failed**](#failed)       | Enough reviewers approved, but the action failed during execution.                                   |
| [**Rejected**](#rejected)   | The intent has been cancelled by a team member.                                                      |
| [**Expired**](#expired)     | The approval window elapsed without enough approvals.                                                |
| [**Dismissed**](#dismissed) | The underlying resource changed or was deleted, invalidating the intent.                             |

### Pending

When a team member or the API proposes an intent, it starts in the **Pending** status. The intent remains pending until one of the following occurs:

* Enough reviewers approve to meet the authorization threshold (transitions to **Executed** or **Failed**).
* A team member cancels the proposal (transitions to **Rejected**).
* The approval window elapses without enough approvals (transitions to **Expired**).
* The underlying resource is modified or deleted (transitions to **Dismissed**).

While pending, team members in the assigned key quorum can view the intent on the [Approvals](https://dashboard.privy.io/apps?page=approvals) page, inspect the proposed action, and submit their approval.

### Granted

An intent moves to **Granted** when the currently authenticated team member has signed the request but still does not have sufficient approval to execute.

*This state is unique to the authenticated team member, and not shared across the team.*

At this point, the intent is still pending and awaiting review from more members of the quorum.

### Executed

An intent moves to **Executed** when the final approval meets the authorization threshold, and the execution succeeds. The final approval that triggers execution requires a double confirmation on the Dashboard. Once confirmed, the proposed action completes automatically -- the transaction is signed and broadcasted or the wallet or policy is updated.

After execution, the intent's `action_result` field contains the response. For transaction intents, this includes the transaction hash. [Fetch the intent](/controls/dashboard/fetch-intent) or listen to the `intent.executed` webhook to retrieve these results.

### Failed

An intent moves to **Failed** when the final approval meets the authorization threshold, but the execution fails.

Intent execution can fail for various reasons such as a policy blocking the transaction or if there is insufficient gas or balance to transact.

At this point, the intent is in a terminal state and must be recreated to try again.

### Rejected

The creator of an intent can cancel it at any time from the [Approvals](https://dashboard.privy.io/apps?page=approvals) page by selecting **Cancel proposal**. For intents proposed via the REST API, any team member can cancel via the [Approvals](https://dashboard.privy.io/apps?page=approvals) page.

Once rejected, the intent is in a terminal state and cannot execute.

### Expired

Intents expire 72 hours after creation. If the approval threshold has not been met within that window, the intent moves to **Expired** and can no longer accept approvals.

Once expired, the intent is in a terminal state and cannot execute.

<Tip>To retry an expired intent, propose a new intent with the same parameters.</Tip>

### Dismissed

An intent is automatically dismissed when the underlying resource changes or is deleted. This prevents stale proposals from executing against a resource that no longer matches the original intent.

When this may happen:

* Updating a wallet dismisses all pending intents for that wallet.
* Deleting a policy dismisses all pending policy and rule intents for that policy.

## Next steps

<CardGroup cols={2}>
  <Card title="Fetch intent" icon="code" href="/controls/dashboard/fetch-intent">
    Retrieve intent status and execution results via the API.
  </Card>

  <Card title="Review intents" icon="fingerprint" href="/controls/dashboard/approvals">
    Approve or reject intents in the Privy Dashboard.
  </Card>
</CardGroup>
\n