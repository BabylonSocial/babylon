> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Chrome extension authentication

This guide shows you how to implement Privy authentication and wallets in your Chrome extension using Privy's React SDK. Chrome extensions offer a unique application experience for your users, but come with some unique nuances specifically around social login.

## Resources

<CardGroup cols={3}>
  <Card title="Chrome Extension Starter" icon="github" href="https://github.com/privy-io/examples/tree/main/examples/privy-react-chrome-extension" arrow>
    Complete starter repository with Privy authentication and wallet management.
  </Card>
</CardGroup>

## Set up your Chrome extension project

First, create a React app and install Privy:

```bash  theme={"system"}
npm create react-app my-extension
cd my-extension
npm install @privy-io/react-auth
```

Create your `manifest.json` file in the `public` directory:

```json  theme={"system"}
{
  "manifest_version": 3,
  "name": "My Extension with Privy",
  "version": "1.0",
  "description": "Chrome extension with Privy authentication",
  "permissions": ["identity"],
  "host_permissions": ["https://auth.privy.io/*"],
  "action": {
    "default_popup": "index.html",
    "default_title": "My Extension"
  },
  "options_page": "options.html",
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; frame-ancestors 'none';"
  }
}
```

<Warning>
  The `identity` permission is required for OAuth flows, and `storage` is recommended for persisting
  user sessions.
</Warning>

### Security Guidelines

Below are comprehensive security guidelines for Chrome extensions. You can find more information in the [Chrome extension security documentation](https://developer.chrome.com/docs/extensions/develop/security-privacy/stay-secure).

<Accordion title="Security best practices">
  #### Content Security Policy

  Add a strict CSP to your manifest to prevent code injection and framing attacks. You can see our broader CSP guidance [here](/security/implementation-guide/content-security-policy).

  ```json  theme={"system"}
  {
    "content_security_policy": {
      "extension_pages": "script-src 'self'; object-src 'self'; frame-ancestors 'none';"
    }
  }
  ```

  <Warning>
    The `frame-ancestors 'none'` directive prevents your extension from being embedded in frames,
    protecting against clickjacking attacks.
  </Warning>

  #### Minimal permissions

  Only request permissions your extension actually needs. Limiting permissions reduces attack surface if compromised:

  ```json  theme={"system"}
  {
    "permissions": ["identity"],
    "host_permissions": ["https://auth.privy.io/*"]
  }
  ```

  **Cross-origin fetch() restrictions:**
  Extensions can only use `fetch()` and `XMLHttpRequest()` to access domains specified in `host_permissions`. If the extension were compromised, it would still only have permission to interact with websites that meet the match pattern. The attacker would only have limited ability to access sites not in this list.

  ```json  theme={"system"}
  {
    "host_permissions": ["https://auth.privy.io/*", "https://api.yourservice.com/*"]
  }
  ```

  <Tip>
    Remove unused permissions like `tabs`, `activeTab`, or broad host permissions to reduce your
    extension's attack surface and improve user trust.
  </Tip>

  #### Externally connectable

  Restrict which external extensions and web pages can communicate with your extension:

  ```json  theme={"system"}
  {
    "externally_connectable": {
      "ids": ["allowedextensionidheredata"],
      "matches": ["https://yourtrustedsite.com/*"],
      "accepts_tls_channel_id": false
    }
  }
  ```

  <Warning>
    Only include trusted sources in `externally_connectable`. This prevents malicious sites from
    communicating with your extension.
  </Warning>

  #### Web-accessible resources

  Minimize web-accessible resources as they make your extension detectable and create attack vectors:

  ```json  theme={"system"}
  {
    "web_accessible_resources": [
      {
        "resources": ["images/icon.png"],
        "matches": ["https://yourtrustedsite.com/*"]
      }
    ]
  }
  ```

  <Tip>
    Keep web-accessible resources to a minimum. Each exposed resource increases potential attack
    surface.
  </Tip>

  #### Secure DOM manipulation

  Avoid `document.write()` and `innerHTML` which can lead to script injection:

  #### Validate all inputs

  Always validate and sanitize inputs, especially from content scripts:

  ```javascript  theme={"system"}
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Validate sender is from your extension
    if (sender.id !== chrome.runtime.id) return;

    // Validate and sanitize request data
    if (request.action === 'updateUser' && typeof request.userData === 'object') {
      // Process validated data
      updateUser(request.userData);
    }
  });
  ```

  <Info>
    Content scripts can be compromised by malicious websites, so treat all messages from content
    scripts as potentially malicious.
  </Info>
</Accordion>

***

## Configure your Privy dashboard

<Info>
  You'll get your extension ID after loading the extension in Chrome's developer mode at
  `chrome://extensions/`.
</Info>

In the [Privy dashboard](https://dashboard.privy.io/apps?setting=domains\&page=settings), configure OAuth settings for your extension:

**1. Add allowed origins**

Go to **App Settings > Domains** and add:

```
chrome-extension://<your-extension-id>
```

**2. (Optional) Configure redirect URLs**

<Tip>Use `chrome.identity.getRedirectURL()` to get the exact redirect URL programmatically.</Tip>

If your extension uses social login, you'll need to configure redirect URLs.

In your allowed domains, add the following redirect URL, and additionally in your [allowed redirect URLs](https://dashboard.privy.io/apps?setting=advanced\&page=settings)

```
https://<your-extension-id>.chromiumapp.org/
```

***

## Enabling social login in your extension

Chrome extensions can't handle social OAuth flows directly in the popup due to security restrictions. **Social login requires opening either the options page or a popup window.** This provides the full browser context needed for OAuth redirects.

Both approaches follow the same flow:

1. User clicks "Sign in with social" in extension
2. Open authentication context (options page or popup window)
3. Privy handles the OAuth flow
4. User is redirected back to the extension authenticated

<Steps>
  <Step title="User initiates social login">
    ### Approach 1: Options page

    **Setup:** Add to your manifest:

    ```json  theme={"system"}
    {"options_page": "options.html"}
    ```

    **Implementation:**

    ```tsx  theme={"system"}
    // In your popup component
    const openOptionsForLogin = () => {
      chrome.tabs.create({
        url: chrome.runtime.getURL('options.html')
      });
    };
    ```

    ### Approach 2: Popup window

    **Implementation:**

    ```tsx  theme={"system"}
    // In your popup component
    const openAuthWindow = () => {
      chrome.windows.create({
        url: chrome.runtime.getURL('auth.html'),
        type: 'popup',
        width: 400,
        height: 600
      });
    };
    ```
  </Step>

  <Step title="Open authentication context (options page or popup window)">
    Both approaches use the same authentication logic:

    <Tip>
      You can use the same `AuthComponent` for both approaches - just render it in different HTML files
      (options.html or auth.html).
    </Tip>

    ```tsx  theme={"system"}
    // src/auth/AuthComponent.tsx
    import {PrivyProvider, usePrivy, useLogin} from '@privy-io/react-auth';
    import {useEffect} from 'react';

    const AuthContent = () => {
      const {authenticated, ready} = usePrivy();
      const {login} = useLogin({
        onComplete: () => {
          // Open the extension popup after authentication
          chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
              // Open the extension popup
              chrome.action.openPopup();
            }
          });
        }
      });

      // Auto-trigger login when opened for authentication
      useEffect(() => {
        if (ready && !authenticated) {
          login();
        }
      }, [authenticated, ready]);

      return null;
    };

    export const AuthComponent = () => (
      <PrivyProvider
        appId="<INSERT_YOUR_APP_ID_HERE>"
        config={{
          appearance: {
            loginMethods: ['google', 'apple', 'email', 'sms', 'twitter']
          }
        }}
      >
        <AuthContent />
      </PrivyProvider>
    );
    ```
  </Step>

  <Step title="Redirect back to the extension">
    Redirect the user back to the extension after authentication.

    ```tsx  theme={"system"}
        onComplete: () => {
          // Open the extension popup after authentication
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
              // Open the extension popup
              chrome.action.openPopup();
            }
          });
        },
    ```
  </Step>
</Steps>

***

## That's it! 🎉

You've now implemented Privy authentication in your Chrome extension.

***

## Production considerations

Before publishing to the Chrome Web Store:

1. **Remove unnecessary permissions** from manifest
2. **Limit host permissions** to only required domains
3. **Minimize web-accessible resources** to reduce attack surface
4. **Implement strict CSP** with `frame-ancestors 'none'`
5. **Validate all inputs** from content scripts and external sources
6. **Update OAuth configuration** with production URLs in Privy dashboard
7. **Review externally connectable** settings for trusted domains only

<Tip>
  Chrome extensions with OAuth require Google's review. Document your authentication flow and
  privacy practices clearly in your Web Store listing. Follow the [Chrome Web Store security best
  practices](https://developer.chrome.com/docs/extensions/develop/security-privacy/stay-secure) for
  faster approval.
</Tip>
\n