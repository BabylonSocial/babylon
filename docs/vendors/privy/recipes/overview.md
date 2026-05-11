> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

export const LinkCard = ({title, links, search = ''}) => {
  const filteredLinks = links.filter(link => link.text.toLowerCase().includes(search.toLowerCase()));
  if (filteredLinks.length === 0) return null;
  return <div className="link-card">
      <h2 className="link-card-title">{title}</h2>
      <div className="link-card-links">
        {filteredLinks.map((link, i) => <a key={i} href={link.href} className="link-card-link">
            {link.text}
          </a>)}
      </div>
    </div>;
};


export default function RecipesOverview() {
  const [search, setSearch] = useState('');
  const popularCards = [{
    title: "Send USDC",
    icon: "money-bill",
    href: "/recipes/send-usdc",
    description: "Format your transaction payload to send tokens."
  }, {
    title: "Send USDC on Solana",
    icon: "money-bill",
    href: "/recipes/solana/send-spl-tokens",
    description: "Format your transaction payload to send SPL tokens."
  }, {
    title: "Bridge Onramp",
    icon: <svg xmlns="http://www.w3.org/2000/svg" width={32} height={32} viewBox="0 0 400 400">

<path fill="#010101" d="M224.203 51.625 227 54c.84.701 1.68 1.403 2.547 2.125C252.756 76.063 266.935 105.775 270 136c.22 3.682.399 7.326 0 11-2.155 2.155-7.071 1.26-10.066 1.316l-2.754.063c-2.914.066-5.828.125-8.743.184l-5.912.13c-4.841.108-9.683.209-14.525.307l.06-2.794c.267-21.661-8.112-41.257-22.892-57.124-16.496-15.842-37.567-22.753-60.063-22.557-8.462.269-16.1 1.786-24.105 4.475l-3.191 1.063C99.657 78.877 84.939 92.95 76 110c-5.696 12.603-7.437 23.931-9 38H27c-4.536-22.682 7.016-49.244 19-68 4.668-6.989 9.864-13.267 16-19l2.438-2.5c43.143-42.09 113.078-44.794 159.765-6.875Z" />
<path fill="#020202" d="M69 162c1.462 2.924 1.81 5.999 2.402 9.2.708 3.317 1.655 6.542 2.598 9.8-4.284 1.964-8.57 3.92-12.86 5.872-1.457.663-2.912 1.329-4.367 1.996-2.1.963-4.204 1.919-6.308 2.874l-1.945.897C44.396 194.502 40.36 195.855 36 197c-.989-2.83-1.966-5.664-2.938-8.5l-.841-2.398-.81-2.383-.747-2.158C29.77 178.11 29.442 174.536 29 171l40-9Z" />
<path fill="#040404" d="M158 227c.434 4.231.86 8.463 1.282 12.695.143 1.436.289 2.87.436 4.306.822 8.02 1.472 15.924 1.282 23.999-8.569 1.624-17.423 1.596-26 0-.197-7.88.567-15.548 1.438-23.375l.408-3.848c1.021-9.38 1.021-9.38 2.154-12.777l8.938-.5 2.576-.145 2.45-.136 2.27-.127A53.3 53.3 0 0 1 158 227Z" />
<path fill="#050505" d="m226 162 41 9c-1.125 8.997-1.125 8.997-2.156 11.922l-.66 1.918-.684 1.91c-1.301 3.725-2.581 7.41-3.5 11.25a1761.89 1761.89 0 0 1-15.326-6.561 712.075 712.075 0 0 0-5.218-2.226 690.433 690.433 0 0 1-7.483-3.225l-2.37-.982c-5.354-2.377-5.354-2.377-6.636-5.615.036-2.616.499-4.406 1.47-6.828C226.05 168.52 226 166.792 226 162Z" />
<path fill="#030303" d="m190 217 1.421 2.491a39418.626 39418.626 0 0 0 7.517 13.169c1.089 1.91 2.179 3.818 3.269 5.727l1.014 1.777c1.46 2.555 2.934 5.08 4.516 7.562C209 250 209 250 209 253a1117.97 1117.97 0 0 1-8.063 3.938l-2.279 1.13c-4.625 2.223-8.536 3.504-13.658 3.932-3.152-7.527-5.78-15.163-8.25-22.938l-1.102-3.4-1.039-3.252-.938-2.933C173 227 173 227 173 224l2.773-1.277 3.602-1.66 3.586-1.653C188.155 217 188.155 217 190 217Z" />
<path fill="#040404" d="M106 217c5.92 1.76 11.416 4.397 17 7-.592 5.031-1.684 9.653-3.285 14.465l-.668 2.055c-.698 2.14-1.404 4.28-2.11 6.417l-1.431 4.385c-1.163 3.562-2.332 7.12-3.506 10.678-6.464-.463-11.236-2.17-17-5.063l-2.348-1.142A699.406 699.406 0 0 1 87 253c.694-3.8 2.395-6.768 4.273-10.121l.984-1.763c1.035-1.854 2.076-3.704 3.118-5.554l2.078-3.72c2.788-4.985 5.585-9.957 8.547-14.842Z" />
<path fill="#050505" d="M81.957 195.04c2.935 1.38 4.636 3.366 6.793 5.773l2.422 2.644C93 206 93 206 93 210c-1.723 2.078-1.723 2.078-4.063 4.25a147.895 147.895 0 0 0-10.097 10.621C75.294 228.974 71.636 232.977 68 237c-5.426-2.313-9.007-6.795-13-11l-1.73-1.785c-1.395-1.528-1.395-1.528-3.27-4.215.191-2.705.734-3.745 2.699-5.628l2.203-1.579 2.436-1.77 2.6-1.835 2.62-1.882c1.71-1.224 3.422-2.445 5.137-3.66a250.807 250.807 0 0 0 5.649-4.154l2.594-1.93 2.152-1.62C80 195 80 195 81.957 195.038ZM214 194c9.26 5.5 17.678 11.964 26.16 18.577A432.068 432.068 0 0 0 246 217c-.559 3.975-2.5 5.985-5.188 8.875l-2.445 2.64A320.507 320.507 0 0 1 230 237c-4.256-1.605-6.86-4.821-9.813-8.125-.53-.585-1.06-1.17-1.607-1.771A933.716 933.716 0 0 1 214 222c-.726-.812-1.451-1.624-2.2-2.46A495.24 495.24 0 0 1 207 214l-2.5-2.75c-1.5-2.25-1.5-2.25-1.34-4.137 1.089-2.74 2.634-4.164 4.778-6.175 2.407-2.277 4.21-4.16 6.062-6.938Z" />
<path fill="#121212" d="M124 28c-3.004 2.002-5.115 2.683-8.563 3.625-5.851 1.744-11.363 3.95-16.937 6.438l-2.319 1.031c-3.142 1.425-6.126 2.873-9.087 4.652C85 45 85 45 83 45v2c-1.637 1.178-1.637 1.178-3.91 2.54-5.585 3.598-9.95 8.056-14.528 12.835-1.577 1.637-3.159 3.27-4.746 4.898l-2.08 2.17C56 71 56 71 54 71l-.785 2.18c-1.272 2.952-2.792 5.328-4.653 7.945l-1.808 2.57C45.272 85.643 43.783 87.332 42 89c1.369-4.95 3.621-8.772 6.625-12.875l1.344-1.86C53.572 69.382 57.535 65.113 62 61l2.5-2.563C78.217 45.065 103.58 26.73 124 28Z" />
<path fill="#101010" d="M72 115c1 2 1 2 .293 4.406l-1.106 3.094C68.3 131.604 68.3 131.604 67 148H27c-2.1-10.498.043-20.845 3-31h1l-.434 3.84c-.581 5.237-1.11 10.479-1.628 15.722L28 146h38v-15c1.059-4.71 1.059-4.71 2.438-8.375l.697-1.938C70.77 116.23 70.77 116.23 72 115Z" />
<path fill="#161616" d="M69 162c1.462 2.924 1.81 5.999 2.402 9.2.708 3.317 1.655 6.542 2.598 9.8-4.284 1.964-8.57 3.92-12.86 5.872-1.457.663-2.912 1.329-4.367 1.996-2.1.963-4.204 1.919-6.308 2.874l-1.945.897c-4.186 1.89-8.026 3.077-12.52 4.361l-5-16h2l5 13c6.912-2.547 13.382-5.066 19.723-8.797 4.223-2.23 8.757-3.69 13.277-5.203l-.621-1.758c-1.52-4.404-2.784-8.599-3.379-13.242l-10 2-1-2 13-3Z" />
<path fill="#0F0F0F" d="M228 133h2c.887 4.546 1 8.234 1 13h37v-8h1v10l-41 1v-16Z" />
<path fill="#161616" d="M141 64a654.73 654.73 0 0 1 15 0l2.66.012C170.283 64.59 183.428 70.605 193 77l1 2c-3.542-1.366-6.973-2.913-10.415-4.513C169.307 67.96 155.532 66.48 140 66l1-2Z" />
<path fill="#141414" d="M188 217v3c-2.463 2.463-4.274 2.768-7.625 3.625-1.003.26-2.006.52-3.04.79L175 225l.813 2.438L177 231l.66 1.945c.793 2.348 1.569 4.7 2.34 7.055l1.082 3.293 1.106 3.457 1.042 3.234c.722 2.826.926 5.12.77 8.016-2.08-3.119-3.018-5.754-4.164-9.313l-1.211-3.757-.621-1.954a1141 1141 0 0 0-1.902-5.906C173 227.383 173 227.383 173 224l2.773-1.277 3.602-1.66 3.586-1.653A191.286 191.286 0 0 0 188 217Z" />
<path fill="#1A1A1A" d="M206 248h2l1 5a1117.97 1117.97 0 0 1-8.063 3.938l-2.279 1.13c-4.625 2.223-8.536 3.504-13.658 3.932l-1-4 3 2a63.93 63.93 0 0 0 7.438-2.688l2.025-.818c3.495-1.451 6.798-2.84 9.537-5.494v-3Z" />
<path fill="#151515" d="m106 217 5 2-1.813.188c-3.126 1.16-3.72 2.878-5.187 5.812l-.828 2.277c-1.42 3.3-3.276 6.069-5.297 9.036l-2.195 3.238L94 242l-1-2c1.08-2.338 1.08-2.338 2.746-5.227l1.787-3.125 1.904-3.273 1.893-3.297c1.55-2.697 3.107-5.39 4.67-8.078Z" />
<path fill="#121212" d="m226 162 7 2-1.852 1.652c-2.35 2.568-3.344 4.653-4.523 7.91l-1.086 2.88L225 179l2 3-4-1c.422-3.513.9-6.712 2.063-10.063 1.001-3.138 1.093-5.664.937-8.937Z" />
<path fill="#181818" d="M77 197v3c-1.62 1.502-1.62 1.502-3.867 3.066l-2.434 1.721-2.574 1.775a3518.53 3518.53 0 0 0-4.992 3.504l-2.254 1.561c-1.985 1.377-1.985 1.377-3.879 3.373l-3-1c2.52-1.897 5.041-3.793 7.563-5.688l2.134-1.607c4.392-3.298 8.821-6.53 13.303-9.705ZM47 167l1 2c-3.827 1.747-7.124 2.349-11.313 2.625l-3.238.227L31 172l1 8-2-1-1-8 18-4Z" />
<path fill="#191919" d="M113 74a900.633 900.633 0 0 1-6.375 4.063l-1.828 1.181c-1.562.98-3.177 1.875-4.797 2.756l-2-1 2.313-1.813c2.592-2.005 2.592-2.005 4.25-3.874C107.397 72.724 109.46 72.82 113 74Z" />
<path fill="#161616" d="M214 220c3.297 1.099 4.047 1.946 6.188 4.563l1.605 1.94L223 228l-1 2a679.453 679.453 0 0 1-4-3.875l-2.25-2.18C214 222 214 222 214 220Z" />
<path fill="#101010" d="M188 217v3c-2.36 2.36-3.779 2.491-7 3 1-3 1-3 4.063-4.688L188 217Z" />
<path fill="#121212" d="M62 208v3c-2.313 2.25-2.313 2.25-5 4l-3-1 8-6Z" />
<path d="M88 93v3l-2 1 2-4ZM55 65v3l-2 1 2-4ZM82 222v3l-2-1 2-2ZM68 52l2 1-3 2 1-3ZM98 226l2 1-2 2v-3ZM242 225v3ZM246 220v3ZM212 193v3ZM63 236l2 2h-2v-2ZM206 214l2 2h-2v-2ZM93 210l1 2-2-1 1-1ZM203 203l2 1-2 1v-2ZM83 193l2 2h-2v-2ZM84 98l1 2-2-1 1-1ZM91 90l1 2-2-1 1-1ZM205 255l2 1ZM244 214l2 1ZM50 214l2 1ZM240 211l2 1ZM236 208l2 1ZM91 203l2 1ZM65 203l2 1ZM71 199l2 1ZM75 196l2 1ZM221 181l2 1ZM198 85l2 1ZM96 85l2 1ZM194 82l2 1ZM100 82l2 1ZM65 55l2 1ZM226 52l2 1ZM72 49l2 1ZM76 46l2 1ZM79 44l2 1Z" />

  </svg>,
    href: "/recipes/bridge-onramp",
    description: "Learn how to implement bridge onramp functionality."
  }, {
    title: "Optimize your setup",
    icon: "lightbulb",
    href: "/recipes/dashboard/optimizing",
    description: "Best tips and tricks to optimize your setup."
  }, {
    title: "Trading apps homepage",
    icon: "chart-simple",
    href: "/recipes/trading-apps-homepage",
    description: "Quickstart guide to building a trading app."
  }, {
    title: "Abstract Global Wallet",
    icon: <svg xmlns="http://www.w3.org/2000/svg" width={24} height={22} viewBox="0 0 141 128" fill="none">
<path d="M93.1166 85.8201L121.195 113.914L108.021 127.096L79.9417 99.0022C77.5343 96.5935 74.361 95.2796 70.9469 95.2796C67.5328 95.2796 64.3594 96.5935 61.952 99.0022L33.8732 127.096L20.6983 113.914L48.7771 85.8201H93.0947H93.1166Z" fill="black" />
<path d="M97.8 77.7181L136.143 87.9879L140.958 69.9665L102.615 59.6968C99.332 58.8209 96.5963 56.7188 94.8892 53.7626C93.1822 50.8284 92.7445 47.3906 93.6199 44.106L103.884 5.74218L85.8725 0.924805L75.6083 39.2886L97.7781 77.6962L97.8 77.7181Z" fill="black" />
<path d="M44.1155 77.7181L5.77252 87.9879L0.957764 69.9665L39.3007 59.6968C42.5835 58.8209 45.3192 56.7188 47.0262 53.7626C48.7333 50.8284 49.171 47.3906 48.2956 44.106L38.0314 5.74218L56.043 0.924805L66.3072 39.2886L44.1374 77.6962L44.1155 77.7181Z" fill="black" />
</svg>,
    href: "/recipes/ecosystem/abstract-global-wallet",
    description: "Integrate Abstract Global Wallet into your app."
  }];
  const filteredPopular = popularCards.filter(card => card.title.toLowerCase().includes(search.toLowerCase()) || card.description.toLowerCase().includes(search.toLowerCase()));
  return <>
  <div className="recipes">
    <div className="text-center">
      <h1>Recipes</h1>
    </div>
    <div id="recipes-search" className="search">
      <input type="text" placeholder="Search recipes..." value={search} onChange={e => setSearch(e.target.value)} className="search-input" style={{
    width: '100%',
    maxWidth: 400,
    margin: '0 auto',
    display: 'block'
  }} />
    </div>
  </div>
  <div className="card-group-wrapper">
    <h2 className="font-semibold text-3xl pb-2 text-center text-black mb-4">Popular</h2>
    <CardGroup cols={2} horizontal>
      {filteredPopular.map(card => <Card key={card.title} title={card.title} icon={card.icon} href={card.href} horizontal>
          {card.description}
        </Card>)}
    </CardGroup>
  </div>
  <div className="card-group-wrapper">
    <h2 className="font-semibold text-3xl pb-2 text-center text-black mb-6">All recipes</h2>
    <div className="link-card-grid">
      <LinkCard title="Authentication" links={[{
    text: 'Configure SMS and WhatsApp login',
    href: '/recipes/dashboard/login-methods/sms-whatsapp'
  }, {
    text: 'Guest accounts',
    href: '/recipes/react/guest-accounts'
  }, {
    text: 'Using OAuth tokens',
    href: '/recipes/react/oauth-tokens'
  }, {
    text: 'Worldcoin SIWE guide',
    href: '/recipes/react/worldcoin-siwe-guide'
  }, {
    text: 'Mocking tokens for testing',
    href: '/recipes/mock-jwt'
  }, {
    text: 'Configure cookies',
    href: '/recipes/react/cookies'
  }, {
    text: 'Using test accounts',
    href: '/recipes/using-test-accounts'
  }, {
    text: 'Chrome extension guide',
    href: '/recipes/react/chrome-extension'
  }, {
    text: 'Using Supabase for custom auth',
    href: '/recipes/authentication/using-supabase-for-custom-auth'
  }]} search={search} />
      <LinkCard title="Wallet infrastructure" links={[{
    text: 'HD wallets',
    href: '/recipes/hd-wallets'
  }, {
    text: 'Pregenerating wallets',
    href: '/recipes/pregenerate-wallets'
  }, {
    text: 'Treasury wallets',
    href: '/recipes/wallets/treasury-wallets'
  }, {
    text: 'Passkey wallets',
    href: '/recipes/passkey-server-wallets'
  }, {
    text: 'Policy-based MFA',
    href: '/recipes/policy-based-mfa'
  }, {
    text: 'TEE wallet migration guide',
    href: '/recipes/tee-wallet-migration-guide'
  }, {
    text: 'Server-side self-custodial user wallets',
    href: '/recipes/wallets/server-side-user-wallets'
  }, {
    text: '2-of-2 quorum: user and server as co-signers',
    href: '/recipes/wallets/two-of-two-server-in-the-loop'
  }, {
    text: 'Using tier 2 chains',
    href: '/recipes/use-tier-2'
  }, {
    text: 'Integrating smart accounts with Wagmi',
    href: '/recipes/account-abstraction/wagmi'
  }, {
    text: 'Conditional policies per signer',
    href: '/recipes/wallets/conditional-signer-policies'
  }]} search={search} />
      <LinkCard title="UI customization and whitelabeling" links={[{
    text: 'Whitelabel homepage',
    href: '/recipes/react/whitelabel'
  }, {
    text: 'Configure wallet confirmation modals',
    href: '/recipes/react/manage-wallet-UIs'
  }, {
    text: 'System theme',
    href: '/recipes/system-theme'
  }, {
    text: 'Brand customization',
    href: '/recipes/dashboard/customization'
  }, {
    text: 'Wallet list configurations',
    href: '/recipes/react/wallet-list-configurations'
  }]} search={search} />
      <LinkCard title="Dashboard" links={[{
    text: 'Configure account transfer',
    href: '/recipes/dashboard/account-transfer'
  }, {
    text: 'Bot traffic mitigation',
    href: '/recipes/dashboard/preventing-bots'
  }, {
    text: 'Configure allowed domains',
    href: '/recipes/dashboard/allowed-domains'
  }, {
    text: 'Configure allowed OAuth redirects',
    href: '/recipes/react/allowed-oauth-redirects'
  }, {
    text: 'Airtable integration',
    href: '/recipes/dashboard/airtable'
  }, {
    text: 'Single sign-on (SSO)',
    href: '/basics/get-started/dashboard/sso'
  }]} search={search} />
      <LinkCard title="Social integrations" links={[{
    text: 'Build World Mini Apps',
    href: '/recipes/world/mini-apps'
  }, {
    text: 'Farcaster Mini App guide',
    href: '/recipes/farcaster/mini-apps'
  }, {
    text: 'Seamless Telegram login',
    href: '/recipes/react/seamless-telegram'
  }, {
    text: 'Login with Farcaster',
    href: '/recipes/farcaster/login'
  }, {
    text: 'Farcaster writes guide',
    href: '/recipes/farcaster/writes'
  }]} search={search} />
      <LinkCard title="Payments and gas sponsorship" links={[{
    text: 'Custom fiat onramp',
    href: '/recipes/react/custom-fiat-onramp'
  }, {
    text: 'Stripe Embedded Components onramp (Expo)',
    href: '/recipes/stripe-headless-onramp'
  }, {
    text: 'Off-ramp guide',
    href: '/recipes/off-ramp-guide'
  }, {
    text: 'Using Privy and Due for On/Off Ramping',
    href: '/recipes/due-on-off-ramp'
  }, {
    text: 'Funding wallets with Relay deposit addresses',
    href: '/recipes/relay-deposit-addresses'
  }, {
    text: 'Integrating OneBalance',
    href: '/recipes/one-balance'
  }, {
    text: 'Swap with 0x',
    href: '/recipes/swap-with-0x'
  }, {
    text: 'EIP-7702',
    href: '/recipes/react/eip-7702'
  }, {
    text: 'Card-based funding',
    href: '/recipes/card-based-funding'
  }, {
    text: 'Issuing debit cards with Bridge',
    href: '/recipes/bridge-cards'
  }, {
    text: 'Custom gas sponsorship rate limits',
    href: '/recipes/gas-sponsorship-rate-limits'
  }]} search={search} />
      <LinkCard title="Trading integrations" links={[{
    text: 'Trading apps homepage',
    href: '/recipes/trading-apps-homepage'
  }, {
    text: 'Polymarket Builder codes',
    href: '/recipes/polymarket-guide'
  }, {
    text: 'Request server-side access to user wallets',
    href: '/recipes/wallets/session-signer-use-cases/server-side-access'
  }, {
    text: 'Execute limit orders while users are offline',
    href: '/recipes/wallets/session-signer-use-cases/limit-orders'
  }, {
    text: 'Telegram trading bot guide',
    href: '/recipes/telegram-bot'
  }]} search={search} />
      <LinkCard title="Hyperliquid" links={[{
    text: 'Getting started',
    href: '/recipes/hyperliquid-guide'
  }, {
    text: 'Agents and Subaccounts',
    href: '/recipes/hyperliquid/agents-and-subaccounts'
  }, {
    text: 'Trading patterns',
    href: '/recipes/hyperliquid/trading-patterns'
  }, {
    text: 'Policies and offline actions',
    href: '/recipes/hyperliquid/policies-and-offline-actions'
  }, {
    text: 'Builder codes and HIP-3',
    href: '/recipes/hyperliquid/builder-codes-and-hip3'
  }, {
    text: 'HyperEVM',
    href: '/recipes/hyperliquid/hyperevm'
  }]} search={search} />
      <LinkCard title="Agent Integrations" links={[{
    text: 'Overview',
    href: '/recipes/agent-integrations/overview'
  }, {
    text: 'Agentic wallets',
    href: '/recipes/agent-integrations/agentic-wallets'
  }, {
    text: 'x402',
    href: '/recipes/agent-integrations/x402'
  }, {
    text: 'Bankr Twitter bot guide',
    href: '/recipes/agent-integrations/bankr-bot-guide'
  }, {
    text: 'OpenClaw agentic wallets',
    href: '/recipes/agent-integrations/openclaw-agentic-wallets'
  }]} search={search} />
      <LinkCard title="Yield" links={[{
    text: 'Overview',
    href: '/recipes/yield/overview'
  }, {
    text: 'Integrate Aave with Privy',
    href: '/recipes/yield/aave-guide'
  }, {
    text: 'Building on Morpho with Privy',
    href: '/recipes/yield/morpho-guide'
  }, {
    text: 'Integrating Sky Savings',
    href: '/recipes/yield/sky-savings-guide'
  }, {
    text: 'Integrating Kamino Earn',
    href: '/recipes/yield/kamino-guide'
  }]} search={search} />
      <LinkCard title="Mobile" links={[{
    text: 'Swift Apple login guide',
    href: '/recipes/swift/apple'
  }, {
    text: 'Deeplinking Solana wallets',
    href: '/recipes/react-native/deeplinking-wallets'
  }, {
    text: 'Clearing state on fresh installs',
    href: '/recipes/react-native/clearing-state-on-fresh-installs'
  }, {
    text: 'OAuth with Capacitor and Ionic',
    href: '/recipes/capacitor-oauth'
  }]} search={search} />
      <LinkCard title="Tooling" links={[{
    text: 'Core JS',
    href: '/recipes/core-js'
  }, {
    text: 'Flashbots protect',
    href: '/recipes/flashbots-protect'
  }, {
    text: 'Lens protocol',
    href: '/recipes/lens'
  }, {
    text: 'TRPC integration',
    href: '/recipes/trpc'
  }]} search={search} />
      <LinkCard title="EVM" links={[{
    text: 'Integrating the Base App',
    href: '/recipes/react/external-wallets/base-app'
  }, {
    text: 'Using Flashblocks with Privy',
    href: '/recipes/evm/flashblocks'
  }, {
    text: 'Using Privy with Hyperliquid',
    href: '/recipes/hyperliquid-guide'
  }, {
    text: 'Base Sub Accounts',
    href: '/recipes/react/external-wallets/base-sub-accounts'
  }, {
    text: 'Speeding up transactions',
    href: '/recipes/speeding-up-transactions'
  }]} search={search} />
      <LinkCard title="Solana" links={[{
    text: 'Configuring external connectors',
    href: '/recipes/react/configuring-external-connectors'
  }, {
    text: 'Standard wallets',
    href: '/recipes/solana/standard-wallets'
  }, {
    text: 'Sending a SOL transaction',
    href: '/recipes/solana/send-sol'
  }, {
    text: 'Sending an SPL transaction',
    href: '/recipes/solana/send-spl-tokens'
  }]} search={search} />
      <LinkCard title="Ecosystem" links={[{
    text: 'Abstract Global Wallet',
    href: '/recipes/ecosystem/abstract-global-wallet'
  }]} search={search} />
      <LinkCard title="Community written guides" links={[{
    text: 'Getting started with Privy and TON (Vite + React)',
    href: '/recipes/community/ton-vite-react'
  }, {
    text: 'Swapping crypto using Privy and Omniston',
    href: '/recipes/community/ton-omniston-swap'
  }]} search={search} />
      <div className="link-card link-card-bottom">
        <h2 className="link-card-title">Did we miss something?</h2>
        <div style={{
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  }}>
          <div style={{
    marginBottom: 16,
    fontSize: 16,
    flex: 1
  }}>
            Reach out to us on Slack and someone from our team will get back to you.
          </div>
          <a href="https://privy.io/slack" target="_blank" rel="noopener noreferrer" className="link-card-bottom-btn">
            Reach out
          </a>
        </div>
      </div>
    </div>

  </div>
</>;
}
\n