> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Using your own authentication provider

Privy supports all JWT-based authentication providers. This includes any OIDC compliant authentication system, including OAuth 2.0, Auth0, Firebase, AWS Cognito, and more.

Using JWT-based authentication integration, you can use your existing authentication system with Privy's services. This approach allows users to maintain their existing login experience while giving them access to embedded wallets.

Privy's authentication is fully compatible with any authentication provider that supports [JWT-based](https://jwt.io/), [stateless](https://auth0.com/blog/stateless-auth-for-stateful-minds/) authentication. When a user logs into your app, your auth provider issues them an access and/or identity token to represent their auth status. Privy validates this token to authenticate your user.

<img src="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/jwt-based-auth-splash.png?fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=ac522c8b8c19e1983d064c042db39936" alt="JWT-based auth splash" data-og-width="5529" width="5529" data-og-height="3949" height="3949" data-path="images/jwt-based-auth-splash.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/jwt-based-auth-splash.png?w=280&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=4a1cb0e1fb927c57346fb3e774993e92 280w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/jwt-based-auth-splash.png?w=560&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=4917411ef3002a86a24c845b7e13bf6e 560w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/jwt-based-auth-splash.png?w=840&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=64ef25ceb73aef7e0ce753a83ce53ae1 840w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/jwt-based-auth-splash.png?w=1100&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=ddf26e5294ad69d4026aec1ebc3cf673 1100w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/jwt-based-auth-splash.png?w=1650&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=71d8ba5c985dac39f6164ff65e425d0a 1650w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/jwt-based-auth-splash.png?w=2500&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=5603353b36d739523f9f11cc55317b16 2500w" />
\n