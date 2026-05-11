> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Remove signers

**Once** a wallet has [signers](/wallets/using-wallets/signers/add-signers), they may also revoke consent to prevent your app from taking any further wallet actions on their behalf.

<View title="React" icon="react">
  To remove all the signers on the wallet, use the `removeSigners` method from the `useSigners` hook:

  ```tsx  theme={"system"}
  removeSigners: async ({address: string}) => Promise<{user: User}>
  ```

  ### Usage

  ```tsx  theme={"system"}
  import {useSigners} from '@privy-io/react-auth';
  ...
  const {removeSigners} = useSigners();
  ```

  When invoked, the `removeSigners` method will remove all the signers, so only the user can transact on the wallet.

  <Warning>
    After this action, your app will no longer be able to take actions on behalf of the user with
    their wallet unless the user adds more [session
    signers](/wallets/using-wallets/signers/add-signers).
  </Warning>

  <Tip>
    Check out the [starter repo](https://github.com/privy-io/examples/blob/main/privy-next-starter/src/components/sections/session-signers.tsx)
    for an end to end example of how to use signers.
  </Tip>

  ### Parameters

  The `removeSigners` method accepts a `params` object with the following fields:

  <ParamField path="address" type="string" required>
    Address of the embedded wallet to delegate.
  </ParamField>

  As an example, you might have a button within your app to allow users to remove all signers like so:

  ```tsx Example remove signers button theme={"system"}
  import {usePrivy, useSigners, type WalletWithMetadata} from '@privy-io/react-auth';

  function RemoveSessionSignersButton() {
    const {user} = usePrivy();
    const {removeSigners} = useSigners();

    // Check if the user's wallets already has signers by searching the linkedAccounts array for wallets
    // with `delegated: true` set
    const delegatedWallet = user.linkedAccounts.filter(
      (account): account is WalletWithMetadata => account.type === 'wallet' && account.delegated
    );

    const onRevoke = async () => {
      if (!hasDelegatedWallets) return; // Button is disabled to prevent this case
      await removeSigners({address: delegatedWallet.address});
    };

    return (
      <button disabled={!hasDelegatedWallets} onClick={onRevoke}>
        Revoke permission for this app to transact on my behalf
      </button>
    );
  }
  ```
</View>

<View title="React Native" icon="react">
  To remove all the signers on the wallet, use the `removeSigners` method from the `useSigners` hook:

  ```tsx  theme={"system"}
  removeSigners: async ({address: string}) => Promise<{user: PrivyUser}};
  ```

  ### Usage

  ```tsx  theme={"system"}
  import {useSigners} from '@privy-io/expo';
  ...
  const {removeSigners} = useSigners();
  ```

  When invoked, the `removeSigners` method will remove all the signers, so only the user can transact on the wallet.

  <Warning>
    After this action, your app will no longer be able to take actions on behalf of the user with
    their wallet unless the user adds more [session
    signers](/wallets/using-wallets/signers/add-signers).
  </Warning>

  ### Parameters

  The `removeSigners` method accepts a `params` object with the following fields:

  <ParamField path="address" type="string" required>
    Address of the embedded wallet to delegate.
  </ParamField>

  As an example, you might have a button within your app to allow users to remove all signers like so:

  ```tsx Example remove signers button theme={"system"}
  import {usePrivy, useSigners, type PrivyEmbeddedWalletAccount} from '@privy-io/expo';

  function RemoveSessionSignersButton() {
    const {user} = usePrivy();
    const {removeSigners} = useSigners();

    // Check if the user's wallets already has signers by searching the linked_accounts array for wallets
    // with `delegated: true` set
    const delegatedWallet = user.linked_accounts.find(
      (account): account is PrivyEmbeddedWalletAccount =>
        account.type === 'wallet' && account.delegated
    );

    const onRevoke = async () => {
      if (!delegatedWallet) return; // Button is disabled to prevent this case
      await removeSigners({address: delegatedWallet.address});
    };

    return (
      <Button disabled={!delegatedWallet} onPress={onRevoke}>
        Revoke permission for this app to transact on my behalf
      </Button>
    );
  }
  ```
</View>

<View title="NodeJS & REST API" icon="node-js">
  Make a request to [update the wallet](/wallets/wallets/update-a-wallet) with the updated list of
  `additional_signers` you'd like on the wallet. The wallet owner must
  [sign](/controls/authorization-keys/using-owners/sign) the request.
</View>
\n