> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Policy-based MFA

Policy-based MFA allows you to configure MFA requirements for certain high value actions, while allowing other actions to be performed without additional verification. You can use this to enable various use cases, like:

* Require MFA for transactions larger than 1000 USDC
* Require MFA for withdrawals, or on specific actions

## How it works

Policy-based MFA combines user authentication with server-side transaction authorization to provide selective MFA enforcement:

* **Users enroll in MFA** on their wallets for high-security protection
* **Define policies** that specify which transactions are considered "safe" (e.g., USDC transfers under 1000)
* **An authorization key** (controlled by your server) is added as a signer on the user's wallet with the policy attached
* **Transactions that satisfy the policy** are signed by your authorization key without prompting the user for MFA
* **Transactions outside the policy** (e.g., larger amounts, different tokens) cannot be signed with the authorization key due to the policy, and require the user to sign which prompts MFA

This approach ensures users are always protected by MFA while reducing friction for routine, low-risk operations that meet your defined criteria.

<Steps>
  <Step title="Enable MFA for your app">
    First, enable MFA in the [Privy Dashboard](https://dashboard.privy.io/apps?logins=mfa\&page=login-methods) by navigating to **Dashboard → Authentication → MFA** and enabling your preferred MFA method(s).

    <Note>
      You can enable SMS, TOTP (authenticator apps), or passkey-based MFA depending on your security requirements.
    </Note>
  </Step>

  <Step title="Enroll user in MFA">
    Once MFA is enabled, prompt your users to enroll in MFA. You can use Privy's default UI or build a custom enrollment flow.

    <Danger>
      Once a user enrolls in MFA, it will remain enabled **even if you disable MFA for your app**. Users
      must manually disable MFA on their wallets if they wish to remove it.
    </Danger>

    **Using default UI (recommended):**

    ```tsx  theme={"system"}
    import {useMfaEnrollment} from '@privy-io/react-auth';

    function MfaEnrollmentButton() {
      const {showMfaEnrollmentModal} = useMfaEnrollment();
      return <button onClick={showMfaEnrollmentModal}>Enroll in MFA</button>;
    }
    ```

    **Custom SMS enrollment:**

    ```tsx  theme={"system"}
    import {useMfaEnrollment} from '@privy-io/react-auth';

    const {initEnrollmentWithSms, submitEnrollmentWithSms} = useMfaEnrollment();

    // Send enrollment code
    await initEnrollmentWithSms({phoneNumber: phoneNumber});

    // Submit code to complete enrollment
    await submitEnrollmentWithSms({
      phoneNumber: phoneNumber,
      mfaCode: mfaCode,
    });
    ```

    Learn more about [MFA enrollment](/authentication/user-authentication/mfa/default-ui).
  </Step>

  <Step title="Create a policy to bypass MFA">
    Create a policy that defines which transactions can be executed without MFA. For example, allow USDC transfers under 1000 USDC without MFA.

    Policies can also be created in the [Dashboard](https://dashboard.privy.io/apps?page=policies). When creating via the Dashboard, you'll receive a policy ID that you can reference in your code.

    Alternatively, you can create a policy programmatically using the [NodeJS SDK](/controls/policies/create-a-policy):

    ```tsx  theme={"system"}
    import { PrivyClient } from "@privy-io/node";
    import { erc20Abi, parseUnits } from "viem";

    const USDC_SEPOLIA_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

    const privy = new PrivyClient({
      appId: PRIVY_APP_ID,
      appSecret: PRIVY_APP_SECRET,
    });

    const policy = await privy.policies().create({
      name: "USDC Transfer Policy",
      version: "1.0",
      chain_type: "ethereum",
      rules: [
        {
          name: "USDC Transfer Policy",
          method: "eth_sendTransaction",
          action: "ALLOW",
          conditions: [
            {
              field_source: "ethereum_transaction",
              field: "to",
              operator: "eq",
              value: USDC_SEPOLIA_ADDRESS,
            },
            {
              field_source: "ethereum_calldata",
              field: "transfer.amount",
              abi: erc20Abi,
              operator: "lte",
              value: parseUnits("1000", 6).toString(), // 1000 USDC
            }
          ]
        },
      ]
    });
    ```

    This policy allows transactions to the USDC contract with transfer amounts up to 1000 USDC. Transactions that satisfy this policy can be signed without MFA. Save the `policy.id` as you'll need it to attach the policy to a signer in the next step.

    Learn more about [creating policies](/controls/policies/create-a-policy).
  </Step>

  <Step title="Add a signer to the wallet">
    Create an authorization key in the Dashboard, then add it as a signer to the user's wallet with the policy you created:

    **1. Create an authorization key:**

    Go to the [Dashboard](https://dashboard.privy.io/apps?page=authorization-keys) and create a new authorization key. Save the private key securely.

    **2. Add the signer to the wallet:**

    ```tsx  theme={"system"}
    import {usePrivy, useSigners} from '@privy-io/react-auth';

    const { user } = usePrivy();
    const { addSigners } = useSigners();

    async function addSigner() {
      if (user && user.wallet && user.wallet.walletClientType === "privy") {
        await addSigners({
          address: user.wallet.address,
          signers: [
            {
              signerId: "<authorization-key-id-from-previous-step>", // Authorization key ID
              policyIds: ["<policy-id-from-previous-step>"], // Policy ID
            }
          ]
        });
      }
    }
    ```

    Learn more about [adding signers](/wallets/using-wallets/signers/add-signers).
  </Step>

  <Step title="Route transactions through the appropriate endpoint">
    On your server, create an endpoint to send transactions using your authorization key:

    ```tsx  theme={"system"}
    import { NextResponse, NextRequest } from "next/server";
    import { PrivyClient } from "@privy-io/node";
    import { AUTHORIZATION_KEY_SECRET } from "@/constants";

    export async function POST(request: NextRequest) {
      const { walletId, transaction } = await request.json();

      const privy = new PrivyClient({
        appId: PRIVY_APP_ID,
        appSecret: PRIVY_APP_SECRET,
      });

      const result = await privy.wallets().ethereum().sendTransaction(walletId, {
        caip2: 'eip155:11155111',
        params: {
          transaction,
        },
        authorization_context: {
          authorization_private_keys: [AUTHORIZATION_KEY_SECRET],
        },
      });

      return NextResponse.json(result);
    }
    ```

    **On the client, route transactions based on whether they satisfy the policy:**

    ```tsx  theme={"system"}
    import {usePrivy, useSendTransaction} from '@privy-io/react-auth';
    import {encodeFunctionData, parseUnits, erc20Abi} from 'viem';
    import {sepolia} from 'viem/chains';

    const USDC_SEPOLIA_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

    const { user } = usePrivy();
    const { sendTransaction } = useSendTransaction();

    const handleSignTransaction = async () => {
      if (!user || !user.wallet) {
        return;
      }

      const transaction = {
        to: USDC_SEPOLIA_ADDRESS,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: "transfer",
          args: [
            "0xE3070d3e4309afA3bC9a6b057685743CF42da77C",
            parseUnits(amount, 6),
          ],
        }),
        chain_id: sepolia.id,
      };

       // If transaction satisfies policy (USDC transfer under 1000), sign with additional signer that does not require MFA
      if (
        transaction.to === USDC_SEPOLIA_ADDRESS &&
        parseUnits(amount, 6) < parseUnits("1000", 6)
      ) {
        const response = await fetch("/api/sign-with-signer", {
          method: "POST",
          body: JSON.stringify({
            walletId: user.wallet.id,
            transaction,
          }),
        });
        const result = await response.json();
        return result;
      }

      // Otherwise, use sendTransaction which requires MFA
      const result = await sendTransaction(transaction, {
        uiOptions: {
          showWalletUIs: false,
        },
      });
      return result;
    };
    ```

    Transactions that satisfy the policy (USDC transfers under 1000) are signed by your authorization key without prompting the user for MFA. All other transactions require MFA.
  </Step>
</Steps>

## Summary

With policy-based MFA, you can:

* **Enable MFA** for additional security on user wallets
* **Create policies** that define transaction limits and conditions
* **Add signers** with scoped permissions to execute policy-approved transactions
* **Route transactions** based on whether they satisfy policy conditions, requiring MFA only when necessary

This approach provides a balance between security and user experience, reducing friction for transactions within policy limits while maintaining strong protection for transactions outside those limits.
\n