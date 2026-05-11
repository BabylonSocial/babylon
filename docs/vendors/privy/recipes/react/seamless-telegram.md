> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Seamless Telegram login

Privy enables developers to quickly integrate Login with Telegram into their applications. With the Privy Telegram integration, users can log in with Telegram and link Telegram accounts.

From a web environment, Privy enables Telegram login via the [Telegram Login widget](https://core.telegram.org/widgets/login). Privy also enables seamless Telegram login directly from within a Telegram bot or within Telegram Mini-Apps!

## Configure Telegram

### Configure Telegram login

Follow [this](https://core.telegram.org/bots/tutorial#obtain-your-bot-token) guide to create a telegram bot. After creating a Telegram bot, you must set your domain using the `/setdomain` command in the `@BotFather` chat. You will need to provide the following to Privy via the Privy Dashboard upon completion:

* Bot token (eg: `1234567890:AzByCxDwEvFuGtHsIr1k2M4o5Q6s7U8w9Y0`)
* Bot handle (eg: `@MyBot_bot`)

Note that when configuring Telegram login:

* Your domain must be configured as your bot's allowed domain.
* **Important**: Telegram does not support `.xyz` domains for authentication. If your application uses a `.xyz` domain, you must use a different top-level domain (TLD) for Telegram authentication to function properly.
* If you have CSP enforcement, you’ll need to update these directives:
  * `script-src` must allow `https://telegram.org` in order to be able to download Telegram's widget script.
  * `frame-src` must allow `https://oauth.telegram.org` in order to be able to render Telegram's widget iframe.

<Tip>
  To use your app as a Telegram Mini-App in the Telegram web client, add `http://web.telegram.org`
  and `https://web.telegram.org` to your allowed domains in the dashboard [Configuration > App
  settings > Domains](https://dashboard.privy.io?page=settings) tab.
</Tip>

<Info>
  Since you need to set your bot's allowed domain you'll need to use a tunneling tool for local
  development such as [Cloudflare
  tunnels](https://developers.cloudflare.com/pages/how-to/preview-with-cloudflare-tunnel/) or
  [ngrok](https://ngrok.com/).
</Info>

### Essential: Secure your bot secret

<Warning>
  Telegram login requires developers to create a Telegram bot with a bot secret. This bot secret
  controls the Telegram bot and is also used as a symmetric key for authentication. Control over
  this key enables a developer to sign over authentication data, meaning compromise of this key puts
  your users (and their accounts) at risk.

  **Securing this symmetric key is essential for the security of all of your app’s Telegram logins.**
</Warning>

## Integration interfaces

### \[optional] Enable Telegram in your client-side `loginMethods`

You must enable Telegram in the Privy Dashboard to enable login with Telegram.

If you *additionally* have `loginMethods` configured client-side in your `PrivyProvider` config, make sure you add `"telegram"` to that list as well. Client-side login method configuration is only necessary if you want to restrict logins to a subset of those configured in the Dashboard.

```jsx  theme={"system"}
  <PrivyProvider
    appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
    config={{
      loginMethods: ["email", "google", "telegram"],
      ...
    }}
  >
```

### Seamless login with Telegram

You can integrate Privy to enable login directly from within a Telegram bot or Telegram mini-app.

* If enabled, Privy will automatically log your user in when your user initiates login from within Telegram. You *do not* have to call `login` from the `usePrivy` hook in this case!
* To enable seamless login, send your website URL using , [InlineKeyboardButton.web\_app](https://core.telegram.org/bots/api#inlinekeyboardbutton) or [InlineKeyboardButton.login\_url](https://core.telegram.org/bots/api#inlinekeyboardbutton) or use a direct link (ex: `t.me/xxx_bot/xxx`)
* For reference, see these docs:
  * [https://core.telegram.org/bots/api#keyboardbutton](https://core.telegram.org/bots/api#keyboardbutton)
  * [https://core.telegram.org/bots/api#inlinekeyboardbutton](https://core.telegram.org/bots/api#inlinekeyboardbutton)

```jsx  theme={"system"}
bot.send_message(chat_id, 'Log in to demo!', {
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: 'Login',
          login_url: {url: 'https://your-website-url'}
        },
        {
          text: 'Mini App',
          web_app: {url: 'https://your-website-url'}
        }
      ]
    ]
  }
});
```

### Login with Telegram

Once Telegram is enabled, you will *automatically* see Telegram in the Privy login modal. You can also list `'telegram'` when [configuring login methods client-side](/basics/react/advanced/configuring-appearance), in the `PrivyProvider`.

### Link Telegram

You can use the `linkTelegram` and `unlinkTelegram` methods from the `usePrivy` hook to add or remove Telegram accounts from a user. See the SDK reference for more details:

```jsx  theme={"system"}
const {linkTelegram, unlinkTelegram} = usePrivy();
```

### Link Telegram seamlessly within a Telegram Mini app

You can use the `linkTelegram` methods from the `usePrivy` hook within a Telegram Mini App to add to a user seamlessly by passing `launchParams` as a parameter. See the SDK reference for more details:

```jsx  theme={"system"}
// Sample library to retrieve launchParams
import {retrieveLaunchParams} from '@telegram-apps/bridge';

const {linkTelegram} = usePrivy();
const launchParams = retrieveLaunchParams();
linkTelegram({launchParams});
```

<Warning>Telegram `launchParams` are treated as expired after five minutes for security.</Warning>

### TelegramAccount type

The `user` object contains information about [all of the accounts](/user-management/users/the-user-object) a user has linked with Privy.

```jsx  theme={"system"}
Use the fields:
- **`user.linkAccounts`** to get a list of all the user's linked accounts
- **`user.telegram`** to get the user's Telegram account
```

**`TelegramAccount` extends `LinkedAccount`**

| Field              | Type       | Description                                                      |
| ------------------ | ---------- | ---------------------------------------------------------------- |
| type               | 'telegram' | N/A                                                              |
| telegram\_user\_id | string     | ID of a user's telegram account.                                 |
| first\_name        | string     | The first name displayed on a user's telegram account.           |
| last\_name         | string     | (Optional) The last name displayed on a user's telegram account. |
| username           | string     | (Optional) The username displayed on a user's telegram account.  |
| photo\_url         | string     | (Optional) The url of a user's telegram account profile picture. |
\n