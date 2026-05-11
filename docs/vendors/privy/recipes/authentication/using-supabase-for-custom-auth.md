> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Using Supabase as an authentication provider

This guide demonstrates how to integrate Supabase's authentication system with Privy to create a custom authentication flow. This setup allows you to leverage Supabase's powerful authentication and backend features, including Row Level Security (RLS) for data access control, while managing user wallets in Privy.

## Configure your Supabase project

Before integrating with Privy, you need to configure your Supabase project to use JWT tokens for authentication. Follow the [Supabase JWT signing keys documentation](https://supabase.com/docs/guides/auth/signing-keys) to:

1. Migrate your Supabase project to use the new JWT signing keys.
2. Get the JWKS endpoint URL, which will look like `https://[PROJECT_ID].supabase.co/auth/v1/.well-known/jwks.json`.
3. Ensure your Supabase project is using an asymmetric signing algorithm.

<Info>
  Make sure to complete the JWT signing key migration in Supabase before proceeding with the Privy
  integration. This ensures your tokens will be properly validated.
</Info>

## Configure your Privy project

Navigate to your Privy dashboard and configure JWT-based authentication following the [custom authentication guide](/authentication/user-authentication/jwt-based-auth/setup).

## Configure your Next.js project

### 1. Create Supabase clients

Create separate Supabase clients for server-side and client-side operations.

<Tabs>
  <Tab title="Server">
    ```typescript lib/supabase/server.ts theme={"system"}
    import { createServerClient } from '@supabase/ssr'
    import { cookies } from 'next/headers'

    export async function createSupabaseServer(token?: string) {
      const cookieStore = cookies()

      return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
            set(name: string, value: string, options: any) {
              cookieStore.set({ name, value, ...options })
            },
            remove(name: string, options: any) {
              cookieStore.set({ name, value: '', ...options })
            },
          },
          global: {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        }
      )
    }
    ```
  </Tab>

  <Tab title="Client">
    ```typescript lib/supabase/client.ts theme={"system"}
    import { createBrowserClient } from '@supabase/ssr'

    export function createSupabaseClient(token?: string) {
      return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      )
    }
    ```
  </Tab>
</Tabs>

### 2. Create a Supabase provider and hook

Create a provider that integrates Privy authentication with Supabase:

```tsx components/SupabaseProvider.tsx theme={"system"}
'use client';

import {createContext, useContext, useEffect, useMemo, useState} from 'react';
import {SupabaseClient, Session, User} from '@supabase/supabase-js';
import {usePathname, useRouter} from 'next/navigation';
import {createClient} from '@/lib/supabase/client';

interface SupabaseContextType {
  supabase: SupabaseClient;
  session: Session | null;
  user: User | null;
  loading: boolean;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const SupabaseProvider = ({children}: {children: React.ReactNode}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({data: {session}}) => {
        setSession(session);
        setUser(session?.user || null);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    const {data: authListener} = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user || null);
      setLoading(false);

      // Optional: Redirect based on auth state
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // console.log("User signed in or token refreshed");
        // router.push("/dashboard"); // Example redirect
      } else if (event === 'SIGNED_OUT') {
        // console.log("User signed out");
        router.push('/'); // Example redirect
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [pathname]);

  return (
    <SupabaseContext.Provider value={{supabase, session, user, loading}}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};
```

### 3. Create a Providers component and add to root layout

Create a combined providers component and wrap your application with it in the root layout:

```tsx components/Providers.tsx theme={"system"}
'use client';

import {PrivyProvider} from '@privy-io/react-auth';
import {SupabaseProvider, useSupabase} from './SupabaseProvider';

export default function Providers({children}: {children: React.ReactNode}) {
  return (
    <SupabaseProvider>
      <InnerPrivyProvider>{children}</InnerPrivyProvider>
    </SupabaseProvider>
  );
}

function InnerPrivyProvider({children}: {children: React.ReactNode}) {
  const {loading, supabase, session} = useSupabase();

  async function getCustomAuthToken() {
    if (!session) return undefined;

    const {data, error} = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error);
      return undefined;
    }

    return data.session?.access_token || undefined;
  }

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      config={{
        customAuth: {
          isLoading: loading,
          getCustomAccessToken: getCustomAuthToken
        },
        embeddedWallets: {
          createOnLogin: 'all-users'
        }
      }}
    >
      {children}
    </PrivyProvider>
  );
}
```

The `getCustomAuthToken` function retrieves the current session's access token from Supabase and passes it to Privy's `getCustomAccessToken` configuration. Privy uses this token to validate the user's authentication state through the JWKS endpoint configured in your Privy dashboard.

### 4. Just use Privy!

You can now access the Privy user object, create wallets and sign messages!

## Conclusion

With this setup complete, you now have a fully integrated Privy and Supabase authentication system. You can:

* Use Supabase for user management, database operations, and real-time features.
* Leverage Privy's wallet management capabilities.
* Customize your authentication flow to match your brand and UI while taking advantage of Supabase RLS!
\n