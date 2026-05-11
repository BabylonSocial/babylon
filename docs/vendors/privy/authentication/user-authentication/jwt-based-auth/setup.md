> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Configuring your authentication provider

To integrate your authentication provider with Privy:

1. Go to the [**Privy Dashboard**](https://dashboard.privy.io)
2. Select your app from the **App Dropdown** in the left sidebar
3. Request access to **Custom Auth Support** in the [Integrations > Plugins](https://dashboard.privy.io/apps?page=integrations) tab of the Privy dashboard
4. Navigate to the [JWT Dashboard](https://dashboard.privy.io/apps?logins=basics\&page=login-methods) via User management > Authentication > JWT-based auth

<img src="https://mintcdn.com/privy-c2af3412/zSwkF5-adOBDSGL-/images/jwt.png?fit=max&auto=format&n=zSwkF5-adOBDSGL-&q=85&s=41c879569e14361b74ab0f68ad32f777" alt="JWT-based auth" data-og-width="5529" width="5529" data-og-height="3949" height="3949" data-path="images/jwt.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/zSwkF5-adOBDSGL-/images/jwt.png?w=280&fit=max&auto=format&n=zSwkF5-adOBDSGL-&q=85&s=12e419ba6574798506b373937267bce5 280w, https://mintcdn.com/privy-c2af3412/zSwkF5-adOBDSGL-/images/jwt.png?w=560&fit=max&auto=format&n=zSwkF5-adOBDSGL-&q=85&s=059f17bc8f3dbcb0fa6ef05e5fe7de10 560w, https://mintcdn.com/privy-c2af3412/zSwkF5-adOBDSGL-/images/jwt.png?w=840&fit=max&auto=format&n=zSwkF5-adOBDSGL-&q=85&s=0a30638c9190a10327c599c55a3882b9 840w, https://mintcdn.com/privy-c2af3412/zSwkF5-adOBDSGL-/images/jwt.png?w=1100&fit=max&auto=format&n=zSwkF5-adOBDSGL-&q=85&s=c706485d075e4fa41f736395c29a2d0b 1100w, https://mintcdn.com/privy-c2af3412/zSwkF5-adOBDSGL-/images/jwt.png?w=1650&fit=max&auto=format&n=zSwkF5-adOBDSGL-&q=85&s=0c942f3ef85c52d9f21af685e572c7bf 1650w, https://mintcdn.com/privy-c2af3412/zSwkF5-adOBDSGL-/images/jwt.png?w=2500&fit=max&auto=format&n=zSwkF5-adOBDSGL-&q=85&s=7d62b221b0a5431bec9a41ffb505a5eb 2500w" />

You'll need to provide the following information:

<ParamField path="Authentication environment">
  Select which environment JWT-authenticated requests will originate from. Client side will only
  allow requests from end user devices, while server side will only allow requests from your own
  backend servers.

  <Tip>
    If you do not use one of Privy's client-side SDKs, we recommended you enable "Server side".
  </Tip>
</ParamField>

<ParamField path="JWT Verification Details" required>
  Privy requires a verification key to ensure the JWTs received are valid. Both the token's signature and its expiration time ([claim](https://datatracker.ietf.org/doc/html/rfc7519#section-4.1.4)) are verified to ensure secure access. This verification process helps protect user data and prevents unauthorized access to Privy services.

  You can provide the verification key in one of two ways:

  <AccordionGroup>
    <Accordion title="JWKS Endpoint">
      If your provider uses [JWKS](https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-key-sets) to sign JWTs, provide a JWKS endpoint URL where Privy can retrieve your auth provider's JWT public key.

      ```json  theme={"system"}
      {
          "keys": [
              {
                "kty": "XXX",
                "n": "XXX",
                "e": "XXX",
                "alg": "XXX", // "RS256" or "ES256"
                "kid": "XXX"
                // ...
              }
          ]
      }
      ```
    </Accordion>

    <Accordion title="Public Verification Key">
      If your provider uses a single key to sign JWTs, provide the corresponding public key certificate used for verification.

      ```json  theme={"system"}
      -----BEGIN CERTIFICATE-----
      // Public key
      -----END CERTIFICATE-----
      ```
    </Accordion>
  </AccordionGroup>
</ParamField>

<ParamField path="JWT ID Claim" default="sub">
  Enter the claim from your user's JWT that contains the user's unique ID. In most access tokens and
  identity tokens, this is the claim.
</ParamField>
\n