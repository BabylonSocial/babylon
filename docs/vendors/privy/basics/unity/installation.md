> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

## Supported Platforms

* ✅ MacOS / iOS
* ✅ Android
* ✅ WebGL
* ❌ Windows
* ❌ Linux

## Installation

Privy's Unity SDK is distributed as a `.unitypackage` file, and is not yet available in Unity's package manager. To import the SDK:

1. Download the latest `.unitypackage` file [here](https://drive.google.com/drive/folders/1Aw9TCxLYM3Tc6wJx0iTJXPzj-UJzwApQ)
2. Open your project in the Unity editor
3. Select Assets → Import Package → Custom Package:

<img src="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/unity-setup/installing-unity-package.png?fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=d29e1741ee670461de779ba8bbc32365" alt="installing-unity-package" data-og-width="848" width="848" data-og-height="646" height="646" data-path="images/unity-setup/installing-unity-package.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/unity-setup/installing-unity-package.png?w=280&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=ed6ff203b565bf77bcae8bd40f1dac23 280w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/unity-setup/installing-unity-package.png?w=560&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=d7dd52119d1bc2c9bd460f0e246e916a 560w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/unity-setup/installing-unity-package.png?w=840&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=5650250caaefa7ed559b2498dbec10d2 840w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/unity-setup/installing-unity-package.png?w=1100&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=d28ad976838ad8f9b4a6a64a443c1a55 1100w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/unity-setup/installing-unity-package.png?w=1650&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=8a4af24e9250283fa7ab7d8efae4a383 1650w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/unity-setup/installing-unity-package.png?w=2500&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=bb6ffc1a03c79e741f7821884a1735ed 2500w" />

4. Confirm the import of the custom package. A window will pop up listing all the assets included in the package; click **Import** to add all the assets to your project.

<Note>
  Privy's Unity package includes dependencies such as `Newtonsoft.Json` and `unity-webview`. If your
  project already includes these packages, the Unity Editor should automatically detect them and
  uncheck them by default. However, if this doesn't happen, you should manually deselect these
  packages during the import process to avoid potential duplicate instances, which could lead to
  errors.
</Note>

## Using the Privy Namespace

All Privy classes in Unity live in the `Privy` namespace. At the top of each file that uses Privy, you must add the `using Privy` directive:

```csharp  theme={"system"}
using Privy;
```

## WebGL Setup

Privy's Unity SDK leverages an iframe to [secure the key material]() for a user's embedded wallet. Given the use of an iframe, we recommend testing builds with Privy's Unity SDK in the **browser**, or on a **non-WebGL platform** in the Unity editor.

<Tip>
  Watch this [demo](https://www.loom.com/share/0bac8322368c44059dff51e2dfc548e8) of setting up the
  Privy SDK in a Unity Project!
</Tip>

To configure settings for your WebGL build to work with Privy, go to your **Project Settings** in the Unity editor. Next, select **Player** and navigate to **WebGL**. Set the following values:

* In **Resolution and Presentation**, select `unity-webview`, or `unity-webview-2020` as the template if you are using a Unity editor version newer than 2020.

<img src="https://mintcdn.com/privy-c2af3412/Ih_Fo3QYM486gzWq/images/unity-setup/webview-template.png?fit=max&auto=format&n=Ih_Fo3QYM486gzWq&q=85&s=0b6d2f19f9457b42eca83ff790b483bb" alt="webview-template" data-og-width="670" width="670" data-og-height="478" height="478" data-path="images/unity-setup/webview-template.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/Ih_Fo3QYM486gzWq/images/unity-setup/webview-template.png?w=280&fit=max&auto=format&n=Ih_Fo3QYM486gzWq&q=85&s=570f0047d759f98b65f1d3fb9db76e72 280w, https://mintcdn.com/privy-c2af3412/Ih_Fo3QYM486gzWq/images/unity-setup/webview-template.png?w=560&fit=max&auto=format&n=Ih_Fo3QYM486gzWq&q=85&s=ddbfeed8b9031b6e242f4a8179d17d97 560w, https://mintcdn.com/privy-c2af3412/Ih_Fo3QYM486gzWq/images/unity-setup/webview-template.png?w=840&fit=max&auto=format&n=Ih_Fo3QYM486gzWq&q=85&s=193a95bab34a6a887018a252a745dc83 840w, https://mintcdn.com/privy-c2af3412/Ih_Fo3QYM486gzWq/images/unity-setup/webview-template.png?w=1100&fit=max&auto=format&n=Ih_Fo3QYM486gzWq&q=85&s=5ed6042f62af8a245920abfd55fd859b 1100w, https://mintcdn.com/privy-c2af3412/Ih_Fo3QYM486gzWq/images/unity-setup/webview-template.png?w=1650&fit=max&auto=format&n=Ih_Fo3QYM486gzWq&q=85&s=95e742717889a66af1171a74a09b187c 1650w, https://mintcdn.com/privy-c2af3412/Ih_Fo3QYM486gzWq/images/unity-setup/webview-template.png?w=2500&fit=max&auto=format&n=Ih_Fo3QYM486gzWq&q=85&s=116cd3e2283529e7ef65f8ed55c9e1f1 2500w" />

* In **Other Settings/Optimization**, **managed stripping level** to **minimal**

<img src="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/unity-setup/webview-stripping-settings.png?fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=96b832009a26bc0408c7b526f793561a" alt="webview-stripping-settings" data-og-width="1256" width="1256" data-og-height="240" height="240" data-path="images/unity-setup/webview-stripping-settings.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/unity-setup/webview-stripping-settings.png?w=280&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=1c88cc7c7f80a744aa67ead7902cd588 280w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/unity-setup/webview-stripping-settings.png?w=560&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=394550f6e4f08157d8457f90a3bab1e0 560w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/unity-setup/webview-stripping-settings.png?w=840&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=4efdccace21e9212cd16749818757966 840w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/unity-setup/webview-stripping-settings.png?w=1100&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=6868aae579c673d68960d8b960e6f7c4 1100w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/unity-setup/webview-stripping-settings.png?w=1650&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=ad495e6a528b45a6196f92c2877c1ad3 1650w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/unity-setup/webview-stripping-settings.png?w=2500&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=66e7977c57955d67fd4c52616b521649 2500w" />

<Note>
  The following versions of the Unity editor are not supported, due to [this
  bug](https://issuetracker.unity3d.com/issues/webgl-cross-origin-embedder-policy-require-corp-http-header-is-included-when-multithreading-is-off):
  `2022.3.20f1`, `2022.3.40f1`, `2023.2.12f1`, `6000.0.0b11`.
</Note>
\n