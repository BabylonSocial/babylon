> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

<View title="React" icon="react">
  <Info>
    When you request a signature or transaction from a user's embedded wallet from another app, Privy **requires** the user to explicitly confirm the signature or transaction. This is accomplished by opening a popup to the provider app's domain, where the user confirms the action in an isolated environment.
  </Info>

  To request signatures and transactions from a user's embedded wallet from a provider app, use the `signMessage`, `signTypedData`, and `sendTransaction` methods returned by Privy's `useCrossAppAccounts` hook

  ```tsx  theme={"system"}
  import {useCrossAppAccounts} from '@privy-io/react-auth';

  const {signMessage, signTypedData, sendTransaction} = useCrossAppAccounts();
  ```

  These methods are similar to the [`signMessage`](/wallets/using-wallets/ethereum/sign-a-message), [`signTypedData`](/wallets/using-wallets/ethereum/sign-typed-data), and [`sendTransaction`](/wallets/using-wallets/ethereum/send-a-transaction) methods returned by `usePrivy` except they all require an additional `CrossAppWalletOptions` object of the following type:

  <ParamField path="address" type="string" required>
    The address for the cross-app embedded wallet that you'd like to request a signature/transaction
    from.
  </ParamField>

  If the `address` you specify in this `CrossAppWalletOptions` object is not a valid embedded wallet
  that has been linked to the current user from a provider app, these wallet methods will error.

  ## signMessage

  To the `signMessage` method returned by `useCrossAppAccounts`, pass the following parameters:

  <ParamField path="message" type="string" required>
    The message the user must sign as a `string`.
  </ParamField>

  <ParamField path="options" type="CrossAppWalletOptions" required>
    Options for the cross-app embedded wallet, which must include the requested wallet's address.

    <Expandable title="properties" defaultOpen="true">
      <ParamField path="address" type="string" required>
        The address for the cross-app embedded wallet that you'd like to request a
        signature/transaction from.
      </ParamField>
    </Expandable>
  </ParamField>

  ## signTypedData

  To the `signTypedData` method returned by `useCrossAppAccounts`, pass the following parameters:

  <ParamField path="typedData" type="SignedTypedDataParams" required>
    A JSON object that conforms to the EIP-712 [`TypedData JSON
      schema.`](https://eips.ethereum.org/EIPS/eip-712#specification-of-the-eth_signtypeddata-json-rpc)
  </ParamField>

  <ParamField path="options" type="CrossAppWalletOptions" required>
    Options for the cross-app embedded wallet, which must include the requested wallet's address.

    <Expandable title="properties" defaultOpen="true">
      <ParamField path="address" type="string" required>
        The address for the cross-app embedded wallet that you'd like to request a
        signature/transaction from.
      </ParamField>
    </Expandable>
  </ParamField>

  ## sendTransaction

  To the `sendTransaction` method returned by `useCrossAppAccounts`, pass the following parameters:

  ```tsx  theme={"system"}
  import {usePrivy, useCrossAppAccounts} from '@privy-io/react-auth';

  function Button() {
    const {user} = usePrivy();
    const {sendTransaction} = useCrossAppAccounts();
    const crossAppAccount = user.linkedAccounts.find((account) => account.type === 'cross_app');
    const address = crossAppAccount.embeddedWallets[0].address;

    return (
      <button
        onClick={() =>
          sendTransaction(
            {
              chainId: 1, // Ethereum mainnet
              to: '0xRecipientAddress',
              value: 1000000000000000000,
              gasLimit: 21000,
              gasPrice: 20000000000,
              nonce: 0,
              data: '0x'
            },
            {address}
          )
        }
        disabled={!address}
      >
        Send transaction
      </button>
    );
  }
  ```

  <ParamField path="requestData" type="UnsignedTransactionRequest" required>
    The transaction request to be sent.
  </ParamField>

  <ParamField path="options" type="CrossAppWalletOptions" required>
    Options for the cross-app embedded wallet, which must include the requested wallet's address.

    <Expandable title="properties" defaultOpen="true">
      <ParamField path="address" type="string" required>
        The address for the cross-app embedded wallet that you'd like to request a
        signature/transaction from.
      </ParamField>
    </Expandable>
  </ParamField>

  ### Example signature request

  As an example, you might request a signature from a user's cross-app wallet like so:

  ```tsx  theme={"system"}
  import {usePrivy, useCrossAppAccounts} from '@privy-io/react-auth';

  function Button() {
    const {user} = usePrivy();
    const {signMessage} = useCrossAppAccounts();
    const crossAppAccount = user.linkedAccounts.find((account) => account.type === 'cross_app');
    const address = crossAppAccount.embeddedWallets[0].address;

    return (
      <button onClick={() => signMessage('Hello world', {address: address})} disabled={!address}>
        Sign a message with your cross-app wallet
      </button>
    );
  }
  ```
</View>

<View title="React Native" icon="react">
  <Info>
    When you request a signature or transaction from a user's embedded wallet from another app, Privy
    **requires** the user to explicitly confirm the signature or transaction. This is accomplished by
    opening a popup to the provider app's domain, where the user confirms the action in an isolated
    environment.
  </Info>

  To request signatures and transactions from a user's embedded wallet from a provider app, use the `signMessage`, `signTypedData`, and `sendTransaction` methods returned by Privy's hooks: `useSignMessageWithCrossApp`, `useSignTypedDataWithCrossApp` and `useSendTransactionWithCrossApp`.

  ```tsx  theme={"system"}
  const {signMessage} = useSignMessageWithCrossApp();
  const {signTypedData} = useSignTypedDataWithCrossApp();
  const {sendTransaction} = useSendTransactionWithCrossApp();
  ```

  These methods all require an additional `address` property, and an optional `redirectUri`, of the following types:

  <ParamField path="address" type="string" required>
    The address for the cross-app embedded wallet that you'd like to request a signature/transaction
    from.
  </ParamField>

  <ParamField path="redirectUri" type="string">
    A URL path that the provider will automatically redirect to after successful authentication. This
    defaults to a link back to your app root, eg. `'/'`, if not provided.
  </ParamField>

  If the `address` you specify in this `CrossAppWalletOptions` object is not a valid embedded wallet
  that has been linked to the current user from a provider app, these wallet methods will error.

  ### signMessage

  To the `signMessage` method returned by \`useSignMessageWithCrossApp\`\`, pass the following parameters:

  ```tsx  theme={"system"}
  import {usePrivy, useSignMessageWithCrossApp} from '@privy-io/expo';

  function Button() {
    const {user} = usePrivy();
    const {signMessage} = useSignMessageWithCrossApp();
    const crossAppAccount = user.linked_accounts.find((account) => account.type === 'cross_app');
    const address = crossAppAccount.embedded_wallets[0].address;

    return (
      <button onClick={() => signMessage({address, message: 'Hello world'})} disabled={!address}>
        Sign a message with your cross-app wallet
      </button>
    );
  }
  ```

  <ParamField path="message" type="string" required>
    The message the user must sign as a `string`.
  </ParamField>

  <ParamField path="address" type="string" required>
    The address for the cross-app embedded wallet that you'd like to request a signature/transaction
    from.
  </ParamField>

  <ParamField path="redirectUri" type="string">
    A URL path that the provider will automatically redirect to after successful authentication. This
    defaults to a link back to your app root, eg. `'/'`, if not provided.
  </ParamField>

  ### signTypedData

  To the `signTypedData` method returned by `useSignTypedDataWithCrossApp`, pass the following parameters:

  ```tsx  theme={"system"}
  import {usePrivy, useSignMessageWithCrossApp} from '@privy-io/expo';

  function Button() {
    const {user} = usePrivy();
    const {signTypedData} = useSignTypedDataWithCrossApp();
    const crossAppAccount = user.linked_accounts.find((account) => account.type === 'cross_app');
    const address = crossAppAccount.embedded_wallets[0].address;

    return (
      <button
        onClick={() => signTypedData({address, typedData: insertTypedDataObject})}
        disabled={!address}
      >
        Sign a message with your cross-app wallet
      </button>
    );
  }
  ```

  <ParamField path="typedData" type="TypedDataDefinition" required>
    A JSON object that conforms to the EIP-712 [`TypedData JSON
      schema.`](https://eips.ethereum.org/EIPS/eip-712#specification-of-the-eth_signtypeddata-json-rpc)
  </ParamField>

  <ParamField path="address" type="string" required>
    The address for the cross-app embedded wallet that you'd like to request a signature/transaction
    from.
  </ParamField>

  <ParamField path="redirectUri" type="string">
    A URL path that the provider will automatically redirect to after successful authentication. This
    defaults to a link back to your app root, eg. `'/'`, if not provided.
  </ParamField>

  ### sendTransaction

  To the `sendTransaction` method returned by `useSendTransactionWithCrossApp`, pass the following parameters:

  ```tsx  theme={"system"}
  import {usePrivy, useSendTransactionWithCrossApp} from '@privy-io/expo';
  import {Button as RNButton} from 'react-native';

  function Button() {
    const {user} = usePrivy();
    const {sendTransaction} = useSendTransactionWithCrossApp();
    const crossAppAccount = user.linked_accounts.find((account) => account.type === 'cross_app');
    const address = crossAppAccount.embedded_wallets[0].address;

    return (
      <RNButton
        title="Send Transaction"
        onPress={() =>
          sendTransaction({
            address,
            transaction: {
              to: '0xRecipientAddress',
              value: 1000000000000000000,
              gasLimit: 21000,
              gasPrice: 20000000000,
              nonce: 0,
              data: '0x'
            }
          })
        }
        disabled={!address}
      />
    );
  }
  ```

  <ParamField path="transaction" type="UnsignedTransactionRequest" required>
    The transaction request to be sent.
  </ParamField>

  <ParamField path="address" type="string" required>
    The address for the cross-app embedded wallet that you'd like to request a signature/transaction
    from.
  </ParamField>

  <ParamField path="redirectUri" type="string">
    A URL path that the provider will automatically redirect to after successful authentication. This
    defaults to a link back to your app root, eg. `'/'`, if not provided.
  </ParamField>
</View>
\n