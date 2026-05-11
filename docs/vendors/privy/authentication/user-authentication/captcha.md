> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# CAPTCHA on login

Privy supports adding CAPTCHA to your login flow to prevent botting.

<Tip>
  Enable CAPTCHA in the [Privy
  Dashboard](https://dashboard.privy.io/apps?page=settings\&setting=advanced) before implementing
  this feature.
</Tip>

<Info>
  CAPTCHA providers load content in the browser. Your app may need to update its Content Security
  Policy to allow CAPTCHA content. See the [Content Security Policy
  guide](/security/implementation-guide/content-security-policy#optional-features) for required
  directives.
</Info>

Once CAPTCHA is enabled, import the `Captcha` component and place it as a peer to your login form: *(When this component mounts, it will execute the invisible CAPTCHA.)*

<View title="React" icon="react">
  ```tsx  theme={"system"}
  import {Captcha, useLoginWithEmail} from '@privy-io/react-auth';

  const MyLoginForm = () => {
    const [email, setEmail] = useState('');
    const {sendCode, loginWithCode} = useLoginWithEmail();

    const handleSendCode = async () => {
      try {
        await sendCode(email);
      } catch (err) {
        // Captcha failures due to timeout or otherwise will show up here
        // in addition to possible network errors from the sendCode request
        //
        // The `sendCode` method from `useLoginWithSms` and `initOAuth` method
        // from `useLoginWithOAuth` work exactly the same way.
      }
    };

    return (
      <>
        <input type="text" onChange={(e) => setEmail(e.target.value)} />
        <button onClick={handleSendCode}>Send Code</button>
        <Captcha />
      </>
    );
  };
  ```
</View>

**That's it! Whenever a user tries to log into your app, Privy will pre-validate the attempt with an invisible CAPTCHA.** 🎉

## Captcha providers

<Info>hCaptcha is supported by the React SDK starting in version `react-auth@3.9.0`.</Info>

Privy supports [hCaptcha](https://www.hcaptcha.com/) and Cloudflare's [Turnstile](https://www.cloudflare.com/products/turnstile/) as CAPTCHA providers. Both providers enable invisible CAPTCHA verification during login.

### hCaptcha risk tolerance

When using hCaptcha, your app can configure a risk tolerance level in the [Privy Dashboard](https://dashboard.privy.io/apps?page=settings\&setting=advanced). This setting determines how strictly Privy blocks suspected bot behavior. By default, Privy uses a balanced setting that only blocks traffic above a mid-range [risk score](https://docs.hcaptcha.com/ent_overview/#real-time-risk-scoring).
\n