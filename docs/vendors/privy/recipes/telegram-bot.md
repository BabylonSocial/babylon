> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Building a Telegram trading bot

Privy can power **Telegram trading bots** that trade on behalf of users. These bots can be controlled via commands in the Telegram app, natural language commands to LLMs, or purely agentic trading.

## Resources

<CardGroup cols={1}>
  <Card title="Telegram trading bot starter" icon="github" href="https://github.com/privy-io/examples/tree/main/examples/privy-node-telegram-trading-bot" arrow>
    Complete starter repository showcasing a Telegram trading bot with Privy and Solana integration.
  </Card>
</CardGroup>

At a high-level, there are two approaches to building a Telegram trading bot:

* [**Bot-first**](/recipes/telegram-bot#bot-first-setup): Users first create and interact with their wallet via Telegram commands to the bot in the Telegram app itself. Later, the user can "claim" their wallet by logging into a web or mobile app to send transactions and export their private key from that interface. Users can also eventually revoke permissions for the bot to transact on their behalf.
* [**App-first**](/recipes/telegram-bot#app-first-setup): Users first create and interact with their wallet by logging into a web or mobile app with their Telegram account, or logging in with an alternate method and then linking their Telegram account. They can send transactions and export their private key from the app, and can also grant permissions to the bot to transact on their behalf.

Follow the guide below to learn how to build Telegram trading bots with Privy. Make sure to follow the appropriate section depending on if your app uses the **bot-first** or **app-first** setup.

## Configuring your bot

To start, we'll cover the basics of creating and setting up your Telegram bot that can send transactions.

### Creating a bot

First, create a new Telegram bot if you haven't already following the instructions below.

<Expandable title="how to create a new bot">
  <Steps>
    <Step title="Create a new bot">
      1. Create a new chat with @BotFather
      2. Create a new bot with the command `/newbot`
      3. Choose a name for your bot
      4. Choose a username for your bot
      5. Safely store your bot token. It should be in the format of, `BOT_ID:BOT_SECRET`
    </Step>

    <Step title="Set up Node.js Telegram bot server">
      1. For this example, we will use Node.js to create a bot server, and specifically use the `node-telegram-bot-api` library.
      2. Install the Telegram bot API library:

      <CodeGroup>
        ```bash npm theme={"system"}
        npm install node-telegram-bot-api
        ```

        ```bash pnpm theme={"system"}
        pnpm install node-telegram-bot-api
        ```

        ```bash yarn theme={"system"}
        yarn add node-telegram-bot-api
        ```
      </CodeGroup>

      3. Create a new file called `bot.js` and add the following code:

      <CodeGroup>
        ```ts @privy-io/node theme={"system"}
        const TelegramBot = require('node-telegram-bot-api');
        const {PrivyClient} = require('@privy-io/node');

        // replace the value below with the Telegram token you receive from @BotFather
        const token = 'YOUR_TELEGRAM_BOT_TOKEN';

        // Create a bot that uses 'polling' to fetch new updates
        const bot = new TelegramBot(token, { polling: true });

        const privy = new PrivyClient({
          appId: 'insert-app-id',
          appSecret: 'insert-app-secret'
        });
        ```

        ```ts @privy-io/server-auth theme={"system"}
        const TelegramBot = require('node-telegram-bot-api');
        const {PrivyClient} = require('@privy-io/server-auth');

        // replace the value below with the Telegram token you receive from @BotFather
        const token = 'YOUR_TELEGRAM_BOT_TOKEN';

        // Create a bot that uses 'polling' to fetch new updates
        const bot = new TelegramBot(token, { polling: true });

        const privy = new PrivyClient('insert-app-id', 'insert-app-secret');
        ```
      </CodeGroup>

      4. Your app is now ready to receive messages from Telegram!
    </Step>
  </Steps>
</Expandable>

### Setting up commands

Next, enable your users to interact with the bot via the Telegram app by configuring your bot to respond to Telegram commands. Use the bot's `onText` interface to register Telegram commands and the actions they should execute.

For example, you might register a `/createwallet` command for users to create wallets via the Telegram app, or a `/transact` command for users to be able to transact.

<Expandable title="how to set up a command">
  You can create a new command via the bot's `onText` method like so:

  <CodeGroup>
    ```ts @privy-io/node {skip-check} theme={"system"}
    bot.onText(/\/insert_command_name/, async (msg) => {
        await privy.wallets().ethereum().sendTransaction(...)
    });
    ```

    ```ts @privy-io/server-auth {skip-check} theme={"system"}
    bot.onText(/\/insert_command_name/, async (msg) => {
        await privy.walletApi.solana.sendTransaction(...)
    });
    ```
  </CodeGroup>

  As an example, you might have a `/transact` command that allows users to send transactions like so.

  <CodeGroup>
    ```ts @privy-io/node {skip-check} theme={"system"}
    bot.onText(/\/transact/, async (msg) => {
      // Custom logic to infer the transaction to send from the user's message
      const transaction = getTransactionDetailsFromMsg(msg);

      // Get the Privy user object using the user's Telegram user ID (`msg.from.id`)
      const user = await privy.users().getByTelegramUserID({
        telegram_user_id: msg.from.id
      });

      // Search the user's linked accounts for their wallet
      const wallet = user.linked_accounts.find(
        (account) => account.type === 'wallet' && 'id' in account
      );

      // Get the wallet ID from the wallet
      const walletId = wallet?.id;

      if (!walletId) throw new Error('Cannot determine wallet ID for user');

      // Send transaction
      await privy.wallets().ethereum().sendTransaction(walletId, {
        caip2: 'eip155:1',
        params: {transaction}
      });
    });
    ```

    ```ts @privy-io/server-auth {skip-check} theme={"system"}
    import type {WalletWithMetadata} from '@privy-io/server-auth';

    bot.onText(/\/transact/, async (msg) => {
      // Custom logic to infer the transaction to send from the user's message
      const transaction = getTransactionDetailsFromMsg(msg);

      // Get the Privy user object using the user's Telegram user ID (`msg.from.id`)
      const user = await privy.getUserByTelegramUserId(msg.from.id);

      // Search the user's linked accounts for their wallet
      const wallet = user?.linkedAccounts.find(
        (account): account is WalletWithMetadata =>
          account.type === 'wallet' && account.walletClientType === 'privy'
      );

      // Get the wallet ID from the wallet
      const walletId = wallet?.id;

      if (!walletId) throw new Error('Cannot determine wallet ID for user');

      // Send transaction
      await privy.walletApi.solana.sendTransaction({walletId, ...transaction});
    });
    ```
  </CodeGroup>
</Expandable>

### Associating your user's wallet ID with their Telegram user ID

In order for the Telegram bot to interact with a user's wallet, the bot must be able to determine what the user's wallet ID is.

<Expandable title="how to get the wallet ID for the Telegram user">
  Within the command, you can access the user's Telegram user ID via the message's `from.id` property. You can then use the Privy client's `getByTelegramUserID` method to get their full Privy user object, as well as their wallet ID.

  <CodeGroup>
    ```ts @privy-io/node {skip-check} theme={"system"}
    bot.onText(/\/log_wallet_id/, async (msg) => {
      // Get the Privy user object using the user's Telegram user ID (`msg.from.id`)
      const user = await privy.users().getByTelegramUserID({
        telegram_user_id: msg.from.id
      });

      // Search the user's linked accounts for their wallet
      const wallet = user.linked_accounts.find(
        (account) => account.type === 'wallet' && 'id' in account
      );

      // Get the wallet ID from the wallet
      const walletId = wallet?.id;
      console.log('Wallet ID', walletId);
    });
    ```

    ```ts @privy-io/server-auth {skip-check} theme={"system"}
    import type {WalletWithMetadata} from '@privy-io/react-auth';
    import {PrivyClient} from '@privy-io/server-auth';

    const privy = new PrivyClient('insert-app-id', 'insert-app-secret');

    bot.onText(/\/log_wallet_id/, async (msg) => {
      // Get the Privy user object using the user's Telegram user ID (`msg.from.id`)
      const user = await privy.getUserByTelegramUserId(msg.from.id);

      // Search the user's linked accounts for their wallet
      const wallet = user?.linkedAccounts.find(
        (account): account is WalletWithMetadata =>
          account.type === 'wallet' && account.walletClientType === 'privy'
      );

      // Get the wallet ID from the wallet
      const walletId = wallet?.id;
      console.log('Wallet ID', walletId);
    });
    ```
  </CodeGroup>
</Expandable>

## Bot-first setup

At a high-level, the **bot-first** setup works by creating a wallet associated with your user's Telegram handle, allowing them to transact with the wallet via commands made to your bot, and enabling users to claim their wallet or control it from a web or mobile app if desired.

Follow the steps below for more concrete guidance.

<Steps>
  <Step title="Create a wallet associated with your user">
    First, create a user in Privy and a wallet owned by that user. To allow your bot to transact on behalf of the user, create an [authorization key](/controls/authorization-keys/keys/create/key) and add it as an [additional signer](/wallets/using-wallets/signers/overview) on the wallet.

    <CodeGroup>
      ```ts @privy-io/node theme={"system"}
      bot.onText(/\/start/, async (msg) => {
        const telegramUserId = msg.from.id;
        // Create Privy user with Telegram user ID
        const privyUser = await privy.users().create({
          linked_accounts: [
            {type: 'telegram', telegram_user_id: telegramUserId}
          ]
        });

        // Create wallet with user owner and the bot as an additional signer
        const wallet = await privy.wallets().create({
          chain_type: 'ethereum',
          owner: { user_id: privyUser.id },
          additional_signers: [{ signer_id: 'insert-signer-id', override_policy_ids: [] }],
        });
      });
      ```

      ```ts @privy-io/server-auth theme={"system"}
      bot.onText(/\/start/, async (msg) => {
          const telegramUserId = msg.from.id;
          // Create Privy user with Telegram user ID
          const privyUser = await privy.importUser({
              linkedAccounts: [{
                  type: 'telegram',
                  telegramUserId
              }]
          });

          // Create wallet with user owner and the bot as an additional signer
          const wallet = await privy.walletApi.createWallet({
              chainType: 'solana',
              owner: {
                  userId: privyUser.id
              },
              additionalSigners: [{
                  signerId: 'id-of-authorization-key-from-dashboard'
              }]
          });
      });
      ```
    </CodeGroup>
  </Step>

  <Step title="Send transactions with the wallet">
    Next, allow the user to transact with commands send to the bot. You might implement a `/transact` command that takes input on the user to transact on their behalf.

    <Tip>
      Make sure to [configure your Privy client](/controls/authorization-keys/using-owners/sign) with the private key for the authorization key you created in the Dashboard.
    </Tip>

    <CodeGroup>
      ```ts @privy-io/node theme={"system"}
      bot.onText(/\/transact/, async (msg) => {
          // Custom logic to infer the transaction to send from the user's message
          const transaction = getTransactionDetailsFromMsg(msg);

          // Determine user's wallet ID from their telegram ID
          const user = await privy.users().getByTelegramUserID({
            telegram_user_id: msg.from.id
          });
          const wallet = user.linked_accounts.find(
            (account) => account.type === 'wallet' && 'id' in account
          );
          const walletId = wallet?.id;

          if (!walletId) throw new Error('Cannot determine wallet ID for user');

          // Send transaction
          await privy.wallets().ethereum().sendTransaction(walletId, {
            caip2: 'eip155:1',
            params: {transaction}
          });
      });
      ```

      ```ts @privy-io/server-auth theme={"system"}
      import type {WalletWithMetadata} from '@privy-io/server-auth';

      bot.onText(/\/transact/, async (msg) => {
          // Custom logic to infer the transaction to send from the user's message
          const transaction = getTransactionDetailsFromMsg(msg);

          // Determine user's wallet ID from their telegram ID
          const user = await privy.getUserByTelegramUserId(msg.from.id);
          const wallet = user?.linkedAccounts.find((account): account is WalletWithMetadata => (account.type === 'wallet' && account.walletClientType === 'privy'));
          const walletId = wallet?.id;

          if (!walletId) throw new Error('Cannot determine wallet ID for user');

          // Send transaction
          await privy.walletApi.solana.sendTransaction({walletId, ...transaction});
      });
      ```
    </CodeGroup>
  </Step>

  <Step title="Allow the user to claim their wallet and use it from your app">
    If you'd like users to be able to claim their wallet via a web or mobile app, configure your web app with Privy's [React SDK](/basics/react/quickstart) or your mobile app with Privy's [React Native SDK](/basics/react-native/quickstart) and enable [Telegram login](/authentication/user-authentication/login-methods/telegram).

    Then, when users login to your app via Telegram, they can [send transactions](/wallets/using-wallets/ethereum/send-a-transaction) or [export their private keys](/wallets/wallets/export).
  </Step>
</Steps>

## App-first setup

At a high-level, the **app-first** setup works by creating a wallet associated with your user when they login to your app with Telegram (or alternatively, link a Telegram account) and then adding a [signer](/wallets/using-wallets/signers/overview) to the wallet to allow the bot to transact on behalf of your user.

Follow the steps below for more concrete guidance.

<Steps>
  <Step title="Instrument your app with Privy">
    If you have not already done so, instrument your web app with Privy's [React SDK](/basics/react/quickstart) or your mobile app with Privy's [React Native SDK](/basics/react-native/quickstart) and enable [Telegram login](/authentication/user-authentication/login-methods/telegram).
  </Step>

  <Step title="Create wallets for your users">
    When your users login to your app with Telegram or link a Telegram account, [create a wallet](/wallets/wallets/create/create-a-wallet) for them. Store a mapping between the ID of the created wallet and the user's Telegram ID so that you can determine the user's wallet within the bot's code.
  </Step>

  <Step title="Add a signer to the user's wallet">
    After the wallet has been created, add a signer to the user's wallet, which the bot can use to transact on the user's behalf.

    Make sure to store the private key(s) associated with your signer ID securely in your server. Your Telegram bot or agent will need this to execute transaction requests.

    Follow the linked quickstart below to learn how to add a signer to the user's wallet.

    <CardGroup cols={1}>
      <Card title="Signer quickstart" href="/wallets/using-wallets/signers/quickstart">
        Request access to user wallets with signers.
      </Card>
    </CardGroup>
  </Step>

  <Step title="Execute actions with your signer">
    Finally, the bot can use the signer to execute transactions on the user's behalf when prompted. For instance, you might implement a `/transact` command that takes input on the user to transact on their behalf.

    <Tip>
      Make sure to [configure your Privy client](/controls/authorization-keys/using-owners/sign) with the private key for the signer (authorization key) you created in the Dashboard.
    </Tip>

    <CodeGroup>
      ```ts @privy-io/node theme={"system"}
      import {isEmbeddedWalletLinkedAccount} from '@privy-io/node';

      bot.onText(/\/transact/, async (msg) => {
          // Custom logic to infer the transaction to send from the user's message
          const transaction = getTransactionDetailsFromMsg(msg);

          // Determine user's wallet ID from their Telegram user ID
          const user = await privy.users().getByTelegramUserID({
            telegram_user_id: msg.from.id
          });
          const wallet = user.linked_accounts.find(isEmbeddedWalletLinkedAccount);
          const walletId = wallet?.id;

          if (!walletId) throw new Error('Cannot determine wallet ID for user');

          // Send transaction
          await privy.wallets().ethereum().sendTransaction(walletId, {
            caip2: 'eip155:1',
            params: {transaction}
          });
      });
      ```

      ```ts @privy-io/server-auth theme={"system"}
      bot.onText(/\/transact/, async (msg) => {
          // Custom logic to infer the transaction to send from the user's message
          const transaction = getTransactionDetailsFromMsg(msg);

          // Determine user's wallet ID from their Telegram user ID
          const user = await privy.getUserByTelegramUserId(msg.from.id);
          const wallet = user?.linkedAccounts.find((account): account is WalletWithMetadata => (account.type === 'wallet' && account.walletClientType === 'privy'));
          const walletId = wallet?.id;

          if (!walletId) throw new Error('Cannot determine wallet ID for user');

          // Send transaction
          await privy.walletApi.solana.sendTransaction({walletId, ...transaction});
      });
      ```
    </CodeGroup>

    <CardGroup cols={3}>
      <Card title="Sign requests" href="/controls/authorization-keys/using-owners/sign">
        Authorize requests to the Privy API with your signer.
      </Card>

      <Card title="EVM" href="/wallets/using-wallets/ethereum/send-a-transaction">
        Take actions on EVM chains with Privy's NodeJS SDK or REST API.
      </Card>

      <Card title="Solana" href="/wallets/using-wallets/solana/send-a-transaction">
        Take actions on Solana with Privy's NodeJS SDK or REST API.
      </Card>
    </CardGroup>
  </Step>
</Steps>
\n