> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Mocking tokens for testing

If your project uses automated testing (e.g. with [Jest](https://jestjs.io/docs/configuration)), your test setup may need access to a Privy token in order to mock out an authenticated session, authorized API calls, and more.

To obtain a Privy token for tests, we **do not recommend** using an actual auth token issued by Privy's production service. Rather, you should construct a test JWT in the [Privy format](/authentication/user-authentication/access-tokens) and then sign it with a key that you control.

### Overview

At a high-level, the instructions for creating and signing a JWT in the Privy format are:

1. **Generate your signing & verification keys for tests.** Privy uses an asymmetric [ECDSA P256](https://csrc.nist.gov/csrc/media/events/workshop-on-elliptic-curve-cryptography-standards/documents/papers/session6-adalier-mehmet.pdf) keypair, but you can choose any key setup you like.
2. **Construct a JWT with the Privy claims.** For tests, you can use any arbitrary Privy DID for the `sub` claim and any arbitrary session ID for the `sid` claim.
3. **Sign your JWT with your signing key.** Privy uses the [ES256 algorithm](https://ldapwiki.com/wiki/ES256) to sign & verify JWTs for your app, but you can choose any signing algorithm you like, as long as it is compatible with your key setup from Step 1.

Below is a reference implementation in JavaScript for generating keys, signing JWTs in the Privy format, and verifying those JWTs using the library [`jose`](https://www.npmjs.com/package/jose).

### Generating signing & verification keys for tests

Generate a keypair using `jose`'s [`generateKeyPair`](https://github.com/panva/jose/blob/HEAD/docs/functions/key_generate_key_pair.generateKeyPair.md#readme) method, specifying the 'ES256' algorithm as a parameter.

```typescript  theme={"system"}
import * as jose from 'jose';

const {publicKey, privateKey} = await jose.generateKeyPair('ES256');
```

You can now use the `privateKey` to sign JWTs and the `publicKey` to verify JWTs in your tests.

### Creating and signing test JWTs

First, define the values you will use to populate your test JWT's claims.

```typescript  theme={"system"}
const session = 'an arbitrary session ID';
const subject = 'an arbitrary Privy DID';
const issuer = 'privy.io';
const audience = 'your Privy app ID';
const expiration = '1h';
```

Next, create and sign your test JWT with your test [`privateKey`](/recipes/mock-jwt.md#generating-signing--verification-keys-for-tests) using `jose`'s [`SignJWT`](https://github.com/panva/jose/blob/9a918a88c5fded3b17bcf356dd58fafefb34a4d0/docs/classes/jwt_sign.SignJWT.md) class.

```typescript  theme={"system"}
import * as jose from 'jose';

const authToken = await new jose.SignJWT({sid: '$SESSION'})
  .setProtectedHeader({alg: 'ES256', typ: 'JWT'})
  .setIssuer('$ISSUER')
  .setIssuedAt()
  .setAudience('$AUDIENCE')
  .setSubject('$SUBJECT')
  .setExpirationTime('$EXPIRATION')
  .sign(new TextEncoder().encode('$PRIVATE_KEY')); // Replace with your CryptoKey
```

### Verifying test JWTs

Use `jose`'s [`jwtVerify`](https://github.com/panva/jose/blob/9a918a88c5fded3b17bcf356dd58fafefb34a4d0/docs/functions/jwt_verify.jwtVerify.md) method to verify your test JWT against your test [`publicKey`](/recipes/mock-jwt.mdx#generating-signing--verification-keys-for-tests)

```typescript  theme={"system"}
import * as jose from 'jose';

try {
  const payload = await jose.jwtVerify(
    '$AUTH_TOKEN',
    (await jose.generateKeyPair('ES256')).privateKey, // Replace with your CryptoKey
    {
      issuer: 'privy.io',
      audience: 'your Privy App ID'
    }
  );
  console.log(payload);
} catch (error) {
  console.log(`JWT failed to verify with error ${error}.`);
}
```
\n