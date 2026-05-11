> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Welcome

export const Logo = ({img, name, href, className}) => {
  return <a href={href} className={'block not-prose font-normal rounded-md cursor-pointer ' + (className || '')} onClick={e => {
    if (href) {
      e.preventDefault();
      window.location.href = href;
    }
  }}>
      <div className="card h-20 w-20 p-2 object-cover overflow-hidden flex items-center justify-center">
        <img src={img} alt={name} noZoom />
      </div>
      <p className="text-nowrap text-center text-xs mt-2">{name}</p>
    </a>;
};

<div className="hero">
  <div className="text-center">
    <h1 className="justify-center">Build with Privy.</h1>
  </div>

  <p className="text-center font-medium details-text">
    Privy builds user onboarding and wallet infrastructure to enable better products built on crypto
    rails by embedding asset control directly into your product.
  </p>

  <div id="hero-search" className="search" onClick={() => clickOnSearch()}>
    <span>Help me learn how to...</span>

    <Icon icon="magnifying-glass" iconType="solid" size={14} />
  </div>

  <div className="text-sm flex items-center justify-center gap-1 font-medium">
    <a href="basics/get-started/account" className="no-underline">
      Get started
    </a>

    <Icon icon="arrow-right" iconType="solid" size={12} />
  </div>
</div>

<div className="max-w-3xl px-4 mx-auto lg:px-8 pb-10">
  <div className="text-center text-sm mb-6">
    <h2 className="subtitle">Quickstarts & recipes</h2>
  </div>

  <CardGroup cols={3}>
    <Card title="Create your first wallet" icon="wallet" href="/basics/react/quickstart">
      Use the React SDK to authenticate a user and create an embedded wallet.
    </Card>

    <Card title="Build a mobile app" icon="mobile" href="/basics/react-native/quickstart">
      Use the React Native SDK to build a mobile app on Solana.
    </Card>

    <Card title="Whitelabel" icon="palette" href="/recipes/react/whitelabel">
      Whitelabel login, wallets, and user management with your own UI and branding.
    </Card>
  </CardGroup>

  <div className="text-center text-sm mt-12 mb-6">
    <h2 className="subtitle">Explore client SDKs</h2>
  </div>

  <div className="flex flex-wrap gap-3 justify-between">
    <Logo name="React" img="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/react-logo.png?fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=0f8dcc42c005ec4a2ed9d40cbcec2f74" href="basics/react/setup" data-og-width="512" width="512" data-og-height="456" height="456" data-path="images/react-logo.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/react-logo.png?w=280&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=993dbaf14151ecb2205ea43d063aba22 280w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/react-logo.png?w=560&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=eb7952e94d645a92fa71db15025ac7ce 560w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/react-logo.png?w=840&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=3b00b2ecc2745f3a18dc90d8739c7d20 840w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/react-logo.png?w=1100&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=d0a8508490716ef09571f0f858f25f6f 1100w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/react-logo.png?w=1650&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=0e072af57e503500fc4fa466d490f526 1650w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/react-logo.png?w=2500&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=a2310192bd5eda544038d6b427287c10 2500w" />

    <Logo name="React Native" img="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/expo-logo.png?fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=2eed3f18ded0223ce8e9b135290dcb6b" className="dark:hidden" href="basics/react-native/setup" data-og-width="1024" width="1024" data-og-height="914" height="914" data-path="images/expo-logo.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/expo-logo.png?w=280&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=0f7955cb01ed32b0e031d2b7200998b9 280w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/expo-logo.png?w=560&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=4451bb779717fb3d772efd0b38bc7987 560w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/expo-logo.png?w=840&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=34771ad7f2e1fb0ced48e67bb23c853b 840w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/expo-logo.png?w=1100&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=bff7c27ecda7c6c5a4823ae0a5379210 1100w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/expo-logo.png?w=1650&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=c6b094a7ce38cbf904fd888416177ba8 1650w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/expo-logo.png?w=2500&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=c90df03a98efe89c9d6986f48952301e 2500w" />

    <Logo name="React Native" img="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/expo-logo-dark.png?fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=5b973668fbf1a9151dedcf4e12f642d0" className="hidden dark:block" href="basics/react-native/setup" data-og-width="1024" width="1024" data-og-height="914" height="914" data-path="images/expo-logo-dark.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/expo-logo-dark.png?w=280&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=a93f1453b96113df3c39694bf4a0ee64 280w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/expo-logo-dark.png?w=560&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=d1bf5ccec53637d0e46335c27a5fd6d1 560w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/expo-logo-dark.png?w=840&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=9998ef7290dfe5e2f588172eda51ed4f 840w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/expo-logo-dark.png?w=1100&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=0544331624ee5cac4e3bdaacf4bbb0cd 1100w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/expo-logo-dark.png?w=1650&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=0856eb1cf558a26cd25c5d3bd0902097 1650w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/expo-logo-dark.png?w=2500&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=12ac9dc99cd7e18ff2a6eb3520884f55 2500w" />

    <Logo name="iOS (Swift)" img="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/swift-logo.png?fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=11df6cff81cb22e668df48d5d9c9d300" href="basics/swift/setup" data-og-width="848" width="848" data-og-height="790" height="790" data-path="images/swift-logo.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/swift-logo.png?w=280&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=4b824489f9c91d2e7b68459f1cffa942 280w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/swift-logo.png?w=560&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=93b7ad188ce5548c92a196fff4219a74 560w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/swift-logo.png?w=840&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=4666e5abeedb3bd4f1472f3d53929ec3 840w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/swift-logo.png?w=1100&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=81ec2d4dcfb0cef29cd0932f37e0f9ab 1100w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/swift-logo.png?w=1650&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=7a7f6b0cf81fde621acf52f9c224c6aa 1650w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/swift-logo.png?w=2500&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=b9961f72a20067687134a45398791273 2500w" />

    <Logo name="Android (Kotlin)" img="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/android-logo.png?fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=fcb54544ea626a4e61aa0a275b864c8d" href="/basics/android/setup" data-og-width="512" width="512" data-og-height="601" height="601" data-path="images/android-logo.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/android-logo.png?w=280&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=e2e8bcf6ae87173ee1acbadec634c9e2 280w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/android-logo.png?w=560&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=704ee3eaa148580c7774ad1ab9f3625e 560w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/android-logo.png?w=840&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=eb233cbecb56f7ad77bb13a2917c111a 840w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/android-logo.png?w=1100&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=f534a7bf7027612d855fb466d0467792 1100w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/android-logo.png?w=1650&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=55f102eed0449705cfdde7459444df8d 1650w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/android-logo.png?w=2500&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=7acb8821a1a739d09e468889514afc48 2500w" />

    <Logo name="Unity" img="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/unity-logo.png?fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=d01a6cd23e2f00e11151e002b5ec63fb" className="dark:hidden" href="basics/unity/setup" data-og-width="280" width="280" data-og-height="280" height="280" data-path="images/unity-logo.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/unity-logo.png?w=280&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=67a5cc3ec2f79c2cbe4a38d09bd91a2e 280w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/unity-logo.png?w=560&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=08d3150e31cb5e560b33b131fc2ad1a3 560w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/unity-logo.png?w=840&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=0da9f8e026f70b6646054cd0dc948c00 840w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/unity-logo.png?w=1100&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=ec3e2e6cefd59bebb981b0442e68c0fe 1100w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/unity-logo.png?w=1650&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=dcd4b81a83d541fa227b3812f55840ee 1650w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/unity-logo.png?w=2500&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=6e6bf5988c4f180f28e908469cd17b01 2500w" />

    <Logo name="Unity" img="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/unity-logo-dark.png?fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=6d5d45f7d40721e72ee482885fe1e48d" className="hidden dark:block" href="basics/unity/setup" data-og-width="280" width="280" data-og-height="280" height="280" data-path="images/unity-logo-dark.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/unity-logo-dark.png?w=280&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=667b3bddd6314b03f51b1f1cd86781f2 280w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/unity-logo-dark.png?w=560&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=913e52733d0b8771fd8ebf64e23a0210 560w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/unity-logo-dark.png?w=840&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=57a60f28fe8a973a9294a1646237d097 840w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/unity-logo-dark.png?w=1100&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=64c151b52fc9b60b8054d304a1d70011 1100w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/unity-logo-dark.png?w=1650&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=70780c956c1368e2b213e94e1949f3b6 1650w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/unity-logo-dark.png?w=2500&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=91f0e85513063ad6b51f9034e4fd0a91 2500w" />

    <Logo name="Flutter" img="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/flutter-logo.png?fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=c058785999aa3fdbab87ef382fb080ab" href="basics/flutter/setup" data-og-width="3000" width="3000" data-og-height="3000" height="3000" data-path="images/flutter-logo.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/flutter-logo.png?w=280&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=67dbdf11a12567135884567b8884c904 280w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/flutter-logo.png?w=560&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=910a95b14c53792ad5231d81cdfce4d8 560w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/flutter-logo.png?w=840&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=2d22e9eb36b5df2a59012e98a4c80b32 840w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/flutter-logo.png?w=1100&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=2fed5bd1a6422160e3d27c8607fc2209 1100w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/flutter-logo.png?w=1650&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=92963fe76568e8b0a53ae2643017e7c1 1650w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/flutter-logo.png?w=2500&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=7a9ef1a80f34ac9fb97e3fce27afbd1b 2500w" />
  </div>

  <div className="text-center text-sm mt-12 mb-6">
    <h2 className="subtitle">Explore server SDKs</h2>
  </div>

  <div className="flex flex-wrap gap-12 space-around justify-center">
    <Logo name="NodeJS" img="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/node-logo.png?fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=d894369bda27812eb446b3f07fa678b5" href="basics/nodeJS/setup" data-og-width="256" width="256" data-og-height="256" height="256" data-path="images/node-logo.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/node-logo.png?w=280&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=4ed6dca5ba3d62011d9e6d25b79da9fb 280w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/node-logo.png?w=560&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=13d0797e547191c93dbe823e7750969f 560w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/node-logo.png?w=840&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=33432def0e3fe942dbb2076f4eacd089 840w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/node-logo.png?w=1100&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=bb43e171620685cf26b34c60fc532c48 1100w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/node-logo.png?w=1650&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=d6ea3aa98f1cb0ee3404626323116c64 1650w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/node-logo.png?w=2500&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=e7e9e67e6f77c8d946af32e0bfadd105 2500w" />

    <Logo name="Python" img="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/python-logo.png?fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=564a6aac342d4e2f450cbf4289bc537a" href="basics/python/setup" data-og-width="512" width="512" data-og-height="512" height="512" data-path="images/python-logo.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/python-logo.png?w=280&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=a5838d08a6115718583dc9cd6bb63384 280w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/python-logo.png?w=560&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=3cd0951d6a6b55e83c432d7f6ef949d4 560w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/python-logo.png?w=840&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=76428a15ec93abe9dd22c42d5e08ffa8 840w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/python-logo.png?w=1100&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=c4b85f936a222df6d74f8a954608d1d6 1100w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/python-logo.png?w=1650&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=37f72f4bef9143a64841f1dbf0fcda0d 1650w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/python-logo.png?w=2500&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=2e6b0954fddbafcdda1edd72acc25323 2500w" />

    <Logo name="Java" img="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/java-logo.png?fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=dee8f122bd829f47fe6f74f3fe611fc1" href="basics/java/setup" data-og-width="512" width="512" data-og-height="512" height="512" data-path="images/java-logo.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/java-logo.png?w=280&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=c653a3f151cf57e558941fcafc83da54 280w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/java-logo.png?w=560&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=8402be50a6725e12d5bf4151cba1f8b1 560w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/java-logo.png?w=840&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=3525ffb0bb74d86b153a0316729ecdc6 840w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/java-logo.png?w=1100&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=9bbfacc30ba23af5524a6ab69f36e1cb 1100w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/java-logo.png?w=1650&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=75e57dbee62e0db293ec9870edd065c9 1650w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/java-logo.png?w=2500&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=f000ac1fda3823e9efa7e5414544e196 2500w" />

    <Logo name="Go" img="https://mintcdn.com/privy-c2af3412/-hYhqGxnG074eAEV/images/go-logo.png?fit=max&auto=format&n=-hYhqGxnG074eAEV&q=85&s=ebb4fabbdde7ad0e23cfdccdcf855119" href="basics/go/setup" data-og-width="512" width="512" data-og-height="452" height="452" data-path="images/go-logo.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/-hYhqGxnG074eAEV/images/go-logo.png?w=280&fit=max&auto=format&n=-hYhqGxnG074eAEV&q=85&s=3dc7481007b63864a59c4568dc2008d3 280w, https://mintcdn.com/privy-c2af3412/-hYhqGxnG074eAEV/images/go-logo.png?w=560&fit=max&auto=format&n=-hYhqGxnG074eAEV&q=85&s=35ebf3658e49030793e101256af54181 560w, https://mintcdn.com/privy-c2af3412/-hYhqGxnG074eAEV/images/go-logo.png?w=840&fit=max&auto=format&n=-hYhqGxnG074eAEV&q=85&s=14900bac6c58402e5dcd7746e0a1535d 840w, https://mintcdn.com/privy-c2af3412/-hYhqGxnG074eAEV/images/go-logo.png?w=1100&fit=max&auto=format&n=-hYhqGxnG074eAEV&q=85&s=ca3a7b663edce7b625e1502141033644 1100w, https://mintcdn.com/privy-c2af3412/-hYhqGxnG074eAEV/images/go-logo.png?w=1650&fit=max&auto=format&n=-hYhqGxnG074eAEV&q=85&s=f19166c33f3085c552e677df1b9956c1 1650w, https://mintcdn.com/privy-c2af3412/-hYhqGxnG074eAEV/images/go-logo.png?w=2500&fit=max&auto=format&n=-hYhqGxnG074eAEV&q=85&s=fa67619a6d3a1ad87f680db9497ea940 2500w" />

    <Logo name="REST API" img="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/rest-api-logo.png?fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=02af129966bcfc90ded9ea9f94d5ced5" href="basics/rest-api/setup" className="dark:hidden" data-og-width="121" width="121" data-og-height="84" height="84" data-path="images/rest-api-logo.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/rest-api-logo.png?w=280&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=64a9c4d8147104925461be3734fc9051 280w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/rest-api-logo.png?w=560&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=dba3163f960b24baa91f8c9dabcfdc24 560w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/rest-api-logo.png?w=840&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=3afd097bccb104836401c68e297cd56c 840w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/rest-api-logo.png?w=1100&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=bf7fe9139f68f91cf0c8ffcde6ff25b1 1100w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/rest-api-logo.png?w=1650&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=d37cf6b68a918f2c0adc6e6b3f560ecf 1650w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/rest-api-logo.png?w=2500&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=04452ef627b5020d083e75a77843a066 2500w" />

    <Logo name="REST API" img="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/rest-api-logo-dark.png?fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=ec0310cf9562416fcbea388fbe464de4" href="basics/rest-api/setup" className="hidden dark:block" data-og-width="121" width="121" data-og-height="84" height="84" data-path="images/rest-api-logo-dark.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/rest-api-logo-dark.png?w=280&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=893bd883ea1970094639f97db4977e22 280w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/rest-api-logo-dark.png?w=560&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=893cf699304d318acf2f2656adf2bf4e 560w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/rest-api-logo-dark.png?w=840&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=8df3e03f8df2e5efd5e1643f7c5328c8 840w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/rest-api-logo-dark.png?w=1100&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=da19c7c844798e7c006452635bea4624 1100w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/rest-api-logo-dark.png?w=1650&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=acfcde7e073cf9ac0beb7bf0ac42eb79 1650w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/rest-api-logo-dark.png?w=2500&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=a84b372ac10b5021a50ffb8195c1223c 2500w" />
  </div>

  <div className="text-center text-sm mt-12 mb-6">
    <h2 className="subtitle">Resources</h2>
  </div>

  <CardGroup cols={3}>
    <Card title="Support" icon="slack" href="https://privy.io/slack">
      Join our Slack community to get support.
    </Card>

    <Card title="Recipes" icon="file-lines" href="/recipes/overview">
      Implement common Privy features and integrations.
    </Card>

    <Card title="Demo" icon="circle-play" href="https://demo.privy.io">
      Sign in to demo.privy.io to view Privy in action.
    </Card>
  </CardGroup>
</div>
\n