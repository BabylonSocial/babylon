> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# UI components

<View title="React" icon="react">
  Privy comes with out-of-the-box UIs for signing messages and sending transactions.

  These wallet UIs are highly-customizable, allowing your application to communicate relevant context to the user or abstract away the fact that a wallet is being used under the hood.

  ## Sign message

  Below is a sample message signature UI.

    <img src="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Sign.png?fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=d53afa26ed87352a61dbf1477c651442" alt="images/Sign.png" data-og-width="1843" width="1843" data-og-height="1317" height="1317" data-path="images/Sign.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Sign.png?w=280&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=497faffb0e9a9258b154f378f58f78c9 280w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Sign.png?w=560&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=2d4124fdcd55dc74775cf1fe34d57d68 560w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Sign.png?w=840&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=efeaf7b5616dcfb09b7e242f95ae3464 840w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Sign.png?w=1100&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=20725f037bed2e1e3af8777075499b35 1100w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Sign.png?w=1650&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=7782b79cdf3be5d27ca512d97d47b651 1650w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Sign.png?w=2500&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=80d47580bb562f983fbc67c495feb357 2500w" />

  This UI can also be customized by passing a `uiOptions` object of the following type to the  method.

  ### Parameters

  <ParamField path="showWalletUIs" type="boolean">
    Whether to overwrite the configured wallet UI for the signature prompt. Defaults to `undefined`,
    which will respect the server-side or SDK configured option.
  </ParamField>

  <ParamField path="title" type="string">
    The title text for the signature prompt. Defaults to 'Sign message'.
  </ParamField>

  <ParamField path="description" type="string">
    The description text for the signature prompt. Defaults to 'Signing this message will not cost you any fees.'.
  </ParamField>

  <ParamField path="buttonText" type="string">
    The description text for the signature prompt. Defaults to 'Sign and continue'.
  </ParamField>

  ## Send transaction

  Below is a sample transaction UI.

    <img src="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Trans.png?fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=e8c2eaf51c49ab7d5bd0bb300a6153f2" alt="images/Trans.png" data-og-width="1843" width="1843" data-og-height="1317" height="1317" data-path="images/Trans.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Trans.png?w=280&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=333f835ff6c9ce7676f8007524f4a141 280w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Trans.png?w=560&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=b4826f5a99b9b1e2e2c767b44fa44ff9 560w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Trans.png?w=840&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=fb59575670b7c9eeb5e528d600e2567f 840w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Trans.png?w=1100&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=17fb32cd9aa1de515b978169c9b89e6e 1100w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Trans.png?w=1650&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=e52dd4524b64aad926330b93a91efa0e 1650w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Trans.png?w=2500&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=d484a4f66a2d6a770ac26c0081d6072d 2500w" />

  This UI can also be customized by passing a `uiOptions` object of the following type to the\
  method.

  ### Parameters

  <ParamField path="showWalletUIs" type="boolean">
    Whether or not to show wallet UIs for this action. Defaults to the wallet UI setting enabled for your app.
  </ParamField>

  <ParamField path="description" type="string">
    Description of the transaction being sent.
  </ParamField>

  <ParamField path="buttonText" type="string">
    Text to show on CTA button for Send Transaction screen. Defaults to 'Submit' or 'Approve'.
  </ParamField>

  <ParamField path="transactionInfo" type="Object">
    <Expandable defaultOpen="true">
      <ParamField path="title" type="string">
        Title for transaction details accordion.
      </ParamField>

      <ParamField path="action" type="string">
        Short action description (e.g., 'Buy NFT').
      </ParamField>

      <ParamField path="contractInfo" type="Object">
        <Expandable defaultOpen="true">
          <ParamField path="url" type="string">
            Smart contract information URL.
          </ParamField>

          <ParamField path="name" type="string">
            Smart contract name.
          </ParamField>

          <ParamField path="imgUrl" type="string">
            Contract image URL.
          </ParamField>

          <ParamField path="imgAltText" type="string">
            Alternative text for contract image.
          </ParamField>

          <ParamField path="imgSize" type="'sm' | 'lg'">
            Image size for contract ('sm' or 'lg').
          </ParamField>
        </Expandable>
      </ParamField>
    </Expandable>
  </ParamField>

  <ParamField path="successHeader" type="string">
    Text displayed at the top of the success screen. Defaults to 'Transaction complete!'.
  </ParamField>

  <ParamField path="successDescription" type="string">
    Description for the success screen. Defaults to 'You're all set.'.
  </ParamField>

  <ParamField path="isCancellable" type="boolean">
    Whether to display a cancel button on the confirmation screen.
  </ParamField>
</View>

<View title="React Native" icon="react">
  When building an application using the React Native SDK, Privy gives you complete control over
  the experience and UI.

  If you do with to use Privy's default UIs for message signing or login, make sure you have
  [properly configured `PrivyElements`](/basics/react-native/advanced/setup-privyelements), and
  use the hooks exported from `@privy-io/expo/ui`, such as `useLogin`, `useSignMessage`, or
  `useFundWallet`.

  <Note>
    The React Native SDK does not yet support default UIs for signing typed data or sending
    transactions. Consumers of the SDK typically attach their own UIs to the Privy SDK methods for
    signing messages and sending transactions
  </Note>

  | Use case                | Hook                                 |
  | ----------------------- | ------------------------------------ |
  | Login users             | `useLogin`                           |
  | Sign message (Ethereum) | `useSignMessage`                     |
  | Sign message (Solana)   | `useSolanaSignMessage`               |
  | Fund wallets (Ethereum) | `useFundWallet`                      |
  | Fund wallets (Solana)   | `useFundSolanaWallet`                |
  | Enroll in MFA           | `useMfaEnrollmentUI`                 |
  | Verify MFA              | Set `enableMfaVerificationUIs: true` |
</View>
\n