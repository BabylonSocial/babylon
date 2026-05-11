> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Sign transaction inputs

<Info>
  With Privy, you can create Bitcoin (segwit) wallets and sign over transactions and any other
  arbitrary input. See the [Tier 2](/wallets/overview/chains) section for more details. Taproot
  wallets are coming soon.
</Info>

## Signing transaction inputs

Bitcoin uses the UTXO model, where each transaction consumes one or more inputs and produces one or more outputs. To sign a transaction using Privy, use Privy's raw sign functionality to sign each input hash, and then add the signature(s) to the transaction.

### Example

The following is an example using the [scure/btc-signer](https://github.com/paulmillr/scure-btc-signer) library to sign a transaction input.

```typescript {skip-check} theme={"system"}
import {p2pkh, OutScript} from '@scure/btc-signer/payment';
import {getInputType, getPrevOut, Transaction} from '@scure/btc-signer/transaction';
import {concatBytes} from '@scure/btc-signer/utils';
import secp256k1 from 'secp256k1';

const publicKey = "<the wallet's public key>";

const publicKeyBuffer = Buffer.from(publicKey, 'hex');
const tx = new Transaction({version: 1, allowLegacyWitnessUtxo: true});
// add as many outputs as needed, in this example there is only one
tx.addOutputAddress(outputAddress, outputAmount);

tx.addInput({
  txid, // buffer of utxo txid
  index: 0, // index of the output in the tx
  witnessUtxo: {
    amount: inputAmount,
    script: p2pkh(publicKeyBuffer).script
  }
});

// Loop through each input and sign it
for (let i = 0; i < tx.inputsLength; i++) {
  const input = tx.getInput(i);
  const inputType = getInputType(input, tx.opts.allowLegacyWitnessUtxo);
  const prevOut = getPrevOut(input);
  let script = inputType.lastScript;
  if (inputType.last.type === 'wpkh') {
    script = OutScript.encode({type: 'pkh', hash: inputType.last.hash});
  }
  const hash = tx.preimageWitnessV0(i, script, inputType.sighash, prevOut.amount);

  const signature = ''; // call Privy's raw sign function with bytesToHex(hash), returns '0x...'

  // convert to DER format
  const derSig = secp256k1.signatureImport(signature);

  // update the input with the signature
  tx.updateInput(
    i,
    {
      partialSig: [[publicKeyBuffer, concatBytes(derSig, new Uint8Array([inputType.sighash]))]]
    },
    true
  );
}

// finalize the transaction. It is now ready to be sent!
tx.finalize();
```
\n