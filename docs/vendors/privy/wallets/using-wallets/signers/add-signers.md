> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Add signers

To allow a third-party to transact on wallets, follow the guide below.

<Info>
  This guide assumes your application has already [configured signers](/wallets/using-wallets/signers/configure-signers) in the Dashboard.
</Info>

<View title="React" icon="react">
  To provision server-side access for user's wallets, use the `addSigners` method from the `useSigners` hook:

  ```tsx  theme={"system"}
  addSigners: async ({address: string, signers: {signerId: string, policyIds: string[]}[]}) => Promise<{user: User}>
  ```

  ### Usage

  ```tsx  theme={"system"}
  import {useSigners} from '@privy-io/react-auth';
  const {addSigners} = useSigners();
  ```

  <Tip>
    Check out the [starter repo](https://github.com/privy-io/examples/blob/main/privy-next-starter/src/components/sections/session-signers.tsx) for an end to end example of how to use signers.
  </Tip>

  ### Parameters

  The `addSigners` method accepts a `params` object with the following fields:

  <ParamField path="address" type="string" required>
    Address of the embedded wallet to add a signer to.
  </ParamField>

  <ParamField path="signers" type="object[]" required>
    <Expandable defaultOpen="true">
      <ParamField path="signerId" type="string" required>
        The key quorum ID that will be allowed to transact on the wallet. This is the same key quorum ID you generated in the [Generate an authorization key](/wallets/using-wallets/signers/configure-signers) step.
      </ParamField>

      <ParamField path="policyIds" type="string[]">
        An ID for a policy that any transaction from the signer must satisfy to be signed. This is an optional field, if not provided, no policies will apply to the signers requests. Note that at this time, each signer can only have one override policy.
      </ParamField>
    </Expandable>
  </ParamField>
</View>

<View title="React Native" icon="react">
  To provision server-side access for user's wallets, use the `addSigners` method from the `useSigners` hook:

  ```tsx  theme={"system"}
  addSigners: async ({address: string, signers: {signerId: string, policyIds: string[]}[]}) => Promise<{user: PrivyUser}>
  ```

  ### Usage

  ```tsx  theme={"system"}
  import {useSigners} from '@privy-io/expo';
  const {addSigners} = useSigners();
  ```

  ### Parameters

  The `addSigners` method accepts a `params` object with the following fields:

  <ParamField path="address" type="string" required>
    Address of the embedded wallet to add a signer to.
  </ParamField>

  <ParamField path="signers" type="object[]" required>
    <Expandable defaultOpen="true">
      <ParamField path="signerId" type="string" required>
        The key quorum ID that will be allowed to transact on the wallet. This is the same key quorum ID you generated in the [Generate an authorization key](/wallets/using-wallets/signers/configure-signers) step.
      </ParamField>

      <ParamField path="policyIds" type="string[]">
        An ID for a policy that any transaction from the signer must satisfy to be signed. This is an optional field, if not provided, no policies will apply to the signers requests. Note that at this time, each signer can only have one override policy.
      </ParamField>
    </Expandable>
  </ParamField>
</View>

<View title="NodeJS & REST API" icon="node-js">
  Make a request to [update the wallet](/wallets/wallets/update-a-wallet) with the desired
  `additional_signers` you'd like to add. The wallet owner must
  [sign](/controls/authorization-keys/using-owners/sign) the request.
</View>
\n