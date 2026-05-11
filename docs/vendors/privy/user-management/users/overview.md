> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Overview

Privy provides a unified user management system that seamlessly combines traditional authentication methods with web3 capabilities. Each user in your application gets a unique Privy DID (Decentralized Identifier) and can link multiple authentication methods and wallets to their account.

<img src="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Users2.png?fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=06adb4371b947fcf9158ba72f074219a" alt="images/Users2.png" data-og-width="1843" width="1843" data-og-height="1317" height="1317" data-path="images/Users2.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Users2.png?w=280&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=4a7b9d725f4915808965123838dc33df 280w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Users2.png?w=560&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=9fa7cf704310441541c4c48b878d4634 560w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Users2.png?w=840&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=b1f33306ff2e72802d59e0fcc32b5b53 840w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Users2.png?w=1100&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=71a9a9ff982023f50d1e635c1510d38a 1100w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Users2.png?w=1650&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=e3767ab556e39718944c78853e762044 1650w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Users2.png?w=2500&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=f680ee09cf4b2bc66c7cbc4d428e6473 2500w" />

### The user object

At the core of Privy's user management is the user object, which provides a unified view of your user's identity across different authentication methods. Each user object contains:

* A unique Privy DID for consistent identification
* A collection of linked accounts (email, phone, wallets)
* Optional custom metadata for application-specific data
* Creation timestamp and other system metadata

### Linked accounts

Privy supports a comprehensive range of authentication methods that can be connected to a user's account. Users can authenticate using traditional methods like email, phone, and passkeys, or through popular social accounts including Google, Apple, and Discord. All of these methods are unified under a single user object, enabling seamless multi-method login while maintaining a consistent user identity.

### Account management

Managing user accounts with Privy is straightforward and flexible. You can dynamically link new authentication methods to existing accounts or remove them when needed. The platform provides powerful tools for:

* Adding custom metadata to enrich user profiles
* Controlling access through allowlists and denylists
* Managing user data and deletion requests
* Monitoring account activity and changes

### Identity verification

Privy's identity token system provides robust security and verification capabilities. These tokens securely represent user identity and can be verified on your backend. They include custom metadata and feature automatic refresh functionality to maintain session state without interruption.

### User events

Monitor user activity through Privy's webhook system, which notifies your backend when important events occur, such as:

* New account creation
* Authentication method changes
* Custom metadata updates
* Other significant account modifications

### UI components

Privy streamlines implementation by providing ready-to-use UI components for all essential user management tasks. These include authentication flows, account linking interfaces, profile management tools, and wallet connection experiences—all designed to work seamlessly with your application.

## Next steps

* Learn about [the user object](/user-management/users/the-user-object)
* Understand how to [link accounts](/user-management/users/linking-accounts)
* Implement [custom metadata](/user-management/users/custom-metadata)
* Set up [user webhooks](/user-management/users/webhooks)
\n