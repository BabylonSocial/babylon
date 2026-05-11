> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Create a Discord bot

Discord.js works out of the box with Bun. Let's write a simple bot. First create a directory and initialize it with `bun init`.

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
mkdir my-bot
cd my-bot
bun init
```

***

Now install Discord.js.

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun add discord.js
```

***

Before we go further, we need to go to the [Discord developer portal](https://discord.com/developers/applications), login/signup, create a new *Application*, then create a new *Bot* within that application. Follow the [official guide](https://discordjs.guide/legacy/preparations/app-setup#creating-your-bot) for step-by-step instructions.

***

Once complete, you'll be presented with your bot's *private key*. Let's add this to a file called `.env.local`. Bun automatically reads this file and loads it into `process.env`.

<Note>This is an example token that has already been invalidated.</Note>

```ini .env.local icon="settings" theme={"theme":{"light":"github-light","dark":"dracula"}}
DISCORD_TOKEN=NzkyNzE1NDU0MTk2MDg4ODQy.X-hvzA.Ovy4MCQywSkoMRRclStW4xAYK7I
```

***

Be sure to add `.env.local` to your `.gitignore`! It is dangerous to check your bot's private key into version control.

```txt .gitignore icon="file-code" theme={"theme":{"light":"github-light","dark":"dracula"}}
node_modules
.env.local
```

***

Now let's actually write our bot in a new file called `bot.ts`.

```ts bot.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
// import discord.js
import { Client, Events, GatewayIntentBits } from "discord.js";

// create a new Client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// listen for the client to be ready
client.once(Events.ClientReady, c => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

// login with the token from .env.local
client.login(process.env.DISCORD_TOKEN);
```

***

Now we can run our bot with `bun run`. It may take a several seconds for the client to initialize the first time you run the file.

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun run bot.ts
```

```txt  theme={"theme":{"light":"github-light","dark":"dracula"}}
Ready! Logged in as my-bot#1234
```

***

You're up and running with a bare-bones Discord.js bot! This is a basic guide to setting up your bot with Bun; we recommend the [official discord.js docs](https://discordjs.guide/) for complete information on the `discord.js` API.
