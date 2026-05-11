> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

If your app uses embedded wallets, you can configure Privy to create wallets **automatically** for your users as part of their **login** flow.

<Tabs>
  <Tab title="Ethereum">
    To configure Privy to automatically create embedded wallets for your user when they login, **set the `config.embedded.solana.createOnLogin`** property of your `PrivyProvider`:

    ```tsx  theme={"system"}
    <PrivyProvider
        appId="your-privy-app-id"
        config={{
            embedded: {
                ethereum: {
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

  <Tab title="Solana">
    To configure Privy to automatically create embedded wallets for your user when they login, **set the `config.embedded.solana.createOnLogin`** property of your `PrivyProvider`:

    ```tsx  theme={"system"}
    <PrivyProvider
        appId="your-privy-app-id"
        config={{
            embedded: {
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
</Tabs>
\n