> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Customize your application

Use the **Configuration > UI components** page of the dashboard to configure your app's brand settings, including name, logo, accent color, and legal policies.

## Name

Use the **Name** input to set a name for your product as you'd like to present it to users. Privy will use this value to reference your product in OTP messages sent to users for login and various UIs throughout your app.

## Logo

Use the **Logo** input to set a logo for your product. Provide the URL to a hosted image. We recommend a 2:1 aspect ratio with a size of 180px by 90px for best results. Please note that SVGs are not allowed, as they are incompatible with many major email clients.

Privy will use this logo in two places:

* in OTP emails sent to your users for passwordless email login
* in the Privy modal shown to users when they login to your app

If you'd like to remove the logo from the Privy modal or set a different logo instead, you can customize the logo via the SDK directly. You should still set a logo in the dashboard for use in OTP emails.

## Brand color

Use the **Brand color** input to set an accent color for your application. Provide the color as a hexadecimal string. This will apply to links and buttons within Privy's UIs in your app.

## Legal

### Terms & conditions

Use the **Terms & conditions** input to set the terms & conditions for your app. Please provide a hosted URL to a publicly viewable site.

If set, users will be shown your terms & conditions as part of their login flow.

### Privacy policy

Use the **Privacy policy** input to set the privacy policy for your app. Please provide a hosted URL to a publicly viewable site.

If set, users will be shown your privacy policy as part of their login flow.

### Affirmative consent

If your app requires affirmative consent for your users for your terms & conditions and privacy policy, enable the **Require affirmative consent** option.

If enabled, users will be prompted for affirmative consent on your legal policies as part of their first login to your app. If disabled, users will be shown your legal policies without an explicit prompt.
\n