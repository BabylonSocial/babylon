> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Build an app with Next.js and Bun

[Next.js](https://nextjs.org/) is a React framework for building full-stack web applications. It supports server-side rendering, static site generation, API routes, and more. Bun provides fast package installation and can run Next.js development and production servers.

***

<Steps>
  <Step title="Create a new Next.js app">
    Use the interactive CLI to create a new Next.js app. This will scaffold a new Next.js project and automatically install dependencies.

    ```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun create next-app@latest my-bun-app
    ```
  </Step>

  <Step title="Start the dev server">
    Change to the project directory and run the dev server with Bun.

    ```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    cd my-bun-app
    bun --bun run dev
    ```

    This starts the Next.js dev server with Bun's runtime.

    Open [`http://localhost:3000`](http://localhost:3000) with your browser to see the result. Any changes you make to `app/page.tsx` will be hot-reloaded in the browser.
  </Step>

  <Step title="Update scripts in package.json">
    Modify the scripts field in your `package.json` by prefixing the Next.js CLI commands with `bun --bun`. This ensures that Bun executes the Next.js CLI for common tasks like `dev`, `build`, and `start`.

    ```json package.json icon="file-json" theme={"theme":{"light":"github-light","dark":"dracula"}}
    {
      "scripts": {
        "dev": "bun --bun next dev", // [!code ++]
        "build": "bun --bun next build", // [!code ++]
        "start": "bun --bun next start", // [!code ++]
      }
    }
    ```
  </Step>
</Steps>

***

## Hosting

Next.js applications on Bun can be deployed to various platforms.

<Columns cols={3}>
  <Card title="Vercel" href="/guides/deployment/vercel" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/vercel.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=0119630345a5bb2be83f4a3078be0839" data-og-width="24" width="24" data-og-height="24" height="24" data-path="icons/ecosystem/vercel.svg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/vercel.svg?w=280&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=558d403f7191ced79eb680a6a9c886e8 280w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/vercel.svg?w=560&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=c930549ba6b93cf10881abb59cf53688 560w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/vercel.svg?w=840&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=72519021875a8e288e76916aec80cf86 840w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/vercel.svg?w=1100&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=0443b5ff8b3e68549cf24d09d4e6f849 1100w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/vercel.svg?w=1650&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=9e1b92cb9521b194cbe4d743473b8fd3 1650w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/vercel.svg?w=2500&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=23c8b364b3c11691bc72f0715a38ffa0 2500w">
    Deploy on Vercel
  </Card>

  <Card title="Railway" href="/guides/deployment/railway" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/railway.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=4553ea0f84b066a50753461143fd2824" data-og-width="24" width="24" data-og-height="24" height="24" data-path="icons/ecosystem/railway.svg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/railway.svg?w=280&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=cd8d8aacd5f2f2efd839130a3b17bcbf 280w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/railway.svg?w=560&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=f9fc9e1b3d6a579f9c18d4ddbfbd5f7f 560w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/railway.svg?w=840&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=b57068a5eb013420e823a1a050956b81 840w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/railway.svg?w=1100&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5a2645f0e6a459ccef063d8ce5d366bd 1100w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/railway.svg?w=1650&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=247388532e03805e97803133456f39bb 1650w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/railway.svg?w=2500&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=3bbb0345be3bbef71abb718114a73654 2500w">
    Deploy on Railway
  </Card>

  <Card title="DigitalOcean" href="/guides/deployment/digital-ocean" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/digitalocean.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=76100ce98a846b41e66d11c3c0dd5a37" data-og-width="24" width="24" data-og-height="24" height="24" data-path="icons/ecosystem/digitalocean.svg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/digitalocean.svg?w=280&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=f05172448d816bf4d5a541a730dd84cd 280w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/digitalocean.svg?w=560&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=be3f886375f8a954ddfc878a3c9987f3 560w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/digitalocean.svg?w=840&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=3c5bf434379f8b1de244b61c0225cccf 840w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/digitalocean.svg?w=1100&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=ff4c79649694e0e8d5567079f4dfa4af 1100w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/digitalocean.svg?w=1650&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=c8fd92cca5737fa100a8cbe88312e722 1650w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/digitalocean.svg?w=2500&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=b630a0e5a68905fca14ed14d16a95d75 2500w">
    Deploy on DigitalOcean
  </Card>

  <Card title="AWS Lambda" href="/guides/deployment/aws-lambda" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/aws.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=2249c35058c03bf3646a117a36bb8a77" data-og-width="24" width="24" data-og-height="24" height="24" data-path="icons/ecosystem/aws.svg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/aws.svg?w=280&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=59f04e1dc2ae7a68bbfdcb42c21f70a3 280w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/aws.svg?w=560&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=7c131a955113089cd6e1da2c03832b89 560w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/aws.svg?w=840&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=ee29bf860e425db34e3d2a8dd8f1f2d7 840w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/aws.svg?w=1100&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=6942c6cc8e4dd9abe551481d474d0b4b 1100w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/aws.svg?w=1650&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=76ed53ffb325947b7ce7c811eda7f3be 1650w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/aws.svg?w=2500&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=69e3a0e0cb384d192c22bcf8e819fde0 2500w">
    Deploy on AWS Lambda
  </Card>

  <Card title="Google Cloud Run" href="/guides/deployment/google-cloud-run" icon="https://mintcdn.com/bun-1dd33a4e/cfVIaCNGtFU88Wgc/icons/ecosystem/gcp.svg?fit=max&auto=format&n=cfVIaCNGtFU88Wgc&q=85&s=a99e6cb0cfadfeb9ea3b6451de38cfd6" data-og-width="24" width="24" data-og-height="24" height="24" data-path="icons/ecosystem/gcp.svg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/cfVIaCNGtFU88Wgc/icons/ecosystem/gcp.svg?w=280&fit=max&auto=format&n=cfVIaCNGtFU88Wgc&q=85&s=a6f174aab45cb9ca3897b5778f7633b1 280w, https://mintcdn.com/bun-1dd33a4e/cfVIaCNGtFU88Wgc/icons/ecosystem/gcp.svg?w=560&fit=max&auto=format&n=cfVIaCNGtFU88Wgc&q=85&s=cfad48954d945d8d67aba73f18d2aa13 560w, https://mintcdn.com/bun-1dd33a4e/cfVIaCNGtFU88Wgc/icons/ecosystem/gcp.svg?w=840&fit=max&auto=format&n=cfVIaCNGtFU88Wgc&q=85&s=6ffa7b2f6e6c11ac40fc9a5488427774 840w, https://mintcdn.com/bun-1dd33a4e/cfVIaCNGtFU88Wgc/icons/ecosystem/gcp.svg?w=1100&fit=max&auto=format&n=cfVIaCNGtFU88Wgc&q=85&s=b6dd2138983435a4d422b71b91d0b15f 1100w, https://mintcdn.com/bun-1dd33a4e/cfVIaCNGtFU88Wgc/icons/ecosystem/gcp.svg?w=1650&fit=max&auto=format&n=cfVIaCNGtFU88Wgc&q=85&s=46ad1c3252441bd6fbc4bfb971d46f51 1650w, https://mintcdn.com/bun-1dd33a4e/cfVIaCNGtFU88Wgc/icons/ecosystem/gcp.svg?w=2500&fit=max&auto=format&n=cfVIaCNGtFU88Wgc&q=85&s=79fc209305615cfabb18fbe87e222dfb 2500w">
    Deploy on Google Cloud Run
  </Card>

  <Card title="Render" href="/guides/deployment/render" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/render.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=b7fd7095e654b99d8ef8b7eca930a2be" data-og-width="24" width="24" data-og-height="24" height="24" data-path="icons/ecosystem/render.svg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/render.svg?w=280&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=c6e2b4582098d021e0300bb4b96ec732 280w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/render.svg?w=560&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=a91ace1d58717926da57197a5ad9ea2e 560w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/render.svg?w=840&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=3ae50e53c0f2df147ea909bfef0effb6 840w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/render.svg?w=1100&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=1678f0f67ff95fccc7287923efa29609 1100w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/render.svg?w=1650&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=eccbb96422883aa345abde24de2c1425 1650w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/render.svg?w=2500&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=f1c23653ff4eaeca1c99c3075684ef9d 2500w">
    Deploy on Render
  </Card>
</Columns>

***

## Templates

<Columns cols={2}>
  <Card title="Bun + Next.js Basic Starter" img="https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-nextjs-basic.png?fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=2bc9edb73c9c49d88e8ced9e2158f75a" href="https://github.com/bun-templates/bun-nextjs-basic" arrow="true" cta="Go to template" data-og-width="2212" width="2212" data-og-height="1326" height="1326" data-path="images/templates/bun-nextjs-basic.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-nextjs-basic.png?w=280&fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=160758dc2a48557d0301e9c2fe829798 280w, https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-nextjs-basic.png?w=560&fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=0c9dcae75ad19b90177058dbae5f32af 560w, https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-nextjs-basic.png?w=840&fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=258cca0ee15886eca7311900830b6f55 840w, https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-nextjs-basic.png?w=1100&fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=cbcaa1b859dee4c29e8f66b312190d95 1100w, https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-nextjs-basic.png?w=1650&fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=e3159754a96b2df91abe8031fe28fdf3 1650w, https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-nextjs-basic.png?w=2500&fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=53b213380cf3557c76f878dea8a0dc4e 2500w">
    A simple App Router starter with Bun, Next.js, and Tailwind CSS.
  </Card>

  <Card title="Todo App with Next.js + Bun" img="https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-nextjs-todo.png?fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=e8f398caf487c6b925a53025c42f4dab" href="https://github.com/bun-templates/bun-nextjs-todo" arrow="true" cta="Go to template" data-og-width="2212" width="2212" data-og-height="1326" height="1326" data-path="images/templates/bun-nextjs-todo.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-nextjs-todo.png?w=280&fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=f6f04b64c40c8daaf8394b3c0882dcb2 280w, https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-nextjs-todo.png?w=560&fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=a01481b9ceca0962b512d9b30aed1cef 560w, https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-nextjs-todo.png?w=840&fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=72fccde7136063268cdcd85957d58a94 840w, https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-nextjs-todo.png?w=1100&fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=b028ce3baf3d39a3b80e6107d4780c36 1100w, https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-nextjs-todo.png?w=1650&fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=53e085fca400339cc39e1523b3c11528 1650w, https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-nextjs-todo.png?w=2500&fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=61fa70b5a2ac1b5035888634f053155f 2500w">
    A full-stack todo application built with Bun, Next.js, and PostgreSQL.
  </Card>
</Columns>

***

[→ See Next.js's official documentation](https://nextjs.org/docs) for more information on building and deploying Next.js applications.
