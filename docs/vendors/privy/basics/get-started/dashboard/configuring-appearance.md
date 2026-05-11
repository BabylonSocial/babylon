> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Configuring appearance

**Privy's UIs are highly-customizable to seamlessly match the branding and design system of your app.**

Read below to learn how to customize several aspects of Privy, including your app's [name](#app-name), [logo](), [theme](#theme), [login ordering](#order-of-login-methods), [displayed wallet options](#external-wallet-options), and more.

<Tip>
  Looking for sample UIs in Figma? Use Privy's [Figma community
  file](https://www.figma.com/community/file/1370772828942381228/sample-privy-uis?searchSessionId=lw15kidv-kln22bn8s6),
  which contains sample UIs for progressive onboarding, authentication, and embedded wallet
  transaction flows.
</Tip>

## App name

To change the name of your application, go to the **Privy Dashboard** and select your desired app from the dropdown in the navigation bar.

Then, navigate to the **UI components** page for your app and enter your app's name (as you'd like it to be presented to your users) in the **Name** field under the Branding tab.

The **Name** you enter here will be used to identify your application for your users, throughout Privy's UIs in your app modals, emails, and SMS messages sent to users with login codes.

## Logo

To configure a logo for your application, go to the **Privy Dashboard** and select your desired app from the dropdown in the navigation bar.

Then, navigate to the **UI components** page for your app and enter a URL for your app's logo in the **Logo** field. We recommend using an asset with a 2:1 aspect ratio and with a size of 180px x 90px. SVGs are not allowed due to poor compatibility with modern email clients. The URL should end in .png.

The **Logo** you save here will be used in the upfront login modal shown to users within your app, as well as emails sent to your users with their login codes. If you'd like to use a different logo for the upfront login modal versus the login email, you can override the logo shown in the login modal via the **`config.appearance.logo`** property of the **`PrivyProvider`** component, like so:

```tsx {6} theme={"system"}
<PrivyProvider
  appId="your-privy-app-id"
  config={{
    appearance: {
      // Defaults to the logo you set in the Dashboard
      logo: 'https://your.logo.url',
      ...insertTheRestOfYourAppearanceConfig
    },
    ...insertTheRestOfYourPrivyProviderConfig
  }}
>
  {children}
</PrivyProvider>
```

You can also opt to show no logo in the login modal by passing an empty string (`''`) to **`appearance.logo`**.

## Login screen header text

To configure the header text of the Privy login modal's landing screen, set a custom `string` as the **`config.appearance.landingHeader`** property of the **`PrivyProvider`** component, like so:

```tsx {6} theme={"system"}
<PrivyProvider
  appId="your-privy-app-id"
  config={{
    appearance: {
      // Defaults to 'Log in or sign up'
      landingHeader: 'Your custom header text',
      ...insertTheRestOfYourAppearanceConfig
    },
    ...insertTheRestOfYourPrivyProviderConfig
  }}
>
  {children}
</PrivyProvider>
```

We recommend using a `string` of length 35 or less. Strings longer than the width of the login modal will be ellipsified.

If you do not set a custom header text, it will default to 'Log in or sign up'.

## Login screen message text

To configure the message text of the Privy login modal's login screen, set a custom `string` as the **`config.appearance.loginMessage`** property of the **`PrivyProvider`** component, like so:

```tsx {6} theme={"system"}
<PrivyProvider
  appId="your-privy-app-id"
  config={{
    appearance: {
      // Defaults to 'Log in or sign up'
      loginMessage: 'Your custom header text',
      ...insertTheRestOfYourAppearanceConfig
    },
    ...insertTheRestOfYourPrivyProviderConfig
  }}
>
  {children}
</PrivyProvider>
```

We recommend using a `string` of length 100 or less. Strings longer than 100 characters will be truncated.

If you do not set a custom header text, there is no default.

## Theme

To configure a theme for your application, set the **`config.appearance.theme`** property of the **`PrivyProvider`** to `'light'`, `'dark'`, or a custom color as a hexadecimal string. The **`theme`** sets the core foreground and background colors for Privy's UIs in your app.

```tsx {6} theme={"system"}
<PrivyProvider
  appId="your-privy-app-id"
  config={{
    appearance: {
      // Defaults to 'light'
      theme: 'dark',
      ...insertTheRestOfYourAppearanceConfig
    },
    ...insertTheRestOfYourPrivyProviderConfig
  }}
>
  {children}
</PrivyProvider>
```

If you set the **`theme`** to `'light'` or `'dark'`, Privy's UIs will use Privy's standard light and dark themes, respectively. You can also set Privy's theme based on the user's system preferences by following this guide.

If you set the **`theme`** to a custom hexadecimal color, the **`theme`** color will be used as the *primary background color* for Privy's UIs. All other colors will be automatically generated by modulating the luminance of the theme color you set. This creates a cohesive palette that matches your app's branding.

<Tip>
  If you set a custom hexadecimal color as your **`theme`**, **we strongly recommend choosing a color that is either light *or* dark (> 80% or \< 20% luminance, as defined by [HSL](https://en.wikipedia.org/wiki/HSL_and_HSV))**. This helps ensure there is sufficient contrast between foreground and background colors in the Privy modal.
</Tip>

If you'd like, you may also override specific colors in Privy's UI to match your brand palette.

## Order of login methods

Privy allows you to enable both web2 (email, phone, and socials) and web3 (external wallet) login methods for your app. You can customize Privy to configure how you want these login methods to appear.

<Tip>
  Though Privy provides careful defaults around ordering of login methods, you can also fully customize the ordering of login methods by using the [`loginMethodsAndOrder` override](#order-of-login-methods).

  This will allow you to fully customize the ordering of your login methods, with any overflow items (after the first four) going to a secondary page.
</Tip>

For many apps, it is preferable to display wallet (or social) logins upfront and have users click to access the rest of the options. If you'd like to default to either web2 or web3 login methods appearing in your login modal, you can do so by setting the **`config.appearance.showWalletLoginFirst`** property of the **`PrivyProvider`** like so:

```tsx {6} theme={"system"}
<PrivyProvider
  appId="your-privy-app-id"
  config={{
    appearance: {
      // Defaults to true
      showWalletLoginFirst: true,
      ...insertTheRestOfYourAppearanceConfig
    },
    ...insertTheRestOfYourPrivyProviderConfig
  }}
>
  {children}
</PrivyProvider>
```

## CSS Overrides

Beyond the configuration properties above, Privy also enables you to **explicitly override specific colors** in the login modal, to further match your product's design system and color palette. You might use these overrides if you are using a default Privy [`theme`](#theme) ('light' or 'dark') and wish to tweak a certain color, or if you set a custom [`theme`](#theme) and want to use your exact brand colors instead of the automatically-generated ones.

To explicitly override colors in your Privy modal, simply add the corresponding CSS variable for the color to the CSS [`body`](https://developer.mozilla.org/en-US/docs/Web/CSS/:root) of your app, and set it to your custom color. The possible CSS variables are listed below; we encourage you to [use your browser's developer tools](https://developer.chrome.com/docs/devtools/css/) to experiment with different color combinations to find the right one for your app!

```css  theme={"system"}
body {
  --privy-border-radius-sm: 'your-custom-value';
  --privy-border-radius-md: 'your-custom-value';
  --privy-border-radius-lg: 'your-custom-value';
  --privy-border-radius-full: 'your-custom-value';
  --privy-color-background: 'your-custom-value';
  --privy-color-background-2: 'your-custom-value';
  --privy-color-background-3: 'your-custom-value';
  --privy-color-foreground: 'your-custom-value';
  --privy-color-foreground-2: 'your-custom-value';
  --privy-color-foreground-3: 'your-custom-value';
  --privy-color-foreground-4: 'your-custom-value';
  --privy-color-foreground-accent: 'your-custom-value';
  --privy-color-accent: 'your-custom-value';
  --privy-color-accent-light: 'your-custom-value';
  --privy-color-accent-lightest: 'your-custom-value';
  --privy-color-accent-dark: 'your-custom-value';
  --privy-color-accent-darkest: 'your-custom-value';
  --privy-color-success: 'your-custom-value';
  --privy-color-error: 'your-custom-value';
  --privy-color-error-light: 'your-custom-value';
}
```
\n