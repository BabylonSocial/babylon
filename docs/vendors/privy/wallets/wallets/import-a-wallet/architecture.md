> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Architecture

**Privy uses end-to-end encryption to securely transmit your wallet entropy into Privy's TEE infrastructure.**

This enables you to import a wallet from your client, server, or TEE without exposing your wallet entropy to any intermediary services.

The wallet import process takes place over three steps:

### Step 1. Initializing key import

In order to end-to-end encrypt an imported wallet directly to the TEE, an asymmetric encryption key is required. Send an initialization request to the Privy API to retrieve a temporary public key used for encrypting private key material before transmission.

### Step 2: Encrypting your private key

Encrypt the wallet’s private key using Hybrid Public Key Encryption (HPKE) with the retrieved public key. This ensures the private key remains encrypted during transit and can only be decrypted within the TEE.

### Step 3: Submitting the encrypted key

Send the encrypted payload to the Privy API. Within the TEE, the encrypted payload is decrypted and the private key is used to initialize a new wallet. The temporary keypair used for the import process is destroyed to maintain forward secrecy.
\n