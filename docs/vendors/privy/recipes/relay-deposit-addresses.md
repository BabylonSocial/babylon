> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Funding wallets with Relay deposit addresses

Relay deposit addresses allow users to bridge and swap assets by sending tokens to a deposit address.

Request a deposit address for the bridging or swapping pair, send the source asset to that address, and Relay executes the bridge or swap to deliver the target asset on the destination chain.

This works seamlessly for wallet funding with Privy's client-side SDKs, server-side SDKs, and REST API.

## Resources

<CardGroup cols={1}>
  <Card title="Relay docs" icon="arrow-up-right-from-square" href="https://docs.relay.link/features/deposit-addresses" arrow>
    Relay deposit address documentation.
  </Card>
</CardGroup>

***

## Prerequisites

If you have not set up Privy yet, [choose the SDK of your choice](/basics/get-started/platforms) to integrate Privy in your project.

***

## Integrating Relay deposit addresses

<Steps>
  <Step title="1. Request deposit address from Relay API">
    Request a deposit address from Relay's API by making a POST request to `https://api.relay.link/quote` with deposit address enabled. This generates a unique deposit address that cannot be reused.

    ```bash  theme={"system"}
    curl --request POST \
      --url 'https://api.relay.link/quote' \
      --header 'Content-Type: application/json' \
      --data '{
        "user": "0xF0AE622e463fa757Cf72243569E18Be7Df1996cd",
        "originChainId": 8453,
        "originCurrency": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        "destinationChainId": 10,
        "destinationCurrency": "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
        "tradeType": "EXACT_INPUT",
        "recipient": "0xF0AE622e463fa757Cf72243569E18Be7Df1996cd",
        "amount": "100000000",
        "usePermit": false,
        "useExternalLiquidity": false,
        "referrer": "privy.io",
        "useDepositAddress": true,
        "refundTo": "0xF0AE622e463fa757Cf72243569E18Be7Df1996cd"
      }'
    ```

    See the body parameters for this request below.

    <Tip>
      When using deposit addresses, set `useDepositAddress` to `true`, `refundTo` to the refund
      recipient address, and `tradeType` to `EXACT_INPUT`. Only exact input bridging is supported for
      deposit addresses.
    </Tip>

    <Expandable title="Request body parameters">
      <ParamField body="originChainId" type="number" required>
        The chain ID of the source chain (e.g., `8453` for Base).
      </ParamField>

      <ParamField body="originCurrency" type="string" required>
        The token address to send. Use `0x0000000000000000000000000000000000000000` for native tokens
        (ETH, MATIC, etc.).
      </ParamField>

      <ParamField body="destinationChainId" type="number" required>
        The chain ID of the destination chain (e.g., `10` for Optimism).
      </ParamField>

      <ParamField body="destinationCurrency" type="string" required>
        The token address to receive. Use `0x0000000000000000000000000000000000000000` for native tokens.
      </ParamField>

      <ParamField body="recipient" type="string" required>
        The wallet address that will receive the bridged/swapped tokens.
      </ParamField>

      <ParamField body="amount" type="string" required>
        The amount to bridge/swap, in the smallest unit (wei for ETH, etc.).
      </ParamField>

      <ParamField body="tradeType" type="string" required>
        Must be set to `EXACT_INPUT` when using deposit addresses. Only exact input bridging is allowed
        for deposit addresses.
      </ParamField>

      <ParamField body="useDepositAddress" type="boolean" required>
        Must be set to `true` to enable deposit address flow.
      </ParamField>

      <ParamField body="refundTo" type="string" required>
        Required when using deposit addresses. Address that receives refunds if the bridge fails.
      </ParamField>
    </Expandable>
  </Step>

  <Step title="2. Extract deposit address and requestId">
    The quote response contains a `steps` array with information for how to execute your bridge/swap.

    Specifically, extract the `depositAddress` from `quote.steps[0].depositAddress` and the `requestId` from `quote.steps[0].requestId`. The `depositAddress` is where you send tokens, and the `requestId` is used to track the bridge status.

    ```tsx  theme={"system"}
    const depositAddress = quote.steps[0].depositAddress;
    const requestId = quote.steps[0].requestId;
    ```
  </Step>

  <Step title="3. Send funds to deposit address">
    Send tokens to the deposit address. Relay bridges or swaps the assets and sends them to the recipient address on the destination chain.
  </Step>
</Steps>

***

### Check bridge status

After sending funds to the deposit address, your app can monitor the bridge status using the `requestId` from the quote response.

<Expandable title="Status checking code example">
  ```tsx  theme={"system"}
  const checkBridgeStatus = async (requestId: string) => {
    const response = await fetch(`https://api.relay.link/intents/status?requestId=${requestId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to check bridge status: ${response.statusText}`);
    }

    return await response.json();
  };
  ```
</Expandable>

***

## Conclusion

With Privy and Relay deposit addresses, your app can enable cross-chain funding for embedded wallets. Relay executes the bridge or swap, and users can fund wallets on any supported chain.

For limitations, edge cases, and advanced use cases, refer to the [Relay deposit addresses documentation](https://docs.relay.link/features/deposit-addresses), or reach out to us in [Slack](https://privy.io/slack).
\n