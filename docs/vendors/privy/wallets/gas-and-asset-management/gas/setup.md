> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Setting up sponsorship

Setting up native gas sponsorship allows your app to pay for all transaction fees, creating a
frictionless experience across all networks.

## Getting started

<Steps>
  <Step title="Enable gas sponsorship in the dashboard">
    Go to the gas sponsorship tab in the [Privy
    Dashboard](https://dashboard.privy.io/apps?page=gas_sponsorship), and enable gas sponsorship for
    your application.

        <img src="https://mintcdn.com/privy-c2af3412/JsgMIYodAfYOjJAO/images/gas-sponsorship.png?fit=max&auto=format&n=JsgMIYodAfYOjJAO&q=85&s=67192ab8282dd9d4f560acc5e8650126" alt="images/gas-sponsorship.png" data-og-width="1843" width="1843" data-og-height="1317" height="1317" data-path="images/gas-sponsorship.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/JsgMIYodAfYOjJAO/images/gas-sponsorship.png?w=280&fit=max&auto=format&n=JsgMIYodAfYOjJAO&q=85&s=caf0cb618c798e2fd0d0359d106e5567 280w, https://mintcdn.com/privy-c2af3412/JsgMIYodAfYOjJAO/images/gas-sponsorship.png?w=560&fit=max&auto=format&n=JsgMIYodAfYOjJAO&q=85&s=ed9519a2ad9468ebca11cdbc8559e84d 560w, https://mintcdn.com/privy-c2af3412/JsgMIYodAfYOjJAO/images/gas-sponsorship.png?w=840&fit=max&auto=format&n=JsgMIYodAfYOjJAO&q=85&s=ed7dd6cd88e7c3280042e644761a0e0c 840w, https://mintcdn.com/privy-c2af3412/JsgMIYodAfYOjJAO/images/gas-sponsorship.png?w=1100&fit=max&auto=format&n=JsgMIYodAfYOjJAO&q=85&s=3c7bb3b42675e4a489cc449f829eb124 1100w, https://mintcdn.com/privy-c2af3412/JsgMIYodAfYOjJAO/images/gas-sponsorship.png?w=1650&fit=max&auto=format&n=JsgMIYodAfYOjJAO&q=85&s=1d8354422d6ef866b9592a619119ef64 1650w, https://mintcdn.com/privy-c2af3412/JsgMIYodAfYOjJAO/images/gas-sponsorship.png?w=2500&fit=max&auto=format&n=JsgMIYodAfYOjJAO&q=85&s=385e7660632af3fd6e7f74f25ab5361b 2500w" />
  </Step>

  <Step title="Configure chains">
    Select which chains you want to enable sponsorship for. Sponsored requests
    may only come from the chains that you have configured. Want support for more networks? [Reach out to us!](mailto:sales@privy.io)
  </Step>

  <Step title="Send transaction requests">
    <Info>
      Apps **must** use [TEE execution](/security/wallet-infrastructure/architecture) in order to use our native gas sponsorship feature. Learn how to migrate [here](/recipes/tee-wallet-migration-guide)!
    </Info>

    <Tabs>
      <Tab title="Ethereum (React)">
        With the React SDK, use the `useSendTransaction` hook with `sponsor: true`:

        ```tsx highlight={12} theme={"system"}
        import {useSendTransaction, useWallets} from '@privy-io/react-auth';

        const {sendTransaction} = useSendTransaction();
        const {wallets} = useWallets();

        sendTransaction(
          {
            to: '0xE3070d3e4309afA3bC9a6b057685743CF42da77C',
            value: 100000
          },
          {
            sponsor: true // Enable gas sponsorship
          }
        );
        ```
      </Tab>

      <Tab title="Solana (React)">
        With the React SDK, use the `useSignAndSendTransaction` hook with `sponsor: true`:

        ```tsx highlight={15} theme={"system"}
        import {useSignAndSendTransaction, useWallets} from '@privy-io/react-auth/solana';

        const {signAndSendTransaction} = useSignAndSendTransaction();
        const {wallets} = useWallets();

        const selectedWallet = wallets[0];

        // Create your transaction (example using @solana/kit)
        const transaction = new Uint8Array([/* your encoded transaction */]);

        const result = await signAndSendTransaction({
          transaction: transaction,
          wallet: selectedWallet,
          options: {
            sponsor: true // Enable gas sponsorship
          }
        });

        console.log('Transaction sent with signature:', result.signature);
        ```

        <Info>
          **Allow transactions from the client**

          To sponsor transactions from your client-side application, enable this setting in your gas sponsorship dashboard configuration. When disabled, transactions can only be sponsored from your server.
        </Info>
      </Tab>

      <Tab title="Ethereum (REST API)">
        Gas sponsored transactions share the same path and interfaces as our other RPC requests. Learn
        more about sending transactions [here.](/api-reference/wallets/ethereum/eth-send-transaction)
        You must also include the `sponsor: true` parameter for transactions to be sponsored.

        ```bash highlight={9} theme={"system"}
        $ curl --request POST https://api.privy.io/v1/wallets/<wallet_id>/rpc \
          -u "<your-privy-app-id>:<your-privy-app-secret>" \
          -H "privy-app-id: <your-privy-app-id>" \
          -H "privy-authorization-signature: <authorization-signature-for-request>" \
          -H 'Content-Type: application/json' \
          -d '{
              "method": "eth_sendTransaction",
              "caip2": "eip155:1",
              "sponsor": true
              "params": {
                  "transaction": {
                      "to": "0xE3070d3e4309afA3bC9a6b057685743CF42da77C",
                      "value": "0x2386F26FC10000",
                  },
              },
          }'
        ```

        <Info>
          To sponsor transactions that are initiated from a client SDK, you may [relay the transaction](/controls/authorization-keys/keys/create/user/request) from your server.
        </Info>
      </Tab>

      <Tab title="Ethereum (Node SDK)">
        With the Node SDK, use the `wallets().ethereum().sendTransaction` method with `sponsor: true`:

        ```typescript highlight={23} theme={"system"}
        import { PrivyClient } from '@privy-io/node';

        const privy = new PrivyClient({
          appId: 'your-app-id',
          appSecret: 'your-app-secret'
        });

        async function sendSponsoredTransaction(walletId: string) {
          try {
            // Send a sponsored transaction on Ethereum
            const response = await privy
              .wallets()
              .ethereum()
              .sendTransaction(walletId, {
                caip2: 'eip155:1', // Ethereum mainnet
                params: {
                  transaction: {
                    to: '0x{address}',
                    value: '0x2386F26FC10000', // Amount in wei (hex format)
                    data: '0x', // optional contract call data
                  },
                },
                sponsor: true, // Enable gas sponsorship
              });

            // Response contains transaction hash and ID
            console.log('Transaction hash:', response.hash);
            console.log('Transaction ID:', response.transaction_id);
            return response;
          } catch (error) {
            console.error('Transaction failed:', error);
            throw error;
          }
        }
        ```

        <Info>
          To sponsor transactions that are initiated from a client SDK, you may [relay the transaction](/controls/authorization-keys/keys/create/user/request) from your server.
        </Info>
      </Tab>

      <Tab title="Ethereum (Rust SDK)">
        With the Rust SDK, use the `ethereum_send_transaction` method with `sponsor: true`:

        ```rust  theme={"system"}
        use privy_rs::{PrivyClient, generated::types::*};

        let client = PrivyClient::new(app_id, app_secret)?;

        // Create a sponsored ETH transfer
        let request = EthereumSendTransactionRpcInput {
            method: "eth_sendTransaction".to_string(),
            caip2: "eip155:1".to_string(), // Ethereum mainnet
            sponsor: Some(true), // Enable gas sponsorship
            params: EthereumSendTransactionRpcInputParams {
                transaction: EthereumSendTransactionRpcInputParamsTransaction {
                    to: Some("0xE3070d3e4309afA3bC9a6b057685743CF42da77C".to_string()),
                    value: Some("0x2386F26FC10000".to_string()), // 0.01 ETH
                    gas: None, // Let Privy estimate
                    gas_price: None, // Let Privy set optimal price
                    data: None,
                    nonce: None,
                }
            }
        };

        let response = client
            .wallets()
            .ethereum_send_transaction("wallet-id", request, &authorization_context)
            .await?;

        println!("Sponsored transaction hash: {}", response.data.transaction_hash);
        ```

        <Info>
          To sponsor transactions that are initiated from a client SDK, you may [relay the transaction](/controls/authorization-keys/keys/create/user/request) from your server.
        </Info>

        ### Parameters and Returns

        See the Rust SDK documentation for detailed parameter and return types, including embedded examples:

        * [WalletsClient::ethereum\_send\_transaction](https://docs.rs/privy-rs/latest/privy_rs/subclients/struct.WalletsClient.html#method.ethereum_send_transaction)
        * [EthereumSendTransactionRpcInput](https://docs.rs/privy-rs/latest/privy_rs/generated/types/struct.EthereumSendTransactionRpcInput.html)

        For REST API details, see the [API reference](/api-reference/wallets/ethereum/eth-send-transaction).
      </Tab>

      <Tab title="Solana (REST API)">
        Gas sponsored transactions share the same path and interfaces as our other RPC requests. Learn
        more about sending transactions [here.](/api-reference/wallets/solana/sign-and-send-transaction)
        You must also include the `sponsor: true` parameter for transactions to be sponsored.

        ```bash highlight={9} theme={"system"}
        $ curl --request POST https://api.privy.io/v1/wallets/<wallet_id>/rpc \
          -u "<your-privy-app-id>:<your-privy-app-secret>" \
          -H "privy-app-id: <your-privy-app-id>" \
          -H "privy-authorization-signature: <authorization-signature-for-request>" \
          -H 'Content-Type: application/json' \
          -d '{
              "method": "signAndSendTransaction",
              "caip2": "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
              "sponsor": true
              "params": {
                  "transaction": "insert-base-64-encoded-serialized-transaction",
                  "encoding": "base64"
              }
          }'
        ```

        <Info>
          To sponsor transactions that are initiated from a client SDK, you may [relay the transaction](/controls/authorization-keys/keys/create/user/request) from your server.
        </Info>
      </Tab>

      <Tab title="Solana (Node SDK)">
        With the Node SDK, use the `wallets().solana().signAndSendTransaction` method with `sponsor: true`:

        ```typescript highlight={22} theme={"system"}
        import { PrivyClient } from '@privy-io/node';

        const privy = new PrivyClient({
          appId: 'your-app-id',
          appSecret: 'your-app-secret'
        });
        // A base64 encoded serialized transaction to sign
        const transaction = "insert-base-64-encoded-serialized-transaction";

        async function sendSponsoredSolanaTransaction(
          walletId: string,
          serializedTransaction: string
        ) {
          try {
            // Send a sponsored transaction on Solana
            const response = await privy
              .wallets()
              .solana()
              .signAndSendTransaction(walletId, {
                caip2: 'solana:mainnet',
                transaction, // Base64-encoded or Uint8Array
                sponsor: true, // Enable gas sponsorship
              });

            // Response contains transaction hash and ID
            console.log('Transaction hash:', response.hash);
            console.log('Transaction ID:', response.transaction_id);
            return response;
          } catch (error) {
            console.error('Transaction failed:', error);
            throw error;
          }
        }
        ```

        <Info>
          To sponsor transactions that are initiated from a client SDK, you may [relay the transaction](/controls/authorization-keys/keys/create/user/request) from your server.
        </Info>
      </Tab>

      <Tab title="Solana (Rust SDK)">
        With the Rust SDK, use the `solana_sign_and_send_transaction` method with `sponsor: true`:

        ```rust  theme={"system"}
        use privy_rs::{PrivyClient, generated::types::*};

        let client = PrivyClient::new(app_id, app_secret)?;

        // Prepare your transaction (this example assumes you have a serialized transaction)
        let serialized_transaction = "base64-encoded-transaction-here";

        let request = SolanaSignAndSendTransactionRpcInput {
            method: "signAndSendTransaction".to_string(),
            caip2: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1".to_string(), // Solana mainnet
            sponsor: Some(true), // Enable gas sponsorship
            params: SolanaSignAndSendTransactionRpcInputParams {
                transaction: serialized_transaction.to_string(),
                encoding: Some("base64".to_string()),
                send_options: None,
            }
        };

        let response = client
            .wallets()
            .solana_sign_and_send_transaction("wallet-id", request, &authorization_context)
            .await?;

        println!("Sponsored transaction signature: {}", response.signature);
        ```

        <Info>
          To sponsor transactions that are initiated from a client SDK, you may [relay the transaction](/controls/authorization-keys/keys/create/user/request) from your server.
        </Info>

        ### Parameters and Returns

        See the Rust SDK documentation for detailed parameter and return types, including embedded examples:

        * [WalletsClient::solana\_sign\_and\_send\_transaction](https://docs.rs/privy-rs/latest/privy_rs/subclients/struct.WalletsClient.html#method.solana_sign_and_send_transaction)
        * [SolanaSignAndSendTransactionRpcInput](https://docs.rs/privy-rs/latest/privy_rs/generated/types/struct.SolanaSignAndSendTransactionRpcInput.html)

        For REST API details, see the [API reference](/api-reference/wallets/solana/sign-and-send-transaction).
      </Tab>
    </Tabs>
  </Step>
</Steps>

<Warning>
  Certain flows that require on-chain ECDSA signature verification such as Permit2 are not supported
  by EIP-7702 upgraded wallets. We recommend using an approval based flow where possible.
</Warning>

## Next steps

<CardGroup cols={2}>
  <Card title="Transaction management" icon="clock" href="/wallets/gas-and-asset-management/gas/transaction-handling">
    Learn how gas-sponsored transactions work and how to track transaction status with webhooks
  </Card>

  <Card title="Security best practices" icon="shield-check" href="/wallets/gas-and-asset-management/gas/security">
    Protect your application from gas sponsorship abuse with rate limiting and threat mitigation
    strategies
  </Card>
</CardGroup>

<Info>
  **Transactions return immediately**

  Gas-sponsored transactions return immediately after broadcast without waiting for confirmation. Learn how to track transaction status with webhooks in the [transaction management guide](/wallets/gas-and-asset-management/gas/transaction-handling).
</Info>

<Warning>
  **Secure your implementation before production**

  Gas sponsorship requires protection against abuse to prevent drainage of your balance. Review the [security best practices](/wallets/gas-and-asset-management/gas/security) before deploying to production.
</Warning>
\n