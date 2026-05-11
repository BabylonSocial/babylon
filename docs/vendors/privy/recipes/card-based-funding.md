> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Funding wallets with Apple Pay and Google Pay

export const CardOnrampMainnetOnly = () => <Warning>
    Card and fiat on-ramp purchases are supported on mainnets only. On testnets (e.g. Polygon Amoy,
    Sepolia), on-ramps cannot purchase testnet tokens, so this flow will not be shown or will fail.
  </Warning>;

Privy has integrated onramp providers that let users fund embedded wallets with payment methods like Apple Pay and Google Pay via `@privy-io/expo` and on the web through `@privy-io/react-auth`.

This guide walks through setting up Privy's funding flows, enabling users to fund wallets quickly in under two minutes.

<img src="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/card-based-funding.png?fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=8618b999fb1d2f574e78d2710c196ffd" alt="card-based-funding" data-og-width="1843" width="1843" data-og-height="1317" height="1317" data-path="images/card-based-funding.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/card-based-funding.png?w=280&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=42ed6f4ea44caa3ee9bfa2c74a9aaf7a 280w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/card-based-funding.png?w=560&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=36fd0fb3832e66ce9691b4340a62b4fc 560w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/card-based-funding.png?w=840&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=25b7d28cb776c85fceb703b3afc8a0e1 840w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/card-based-funding.png?w=1100&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=98b27a3b139fc6810454bdd5f90ff940 1100w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/card-based-funding.png?w=1650&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=e3770184c30dc57b847612231045f3b3 1650w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/card-based-funding.png?w=2500&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=e597b1c7834bb0338a0c15d28442756c 2500w" />

<CardOnrampMainnetOnly />

## 1. Enable debit card funding in the Dashboard

In the [Privy
Dashboard](https://dashboard.privy.io/apps?page=funding), enable **Pay with card** on the **User management > Account funding** page.

With this option enabled, if Apple Pay or Google Pay is available on a user's device, Privy will provide the option to purchase with those methods.

Choose your desired network across EVM and Solana and set a recommended amount for users to fund. Users can update the amount manually if they choose.

## 2. Prompt the user to fund

### `@privy-io/react-auth`

Prompt the user to fund by calling `fundWallet`

<Tabs>
  <Tab title="Fund with EVM">
    | Parameter | Type                                                | Description                                                                                                                                                                                                                                                                               |
    | --------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `chain`   | [`Chain`](https://viem.sh/docs/chains/introduction) | Optional. A [`viem/chains`](https://viem.sh/docs/chains/introduction) object for the network on which users should fund their accounts. Defaults to the network you configured in the Privy Dashboard.                                                                                    |
    | `asset`   | `'native-currency' \| 'USDC' \| {erc20: string}`    | Optional. The asset you'd like the user to fund their accounts with. Set `'native-currency'` to fund with the `chain`'s native currency (e.g. ETH), `'USDC'` to fund with USDC, or a token address in the `erc20` field to fund with an arbitrary ERC20. Defaults to `'native-currency'`. |
    | `amount`  | `string`                                            | Required if `asset` is set, optional otherwise. The amount of the asset to fund as a decimal string. Defaults to the amount you configured in the Privy Dashboard.                                                                                                                        |

    ```tsx  theme={"system"}
    import {useFundWallet} from '@privy-io/react-auth';
    // Replace this with your desired network
    import {base} from 'viem/chains'
    ...
    // `fundWallet` from the useFundWallet() hook
    fundWallet('your-wallet-address-here', {
      chain: base,
      amount: '0.01' // Since no `asset` is set, defaults to 'native-currency' (ETH)
    })
    ```
  </Tab>

  <Tab title="Fund with SOL">
    | Parameter | Type            | Description                                                                                                                                                        |
    | --------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
    | `cluster` | `SolanaCluster` | Optional. An object for the cluster on which users should fund their accounts. Defaults to `mainnet-beta`.                                                         |
    | `amount`  | `string`        | Required if `asset` is set, optional otherwise. The amount of the asset to fund as a decimal string. Defaults to the amount you configured in the Privy Dashboard. |

    As an example, you can configure the cluster and amount to fund like so:

    ```tsx  theme={"system"}
    import {useFundWallet} from '@privy-io/react-auth/solana';
    ...
    // `fundWallet` from the useFundWallet() hook
    const {fundWallet} = useFundWallet();
    fundWallet('your-wallet-address-here', {
      cluster: {name: 'devnet'},
      amount: '0.01', // SOL
    });
    ```
  </Tab>
</Tabs>

### `@privy-io/expo`

<Tabs>
  <Tab title="Fund with EVM">
    | Parameter | Type                                                | Description                                                                                                                                                                                                                                                                               |
    | --------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `address` | `string`                                            | The destination address to fund.                                                                                                                                                                                                                                                          |
    | `chain`   | [`Chain`](https://viem.sh/docs/chains/introduction) | Optional. A [`viem/chains`](https://viem.sh/docs/chains/introduction) object for the network on which users should fund their accounts. Defaults to the network you configured in the Privy Dashboard.                                                                                    |
    | `asset`   | `'native-currency' \| 'USDC' \| {erc20: string}`    | Optional. The asset you'd like the user to fund their accounts with. Set `'native-currency'` to fund with the `chain`'s native currency (e.g. ETH), `'USDC'` to fund with USDC, or a token address in the `erc20` field to fund with an arbitrary ERC20. Defaults to `'native-currency'`. |
    | `amount`  | `string`                                            | Required if `asset` is set, optional otherwise. The amount of the asset to fund as a decimal string. Defaults to the amount you configured in the Privy Dashboard.                                                                                                                        |

    ```tsx  theme={"system"}
    import {useFundWallet} from '@privy-io/expo/ui';
    // Replace this with your desired network
    import {base} from 'viem/chains'
    ...
    // `fundWallet` from the useFundWallet() hook
    fundWallet({
      address: '0x2F3eb40872143b77D54a6f6e7Cc120464C764c09',
      asset: "USDC",
      chain: base,
      amount: '1'
    })
    ```
  </Tab>

  <Tab title="Fund with SOL">
    | Parameter | Type            | Description                                                                                                                                                        |
    | --------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
    | `cluster` | `SolanaCluster` | Optional. An object for the cluster on which users should fund their accounts. Defaults to `mainnet-beta`.                                                         |
    | `amount`  | `string`        | Required if `asset` is set, optional otherwise. The amount of the asset to fund as a decimal string. Defaults to the amount you configured in the Privy Dashboard. |

    As an example, you can configure the cluster and amount to fund like so:

    ```tsx  theme={"system"}
    import {useFundSolanaWallet} from '@privy-io/expo/ui';
    ...
    // `fundWallet` from the useFundSolanaWallet() hook
    const {fundWallet} = useFundSolanaWallet();
    fundWallet({
      address: 'address'
      amount: '0.01', // SOL
    });
    ```
  </Tab>
</Tabs>

## Resources

<CardGroup cols={1}>
  <Card title="Funding starter template" icon="github" href="https://github.com/privy-io/examples/tree/main/examples/privy-next-funding" arrow>
    Complete starter repository showcasing Privy's funding hooks and wallet funding flows.
  </Card>
</CardGroup>

## All set!

Users can now fund wallets with Apple Pay and Google Pay natively within the app, through supported onramp providers.
\n