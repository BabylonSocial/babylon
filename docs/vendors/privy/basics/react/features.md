> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Features

> Learn about the features supported by the React SDK

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

## Supported features

<FeatureMatrix sdk="react" />
\n