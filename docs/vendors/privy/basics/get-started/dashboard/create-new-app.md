> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

Before using any Privy SDK, you'll need to create a new app in the Privy Dashboard. This will give you an **app ID** and **app secret** that you'll use to authenticate your app with Privy's APIs.

<Tip>
  We recommend creating a new app for each environment (e.g. development, staging, production) to
  keep your API credentials secure.
</Tip>

## Create an app

Login to the [Privy Dashboard](https://dashboard.privy.io) and create a new app if you haven't already.

## Get API credentials

Navigate to the[ Configuration > App settings > Basics ](https://dashboard.privy.io/apps?page=settings\&tab=basics) tab for your app.

Here you'll find your:

* **App ID**: A unique identifier for your application. It is a public value that can be safely exposed.
* **App Secret**: A secret key used to authenticate API requests. Do **not** expose it outside of your backend server.

<Warning>
  Privy does not store your app secret. Lost app secrets cannot be recovered and must be
  re-generated.
</Warning>

## Configure login methods (optional)

If you plan on using Privy for user onboarding, you'll need to configure the login methods you want to use in your app.
All client SDKs require at least one login method to be enabled - follow the steps [here](/basics/get-started/dashboard/configure-login-methods) to set up different options for your users!
\n