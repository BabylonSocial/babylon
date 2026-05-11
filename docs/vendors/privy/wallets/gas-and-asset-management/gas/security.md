> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Security best practices

> Protecting your application from gas sponsorship abuse

When implementing gas sponsorship, protecting the application from abuse is critical to prevent drainage of gas sponsorship balances. Privy natively offers controls to limit total spend and set logic for when to sponsor conditionally.

## Rate limiting

To protect against abuse, consider implementing:

* **Strict rate limits** — Set per-user and per-wallet transaction limits appropriate for the use case
* **Spending pattern monitoring** — Track unusual activity and implement automatic circuit breakers for suspicious behavior
* **Maximum sponsorship amounts** — Configure spending caps to limit potential losses from exploitation
* **Backend transaction routing** — Privy aggressively rate limits transactions sent from the client. For more granular control over limiting, [relay transactions](/controls/authorization-keys/keys/create/user/request) from the server

<Note>
  For a detailed implementation guide on custom rate limiting for spending controls, see the [custom
  gas sponsorship rate limits recipe](/recipes/gas-sponsorship-rate-limits).
</Note>

## Threat models

Understanding common attack vectors helps prevent gas sponsorship abuse. Here are some known threat models to protect against:

### Solana rent refund vulnerability

On Solana, when Associated Token Accounts (ATAs) are created during sponsored transactions, the rent deposit refund upon account closure goes to the account owner, not the fee payer. This creates a potential exploitation vector where users can profit from the rent refunds while the application pays the creation fees.

**Example scenario:** A user swapping USDC to SOL could gain approximately \$0.40 per transaction from the rent refund, effectively draining gas sponsorship funds through repeated transactions.

**Why this happens:** Some APIs (like Jupiter) automatically include the `CloseAccount` instruction for transfers that will close the ATA and refund the rent to the user.

### Protection strategy

If the application plans to reuse a limited set of tokens, strip the `CloseAccount` instruction from transactions to prevent users from profiting off the rent refunds.

Here's an example of how to remove the `CloseAccount` instruction from a Solana transaction:

```typescript  theme={"system"}
import {Transaction, TransactionInstruction} from '@solana/web3.js';

function stripCloseAccountInstruction(transaction) {
  // Filter out any CloseAccount instructions from the transaction
  const filteredInstructions = transaction.instructions.filter((instruction) => {
    // CloseAccount instruction has discriminator 0x0a (10 in decimal)
    const discriminator = instruction.data[0];
    return discriminator !== 0x0a;
  });

  // Create a new transaction with the filtered instructions
  const newTransaction = new Transaction();
  for (const instruction of filteredInstructions) {
    newTransaction.add(instruction);
  }

  // Copy signers from original transaction
  newTransaction.feePayer = transaction.feePayer;
  newTransaction.recentBlockhash = transaction.recentBlockhash;

  return newTransaction;
}
```

This approach keeps the ATAs open for future transactions, reducing creation costs and eliminating the rent refund exploit.

## Implementation recommendations

<AccordionGroup>
  <Accordion title="Set up monitoring and alerts">
    Implement monitoring for:

    * Unusual transaction volume spikes from individual users or wallets
    * Abnormal gas consumption patterns
    * Repeated failed transactions (possible attack attempts)
    * Total daily/weekly spending approaching configured limits

    Configure alerts to notify the team when suspicious activity is detected.
  </Accordion>

  <Accordion title="Implement gradual limit increases">
    For new users or wallets, start with conservative transaction limits and gradually increase them based on:

    * Account age
    * Transaction history
    * User verification level
    * Application-specific trust signals

    This minimizes risk from newly created accounts used for exploitation.
  </Accordion>

  <Accordion title="Use transaction simulation">
    Before sponsoring transactions, simulate them to:

    * Verify they will succeed
    * Check gas estimates are reasonable
    * Detect unusual patterns in contract interactions
    * Identify potentially malicious behavior

    This prevents wasting gas on transactions designed to fail or exploit gas estimation.
  </Accordion>

  <Accordion title="Implement circuit breakers">
    Configure automatic circuit breakers that temporarily disable sponsorship when:

    * Spending exceeds expected thresholds
    * Attack patterns are detected
    * System anomalies occur

    This provides time to investigate and respond to potential threats without depleting funds.
  </Accordion>
</AccordionGroup>

## Security checklist

Before deploying gas sponsorship to production:

* [ ] Configure per-user and per-wallet transaction rate limits
* [ ] Set up monitoring and alerting for unusual patterns
* [ ] Implement spending caps appropriate for the use case
* [ ] Review and mitigate chain-specific vulnerabilities (e.g., Solana rent refunds)
* [ ] Test circuit breaker functionality
* [ ] Document incident response procedures for detected abuse
* [ ] Route transactions through the backend for better control
* [ ] Review the [custom rate limits recipe](/recipes/gas-sponsorship-rate-limits) for advanced patterns

<Warning>
  Gas sponsorship can be a significant cost center if not properly protected. Implement multiple
  layers of defense to prevent abuse and ensure sustainable operations.
</Warning>
\n