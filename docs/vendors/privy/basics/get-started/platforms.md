> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Choose your platform

export const FeatureMatrix = ({sdk}) => {
  const sdks = sdk ? [sdk] : ['react', 'reactNative', 'swift', 'android', 'flutter', 'unity'];
  const sdkNames = {
    react: 'React',
    reactNative: 'React Native',
    swift: 'Swift',
    android: 'Android',
    flutter: 'Flutter',
    unity: 'Unity'
  };
  const matrix = [{
    name: 'Authentication',
    features: [{
      name: 'Email',
      react: true,
      reactNative: true,
      swift: true,
      android: true,
      flutter: true,
      unity: true
    }, {
      name: 'SMS',
      react: true,
      reactNative: true,
      swift: true,
      android: true,
      flutter: true
    }, {
      name: 'OAuth',
      react: true,
      reactNative: true,
      swift: 'Google, Apple, Twitter, Discord',
      android: 'Google, Discord, Twitter',
      flutter: 'Google, Apple, Twitter, Discord',
      unity: 'Google, Apple, Twitter, Discord'
    }, {
      name: 'SIWE (Sign In with Ethereum)',
      react: true,
      reactNative: true,
      swift: true,
      android: true,
      flutter: true
    }, {
      name: 'SIWS (Sign In with Solana)',
      react: true,
      reactNative: true,
      swift: true,
      android: true,
      flutter: true
    }, {
      name: 'Farcaster',
      react: true,
      reactNative: true
    }, {
      name: 'Telegram',
      react: true
    }, {
      name: 'Custom Auth',
      react: true,
      reactNative: true,
      swift: true,
      android: true,
      flutter: true
    }, {
      name: 'Passkeys',
      react: true,
      reactNative: true,
      swift: true,
      android: true,
      flutter: true
    }]
  }, {
    name: 'Farcaster',
    features: [{
      name: 'SIWF',
      react: true,
      reactNative: true
    }]
  }, {
    name: 'Embedded Wallets',
    features: [{
      name: 'Creating wallets manually',
      react: ['ethereum', 'solana'],
      reactNative: ['ethereum', 'solana'],
      swift: ['ethereum', 'solana'],
      android: ['ethereum', 'solana'],
      flutter: ['ethereum', 'solana'],
      unity: ['ethereum', 'solana']
    }, {
      name: 'Creating wallets automatically',
      react: ['ethereum', 'solana'],
      reactNative: ['ethereum', 'solana']
    }, {
      name: 'Pregenerating wallets',
      react: ['ethereum', 'solana'],
      reactNative: ['ethereum', 'solana'],
      swift: ['ethereum', 'solana'],
      android: ['ethereum', 'solana'],
      flutter: ['ethereum', 'solana']
    }, {
      name: 'Signing messages and transactions',
      react: ['ethereum', 'solana'],
      reactNative: ['ethereum', 'solana'],
      swift: ['ethereum', 'solana'],
      android: ['ethereum', 'solana'],
      flutter: ['ethereum', 'solana'],
      unity: ['ethereum', 'solana']
    }, {
      name: 'Broadcasting transactions',
      react: ['ethereum', 'solana'],
      reactNative: ['ethereum', 'solana'],
      swift: ['ethereum', 'solana'],
      android: ['ethereum', 'solana'],
      flutter: ['ethereum', 'solana'],
      unity: ['ethereum']
    }, {
      name: 'Native smart wallets',
      react: ['ethereum'],
      reactNative: ['ethereum']
    }, {
      name: 'Automatic recovery',
      react: ['ethereum', 'solana'],
      reactNative: ['ethereum', 'solana'],
      swift: ['ethereum', 'solana'],
      android: ['ethereum', 'solana'],
      flutter: ['ethereum', 'solana'],
      unity: ['ethereum']
    }, {
      name: 'User controlled recovery',
      react: ['ethereum', 'solana'],
      reactNative: ['ethereum', 'solana']
    }, {
      name: 'Transaction MFA',
      react: ['ethereum', 'solana'],
      reactNative: ['ethereum', 'solana']
    }, {
      name: 'Key Export',
      react: ['ethereum', 'solana']
    }, {
      name: 'Key Import',
      react: ['ethereum', 'solana']
    }, {
      name: 'HD wallets',
      react: ['ethereum', 'solana'],
      reactNative: ['ethereum', 'solana'],
      swift: ['ethereum', 'solana'],
      android: ['ethereum', 'solana'],
      flutter: ['ethereum', 'solana'],
      unity: ['ethereum']
    }, {
      name: 'Signers',
      react: ['ethereum', 'solana'],
      reactNative: ['ethereum', 'solana']
    }, {
      name: 'Global wallets (Cross App Accounts)',
      react: ['ethereum'],
      reactNative: ['ethereum']
    }, {
      name: 'Custom EVM (Ethereum) network support',
      react: ['ethereum'],
      reactNative: ['ethereum']
    }, {
      name: 'Custom SVM (Solana) network support',
      react: ['solana'],
      reactNative: ['solana']
    }]
  }, {
    name: 'Connectors',
    features: [{
      name: 'External wallets',
      react: ['ethereum', 'solana']
    }, {
      name: 'Wagmi',
      react: ['ethereum']
    }, {
      name: 'Viem',
      react: ['ethereum'],
      reactNative: ['ethereum']
    }, {
      name: 'Ethers',
      react: ['ethereum'],
      reactNative: ['ethereum']
    }, {
      name: '@solana/web3.js',
      react: ['solana']
    }, {
      name: 'web3swift',
      swift: ['ethereum']
    }]
  }, {
    name: 'Funding',
    features: [{
      name: 'Transfer or bridge from wallet',
      react: ['ethereum', 'solana']
    }, {
      name: 'Transfer from exchange',
      react: ['ethereum', 'solana'],
      reactNative: ['ethereum', 'solana']
    }, {
      name: 'Pay with card',
      react: ['ethereum', 'solana'],
      reactNative: ['ethereum', 'solana']
    }]
  }];
  const filteredMatrix = matrix.map(section => {
    return {
      ...section,
      features: section.features.filter(featureItem => {
        if (sdk) {
          return featureItem[sdk] !== undefined;
        }
        return true;
      })
    };
  }).filter(section => {
    return section.features.length > 0;
  });
  return <table>
      {sdk ? null : <thead>
          <tr>
            <th></th>
            {sdks.map(sdk => <th>{sdkNames[sdk]}</th>)}
          </tr>
        </thead>}
      <tbody>
        {filteredMatrix.map(section => <>
            <tr>
              <td style={{
    minWidth: 0
  }}>
                <strong>{section.name}</strong>
              </td>
              {sdks.map(() => <td style={{
    minWidth: 0
  }}></td>)}
            </tr>
            {section.features.map(feature => <tr>
                <td style={{
    minWidth: 0
  }}>
                  <em>{feature.name}</em>
                </td>
                {sdks.map(sdk => {
    const supported = feature[sdk];
    if (supported === true || typeof supported === 'string') {
      return <td style={{
        minWidth: 0
      }}>✅</td>;
    } else if (!supported) {
      return <td style={{
        minWidth: 0
      }}></td>;
    } else if (Array.isArray(supported)) {
      return <td style={{
        minWidth: 0
      }}>
                        {supported.map(item => item === 'ethereum' ? <img src="https://mintlify.s3.us-west-1.amazonaws.com/privy-c2af3412/images/ethereum.png" noZoom style={{
        display: 'inline',
        margin: '2px',
        width: '18px'
      }} /> : <img src="https://mintlify.s3.us-west-1.amazonaws.com/privy-c2af3412/images/solana.png" noZoom style={{
        display: 'inline',
        margin: '2px',
        width: '18px'
      }} />)}
                      </td>;
    } else {
      return <td style={{
        minWidth: 0
      }}>{supported}</td>;
    }
  })}
              </tr>)}
          </>)}
      </tbody>
    </table>;
};

export const Solana = () => {
  return <img src="https://mintlify.s3.us-west-1.amazonaws.com/privy-c2af3412/images/solana.png" noZoom style={{
    display: 'inline',
    margin: '2px',
    width: '18px'
  }} />;
};

export const Ethereum = () => {
  return <img src="https://mintlify.s3.us-west-1.amazonaws.com/privy-c2af3412/images/ethereum.png" noZoom style={{
    display: 'inline',
    margin: '2px',
    width: '18px'
  }} />;
};

Privy builds flexible wallet and key management infrastructure to power better products built on crypto rails. You can choose to integrate with Privy's **REST API** directly, or leverage our platform-specific **SDKs** to securely provision wallets and manage assets.

<img src="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Platform2.png?fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=1ae659247712f78f81d6a55be12c2cc9" alt="images/Platform2.png" data-og-width="3688" width="3688" data-og-height="1506" height="1506" data-path="images/Platform2.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Platform2.png?w=280&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=892509b30c619c782c0456e0d285b12e 280w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Platform2.png?w=560&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=1fbaff392bad8881f58be1aef918884b 560w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Platform2.png?w=840&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=c65956a6d3fa7720895c08a11149bf96 840w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Platform2.png?w=1100&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=7ecc9d27fac3a0161f5084d6c2df1b81 1100w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Platform2.png?w=1650&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=faf57a0c67ee472f54d9cdd600381119 1650w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Platform2.png?w=2500&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=f91a2ecd0049b9af12c098f724667d6a 2500w" />

## REST API

The Privy API is a resource-oriented API designed with RESTful principles. You can use the API to create and use wallets on different blockchains, set granular policies and controls, and manage ownership over different resources.

You can make requests to Privy's API from any environment that supports HTTPS requests and securely storing an API secret. Once you've provisioned wallets from Privy's REST API, you can continue to use and manage those wallets from the REST API or additionally integrate Privy's supported SDKs.

<Info>
  Privy's API have extended support for many blockchain ecosystems. Learn more about the distinct
  tiers of support for each blockchain in our [chain support](/wallets/overview/chains) guide.
</Info>

## SDKs

Privy offers multiple SDKs for various languages and frameworks. These SDKs wrap the Privy REST API into interfaces and abstractions that are idiomatic to your framework, streamlining your integration.

If your framework is not supported by the SDKs below, you can always integrate Privy's REST API directly or build a slim client SDK for your framework.

### Client-side SDKs

Client-side SDKs are designed for use in web and mobile applications, providing hooks and components for authenticating users and securely provisioning wallets.

| SDK                                               | Description                                                                                                          | Supported environments                                      |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [React](/basics/react/installation)               | A client-side React SDK with hooks and components for authenticating users and securely provisioning wallets.        | Web apps built with React.                                  |
| [React Native](/basics/react-native/installation) | A client-side React Native SDK with hooks and components for authenticating users and securely provisioning wallets. | Mobile apps (iOS, Android) built with Expo or React Native. |
| [Swift](/basics/swift/installation)               | A client-side Swift SDK with methods for authenticating users and securely provisioning wallets.                     | Mobile apps (iOS) built with Swift.                         |
| [Android](/basics/android/installation)           | A client-side Kotlin SDK with methods for authenticating users and securely provisioning wallets.                    | Mobile apps (Android) built with Kotlin.                    |
| [Flutter](/basics/flutter/installation)           | A client-side Flutter SDK with methods for authenticating users and securely provisioning wallets.                   | Mobile apps (iOS, Android) built with Flutter.              |
| [Unity](/basics/unity/installation)               | A client-side Unity SDK with methods for authenticating users and securely provisioning wallets.                     | Games built with Unity.                                     |

#### Client-side SDK features

Check out the matrix below to determine which features are supported in each client SDK. As a guide:

* <Ethereum /> - indicates the feature is available on EVM chains.
* <Solana /> - indicates the feature is available on Solana.
* <Ethereum /> <Solana /> - indicates the feature is available on both EVM and Solana.

<FeatureMatrix />

### Server-side SDKs

Server-side SDKs are designed for backend environments, with the full functionality of the Privy API to enable a streamlined integration.

| SDK                                                             | Description                                                                                                                                      | Supported environments                                         |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| [NodeJS](/basics/nodeJS/installation)                           | A server-side Node SDK that supports securely provisioning wallets, configuring policies and ownership, and managing user data.                  | Server-side JS runtimes, including Node, Deno, Bun, Edge, etc. |
| [Java](/basics/java/installation)                               | A server-side Java SDK that supports securely provisioning wallets, configuring policies and ownership, and managing user data.                  | Server-side Java environments.                                 |
| [Python](/basics/python/installation)                           | A server-side Python SDK that supports securely provisioning wallets, configuring policies and ownership, and managing user data.                | Server-side Python environments.                               |
| [Go](/basics/go/installation)                                   | A server-side Go SDK that supports securely provisioning wallets, configuring policies and ownership, and managing user data.                    | Server-side Go environments.                                   |
| [Rust](/basics/rust/installation)                               | A server-side Rust SDK that supports securely provisioning wallets, configuring policies and ownership, and managing user data.                  | Server-side Rust environments.                                 |
| [NodeJS (server-auth)](/basics/nodeJS-server-auth/installation) | **(Deprecated)** A server-side Node SDK that supports securely provisioning wallets, configuring policies and ownership, and managing user data. | Server-side JS runtimes, including Node, Deno, Bun, Edge, etc. |

<Info>
  **Is there a particular feature that you'd like support for within a certain SDK?** [Please reach
  out!](https://privy.io/slack)
</Info>
\n