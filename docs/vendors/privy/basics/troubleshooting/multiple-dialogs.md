> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Multiple dialogs

The Privy modal is an [HTML `<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) element that will appear in the foreground of your app when opened.

If your app makes use of dialog components (most commonly, for modals and pop-ups), you may encounter issues with the Privy dialog interfering with those from your app.

When using other non-Privy dialog elements within your app, we generally recommend:

* **Avoid UIs that involve a modal overlaying another modal.** This can be a confusing and visually jarring experience for users, especially since users can only interact with a single modal at a time.
* **Use the [`Dialog`](https://headlessui.com/react/dialog) component from [`headless-ui`](https://headlessui.com)**, as it has the best compatibility with UI components and HTML elements from third-party libraries like Privy.

## Radix UI dialogs

If your app uses the [**`Dialog`**](https://www.radix-ui.com/primitives/docs/components/dialog) component from [**Radix UI**](https://www.radix-ui.com), we suggest making the following modifications to the default [**`Dialog`**](https://www.radix-ui.com/primitives/docs/components/dialog) component:

1. Prevent the default behavior of the Radix dialog closing when the user clicks outside of it, via the [**`onPointerDownOutside`**](https://www.radix-ui.com/primitives/docs/components/dialog#content) prop of the [**`Dialog.Content`**](https://www.radix-ui.com/primitives/docs/components/dialog#content) component.
2. Prevent the default behavior of the Radix dialog always trapping the browser's focus (even if other dialogs are opened), by wrapping your[ **`Dialog.Content`**](https://www.radix-ui.com/primitives/docs/components/dialog#content) with the **`FocusScope`** component from the [**`@radix-ui/react-focus-scope`**](https://www.npmjs.com/package/@radix-ui/react-focus-scope) library. In this **`FocusScope`** component, you should set the prop **`trapped`** to `false`. See this [GitHub discussion](https://github.com/radix-ui/primitives/issues/2544) for more info!

Altogether, the modifications to a [**`Dialog`**](https://www.radix-ui.com/primitives/docs/components/dialog) component might look as follows:

```tsx  theme={"system"}

import * as Dialog from '@radix-ui/react-dialog';
import {FocusScope} from '@radix-ui/react-focus-scope';

<Dialog.Root>
  ...
  <Dialog.Portal>
    <Dialog.Overlay />
    {/* This wrapper prevents the Radix dialog from stealing focus away from other dialogs in the page. */}
    <FocusScope trapped={false}>
        {/* The `onPointerDownOutside` handler prevents Radix from closing the dialog when the user clicks outside. */}
      <Dialog.Content
        onPointerDownOutside={(e) => e.preventDefault()}
      />
        ...
      </Dialog.Content>
    </FocusScope>
  </Dialog.Portal>
<Dialog.Root>
```
\n