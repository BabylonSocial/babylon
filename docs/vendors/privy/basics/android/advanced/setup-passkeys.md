> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

## Setup passkeys for Android

To enable passkey support for your Android app, associate your app with a website that your app owns.

### 1. Get your SHA256 fingerprint

For detailed instructions on obtaining your certificate fingerprints, see [Android's official passkey documentation](https://developer.android.com/identity/passkeys/create-passkeys#verify).

Run the following command to get your app's certificate fingerprints:

```sh  theme={"system"}
keytool -list -v -keystore <path-to-your-keystore> | grep SHA256
```

The output should look like this:

```txt  theme={"system"}
Certificate fingerprints:
         SHA1: A1:B2:C3:D4:E5:F6:07:08:09:0A:1B:2C:3D:4E:5F:60:71:82:93:A4
         SHA256: 1A:2B:3C:4D:5E:6F:70:81:92:A3:B4:C5:D6:E7:F8:09:1A:2B:3C:4D:5E:6F:70:81:92:A3:B4:C5:D6:E7:F8:09
```

<Info>**Note:** You'll need the **SHA256** fingerprint (not SHA1) for the next steps.</Info>

### 2. Digital Asset Links

* Create a `JSON` file with *at least* the following content

```json  theme={"system"}
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "<package_name>",
      "sha256_cert_fingerprints": ["<sha256_cert_fingerprint>"]
    }
  }
]
```

* Make the file accessible on your website at the following path

```txt  theme={"system"}
https://<your_domain>/.well-known/assetlinks.json
```

**Make sure to use your `package_name` and `sha256_cert_fingerprint` (from step 1) in the file hosted on your website.**

For more information about generally supporting Digital Asset Links [see Google's documentation](https://developer.android.com/training/sign-in/passkeys#add-support-dal).

### 3. Dashboard

You will also need to add your `sha256_cert_fingerprint` to the allowed Android key hashes list in the `Settings` tab of the Privy dashboard.

### 4. Optional Biometric Permission

If you would like to optionally associate passkeys with biometric data, add this permission to your `AndroidManifest.xml`:

```xml  theme={"system"}
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
```
\n