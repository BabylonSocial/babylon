> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Bun Redis with Upstash

[Upstash](https://upstash.com/) is a fully managed Redis database as a service. Upstash works with the Redis® API, which means you can use Bun's native Redis client to connect to your Upstash database.

<Note>TLS is enabled by default for all Upstash Redis databases.</Note>

***

<Steps>
  <Step title="Create a new project">
    Create a new project by running `bun init`:

    ```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun init bun-upstash-redis
    cd bun-upstash-redis
    ```
  </Step>

  <Step title="Create an Upstash Redis database">
    Go to the [Upstash dashboard](https://console.upstash.com/) and create a new Redis database. After completing the [getting started guide](https://upstash.com/docs/redis/overall/getstarted), you'll see your database page with connection information.

    The database page displays two connection methods; HTTP and TLS. For Bun's Redis client, you need the **TLS** connection details. This URL starts with `rediss://`.

    <Frame>
            <img src="https://mintcdn.com/bun-1dd33a4e/ONaGWxnTD93zNXCt/images/guides/upstash-1.png?fit=max&auto=format&n=ONaGWxnTD93zNXCt&q=85&s=bf927cfe3f0c675c100ae9a2af1d687c" alt="Upstash Redis database page" data-og-width="3972" width="3972" data-og-height="1024" height="1024" data-path="images/guides/upstash-1.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/ONaGWxnTD93zNXCt/images/guides/upstash-1.png?w=280&fit=max&auto=format&n=ONaGWxnTD93zNXCt&q=85&s=512af46f5b587f814914cb5ad7d79ee6 280w, https://mintcdn.com/bun-1dd33a4e/ONaGWxnTD93zNXCt/images/guides/upstash-1.png?w=560&fit=max&auto=format&n=ONaGWxnTD93zNXCt&q=85&s=40dd2f78d8f60b59f24ab5160fc265cf 560w, https://mintcdn.com/bun-1dd33a4e/ONaGWxnTD93zNXCt/images/guides/upstash-1.png?w=840&fit=max&auto=format&n=ONaGWxnTD93zNXCt&q=85&s=e4b82c4ea36c2c04effd217639cd81f7 840w, https://mintcdn.com/bun-1dd33a4e/ONaGWxnTD93zNXCt/images/guides/upstash-1.png?w=1100&fit=max&auto=format&n=ONaGWxnTD93zNXCt&q=85&s=770b433ea87e69ef8a48fbecf962bd04 1100w, https://mintcdn.com/bun-1dd33a4e/ONaGWxnTD93zNXCt/images/guides/upstash-1.png?w=1650&fit=max&auto=format&n=ONaGWxnTD93zNXCt&q=85&s=cb8a2bd1eab3106bbca0e5bbc82480f9 1650w, https://mintcdn.com/bun-1dd33a4e/ONaGWxnTD93zNXCt/images/guides/upstash-1.png?w=2500&fit=max&auto=format&n=ONaGWxnTD93zNXCt&q=85&s=65612bc443777fefb30094d32879aa4a 2500w" />
    </Frame>
  </Step>

  <Step title="Connect using Bun's Redis client">
    You can connect to Upstash by setting environment variables with Bun's default `redis` client.

    Set the `REDIS_URL` environment variable in your `.env` file using the Redis endpoint (not the REST URL):

    ```ini .env icon="settings" theme={"theme":{"light":"github-light","dark":"dracula"}}
    REDIS_URL=rediss://********@********.upstash.io:6379
    ```

    Bun's Redis client reads connection information from `REDIS_URL` by default:

    ```ts index.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    import { redis } from "bun";

    // Reads from process.env.REDIS_URL automatically
    await redis.set("counter", "0"); // [!code ++]
    ```

    Alternatively, you can create a custom client using `RedisClient`:

    ```ts index.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    import { RedisClient } from "bun";

    const redis = new RedisClient(process.env.REDIS_URL); // [!code ++]
    ```
  </Step>

  <Step title="Use the Redis client">
    You can now use the Redis client to interact with your Upstash Redis database:

    ```ts index.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    import { redis } from "bun";

    // Get a value
    let counter = await redis.get("counter");

    // Set a value if it doesn't exist
    if (!counter) {
    	await redis.set("counter", "0");
    }

    // Increment the counter
    await redis.incr("counter");

    // Get the updated value
    counter = await redis.get("counter");
    console.log(counter);
    ```

    ```txt  theme={"theme":{"light":"github-light","dark":"dracula"}}
    1
    ```

    The Redis client automatically handles connections in the background. No need to manually connect or disconnect for basic operations.
  </Step>
</Steps>
