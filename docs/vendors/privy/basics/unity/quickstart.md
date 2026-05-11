> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart

> Learn how to authenticate users, create embedded wallets, and send transactions in your Unity app

## Prerequisites

This guide assumes that you have completed the [setup](/basics/unity/setup) guide.

## Check user's authentication state

```csharp  theme={"system"}
var authState = await PrivyManager.Instance.GetAuthState();

switch (authState) {
    case AuthState.Authenticated:
        // User is authenticated. Grab the user's linked accounts
        var privyUser = await PrivyManager.Instance.GetUser();
        var linkedAccounts = privyUser.LinkedAccounts;
        break;
    case AuthState.Unauthenticated:
        // User is not authenticated.
        break;
}
```

## Authenticate your user

<Tip>
  This quickstart guide will demonstrate how to authenticate a user with a one time password as an
  example, but Privy supports many authentication methods. Explore our [Authentication
  docs](/authentication/overview) to learn about other methods such as socials, passkeys, and
  external wallets to authenticate users in your app.
</Tip>

Privy offers a variety of authentication mechanisms. The example below showcases authenticating a user via email.

This is a two step process:

1. Send an OTP to the user provided email address.
2. Verify the OTP sent to the user.

### 1. Send an OTP to the user's email address

After collecting and validating your users email, send an OTP by calling the **`SendCode`** method.

```csharp  theme={"system"}
bool success = await PrivyManager.Instance.Email.SendCode(email);

if (success)
{
    // Prompt user to enter the OTP they received at their email address through your UI
}
else
{
  // There was an error sending an OTP to your user's email
}
```

### 2. Authenticate with OTP

The user will then receive an email with a 6-digit OTP. Prompt the user for this OTP within your application, then authenticate the user with the **`loginWithCode`** method. As a parameter to this method, pass an object with the following fields:

<ParamField name="email" type="String">
  The user's email address.
</ParamField>

<ParamField name="code" type="String">
  OTP code inputted by the user in your app.
</ParamField>

```csharp  theme={"system"}
try
{
    // User will be authenticated if this call is successful
    await PrivyManager.Instance.Email.LoginWithCode(email, code);
}
catch
{
    // If "LoginWithCode" throws an exception, user login was unsuccessful.
    Debug.Log("Error logging user in.");
}
```

This method will throw an error if:

* the incorrect OTP code is inputted
* the network call to authenticate the user fails

## The embedded wallet

<Tabs>
  <Tab title="Ethereum">
    ### Create an embedded wallet

    To create an embedded Ethereum wallet for your user, call the `CreateWallet` method on the `PrivyUser`.

    ```csharp  theme={"system"}
    try
    {
        PrivyUser privyUser = PrivyManager.Instance.User;

        if (privyUser != null)
        {
            IEmbeddedEthereumWallet wallet = await PrivyManager.Instance.User.CreateWallet();
            Debug.Log("New wallet created with address: " + wallet.Address);
        }
    }
    catch
    {
        Debug.Log("Error creating embedded wallet.");
    }
    ```

    This method will throw an error if:

    * the user is not authenticated
    * the user already has an embedded wallet
    * wallet creation fails on the user's device

    To use embedded wallets, Privy implements an `RpcProvider` on the `EmbeddedWallet` class of the Unity SDK. This is an EIP1193 provider is responsible for managing RPC requests to a user's embedded wallet.

    Currently, Privy's `RpcProvider` only supports the `personal_sign` and `eth_signTypedData_v4` RPCs. We are actively adding support for other methods.

    #### 1. Get the user's wallet

    To make an RPC request to a user's wallet, first get the user's embedded wallet like so:

    ```csharp  theme={"system"}
    // Ensure user is authenticated / non null

    PrivyUser privyUser = PrivyManager.Instance.User;

    if ( privyUser != null )
    {
        // Grab the embedded wallet from the embedded wallet list
        // For demonstration purposes we're just grabbing the first one.
        IEmbeddedEthereumWallet embeddedWallet = PrivyManager.Instance.User.EmbeddedWallets[0];

        //Ensure the Wallet is not null
        if ( embeddedWallet != null )
        {
            //wallet operations
        }
    }

    ```

    #### 2. Construct your RPC request

    Next, construct the RPC request using the `RpcRequest` class from Privy. The class follows the interface below:

    ```csharp  theme={"system"}
    public class RpcRequest
    {
        public string Method { get; set; }
        public string[] Params { get; set; }

    }
    ```

    As an example, you can construct a new RPC request like so.

    ```csharp  theme={"system"}
    var rpcRequest = new RpcRequest
    {
        Method = "personal_sign", //a supported method
        Params = new string[] { "A message to sign", embeddedWallet.Address } //an array of strings, with the message + address
    };
    ```

    #### 3. Execute the RPC request

    Now, simply pass the `rpcRequest` you constructed to the `RpcProvider`'s `Request` method to execute the request:

    ```csharp  theme={"system"}
    try
    {
        //Now that the response has been constructed, we try to execute the request
        RpcResponse personalSignResponse = await embeddedWallet.RpcProvider.Request(rpcRequest);

        //If response is successful, we can parse out the data
        Debug.Log(personalSignResponse.Data)
    }
    catch (PrivyException.EmbeddedWalletException ex)
    {
        //If the request method fails, we catch it here
        Debug.LogError($"Could not sign message due to error: {ex.Error} {ex.Message}");
    }
    catch (Exception ex)
    {
        //If there's some other error, unrelated to the request, catch this here
        Debug.LogError($"Could not sign message exception {ex.Message}");
    }
    ```

    This will return an `RpcResponse`, which implements the interface below:

    ```csharp  theme={"system"}
    public class RpcResponse
    {
        public string Method { get; set; }
        public string Data { get; set; }

    }
    ```

    #### Handling errors

    The provider's `Request` method may error if:

    * the user is not authenticated
    * the user's wallet does not exist or has not loaded on their device
    * there is an issue with the RPC request that was sent to the wallet

    These errors can be caught through a generic exception, or Privy's custom `AuthenticationException` or `EmbeddedWalletException`:

    ```csharp  theme={"system"}
    catch (PrivyException.AuthenticationException ex)
    {
        Debug.LogError($"Error signing message, Type:{ex.Error}, Message:{ex.Message}");
    }
    catch (PrivyException.EmbeddedWalletException ex)
    {
        Debug.LogError($"Could not sign message due to error: {ex.Error} {ex.Message}");
    }
    catch
    {
        Debug.LogError("Error signing message");
    }

    ```

    ### Full example

    As a complete example, you can send an RPC request to a wallet and handle corresponding errors like so:

    ```csharp  theme={"system"}
    try {
        IEmbeddedEthereumWallet embeddedWallet = PrivyManager.Instance.User.EmbeddedWallets[0];

        var rpcRequest = new RpcRequest
        {
            Method = "personal_sign",
            Params = new string[] { "A message to sign", embeddedWallet.Address }  // Use the 'new' keyword here
        };

        RpcResponse personalSignResponse = await embeddedWallet.RpcProvider.Request(rpcRequest);

        Debug.Log(personalSignResponse.Data);
    } catch (PrivyException.EmbeddedWalletException ex){
        Debug.LogError($"Could not sign message due to error: {ex.Error} {ex.Message}");
    } catch (Exception ex) {
        Debug.LogError($"Could not sign message exception {ex.Message}");
    }
    ```
  </Tab>

  <Tab title="Solana">
    ### Create an embedded Solana wallet

    To create an embedded Solana wallet for your user, call the `CreateSolanaWallet` method on the `PrivyUser`.

    ```csharp  theme={"system"}
    try {
        var solanaWallet = await PrivyManager.Instance.User.CreateSolanaWallet();
        Debug.Log("New Solana wallet created with address: " + solanaWallet.Address);
    } catch {
        Debug.Log("Error creating embedded wallet.");
    }
    ```

    This method will throw an error if:

    * the user is not authenticated
    * the user already has an embedded wallet
    * wallet creation fails on the user's device

    ### Signing a message with an embedded Solana wallet

    To use embedded wallets, Privy implements a provider on the `EmbeddedSolanaWallet` class of the Unity SDK.
    This is responsible for managing requests to a user's embedded Solana wallet, via the `SignMessage` method.

    <Steps>
      <Step title="Get the user's wallet">
        To make an RPC request to a user's wallet, first get the user's embedded wallet like so:

        ```csharp  theme={"system"}
        PrivyUser privyUser = PrivyManager.Instance.User;

        // Grab the embedded wallet from the embedded wallet list
        // For demonstration purposes we're just grabbing the first one.
        var embeddedWallet = PrivyManager.Instance.User.EmbeddedSolanaWallets[0];

        //Ensure the Wallet is not null
        if (embeddedWallet != null) {
            //wallet operations
        }
        ```
      </Step>

      <Step title="Encode the message for signature">
        Signatures using the embedded Solana wallet are performed on a **base64-encoded message**.

        This means you can sign arbitrary strings by encoding their utf-8 bytes to base64,
        but it also means you can **sign any transaction by serializing it** to a base64 encoded string.

        ```csharp  theme={"system"}
        // Preparing an arbitrary string for signing
        string message = "A message to sign";
        string base64Message = Convert.ToBase64String(Encoding.UTF8.GetBytes(message));

        // Preparing a transaction for signing (using a custom class of your own for building the transaction)
        byte[] tx = new TransactionBuilder()
           // Add instructions to the transaction
           .CompileMessage();
        string base64Tx = Convert.ToBase64String(tx);
        ```
      </Step>

      <Step title="Execute the signature request">
        Now, simply pass the message you want signed to the provider's `SignMessage` method to execute the signature request:

        ```csharp  theme={"system"}
        try
        {
            var provider = embeddedWallet.EmbeddedSolanaWalletProvider;
            string signature = await provider.SignMessage(base64Message);

            Debug.Log(signature);
        }
        catch (PrivyException.EmbeddedWalletException ex)
        {
            //If the request method fails, we catch it here
            Debug.LogError($"Could not sign message due to error: {ex.Error} {ex.Message}");
        }
        catch (Exception ex)
        {
            //If there's some other error, unrelated to the request, catch this here
            Debug.LogError($"Could not sign message exception {ex.Message}");
        }
        ```
      </Step>
    </Steps>

    #### Handling errors

    The provider's `SignMessage` method may error if:

    * the user is not authenticated
    * the user's wallet does not exist or has not loaded on their device
    * there is an issue with the signature request that was sent to the wallet

    These errors can be caught through a generic exception, or Privy's custom `AuthenticationException` or `EmbeddedWalletException`:

    ```csharp  theme={"system"}
    catch (PrivyException.AuthenticationException ex)
    {
        Debug.LogError($"Error signing message, Type:{ex.Error}, Message:{ex.Message}");
    }
    catch (PrivyException.EmbeddedWalletException ex)
    {
        Debug.LogError($"Could not sign message due to error: {ex.Error} {ex.Message}");
    }
    catch (Exception ex)
    {
        Debug.LogError($"Could not sign message exception {ex.Message}");
    }
    ```
  </Tab>
</Tabs>
\n