> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Deploy a Bun application on Render

[Render](https://render.com/) is a cloud platform that lets you flexibly build, deploy, and scale your apps.

It offers features like auto deploys from GitHub, a global CDN, private networks, automatic HTTPS setup, and managed PostgreSQL and Redis.

Render supports Bun natively. You can deploy Bun apps as web services, background workers, cron jobs, and more.

***

As an example, let's deploy a simple Express HTTP server to Render.

<Steps>
  <Step title="Step 1">
    Create a new GitHub repo named `myapp`. Git clone it locally.

    ```sh  theme={"theme":{"light":"github-light","dark":"dracula"}}
    git clone git@github.com:my-github-username/myapp.git
    cd myapp
    ```
  </Step>

  <Step title="Step 2">
    Add the Express library.

    ```sh  theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun add express
    ```
  </Step>

  <Step title="Step 3">
    Define a simple server with Express:

    ```ts app.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    import express from "express";

    const app = express();
    const port = process.env.PORT || 3001;

    app.get("/", (req, res) => {
    	res.send("Hello World!");
    });

    app.listen(port, () => {
    	console.log(`Listening on port ${port}...`);
    });
    ```
  </Step>

  <Step title="Step 4">
    Commit your changes and push to GitHub.

    ```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    git add app.ts bun.lock package.json
    git commit -m "Create simple Express app"
    git push origin main
    ```
  </Step>

  <Step title="Step 5">
    In your [Render Dashboard](https://dashboard.render.com/), click `New` > `Web Service` and connect your `myapp` repo.
  </Step>

  <Step title="Step 6">
    In the Render UI, provide the following values during web service creation:

    |                   |               |
    | ----------------- | ------------- |
    | **Runtime**       | `Node`        |
    | **Build Command** | `bun install` |
    | **Start Command** | `bun app.ts`  |
  </Step>
</Steps>

That's it! Your web service will be live at its assigned `onrender.com` URL as soon as the build finishes.

You can view the [deploy logs](https://docs.render.com/logging#logs-for-an-individual-deploy-or-job) for details. Refer to [Render's documentation](https://docs.render.com/deploys) for a complete overview of deploying on Render.
