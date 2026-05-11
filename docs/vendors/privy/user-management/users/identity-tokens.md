> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Identity tokens

> Access user data securely with Privy identity tokens

Identity tokens provide a secure and efficient way to access user data, especially on the server side. These tokens are JSON Web Tokens (JWTs) whose claims contain information about the currently authenticated user, including their linked accounts, metadata, and more.

Privy strongly recommends using identity tokens when you need user-level data on your server. They allow you to easily pass a signed representation of the current user's linked accounts from your frontend to your backend directly, letting you verifiably determine which accounts (wallet address, email address, Farcaster profile, etc.) are associated with the current request.

<Tip>
  Enable identity tokens in the [Privy
  Dashboard](https://dashboard.privy.io/apps?page=login-methods\&logins=advanced) before implementing
  this feature.
</Tip>

## Enabling identity tokens

To enable identity tokens for your application:

1. Navigate to your application dashboard's [User management > Authentication > Advanced](https://dashboard.privy.io/apps?logins=advanced\&page=login-methods) section
2. Toggle on **Return user data in an identity token**
3. Make sure you're using the latest version of the Privy SDK

## Token format

Privy identity tokens are [JSON Web Tokens (JWT)](https://jwt.io/introduction), signed with the ES256 algorithm. These JWTs include the following claims:

<Expandable title="claims" defaultOpen="true">
  <ParamField query="linked_accounts" type="string">
    A stringified array containing a lightweight version of the current user's `linkedAccounts`
  </ParamField>

  <ParamField query="custom_metadata" type="string">
    A stringified version of the current user's `customMetadata`
  </ParamField>

  <ParamField query="sub" type="string">
    The user's Privy DID
  </ParamField>

  <ParamField query="iss" type="string">
    The token issuer, which should always be `privy.io`
  </ParamField>

  <ParamField query="aud" type="string">
    Your Privy app ID
  </ParamField>

  <ParamField query="iat" type="number">
    The timestamp of when the JWT was issued
  </ParamField>

  <ParamField query="exp" type="number">
    The timestamp of when the JWT will expire (generally 1 hour after issuance)
  </ParamField>
</Expandable>

## Retrieving identity tokens

<View title="React" icon="react">
  Once you've enabled identity tokens, Privy will **automatically** include the identity token as a cookie on every request from your frontend to your server.

  For setups where you cannot use cookies, you can retrieve the identity token using the `useIdentityToken` hook or the `getIdentityToken` method:

  ```tsx  theme={"system"}
  import { useIdentityToken, getIdentityToken } from '@privy-io/react-auth';

  function MyComponent() {
    const { identityToken } = useIdentityToken();

    // Use the token in your API requests
    const callApi = async () => {
      const response = await fetch('/api/your-endpoint', {
        headers: {
          'privy-id-token': identityToken // or await getIdentityToken() if you need to get the token outside of the useIdentityToken hook
        }
      });
    };

    return (
      <button onClick={callApi}>Call API</button>
    );
  }
  ```

  <Tip>
    We strongly recommend setting a base domain for your application, so that Privy can set the identity token as a more secure **HttpOnly** cookie.
  </Tip>
</View>

<View title="React Native" icon="react">
  In React Native applications, you can get the current user's Privy token using the `getIdentityToken` method from the `useIdentityToken` hook:

  ```tsx  theme={"system"}
  import { useIdentityToken } from '@privy-io/expo';

  function MyComponent() {
    const { getIdentityToken } = useIdentityToken();

    const callApi = async () => {
      const idToken = await getIdentityToken();

      // For authenticated users, idToken will be a valid token
      // For unauthenticated users, idToken will be null

      if (idToken) {
        const response = await fetch('https://your-api.com/endpoint', {
          method: 'POST',
          headers: {
            'privy-id-token': idToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ /* your data */ })
        });
      }
    };

    return (
      <Button onPress={callApi} title="Call API" />
    );
  }
  ```
</View>

<View title="Swift" icon="swift">
  In Swift applications, the identity token can be accessed directly on the PrivyUser object. It will default to nil if it has not been configured. You can grab it with `privy.user.identityToken`:

  ```swift  theme={"system"}
  // Check if user is authenticated
  guard let user = privy.user else {
    // If user is nil, user is not authenticated
    return
  }

  // Access the identity token
  if let identityToken = user.identityToken {
    print("Identity token: \(identityToken)")
  } else {
    // Identity token has not been configured, defaults to nil
  }
  ```
</View>

<View title="Android" icon="android">
  In Android applications, the identity token can be accessed directly on the PrivyUser object. It will default to null if it has not been configured. You can grab it with `privy.user.identityToken`:

  ```kotlin  theme={"system"}
  // Check if user is authenticated
  val user = privy.user
  if (user != null) {
    // Access the identity token
    val identityToken = user.identityToken
    if (identityToken != null) {
      println("Identity token: $identityToken")
    } else {
      // Identity token has not been configured, defaults to null
    }
  }
  ```
</View>

<View title="Flutter" icon="flutter">
  In Flutter applications, the identity token can be accessed directly on the PrivyUser object. It will default to null if it has not been configured. You can grab it with `privy.user.identityToken`:

  ```dart  theme={"system"}
  // Check if user is authenticated
  final user = privy.user;
  if (user != null) {
    // Access the identity token
    final identityToken = user.identityToken;
    if (identityToken != null) {
      print("Identity token: $identityToken");
    } else {
      // Identity token has not been configured, defaults to null
    }
  }
  ```
</View>

<View title="Unity" icon="unity">
  In Unity applications, the identity token can be accessed using the `GetIdentityToken` method on the `PrivyUser` instance. It will return null if it has not been configured.

  ```csharp  theme={"system"}
  // User will be null if no user is authenticated
  PrivyUser user = PrivyManager.Instance.User;
  if (user != null) {
    string identityToken = await user.GetIdentityToken();
    if (identityToken != null) {
      Debug.Log(identityToken);
    } else {
      // Identity token has not been configured, defaults to null
    }
  }
  ```
</View>

## Reading identity tokens on your server

On your server, you can retrieve the identity token from incoming requests and use it to identify the user.

<View title="Next.js (Pages Router)" icon="node-js">
  ```tsx  theme={"system"}
  // pages/api/example.ts
  import type { NextApiRequest, NextApiResponse } from 'next';
  import { PrivyClient } from '@privy-io/node';

  export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
      // Get identity token from cookie
      const idToken = req.cookies['privy-id-token'];

      // Or from header if sent that way
      // const idToken = req.headers['privy-id-token'];

      if (!idToken) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Parse and verify the token
      const user = await privy.users().get({ id_token: idToken });

      // Now you can use the user data
      return res.status(200).json({
        userId: user.id,
        // Other user data...
      });
    } catch (error) {
      console.error('Error verifying identity token:', error);
      return res.status(401).json({ message: 'Invalid token' });
    }
  }
  ```
</View>

<View title="Next.js (App Router)" icon="node-js">
  ```tsx  theme={"system"}
  // app/api/example/route.ts
  import { cookies, headers } from 'next/headers';
  import { PrivyClient } from '@privy-io/node';
  import { NextResponse } from 'next/server';

  export async function GET() {
    try {
      // Get identity token from cookie
      const cookieStore = cookies();
      const idToken = cookieStore.get('privy-id-token')?.value;

      // Or from header if sent that way
      // const headersList = headers();
      // const idToken = headersList.get('privy-id-token');

      if (!idToken) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }

      // Parse and verify the token
      const user = await privy.users().get({ id_token: idToken });

      // Now you can use the user data
      return NextResponse.json({
        userId: user.id,
        // Other user data...
      });
    } catch (error) {
      console.error('Error verifying identity token:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  }
  ```
</View>

<View title="Express" icon="node-js">
  ```typescript  theme={"system"}
  import express from 'express';
  import cookieParser from 'cookie-parser';
  import { PrivyClient } from '@privy-io/node';

  const app = express();
  app.use(cookieParser());

  app.get('/api/protected', async (req, res) => {
    try {
      // Get identity token from cookie
      const idToken = req.cookies['privy-id-token'];

      // Or from header if sent that way
      // const idToken = req.headers['privy-id-token'];

      if (!idToken) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Parse and verify the token
      const user = await privy.users().get({ id_token: idToken });

      // Now you can use the user data
      return res.status(200).json({
        userId: user.id,
        // Other user data...
      });
    } catch (error) {
      console.error('Error verifying identity token:', error);
      return res.status(401).json({ message: 'Invalid token' });
    }
  });

  app.listen(3000, () => {
    console.log('Server running on port 3000');
  });
  ```
</View>

<View title="Next.js (Pages Router, server-auth)" icon="node-js">
  ```tsx  theme={"system"}
  // pages/api/example.ts
  import type { NextApiRequest, NextApiResponse } from 'next';
  import { getUser } from '@privy-io/server-auth';

  export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
      // Get identity token from cookie
      const idToken = req.cookies['privy-id-token'];

      // Or from header if sent that way
      // const idToken = req.headers['privy-id-token'];

      if (!idToken) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Parse and verify the token
      const user = await getUser({ idToken });

      // Now you can use the user data
      return res.status(200).json({
        userId: user.id,
        // Other user data...
      });
    } catch (error) {
      console.error('Error verifying identity token:', error);
      return res.status(401).json({ message: 'Invalid token' });
    }
  }
  ```
</View>

<View title="Next.js (App Router, server-auth)" icon="node-js">
  ```tsx  theme={"system"}
  // app/api/example/route.ts
  import { cookies, headers } from 'next/headers';
  import { getUser } from '@privy-io/server-auth';
  import { NextResponse } from 'next/server';

  export async function GET() {
    try {
      // Get identity token from cookie
      const cookieStore = cookies();
      const idToken = cookieStore.get('privy-id-token')?.value;

      // Or from header if sent that way
      // const headersList = headers();
      // const idToken = headersList.get('privy-id-token');

      if (!idToken) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }

      // Parse and verify the token
      const user = await getUser({ idToken });

      // Now you can use the user data
      return NextResponse.json({
        userId: user.id,
        // Other user data...
      });
    } catch (error) {
      console.error('Error verifying identity token:', error);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
  }
  ```
</View>

<View title="Express (server-auth)" icon="node-js">
  ```typescript  theme={"system"}
  import express from 'express';
  import cookieParser from 'cookie-parser';
  import { getUser } from '@privy-io/server-auth';

  const app = express();
  app.use(cookieParser());

  app.get('/api/protected', async (req, res) => {
    try {
      // Get identity token from cookie
      const idToken = req.cookies['privy-id-token'];

      // Or from header if sent that way
      // const idToken = req.headers['privy-id-token'];

      if (!idToken) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Parse and verify the token
      const user = await getUser({ idToken });

      // Now you can use the user data
      return res.status(200).json({
        userId: user.id,
        // Other user data...
      });
    } catch (error) {
      console.error('Error verifying identity token:', error);
      return res.status(401).json({ message: 'Invalid token' });
    }
  });

  app.listen(3000, () => {
    console.log('Server running on port 3000');
  });
  ```
</View>

<View title="Python" icon="python">
  ```python  theme={"system"}
  from privy import PrivyAPI

  client = PrivyAPI(app_id="your-privy-app-id", app_secret="your-privy-api-key")

  user = client.users.get_by_id_token(id_token)

  print(user)
  ```
</View>

## Accessing custom metadata

Privy allows you to set [custom metadata](/user-management/users/custom-metadata) for a user via backend API requests. This metadata is available in the `custom_metadata` claim of the identity token.

Here's how to parse and access it:

<CodeGroup>
  ```typescript @privy-io/node theme={"system"}
  import {PrivyClient} from '@privy-io/node';
  import * as jose from 'jose';

  const client = new PrivyClient({appId: '$PRIVY_APP_ID', appSecret: '$PRIVY_APP_SECRET'});

  // Method 1: Using get (recommended)
  async function getUserWithMetadata(idToken: string) {
    const user = await client.users().get({id_token: idToken});
    // Custom metadata is already parsed and available
    return user.custom_metadata;
  }

  // Method 2: Manual parsing
  async function parseCustomMetadata(idToken: string) {
    const verificationKey = await jose.importJWK({}); /* your verification key */

    try {
      const {payload} = await jose.jwtVerify(idToken, verificationKey, {
        issuer: 'privy.io',
        audience: 'your-privy-app-id'
      });

      if (payload && payload.custom_metadata) {
        return JSON.parse(payload.custom_metadata as string);
      }

      return {};
    } catch (error) {
      console.error('Error parsing identity token:', error);
      throw error;
    }
  }
  ```

  ```typescript @privy-io/server-auth theme={"system"}
  import {PrivyClient} from '@privy-io/server-auth';
  import * as jose from 'jose';

  const client = new PrivyClient('$PRIVY_APP_ID', '$PRIVY_APP_SECRET');

  // Method 1: Using getUser (recommended)
  async function getUserWithMetadata(idToken: string) {
    const user = await client.getUser({idToken});
    // Custom metadata is already parsed and available
    return user.customMetadata;
  }

  // Method 2: Manual parsing
  async function parseCustomMetadata(idToken: string) {
    const verificationKey = await jose.importJWK({}); /* your verification key */

    try {
      const {payload} = await jose.jwtVerify(idToken, verificationKey, {
        issuer: 'privy.io',
        audience: 'your-privy-app-id'
      });

      if (payload && payload.custom_metadata) {
        return JSON.parse(payload.custom_metadata as string);
      }

      return {};
    } catch (error) {
      console.error('Error parsing identity token:', error);
      throw error;
    }
  }
  ```
</CodeGroup>

## Refreshing the identity token

A new identity token is automatically issued when a user:

* Authenticates into the application
* Links or unlinks an account
* Refreshes their application page
* Calls `getAccessToken` when the access token is expired

<View title="React" icon="react">
  To programmatically refresh the identity token, call `refreshUser` from the `useUser` hook:

  ```tsx  theme={"system"}
  import {useUser} from '@privy-io/react-auth';

  function RefreshButton() {
    const {refreshUser} = useUser();

    return <button onClick={refreshUser}>Refresh User Data</button>;
  }
  ```
</View>

<View title="React Native" icon="react">
  To programmatically refresh the identity token, call `client.user.get()` from the `usePrivyClient` hook:

  ```tsx  theme={"system"}
  import {usePrivyClient} from '@privy-io/expo';
  import {Button, View} from 'react-native';

  function RefreshButton() {
    const client = usePrivyClient();

    const refreshUser = async () => {
      // Refresh and get the updated user data
      const user = await client.user.get();
    };

    return (
      <View>
        <Button title="Refresh User Data" onPress={refreshUser} />
      </View>
    );
  }
  ```
</View>

## Verifying the identity token

When your server receives a request with an identity token, you should verify the token's signature to authenticate the user. The preferred way is to use the `getUser` method from `@privy-io/server-auth`, which handles verification and parsing:

<CodeGroup>
  ```typescript @privy-io/node theme={"system"}
  import {PrivyClient} from '@privy-io/node';

  const client = new PrivyClient({appId: '$PRIVY_APP_ID', appSecret: '$PRIVY_APP_SECRET'});

  async function verifyAndGetUser(idToken) {
    try {
      // This verifies the token signature and parses the payload
      const user = await client.users().get({id_token: idToken});
      return user;
    } catch (error) {
      console.error('Invalid identity token:', error);
      throw new Error('Authentication failed');
    }
  }
  ```

  ```typescript @privy-io/server-auth theme={"system"}
  import {PrivyClient} from '@privy-io/server-auth';

  const client = new PrivyClient('$PRIVY_APP_ID', '$PRIVY_APP_SECRET');

  async function verifyAndGetUser(idToken) {
    try {
      // This verifies the token signature and parses the payload
      const user = await client.getUser({idToken});
      return user;
    } catch (error) {
      console.error('Invalid identity token:', error);
      throw new Error('Authentication failed');
    }
  }
  ```
</CodeGroup>

<Info>
  The `verifyAuthToken` method will not work on identity tokens, as it is only used to verify Privy
  access tokens. Always use `get({id_token})` when working with identity tokens.
</Info>

For manual verification without using `get`, you can use JWT libraries like `jose`:

```typescript  theme={"system"}
import * as jose from 'jose';

async function verifyIdentityToken(idToken) {
  // Import the public key
  const publicKey = await jose.importJWK({
    // Your public key in JWK format
  });

  try {
    // Verify the token
    const {payload} = await jose.jwtVerify(idToken, publicKey, {
      issuer: 'privy.io',
      audience: 'your-privy-app-id'
    });

    return payload;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Authentication failed');
  }
}
```

## Security considerations

For optimal security when working with identity tokens:

1. **Always verify the token signature** before trusting any claims
2. **Check the expiration time** (`exp` claim) to ensure the token is still valid
3. **Set a base domain** for your application to enable HttpOnly cookies for the identity token
4. **Use HTTPS** for all communication between your frontend and backend
5. **Do not store sensitive information** in custom metadata, as it will be included in the identity token

<Info>Read more about Privy's tokens and their security in our [security guide](/security).</Info>
\n