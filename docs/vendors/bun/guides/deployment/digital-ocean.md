> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Deploy a Bun application on DigitalOcean

[DigitalOcean](https://www.digitalocean.com/) is a cloud platform that provides a range of services for building and deploying applications.

In this guide, we will deploy a Bun HTTP server to DigitalOcean using a `Dockerfile`.

<Note>
  Before continuing, make sure you have:

  * A Bun application ready for deployment
  * A [DigitalOcean account](https://www.digitalocean.com/)
  * [DigitalOcean CLI](https://docs.digitalocean.com/reference/doctl/how-to/install/#step-1-install-doctl) installed and configured
  * [Docker](https://docs.docker.com/get-started/get-docker/) installed and added to your `PATH`
</Note>

***

<Steps>
  <Step title="Create a new DigitalOcean Container Registry">
    Create a new Container Registry to store the Docker image.

    <Tabs>
      <Tab title="Through the DigitalOcean dashboard">
        In the DigitalOcean dashboard, go to [**Container Registry**](https://cloud.digitalocean.com/registry), and enter the details for the new registry.

        <Frame>
                    <img src="https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-7.png?fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=76ad48c8c2e29367ba96be65bd4c5d75" alt="DigitalOcean registry dashboard" data-og-width="5552" width="5552" data-og-height="2856" height="2856" data-path="images/guides/digitalocean-7.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-7.png?w=280&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=2d50bf6c92c4d14099dad4c5964ae069 280w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-7.png?w=560&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=f86f9e3c127de1ab43f8e95194d90029 560w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-7.png?w=840&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=7817d422bd320d839a09fe3dc45f7fef 840w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-7.png?w=1100&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=3a44c879ba5f8acead299abea0cccf85 1100w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-7.png?w=1650&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=ac07fb366e9499c68516f7c316b80363 1650w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-7.png?w=2500&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=020d245bf6ed61f318639e7ba2c1bc85 2500w" />
        </Frame>

        Make sure the details are correct, then click **Create Registry**.
      </Tab>

      <Tab title="Through the DigitalOcean CLI">
        ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
        doctl registry create bun-digitalocean-demo
        ```

        ```txt  theme={"theme":{"light":"github-light","dark":"dracula"}}
        Name                     Endpoint                                           Region slug
        bun-digitalocean-demo    registry.digitalocean.com/bun-digitalocean-demo    sfo2
        ```
      </Tab>
    </Tabs>

    You should see the new registry in the [**DigitalOcean registry dashboard**](https://cloud.digitalocean.com/registry):

    <Frame>
            <img src="https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-1.png?fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=e4a3dd728868d106a62ec6d4268a508b" alt="DigitalOcean registry dashboard" data-og-width="2636" width="2636" data-og-height="1414" height="1414" data-path="images/guides/digitalocean-1.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-1.png?w=280&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=cc5388db2eda9b7fb2c2a0f76edd296b 280w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-1.png?w=560&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=6ff10221098b5980fc6c103ed023ee69 560w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-1.png?w=840&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=903064b4a07e961c26754ed0a3f2c294 840w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-1.png?w=1100&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=a9197eb37047b47393c4bae7e6695091 1100w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-1.png?w=1650&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=47651c0f96748a5d235eb176b5f4d677 1650w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-1.png?w=2500&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=66b961845357efc825476cbaaddb5d48 2500w" />
    </Frame>
  </Step>

  <Step title="Create a new Dockerfile">
    Make sure you're in the directory containing your project, then create a new `Dockerfile` in the root of your project. This file contains the instructions to initialize the container, copy your local project files into it, install dependencies, and start the application.

    ```docker Dockerfile icon="docker" theme={"theme":{"light":"github-light","dark":"dracula"}}
    # Use the official Bun image to run the application
    FROM oven/bun:debian

    # Set the work directory to `/app`
    WORKDIR /app

    # Copy the package.json and bun.lock into the container
    COPY package.json bun.lock ./

    # Install the dependencies
    RUN bun install --production --frozen-lockfile

    # Copy the rest of the application into the container
    COPY . .

    # Expose the port (DigitalOcean will set PORT env var)
    EXPOSE 8080

    # Run the application
    CMD ["bun", "index.ts"]
    ```

    <Note>
      Make sure that the start command corresponds to your application's entry point. This can also be `CMD ["bun", "run", "start"]` if you have a start script in your `package.json`.

      This image installs dependencies and runs your app with Bun inside a container. If your app doesn't have dependencies, you can omit the `RUN bun install --production --frozen-lockfile` line.
    </Note>

    Create a new `.dockerignore` file in the root of your project. This file contains the files and directories that should be *excluded* from the container image, such as `node_modules`. This makes your builds faster and smaller:

    ```docker .dockerignore icon="Docker" theme={"theme":{"light":"github-light","dark":"dracula"}}
    node_modules
    Dockerfile*
    .dockerignore
    .git
    .gitignore
    README.md
    LICENSE
    .vscode
    .env
    # Any other files or directories you want to exclude
    ```
  </Step>

  <Step title="Authenticate Docker with DigitalOcean registry">
    Before building and pushing the Docker image, authenticate Docker with the DigitalOcean Container Registry:

    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    doctl registry login
    ```

    ```txt  theme={"theme":{"light":"github-light","dark":"dracula"}}
    Successfully authenticated with registry.digitalocean.com
    ```

    <Note>
      This command authenticates Docker with DigitalOcean's registry using your DigitalOcean credentials. Without this step, the build and push command will fail with a 401 authentication error.
    </Note>
  </Step>

  <Step title="Build and push the Docker image to the DigitalOcean registry">
    Make sure you're in the directory containing your `Dockerfile`, then build and push the Docker image to the DigitalOcean registry in one command:

    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    docker buildx build --platform=linux/amd64 -t registry.digitalocean.com/bun-digitalocean-demo/bun-digitalocean-demo:latest --push .
    ```

    <Note>
      If you're building on an ARM Mac (M1/M2), you must use `docker buildx` with `--platform=linux/amd64` to ensure compatibility with DigitalOcean's infrastructure. Using `docker build` without the platform flag will create an ARM64 image that won't run on DigitalOcean.
    </Note>

    Once the image is pushed, you should see it in the [**DigitalOcean registry dashboard**](https://cloud.digitalocean.com/registry):

    <Frame>
            <img src="https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-2.png?fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=f60f8f2d8b6c60c319267693b89298da" alt="DigitalOcean registry dashboard" data-og-width="2636" width="2636" data-og-height="1414" height="1414" data-path="images/guides/digitalocean-2.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-2.png?w=280&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=862c1b67054a4a3efbb0a9d8ae26a498 280w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-2.png?w=560&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=da9a4634b026017fc46447b369a19f99 560w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-2.png?w=840&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=98ae1da8904194ce3c52937e6235fe7c 840w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-2.png?w=1100&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=454c4066d7333c671cbc9a398f38a255 1100w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-2.png?w=1650&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=0250a9f1fd7f2f0a72f01128ce359bca 1650w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-2.png?w=2500&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=44691a1cc9c0878b50ee215ab4f8a6d5 2500w" />
    </Frame>
  </Step>

  <Step title="Create a new DigitalOcean App Platform project">
    In the DigitalOcean dashboard, go to [**App Platform**](https://cloud.digitalocean.com/apps) > **Create App**. We can create a project directly from the container image.

    <Frame>
            <img src="https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-3.png?fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=b5cec0c6e18eaa1ca0f664bbd8edbbea" alt="DigitalOcean App Platform project dashboard" data-og-width="5272" width="5272" data-og-height="2828" height="2828" data-path="images/guides/digitalocean-3.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-3.png?w=280&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=9a0525f7863013b2903a305d3fd2e8a1 280w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-3.png?w=560&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=96b84796e197fe1c282276fbdaeeb065 560w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-3.png?w=840&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=62e154160ee7542f4cf2f80e8f53c983 840w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-3.png?w=1100&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=317610f78b3b00a91e103f295882211a 1100w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-3.png?w=1650&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=7e6783cc8b4622e14d5382e7ef3b3497 1650w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-3.png?w=2500&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=2f90c9cad5f099708ffacf71b55d55bc 2500w" />
    </Frame>

    Make sure the details are correct, then click **Next**.

    <Frame>
            <img src="https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-4.png?fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=abec52c09a5fc79c1202000634d2f558" alt="DigitalOcean App Platform service dashboard" data-og-width="5272" width="5272" data-og-height="2828" height="2828" data-path="images/guides/digitalocean-4.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-4.png?w=280&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=fab80cdae4dbad58eb9cbe56be6ed88f 280w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-4.png?w=560&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=41a86d18f076ad2fb2faa1b9748f4765 560w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-4.png?w=840&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=716341b0e5bf296819e0b400d6e62670 840w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-4.png?w=1100&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=ef22737553d289f061374ba7d1600422 1100w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-4.png?w=1650&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=f4b04bb7254e5e3534947791b20090a8 1650w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-4.png?w=2500&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=d032119e65e0c21e69b4717db1f0ce95 2500w" />
    </Frame>

    Review and configure resource settings, then click **Create app**.

    <Frame>
            <img src="https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-6.png?fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=f14ad53fb062419b9970bb3b1d970e43" alt="DigitalOcean App Platform service dashboard" data-og-width="5036" width="5036" data-og-height="2688" height="2688" data-path="images/guides/digitalocean-6.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-6.png?w=280&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=adca27a6e469312b762ba014123d0182 280w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-6.png?w=560&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=f759a11619c6ca414590af00292e88d4 560w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-6.png?w=840&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=debb071a49c1f0ead8de2b7250ca3435 840w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-6.png?w=1100&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=2a957db16fdd06cc3ae8c43545eab886 1100w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-6.png?w=1650&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=4ee794d2504b63e16c410bd1d48b329e 1650w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-6.png?w=2500&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=2b095223b3bac5db5d37b0532c02b7b1 2500w" />
    </Frame>
  </Step>

  <Step title="Visit your live application">
    🥳 Your app is now live! Once the app is created, you should see it in the App Platform dashboard with the public URL.

    <Frame>
            <img src="https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-5.png?fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=155602e07d2a55d62fc2c1ccf01a3903" alt="DigitalOcean App Platform app dashboard" data-og-width="5036" width="5036" data-og-height="2688" height="2688" data-path="images/guides/digitalocean-5.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-5.png?w=280&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=cb08825444bd33300dfa03a9d17011d0 280w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-5.png?w=560&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=8fc3f29014c4783083be8b36f065058e 560w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-5.png?w=840&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=ec468abadee2a0c4dc0f6445f33058e2 840w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-5.png?w=1100&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=0ebe95291e367125ec62d2530c8eb0ba 1100w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-5.png?w=1650&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=f46959e3d5e6eed4dc1c4a21912dea8c 1650w, https://mintcdn.com/bun-1dd33a4e/TVJ0wXBZobUdB01H/images/guides/digitalocean-5.png?w=2500&fit=max&auto=format&n=TVJ0wXBZobUdB01H&q=85&s=21948e30cf8c83ec2136e79fd3cba6a2 2500w" />
    </Frame>
  </Step>
</Steps>
