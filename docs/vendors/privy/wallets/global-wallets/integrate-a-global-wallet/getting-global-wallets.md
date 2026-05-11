> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

Once a user has successfully linked their account from a provider app, an account of `type: 'cross_app'` will be added to the `linkedAccounts` array of their `user` object.

This `crossAppAccount` is an object with the following properties:

<Expandable title="properties" defaultOpen="true">
  <ParamField path="type" type="'cross_app'" required>
    Indicates that the linked account is a cross-app account.
  </ParamField>

  <ParamField path="embeddedWallets" type="Array<{address: string}>">
    An array of the user's embedded wallet(s) from the provider app for the cross-app account.
  </ParamField>

  <ParamField path="smartWallets" type="Array<{address: string}>">
    An array of the user's smart wallet(s) from the provider app for the cross-app account, if the
    provider has smart wallets enabled.
  </ParamField>

  <ParamField path="providerApp" type="ProviderAppMetadata">
    Metadata about the provider app for the cross-app account.

    <Expandable defaultOpen="true">
      <ParamField path="id" type="string" required>
        Privy app ID of the source app.
      </ParamField>

      <ParamField path="name" type="string">
        Name of the source app.
      </ParamField>

      <ParamField path="logoUrl" type="string">
        Logo of the source app.
      </ParamField>
    </Expandable>
  </ParamField>

  <ParamField path="firstVerifiedAt" type="Date">
    Datetime when the cross-app account was first linked to the user.
  </ParamField>

  <ParamField path="latestVerifiedAt" type="Date">
    Datetime for when the user last logged in/linked the cross-app account.
  </ParamField>
</Expandable>

To find a user's cross-app embedded wallet, first find the account of `type: 'cross_app'` from their `linkedAccounts` array. If your app permits users to link cross-app accounts from *multiple* provider apps, you should also filter the `linkedAccounts` by the `providerApp.id` on the cross-app account.

```tsx  theme={"system"}
// Replace `providerAppId` with the Privy app ID of your desired provider app
const providerAppId = 'insert-provider-app-id';
const crossAppAccount = user.linkedAccounts.find(
  (account) => account.type === 'cross_app' && account.providerApp.id === providerAppId
);
```

Next, from the `crossAppAccount`, inspect the `embeddedWallets` array to get the user's embedded wallet address(es) from the source app.

```tsx  theme={"system"}
const address = crossAppAccount.embeddedWallets[0].address;
```

<Info>
  Most users only have one embedded wallet per app. Certain apps, however, leverage multiple
  embedded wallets (e.g. HD wallets) per user to support certain use cases. In kind, the
  `embeddedWallets` field is designed as an array, but generally will be a singleton containing one
  entry.

  Similarly, the `smartWallets` field is designed as an array, but generally will be a singleton or empty
  depending on whether the provider app has smart wallets enabled.
</Info>
\n