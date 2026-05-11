> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Stripe Embedded Components crypto onramp

> Build a fully customized crypto stablecoin onramp experience using Privy embedded wallets and Stripe Embedded Components for the Crypto Onramp SDK

Privy's embedded wallets integrate with Stripe's Embedded Components for the Crypto Onramp SDK. Stripe handles payment processing, KYC, and crypto delivery. This recipe shows how to build a fully customized onramp experience where your app controls the UI.

Using this integration, your app can:

* Create a seamless branded onramp experience with app-controlled UI
* Leverage Stripe's payment infrastructure for card, bank, and Apple Pay
* Delivers crypto to users' Privy embedded wallets through Stripe
* Handle KYC verification through Stripe's identity services

<Warning>
  Stripe's Embedded Components for Crypto Onramp is currently in private beta. Your app must be
  approved for crypto onramp and enrolled in Stripe's verified apps program before using this
  integration.
</Warning>

## Prerequisites

Before integrating, ensure your app meets the following requirements:

1. **Stripe Account with Crypto Onramp Access**: Submit an [application for crypto onramp](https://docs.stripe.com/crypto/onramp#submit-your-application)
2. **Verified Apps Program Enrollment**: Contact your Stripe representative to enroll in the verified apps program
3. **Privy App**: A configured Privy app with embedded wallets enabled

## Architecture overview

The Embedded Components onramp flow involves three components:

1. **Your Frontend (Expo/React Native)**: Collects user input, displays UI, and calls Stripe Embedded Components SDK methods
2. **Your Backend**: Calls Stripe APIs to manage crypto customers, sessions, and transactions
3. **Stripe Embedded Components SDK**: Handles Link authentication, KYC collection, payment method selection, and identity verification

## Setup

### 1. Install the Stripe React Native SDK with Embedded Components

Add the Stripe React Native SDK with Embedded Components onramp support to your Expo project:

```bash  theme={"system"}
npm install @stripe/stripe-react-native@0.52.0-crypto-onramp-2-private-beta
```

### 2. Configure Expo

Update your `app.json` to include the onramp plugin:

```json  theme={"system"}
{
  "expo": {
    "plugins": [
      [
        "@stripe/stripe-react-native",
        {
          "merchantIdentifier": "merchant.com.your-app",
          "enableGooglePay": false,
          "includeOnramp": true
        }
      ]
    ]
  }
}
```

### 3. Configure StripeProvider

Wrap your app with both `PrivyProvider` and `StripeProvider`:

```tsx  theme={"system"}
import {PrivyProvider} from '@privy-io/expo';
import {StripeProvider} from '@stripe/stripe-react-native';

export default function App() {
  return (
    <PrivyProvider appId="your-privy-app-id" clientId="your-client-id">
      <StripeProvider publishableKey="pk_..." merchantIdentifier="merchant.com.your-app">
        <YourApp />
      </StripeProvider>
    </PrivyProvider>
  );
}
```

## Integration flow

The Embedded Components onramp follows this sequence:

1. User signs up or logs in to Link (returns a `CryptoCustomer` ID)
2. Your backend fetches the customer's status (KYC, wallets, payment methods)
3. If setup is needed, the Embedded Components SDK helps the user complete it
4. Your backend creates and completes an onramp session

### Step 1: Initialize the Onramp Coordinator

Configure the Stripe Embedded Components SDK when your component mounts:

```tsx  theme={"system"}
import {useOnramp} from '@stripe/stripe-react-native';
import {usePrivy} from '@privy-io/expo';

function OnrampScreen() {
  const {configure, hasLinkAccount, registerLinkUser, authenticateUser} = useOnramp();
  const {user} = usePrivy();
  const [cryptoCustomerId, setCryptoCustomerId] = useState<string | null>(null);

  useEffect(() => {
    // Initialize the onramp coordinator
    configure({
      appearance: {
        // Customize the appearance of Stripe UI components
        colors: {
          primary: '#0066FF'
        }
      }
    });
  }, []);
}
```

### Step 2: Handle Link authentication

Check if the user has a Link account and authenticate or register them:

```tsx  theme={"system"}
async function handleLinkAuth(email: string) {
  // Check if user already has a Link account
  const result = await hasLinkAccount(email);

  if (result.hasLinkAccount) {
    // Authenticate existing user - presents Stripe UI for OTP verification
    const authResult = await authenticateUser();
    if (authResult.customerId) {
      setCryptoCustomerId(authResult.customerId);
      return authResult.customerId;
    }
  } else {
    // Register new Link user
    const regResult = await registerLinkUser({
      email,
      phone: '+1234567890', // Collect from user in E.164 format
      country: 'US', // Two-letter country code
      fullName: 'John Doe' // Recommended for non-US users
    });
    if (regResult.customerId) {
      setCryptoCustomerId(regResult.customerId);
      return regResult.customerId;
    }
  }
  return null;
}
```

### Step 3: Check customer status (Backend)

After authentication, fetch the customer's status from your backend:

<View title="Backend (Node.js)" icon="node-js">
  ```typescript  theme={"system"}
  import Stripe from 'stripe';

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  // GET /api/crypto/customer/:id
  async function getCryptoCustomer(req, res) {
    const {id} = req.params;
    const oauthToken = req.headers['stripe-oauth-token'];

    const response = await fetch(`https://api.stripe.com/v1/crypto/customers/${id}`, {
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Stripe-OAuth-Token': oauthToken
      }
    });

    const customer = await response.json();

    // Check verification status
    const kycVerified = customer.verifications.find((v) => v.name === 'kyc_verified');
    const idDocVerified = customer.verifications.find((v) => v.name === 'id_document_verified');

    res.json({
      customerId: customer.id,
      providedFields: customer.provided_fields,
      kycStatus: kycVerified?.status || 'not_started',
      idDocStatus: idDocVerified?.status || 'not_started'
    });
  }
  ```
</View>

<View title="Frontend" icon="react">
  ```tsx  theme={"system"}
  async function checkCustomerStatus(customerId: string) {
    const response = await fetch(`/api/crypto/customer/${customerId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    return response.json();
  }
  ```
</View>

### Step 4: Collect KYC data if needed

If the customer needs KYC verification, collect and submit the data:

```tsx  theme={"system"}
import {useOnramp} from '@stripe/stripe-react-native';

function KYCForm({customerId}: {customerId: string}) {
  const {attachKycInfo} = useOnramp();

  async function submitKYC(formData: KYCFormData) {
    const result = await attachKycInfo({
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: {
        day: formData.dobDay,
        month: formData.dobMonth,
        year: formData.dobYear
      },
      address: {
        line1: formData.addressLine1,
        line2: formData.addressLine2,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        country: formData.country
      },
      // Optional fields depending on jurisdiction
      idType: 'social_security_number',
      idNumber: formData.ssn
    });

    if (!result.error) {
      // KYC submitted successfully
      return true;
    }
    return false;
  }
}
```

### Step 5: Handle identity verification if required

For transactions requiring document verification, use the identity verification API:

```tsx  theme={"system"}
async function handleIdentityVerification() {
  const {verifyIdentity} = useOnramp();

  // This launches Stripe's Identity SDK for document upload
  const result = await verifyIdentity();

  if (!result.error) {
    // User completed document upload
    return true;
  }
  // User canceled or error occurred - allow retry
  return false;
}
```

### Step 6: Register wallet address

Register the user's Privy wallet as their crypto destination:

```tsx  theme={"system"}
import {useEmbeddedEthereumWallet} from '@privy-io/expo';
import {useOnramp} from '@stripe/stripe-react-native';

function WalletRegistration() {
  const {wallets} = useEmbeddedEthereumWallet();
  const {registerWalletAddress} = useOnramp();

  async function registerWallet() {
    const wallet = wallets[0];
    if (!wallet) return;

    // Register wallet with network type
    // Supported networks for USDC: 'base', 'polygon', 'solana', 'avalanche'
    const result = await registerWalletAddress(wallet.address, 'base');

    return !result.error;
  }
}
```

### Step 7: Collect payment method

Allow users to select or add a payment method:

```tsx  theme={"system"}
async function handlePaymentMethodCollection(paymentType: 'Card' | 'BankAccount' | 'PlatformPay') {
  const {collectPaymentMethod} = useOnramp();

  // Collect a specific payment method type
  // For PlatformPay (Apple Pay/Google Pay), pass additional params
  const result = await collectPaymentMethod(
    paymentType,
    paymentType === 'PlatformPay'
      ? {
          // Optional PlatformPay params for Apple Pay / Google Pay
        }
      : undefined
  );

  if (result.paymentDisplayData) {
    // Returns PaymentDisplayData with icon, label, sublabel
    return result.paymentDisplayData;
  }
  return null;
}
```

### Step 8: Create and complete the onramp session (Backend)

Create an onramp session and execute the transaction:

<View title="Backend (Node.js)" icon="node-js">
  ```typescript  theme={"system"}
  // POST /api/crypto/onramp
  async function createOnrampSession(req, res) {
    const {
      cryptoCustomerId,
      paymentToken,
      walletId,
      sourceCurrency,
      destinationCurrency,
      sourceAmount,
      customerIpAddress
    } = req.body;

    // Create the onramp session
    const session = await fetch('https://api.stripe.com/v1/crypto/onramp_sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        ui_mode: 'headless',
        crypto_customer_id: cryptoCustomerId,
        payment_token: paymentToken,
        wallet_id: walletId,
        source_currency: sourceCurrency, // e.g., 'usd.fiat'
        destination_currency: destinationCurrency, // e.g., 'eth.ethereum'
        source_amount: sourceAmount.toString(),
        customer_ip_address: customerIpAddress,
        off_session: 'false'
      })
    });

    const sessionData = await session.json();
    res.json(sessionData);
  }

  // POST /api/crypto/onramp/:sessionId/checkout
  async function completeCheckout(req, res) {
    const {sessionId} = req.params;

    const result = await fetch(
      `https://api.stripe.com/v1/crypto/onramp_sessions/${sessionId}/checkout`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`
        }
      }
    );

    const data = await result.json();

    // Check for errors
    if (data.error_reason) {
      return res.status(400).json({
        error: data.error_reason
        // Possible values: location_not_supported, transaction_limit_reached,
        // charged_with_expired_quote, action_required, transaction_failed,
        // missing_kyc, missing_document_verification, missing_consumer_wallet
      });
    }

    res.json({
      status: data.status,
      transactionDetails: data.transaction_details
    });
  }
  ```
</View>

<View title="Frontend" icon="react">
  ```tsx  theme={"system"}
  async function executeOnramp(params: {amount: string; destinationCurrency: string}) {
    // Create session
    const session = await fetch('/api/crypto/onramp', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        cryptoCustomerId,
        paymentToken: selectedPaymentMethod.token,
        walletId: registeredWalletId,
        sourceCurrency: 'usd.fiat',
        destinationCurrency: params.destinationCurrency,
        sourceAmount: params.amount,
        customerIpAddress: await getClientIp()
      })
    });

    const sessionData = await session.json();

    // Complete checkout
    const result = await fetch(`/api/crypto/onramp/${sessionData.id}/checkout`, {
      method: 'POST'
    });

    return result.json();
  }
  ```
</View>

### Step 9: Handle 3DS and additional authentication

Some transactions require additional authentication (like 3DS for cards). The `performCheckout` SDK method handles this automatically:

```tsx  theme={"system"}
import {useOnramp} from '@stripe/stripe-react-native';

function CheckoutButton({sessionId}: {sessionId: string}) {
  const {performCheckout} = useOnramp();

  async function handleCheckout() {
    // performCheckout handles 3DS and other auth flows automatically
    // The callback may be invoked twice: initially and after any required auth
    const result = await performCheckout(sessionId, async () => {
      const response = await fetch(`/api/crypto/onramp/${sessionId}/checkout`, {
        method: 'POST'
      });
      const data = await response.json();
      return data.client_secret;
    });

    if (!result.error) {
      // Transaction successful
      // Poll for blockchain confirmation using transaction_details.blockchain_tx_id
    }
  }
}
```

## Complete example

Here's a complete component that ties together the entire flow (you can find the repo example [here](https://github.com/privy-io/expo-starter/tree/feature/stripe-headless-onramp)):

```tsx  theme={"system"}
import {useState, useEffect} from 'react';
import {View, Text, Button, TextInput} from 'react-native';
import {usePrivy, useEmbeddedEthereumWallet} from '@privy-io/expo';
import {useOnramp} from '@stripe/stripe-react-native';

type OnrampStep = 'auth' | 'kyc' | 'wallet' | 'payment' | 'checkout' | 'complete';

export function HeadlessOnramp() {
  const {user} = usePrivy();
  const {wallets} = useEmbeddedEthereumWallet();
  const {
    configure,
    hasLinkAccount,
    registerLinkUser,
    authenticateUser,
    attachKycInfo,
    registerWalletAddress,
    collectPaymentMethod,
    createCryptoPaymentToken,
    performCheckout
  } = useOnramp();

  const [step, setStep] = useState<OnrampStep>('auth');
  const [cryptoCustomerId, setCryptoCustomerId] = useState<string | null>(null);
  const [amount, setAmount] = useState('100');

  useEffect(() => {
    configure({
      appearance: {colors: {primary: '#6366F1'}}
    });
  }, []);

  // Step 1: Link Authentication
  async function handleAuth() {
    const email = user?.email?.address;
    if (!email) return;

    const lookupResult = await hasLinkAccount(email);

    if (lookupResult.hasLinkAccount) {
      const authResult = await authenticateUser();
      if (authResult.customerId) {
        setCryptoCustomerId(authResult.customerId);
        await checkAndAdvance(authResult.customerId);
      }
    } else {
      // Show registration form...
    }
  }

  // Check customer status and advance to appropriate step
  async function checkAndAdvance(customerId: string) {
    const status = await fetch(`/api/crypto/customer/${customerId}`).then((r) => r.json());

    if (status.kycStatus !== 'verified') {
      setStep('kyc');
    } else if (!status.hasWallet) {
      setStep('wallet');
    } else if (!status.hasPaymentMethod) {
      setStep('payment');
    } else {
      setStep('checkout');
    }
  }

  // Step 2: Register Privy wallet
  async function handleWalletRegistration() {
    const wallet = wallets[0];
    if (!wallet) return;

    const result = await registerWalletAddress(wallet.address, 'base');

    if (!result.error) {
      setStep('payment');
    }
  }

  // Step 3: Collect payment method
  async function handlePaymentMethod() {
    const result = await collectPaymentMethod('Card');

    if (result.paymentDisplayData) {
      setStep('checkout');
    }
  }

  // Step 4: Execute checkout
  async function handleCheckout() {
    // Create a payment token for the selected method
    const tokenResult = await createCryptoPaymentToken();
    if (!tokenResult.cryptoPaymentToken) return;

    const session = await fetch('/api/crypto/onramp', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        cryptoCustomerId,
        paymentToken: tokenResult.cryptoPaymentToken,
        sourceAmount: amount,
        destinationCurrency: 'usdc.base'
      })
    }).then((r) => r.json());

    const result = await performCheckout(session.id, async () => {
      const checkout = await fetch(`/api/crypto/onramp/${session.id}/checkout`, {
        method: 'POST'
      }).then((r) => r.json());
      return checkout.client_secret;
    });

    if (!result.error) {
      setStep('complete');
    }
  }

  return (
    <View>
      {step === 'auth' && <Button title="Connect with Link" onPress={handleAuth} />}

      {step === 'wallet' && (
        <View>
          <Text>Register your wallet to receive crypto</Text>
          <Text>Wallet: {wallets[0]?.address}</Text>
          <Button title="Register Wallet" onPress={handleWalletRegistration} />
        </View>
      )}

      {step === 'payment' && <Button title="Add Payment Method" onPress={handlePaymentMethod} />}

      {step === 'checkout' && (
        <View>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="Amount in USD"
          />
          <Button title={`Buy $${amount} of USDC`} onPress={handleCheckout} />
        </View>
      )}

      {step === 'complete' && <Text>Transaction complete! Check your wallet for USDC.</Text>}
    </View>
  );
}
```

<Info>
  Stripe Crypto onramp currently only supports stablecoin as onramp currencies. If you wish to
  onramp other currencies such as ETH or SOL, you can make use of our [card-based
  funding](/recipes/card-based-funding) offerings.
</Info>

## Error handling

Handle common errors that can occur during the onramp flow:

```tsx  theme={"system"}
const ERROR_MESSAGES: Record<string, string> = {
  location_not_supported: "Crypto purchases aren't available in your location",
  transaction_limit_reached: 'You have reached your transaction limit',
  charged_with_expired_quote: 'The quote expired. Please try again',
  action_required: 'Additional verification required',
  transaction_failed: 'Transaction failed. Please try again',
  missing_kyc: 'Please complete identity verification',
  missing_document_verification: 'Please upload your ID document',
  missing_consumer_wallet: 'Please register a wallet address'
};

function getErrorMessage(errorCode: string): string {
  return ERROR_MESSAGES[errorCode] || 'An unexpected error occurred';
}
```

## Resources

<CardGroup cols={2}>
  <Card title="Example implementation" icon="github" href="https://github.com/privy-io/expo-starter/tree/feature/stripe-headless-onramp">
    POC integration in the Privy Expo starter repo
  </Card>

  <Card title="Privy Expo SDK" icon="mobile" href="/basics/react-native/installation">
    Set up Privy embedded wallets in your Expo app
  </Card>

  <Card title="Stripe Crypto Docs" icon="stripe" href="https://docs.stripe.com/crypto/onramp">
    Official Stripe Crypto Onramp documentation
  </Card>

  <Card title="Bridge Onramp" icon="building-columns" href="/recipes/bridge-onramp">
    Bank transfer funding via Bridge
  </Card>
</CardGroup>
\n