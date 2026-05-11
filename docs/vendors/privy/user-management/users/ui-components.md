> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# UI components

<View title="React" icon="react">
  Privy provides a `UserPill` component to easily embed in your application. Users can login or connect their wallet from the user pill. Once authenticated, users can interact with the pill to quickly view their account information and use their wallets.

    <img src="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Userpill2.png?fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=0e1baa60006191c882308f8d592c2f41" alt="images/Userpill2.png" data-og-width="1540" width="1540" data-og-height="1100" height="1100" data-path="images/Userpill2.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Userpill2.png?w=280&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=ed624633c59e60d68ac4fb4f897c77a4 280w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Userpill2.png?w=560&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=2c89efa86cc50b2e770f35535009c28a 560w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Userpill2.png?w=840&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=e765c4566d86d57146b3d41d71d9c405 840w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Userpill2.png?w=1100&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=1b6130ec0ce11a7d6b7823e9bc971b98 1100w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Userpill2.png?w=1650&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=575d9ba1b43765166cdae286ed1bbefe 1650w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Userpill2.png?w=2500&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=203102d7adc3a09f18604e7f137ca1d9 2500w" />

  ## Usage

  To use the user pill component, import from the `@privy-io/react-auth` package:

  ```tsx  theme={"system"}
  import {UserPill} from '@privy-io/react-auth/ui';
  ```

  Then, embed the user pill within any component wrapped by your `PrivyProvider`:

  ```tsx {8} theme={"system"}
  import {UserPill} from '@privy-io/react-auth/ui';

  function Page() {
    return (
      <div>
        <h1>Dashboard</h1>
        ...
        <UserPill />
        ...
      </div>
    );
  }
  ```

  You can also customize the user pill by passing the props describing the desired action, label, and size for the component. See more on these props below.

  ```tsx {18-22} theme={"system"}
  import {UserPill} from '@privy-io/react-auth/ui';

  const logoImageElement = (
    <Image
      className="h-8 w-8 rounded-full"
      src="/images/logo.png"
      alt="logo placeholder"
      height={32}
      width={32}
    />
  );

  function Page() {
    return (
      <div>
        <h1>Dashboard</h1>
        ...
        <UserPill
          action={{type: 'login', options: {loginMethods: ['email']}}}
          label={logoImageElement}
          size={32}
        />
        ...
      </div>
    );
  }
  ```

  <Tip>
    The `UserPill` component relies on some base CSS styles to render properly. If you notice styling issues with the component, you can add these foundational styles to your application:

    ```css  theme={"system"}
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      border: 0 solid;
    }

    html {
      font-family: sans-serif;
      line-height: 1.15;
    }

    button {
      background-color: transparent;
    }
    ```
  </Tip>

  ## Customizing via props

  Privy allows you to easily customize the user pill within your app by passing `action`, `label`, and/or `size` props on the component.

  | Prop   | Type      | Description                                                                                  |
  | ------ | --------- | -------------------------------------------------------------------------------------------- |
  | label  | ReactNode | The component to render in the user pill. This can be an image, text, or a custom component. |
  | size   | Number    | The size (in pixels) of the pill button. Defaults to 44.                                     |
  | action | See below | The action users take from the user pill.                                                    |

  ### Action prop

  The action prop describes the action the user can take from the `UserPill` component. This prop is an object with a `type` and `options` field.

  You can set the `type` to:

  * `'connectWallet'` to guide the user to connect their wallet. If `type: 'connectWallet'` is set, you may set `options: {description?: string}` to provide a description for the wallet connection prompt.
  * `'login'` to guide the user to login to your application with any of your configured login methods. If `type: 'login'` is set, you may set `options` to an object containing `loginMethods` and/or `prefill`. The `loginMethods` field contains an array of the login methods to use in the pill and the `prefill` field contains an email address or phone number to prefill into the Privy login modal.

  Concretely, this type looks like

  ```tsx  theme={"system"}
  type Action =
    | {
        type: 'login';
        // Prompt the user to login
        options?: {
          loginMethods?: [string];
          prefill?: {
            type: 'email' | 'phone';
            value: string;
          };
        };
      }
    | {
        type: 'connectWallet';
        // Prompt the user to connect their wallet
        options?: {description?: string};
      };
  ```
</View>
\n