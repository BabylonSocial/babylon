> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# API error codes

This page lists common error codes you may encounter when using the Privy API, along with their descriptions and troubleshooting steps.

<Tip>
  Encountering an error code that's not listed here? Tell us what you'd like added in
  [Slack](https://privy.io/slack).
</Tip>

| Error Code                                                                                          | Description                                                              |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [`policy_violation`](#policy-violation)                                                             | RPC request denied due to policy violation                               |
| [`insufficient_funds`](#insufficient-funds)                                                         | Wallet has insufficient funds to complete the transaction                |
| [`transaction_broadcast_failure`](#transaction-broadcast-failure)                                   | Transaction failed to broadcast to the network                           |
| [`missing_or_empty_authorization_header`](#missing-or-empty-authorization-header)                   | Missing `privy-authorization-signature` header or no signatures provided |
| [`zero_correct_authorization_signatures`](#zero-correct-authorization-signatures)                   | No valid authorization signatures were provided                          |
| [`insufficient_correct_authorization_signatures`](#insufficient-correct-authorization-signatures)   | Not enough valid authorization signatures provided                       |
| [`incorrect_quantity_of_authorization_signatures`](#incorrect-quantity-of-authorization-signatures) | Number of signatures does not match the wallet's authorization threshold |
| [`no_valid_user_session_keys`](#no-valid-user-session-keys)                                         | No valid user signing keys available                                     |
| [`user_session_keys_expired`](#user-session-keys-expired)                                           | User signing key is expired                                              |

## Transaction errors

### `policy_violation`

**Description:** RPC request denied due to policy violation

This error occurs when an RPC request is blocked by a policy configured on the wallet. While this is intended behavior to enforce security controls, it may indicate that your policy configuration needs adjustment or that the transaction needs to be modified to comply with the policy.

**Common causes:**

* Transaction exceeds spending limits configured in the policy.
* Transaction is sent to an address that is not allowlisted.
* One or more Solana instructions may not be explicitly allowed.

**Troubleshooting:**

* **Review the policy configuration:** Navigate to the [Wallets dashboard](https://dashboard.privy.io/apps?page=wallets) to find the wallet and view the policy applied to this wallet
* **Retrieve the wallet's policy via API:** Use the [Get Wallet](/api-reference/wallets/get) endpoint to check which policy is applied, then use the [Get Policy](/api-reference/policies/get) endpoint to review its rules
* **Verify transaction details:** Ensure the transaction amount, recipient address, and contract interactions align with your policy requirements
* **Check policy conditions:** Review specific conditions like spending limits, allowlisted addresses, and restricted operations
* **Adjust policy or transaction:** Either modify the policy to accommodate legitimate use cases or adjust the transaction to comply with existing rules

***

### `insufficient_funds`

**Description:** Wallet has insufficient funds to complete the transaction

This error can appear in two forms:

* "Wallet has insufficient funds for this transaction" - The wallet doesn't have enough tokens to cover the transaction and gas fees
* "Insufficient gas credits balance" - Your app's gas sponsorship credits are depleted

**Common causes:**

* Wallet balance is too low to cover transaction value and gas fees
* Gas credits have been exhausted (when using gas sponsorship)
* Gas price spike causing higher than expected fees
* Complex transaction requiring more gas than available
* Incorrect gas estimation leaving insufficient buffer

**Troubleshooting:**

* **For gas credits depletion:**
  * Check your gas credits balance in the [Gas Sponsorship](https://dashboard.privy.io/billing?tab=gas-sponsorship) page of the Privy dashboard.
  * Add more credits to continue sponsoring transactions
  * Enable **Automated credit refill** to avoid this in the future, and make sure **Low credit notifications** are enabled.
* **For wallet balance issues:**
  * Check the wallet's native token balance (ETH, MATIC, SOL, etc.) on a block explorer. Make sure to check the balance on the same chain you are sending the transaction on.
  * Fund the wallet with sufficient native tokens to cover gas fees
  * Consider implementing [wallet funding flows](/wallets/funding/prompting-users-to-fund/evm) in your app
  * Use gas sponsorship to eliminate the need for users to hold native tokens for gas

***

### `transaction_broadcast_failure`

**Description:** Transaction failed to broadcast to the network

This error indicates that the transaction could not be broadcasted to the blockchain. The transaction was **not** broadcasted, meaning it's safe to retry without risk of duplicate transactions.

**Common causes:**

* Invalid transaction parameters (malformed data, incorrect format)
* Network congestion or chain outages
* RPC node connectivity issues
* Nonce conflicts or sequencing errors

**Troubleshooting:**

* **Verify transaction inputs:** Double-check all transaction parameters including recipient address, amount, data field, and gas settings
* **Retry the transaction:** Since the transaction was not broadcast, it's safe to retry with the same or corrected parameters
* **Check network status:**
  * Visit the [Privy Status Page](https://status.privy.io) to check for known issues
  * Check the blockchain network's status page or block explorer for chain-wide issues
* **Review error details:** Examine any additional error messages returned with the failure for specific validation issues

***

## Authorization signature errors

The following errors occur when there is a failure validating [authorization signatures](/api-reference/authorization-signatures) for API requests. Certain API endpoints require authorization signatures from the resource owner to authorize the request.

### `missing_or_empty_authorization_header`

**Description:** Missing `privy-authorization-signature` header or no signatures provided

This error occurs when an API request requires authorization signatures but the `privy-authorization-signature` header is either missing entirely or contains no signatures.

**Common causes:**

* Making a request to an endpoint that requires authorization without including the required header
* Header is present but contains an empty value
* Missing `AuthorizationContext` when using Privy SDKs

**Troubleshooting:**

* **Implement proper signing:** Follow the [signing requests guide](/controls/authorization-keys/using-owners/sign/overview) to properly sign your API requests
* **Verify SDK configuration:** If using a Privy SDK, ensure you've configured the [`AuthorizationContext`](/controls/authorization-keys/using-owners/sign/signing-on-the-server#using-the-authorization-context) correctly
* **Check request headers:** Confirm the `privy-authorization-signature` header is being included in your request

***

### `zero_correct_authorization_signatures`

**Description:** No valid authorization signatures were provided

This error indicates that while authorization signatures were provided, none of them are valid. The signature payload may be malformed or the signing keys may be incorrect or expired.

**Common causes:**

* Signing the wrong payload (e.g., incorrect request body, URL, or headers)
* Malformed signature format
* Signing with a key that is not able to authorize the request

**Troubleshooting:**

* **Verify signature payload:** Ensure you're signing the correct payload according to the [authorization signatures specification](/controls/authorization-keys/using-owners/sign/overview#signature-payload)
* **Check signing keys:** Verify that the keys you're using for signing are correct and have proper permissions
* **Review signing implementation:** Follow the [signing requests guide](/controls/authorization-keys/using-owners/sign/overview) to ensure proper implementation

***

### `insufficient_correct_authorization_signatures`

**Description:** Not enough valid authorization signatures provided

This error occurs when some valid signatures were provided, but the number of valid signatures is less than the required authorization threshold for the resource.

**Common causes:**

* Wallet requires multiple signatures (based on the authorization threshold of the key quorum) but only one was provided
* Some provided signatures are valid but others are malformed or expired
* Authorization threshold was recently increased but request still uses old signature count
* Missing signatures from required signers

**Troubleshooting:**

* **Check authorization threshold:** Navigate to the [Wallets dashboard](https://dashboard.privy.io/apps?page=wallets) to find the wallet and view the owner or signer applied to this wallet
* **Provide all required signatures:** Ensure you're collecting and including signatures from all required owners or signers

***

### `incorrect_quantity_of_authorization_signatures`

**Description:** Number of signatures does not match the wallet's authorization threshold

This error occurs when the exact number of signatures provided in the `privy-authorization-signature` header doesn't match the wallet's required authorization threshold.

**Common causes:**

* Providing too few signatures
* Incorrectly parsing or concatenating multiple signatures in the header

**Troubleshooting:**

* **Check authorization threshold:** Navigate to the [Wallets dashboard](https://dashboard.privy.io/apps?page=wallets) to find the wallet and view the owner or signer applied to this wallet
* **Match signature count:** Ensure you're providing exactly the number of signatures required by the authorization threshold
* **Check signature format:** When providing multiple signatures, ensure they're properly formatted in the header (comma-separated)

***

### `no_valid_user_session_keys`

**Description:** No valid user signing keys available

This error occurs when attempting to authorize a request using user signing keys, but no valid keys are available for the user.

**Common causes:**

* User signing key was never requested or generated
* /wallets/authenticate request was never completed or returned key was not properly decrypted. This happens automatically for Server SDKs using AuthorizationContext
* User JWT is invalid or expired

**Troubleshooting:**

* **Request a user signing key:** Follow the [user signers guide](/controls/authorization-keys/keys/create/user/request) to properly request and use user signing keys
* **Check authentication flow:** Verify the /wallets/authenticate request is returning correctly and the updated key is being used.
* **Validate user JWT:** Ensure the user's JWT is valid and not expired

***

### `user_session_keys_expired`

**Description:** User signing key is expired

This error occurs when the user signing key being used to authorize the request has expired. User signing keys are time-bound for security purposes.

**Common causes:**

* User signing key has exceeded its validity period
* Long delay between requesting the session key and making the API call
* Using a cached session key that has expired

**Troubleshooting:**

* **Request a fresh session key:** Follow the [user signers guide](/controls/authorization-keys/keys/create/user/request) to request a new user signing key
* **Use provided Server-side SDK AuthorizationContext:** AuthorizationContext will automatically retrieve a fresh user key and construct an authorization signature before making the RPC call.
\n