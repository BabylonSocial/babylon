> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

If your app uses embedded wallets, you can configure Privy to create wallets **automatically** for your users as part of their **login** flow.

<Warning>
  Automatic embedded wallet creation is currently not supported if your app uses Privy's whitelabel
  login interfaces. If this is the case for your app, you must [manually create embedded
  wallets](/wallets/wallets/create/create-a-wallet) for your users at the desired point in your
  onboarding flow.
</Warning>

<Note>
  Automatic wallet creation only applies to login via the Privy modal and not from whitelabel login
  methods. It does not trigger wallet creation for users who authenticate through direct login
  methods like loginWithCode, useLoginWithOAuth, or similar custom flows.
</Note>

<Tabs>
  <Tab title="Ethereum">
    To configure Privy to automatically create embedded wallets for your user when they login, **set the `config.embeddedWallets.ethereum.createOnLogin`** property of your `PrivyProvider`:

    ```tsx  theme={"system"}
    <PrivyProvider
        appId="your-privy-app-id"
        config={{
            embeddedWallets: {
                ethereum: {
                    createOnLogin: "users-without-wallets",
                },
            },
        }}
    >
        {children}
    </PrivyProvider>
    ```

    <ParamField path="createOnLogin" type="'all-users' | 'users-without-wallets' | 'off'" default="off">
      Determines when to create a wallet for the user.

      * `'all-users'`: Create a wallet for all users on login.
      * `'users-without-wallets'`: Create a wallet for users who do not have a wallet on login.
      * `'off'`: Do not create a wallet on login.
    </ParamField>
  </Tab>

  <Tab title="Solana">
    To configure Privy to automatically create embedded wallets for your user when they login, **set the `config.embeddedWallets.solana.createOnLogin`** property of your `PrivyProvider`:

    ```tsx  theme={"system"}
    <PrivyProvider
        appId="your-privy-app-id"
        config={{
            embeddedWallets: {
                solana: {
                    createOnLogin: 'users-without-wallets',
                },
            },
        }}
    >
        {children}
    </PrivyProvider>
    ```

    <ParamField path="createOnLogin" type="'all-users' | 'users-without-wallets' | 'off'" default="off">
      Determines when to create a wallet for the user.

      * `'all-users'`: Create a wallet for all users on login.
      * `'users-without-wallets'`: Create a wallet for users who do not have a wallet on login.
      * `'off'`: Do not create a wallet on login.
    </ParamField>
  </Tab>

  <Tab title="Ethereum & Solana">
    To configure Privy to automatically create embedded wallets for your user when they login, **set the `config.embeddedWallets.ethereum.createOnLogin`** and `config.embeddedWallets.solana.createOnLogin` properties of your `PrivyProvider`:

    ```tsx  theme={"system"}
    <PrivyProvider
        appId="your-privy-app-id"
        config={{
            embeddedWallets: {
                ethereum: {
                    createOnLogin: 'users-without-wallets',
                },
                solana: {
                    createOnLogin: 'users-without-wallets',
                },
            },
        }}
    >
        {children}
    </PrivyProvider>
    ```
  </Tab>
</Tabs>
\n