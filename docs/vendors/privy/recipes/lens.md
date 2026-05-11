> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Login with Lens

[Lens Protocol](https://www.lens.xyz/) is an open social network that allows users to own their content and connections. Developers can build on the network, leveraging its audience and infrastructure. Users can seamlessly switch between social apps without losing their profiles, content, or connections.

Allowing users to log into Lens with Privy is fully supported and simple to integrate.

In this recipe, you'll integrate Privy + wagmi with the Lens React SDK, then let users log in with their Lens account using an embedded or external wallet.

## Resources

<CardGroup cols={2}>
  <Card title="Lens Docs" icon="arrow-up-right-from-square" href="https://lens.xyz/docs/protocol/getting-started/react" arrow>
    Official documentation for Lens protocol and SDK.
  </Card>

  <Card title="Privy Wagmi integration" icon="wallet" href="/wallets/connectors/ethereum/integrations/wagmi" arrow>
    Configure Privy with wagmi for EVM integrations.
  </Card>
</CardGroup>

***

## Integrate Lens login

<Steps>
  <Step title="1. Install dependencies">
    ```bash  theme={"system"}
    pnpm add @privy-io/react-auth @lens-protocol/react@canary @privy-io/wagmi @tanstack/react-query wagmi viem
    ```

    <Tip>We use <code>@lens-protocol/react\@canary</code> to access the latest Lens features.</Tip>
  </Step>

  <Step title="2. Set up providers">
    This step assumes you have set up your project with Privy and integrated with wagmi. If not, follow the [Privy wagmi guide](https://docs.privy.io/wallets/connectors/ethereum/integrations/wagmi#complete-example).
    Once your Privy setup is complete, initialize the Lens provider and client.

    Lens Protocol runs on the Lens chain (mainnet and testnet). Ensure your wagmi and Privy configs include the Lens chains.

    Wrap your app with <code>LensProvider</code> to use the Lens SDK across your app.

    <Tabs>
      <Tab title="providers.tsx">
        ```tsx {skip-check} theme={"system"}
        import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
        import {LensProvider, PublicClient, mainnet} from '@lens-protocol/react'; // [!code ++]

        const queryClient = new QueryClient();

        // [!code ++:4]
        const lensClient = PublicClient.create({
          environment: mainnet,
          storage: window.localStorage
        });

        return (
          <PrivyProvider appId="your-privy-app-id" config={privyConfig}>
            <QueryClientProvider client={queryClient}>
              <WagmiProvider config={wagmiConfig}>
                <LensProvider client={lensClient}>{children}</LensProvider> {/* [!code ++] */}
              </WagmiProvider>
            </QueryClientProvider>
          </PrivyProvider>
        );
        ```
      </Tab>

      <Tab title="privy-config.ts">
        ```ts {skip-check} theme={"system"}
        import {lens, lensTestnet} from 'viem/chains';

        export const privyConfig = {
          supportedChains: [lens, lensTestnet]
        };
        ```
      </Tab>

      <Tab title="wagmi-config.ts">
        ```ts {skip-check} theme={"system"}
        import {createConfig} from '@privy-io/wagmi';
        import {http} from 'wagmi';
        import {lens, lensTestnet} from 'viem/chains';

        export const wagmiConfig = createConfig({
          chains: [lens, lensTestnet],
          transports: {
            [lens.id]: http(),
            [lensTestnet.id]: http()
          }
        });
        ```
      </Tab>
    </Tabs>

    You’ve successfully set up the Lens SDK. Your app is now ready to use features like logging in with Lens and posting directly on Lens.
  </Step>

  <Step title="3. Connect a wallet with Privy">
    Use `login` to prompt the user to connect a wallet. With Privy, you can automatically create wallets for users who don’t have one (for example, when signing in with Google or another social method). With this new wallet, you can onboard the user to your Lens‑powered app and keep the onboarding experience seamless.

    <Tip>
      You can customize whether to automatically create an embedded wallet for the user. See the
      <a href="/basics/react/advanced/automatic-wallet-creation">automatic wallet creation guide</a>.
    </Tip>

    ```tsx  theme={"system"}
    import {usePrivy} from '@privy-io/react-auth';

    const {login} = usePrivy();

    <button onClick={login}>Login</button>;
    ```
  </Step>

  <Step title="4. Fetch accounts for the connected wallet">
    First, fetch all the Lens accounts associated with the connected user wallet.

    ```ts {skip-check} theme={"system"}
    import {useAccountsAvailable} from '@lens-protocol/react';
    import {useAccount} from 'wagmi';

    const {address} = useAccount();
    const {data: lensAccounts} = useAccountsAvailable({
      managedBy: address
    });
    ```

    <Accordion title="Switching wallets (if the user has more than one wallet)">
      If a user has multiple wallets connected, set the active wallet to ensure you log in with the
      correct Lens account.

      ```ts  theme={"system"}
      import {useWallets} from '@privy-io/react-auth';
      import {useSetActiveWallet} from '@privy-io/wagmi';

      const {wallets} = useWallets();
      const {setActiveWallet} = useSetActiveWallet();
      await setActiveWallet(wallets[0]);
      ```
    </Accordion>
  </Step>

  <Step title="5. Implement login with Lens">
    Create a hook that handles the Lens login process for the selected account.

    ```ts {skip-check} theme={"system"}
    import {AccountAvailable, EvmAddress, useLogin} from '@lens-protocol/react';
    import {signMessageWith} from '@lens-protocol/react/viem';
    import {useAccount, useWalletClient} from 'wagmi';

    export function useLensLogin() {
      const {address} = useAccount();
      const {data: signer} = useWalletClient();
      const {execute: login} = useLogin();

      return (item: AccountAvailable) => {
        if (!signer) return;
        const ownerOrManager = signer.account?.address ?? (address as EvmAddress | undefined);
        if (!ownerOrManager) return;

        const payload =
          item.__typename === 'AccountManaged'
            ? {
                accountManager: {
                  account: item.account.address as EvmAddress,
                  manager: ownerOrManager as EvmAddress
                }
              }
            : {
                accountOwner: {
                  account: item.account.address as EvmAddress,
                  owner: ownerOrManager as EvmAddress
                }
              };

        return login({
          ...payload,
          signMessage: signMessageWith(signer)
        });
      };
    }
    ```
  </Step>

  <Step title="6. Render accounts and trigger login">
    Show the fetched accounts and let users pick one to log in.

    ```tsx {skip-check} theme={"system"}
    import {useAccountsAvailable} from '@lens-protocol/react';
    import {useAccount} from 'wagmi';
    import {useLensLogin} from './use-lens-login';

    export function LensAccountsList() {
      const {address} = useAccount();
      const {data: lensAccounts} = useAccountsAvailable({managedBy: address});
      const loginWithLensAccount = useLensLogin();

      if (!lensAccounts || lensAccounts.items.length === 0) {
        return <p>No Lens accounts found for {address}.</p>;
      }

      return (
        <div>
          {lensAccounts.items.map((item) => (
            <div key={item.account.address}>
              <button onClick={() => loginWithLensAccount(item)}>
                Login with {item.account.username?.value ?? item.account.address}
              </button>
            </div>
          ))}
        </div>
      );
    }
    ```
  </Step>

  <Step title="7. Check authentication status">
    Use `useAuthenticatedUser` to check whether the user is authenticated with a Lens account.

    ```ts {skip-check} theme={"system"}
    import {useAuthenticatedUser} from '@lens-protocol/react';

    const {data: isAuthenticated} = useAuthenticatedUser();
    ```
  </Step>
</Steps>

***

## Next steps

Explore the full [Lens SDK documentation](https://lens.xyz/docs/protocol/getting-started/react).

* Create posts and publications
* React to publications
* Manage profiles and metadata

For wagmi setup with Privy, see [Integrating with wagmi](https://docs.privy.io/wallets/connectors/ethereum/integrations/wagmi).
\n