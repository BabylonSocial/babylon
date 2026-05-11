> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Setting up wallet MFA for your app

<Danger>
  Once a user enrolls in MFA, it will remain enabled **even if you disable MFA for your app**. Users
  must manually disable MFA on their wallets if they wish to remove it.
</Danger>

To enable MFA for your app, select your desired app from the sidebar and navigate to the **User management > Authentication > MFA** page.

Within the **MFA** tab, scroll down to the **Enable MFA for transactions** section and **select the desired MFA methods** you'd like to enable for your app.

<img src="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/MFA2.png?fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=45f480bd8d2b74a238b6b7213fb71214" alt="images/MFA2.png" data-og-width="1843" width="1843" data-og-height="1317" height="1317" data-path="images/MFA2.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/MFA2.png?w=280&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=cceb295a4e8b3c06e950eb9a4fc5e0c5 280w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/MFA2.png?w=560&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=d7bfd57e9bed00df1b8faebb204654a8 560w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/MFA2.png?w=840&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=f5b087e4425a13ed3d3762cd288a6bab 840w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/MFA2.png?w=1100&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=0a86010bfab22822e4f9c36b59059e11 1100w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/MFA2.png?w=1650&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=1cbf3aee20131fb7c0a6b15be47694c4 1650w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/MFA2.png?w=2500&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=fb394ec802f7cd2d6b32b50cda008652 2500w" />

Once you have selected your desired MFA methods and saved changes, you can prompt your users to enroll in any of the methods you've enabled!

Please note that:

* If your app has SMS enabled as a login method, you **may not** enable SMS as an MFA method as well.
  With SMS login enabled, SMS can already be used as the primary factor to authenticate the user for access to their wallet; it cannot be enabled as an additional factor as well.
* To use passkeys as an MFA method, you *must* also enable passkeys as a login method

## Implementation options

Privy offers two approaches to implement wallet MFA:

1. **Building custom UIs** - Build your own MFA flows with full control over the user experience. This approach works with all Privy SDKs.
2. **Using Privy's default UIs** - Available for **React and React Native only**. Privy handles the UI components for enrollment and verification.
\n