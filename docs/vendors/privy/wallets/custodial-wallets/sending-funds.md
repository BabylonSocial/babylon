> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Sending funds

Custodial wallets support transferring assets that are supported by the custodian. To transfer these assets, applications can use the same interface as non-custodial wallets through Privy's [server-side SDKs](/basics/get-started/platforms#server-side-sdks) or [REST API](/api-reference/wallets/ethereum/eth-send-transaction).

<Info>All transactions from custodial wallets are executed server-side.</Info>

## Send a transaction

For custodial wallets, only assets that are supported by the custodian can be transferred. Below are the assets supported:

| Asset       | Custodians that support | Contract address                             |
| ----------- | ----------------------- | -------------------------------------------- |
| USDC (Base) | Bridge                  | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| USDB (Base) | Bridge                  | `0x100Faa513aC917181EB29f73B64Bf7a434A206fe` |

<Tip>
  See the [Sending USDC recipe](/recipes/send-usdc) for a detailed example of stablecoin transfers.
</Tip>

<Info>
  Transactions from custodial wallets are gasless by default, customers do not need to enable gas
  sponsorship or set `sponsor: true` for gas to be sponsored.
</Info>

<Info>
  Like non-custodial wallets, custodial wallets with an `owner` or `additional_signers` require an
  [authorization signature](/controls/authorization-keys/using-owners/sign/overview) for transaction
  requests.
</Info>

<Tabs>
  <Tab title="NodeJS">
    Use the `sendTransaction` method from the custodial wallets interface to send transactions. This example shows sending USDC on Base.

    ### Usage

    ```js  theme={"system"}
    import {encodeFunctionData, erc20Abi} from 'viem';

    const recipientAddress = '0x...';
    const amountToSend = 10; // Sender wants to send 1 USDC
    const decimals = 6; // USDC has 6 decimals

    const encodedData = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [recipientAddress, BigInt(amountToSend * 10 ** decimals)]
    });

    const {hash, caip2} = await privy.wallets().ethereum().sendTransaction('insert-wallet-id', {
        caip2: 'eip155:8453',
        params: {
            transaction: {
                to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC contract on Base
                data: encodedData,
            },
        },
    });
    ```

    ### Parameters

    <ParamField path="walletId" type="string" required>
      The ID of the custodial wallet to send the transaction from.
    </ParamField>

    <ParamField path="caip2" type="'eip155:8453'" required>
      The CAIP-2 chain ID. For `ethereum` type custodial wallets on Base, this is `eip155:8453`.
    </ParamField>

    <ParamField path="params.transaction" type="object" required>
      The transaction details.

      <Expandable title="child properties" defaultOpen>
        <ParamField path="to" type="string" required>
          The recipient address. For ERC20 transfers, this is the token contract address (e.g., USDC on Base: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`).
        </ParamField>

        <ParamField path="data" type="string">
          Encoded transaction data. For ERC20 transfers, this contains the encoded `transfer(address,uint256)` function call.
        </ParamField>
      </Expandable>
    </ParamField>

    ### Returns

    <ResponseField name="hash" type="string">
      The hash for the broadcasted transaction. This will be an empty string since the transaction must go through custodian screening first before being broadcasted.
    </ResponseField>

    <ResponseField name="caip2" type="'eip155:8453'">
      The CAIP-2 chain ID confirming the transaction was sent on Base.
    </ResponseField>

    <ResponseField name="transactionId" type="string">
      The transaction ID for the transaction.
    </ResponseField>
  </Tab>

  <Tab title="REST API">
    To send a transaction from a custodial wallet, make a `POST` request to:

    ```bash  theme={"system"}
    https://api.privy.io/v1/custodial_wallets/<wallet_id>/rpc
    ```

    ### Usage

    This example shows sending 10 USDC on Base to the address `0xf53D6d472b4c1dF819549d044b85e63e3c7c1be2`:

    ```bash  theme={"system"}
    curl --request POST https://api.privy.io/v1/custodial_wallets/<wallet_id>/rpc \
      -u "<your-privy-app-id>:<your-privy-app-secret>" \
      -H "privy-app-id: <your-privy-app-id>" \
      -H "privy-authorization-signature: <authorization-signature-for-request>" \
      -H 'Content-Type: application/json' \
      -d '{
        "method": "eth_sendTransaction",
        "caip2": "eip155:8453",
        "params": {
          "transaction": {
            "to": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
            "data": "0xa9059cbb000000000000000000000000f53d6d472b4c1df819549d044b85e63e3c7c1be20000000000000000000000000000000000000000000000000000000000989680",
          }
        }
      }'
    ```

    ### Body

    <ParamField path="method" type="'eth_sendTransaction'" required>
      The RPC method to execute.
    </ParamField>

    <ParamField path="caip2" type="'eip155:8453'" required>
      The CAIP-2 chain ID. For `ethereum` type custodial wallets on Base, this is `eip155:8453`.
    </ParamField>

    <ParamField path="params.transaction" type="object" required>
      The transaction details.

      <Expandable title="child properties" defaultOpen>
        <ParamField path="to" type="string" required>
          The recipient address. For ERC20 transfers, this is the token contract address (e.g., USDC on Base: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`).
        </ParamField>

        <ParamField path="data" type="string">
          Encoded transaction data. For ERC20 transfers, this contains the encoded `transfer(address,uint256)` function call.
        </ParamField>
      </Expandable>
    </ParamField>

    ### Response

    A successful response will look like:

    ```json  theme={"system"}
    {
      "method": "eth_sendTransaction",
      "data": {
        "hash": "",
        "caip2": "eip155:8453",
        "transaction_id": "fd272b00-1531-4bf8-8536-25b9b8f5aa3d",
      }
    }
    ```

    Check out the [API reference](/api-reference/wallets/ethereum/eth-send-transaction) for more details. Note that the transaction hash will be an empty string since the transaction must go through custodian screening first before being broadcasted.
  </Tab>
</Tabs>

## Next steps

<CardGroup>
  <Card title="Transaction lifecycle" icon="clock" href="/wallets/custodial-wallets/transaction-lifecycle">
    Learn about the transaction lifecycle for custodial wallets
  </Card>

  <Card title="Sending USDC recipe" icon="book-open" href="/recipes/send-usdc">
    Learn how to format and encode ERC-20 token transfers
  </Card>

  <Card title="Authorization controls" icon="shield-halved" href="/wallets/custodial-wallets/advanced/authorization-controls">
    Configure policies and multi-party approvals for custodial wallets
  </Card>

  <Card title="Transaction webhooks" icon="webhook" href="/wallets/custodial-wallets/advanced/webhooks">
    Monitor transaction status and lifecycle events
  </Card>
</CardGroup>
\n