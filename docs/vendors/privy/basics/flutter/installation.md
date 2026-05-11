> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

## Supported Platforms

* ✅ Android
* ✅ iOS
* ❌ Web

## Requirements

* Flutter: 3.24.0+
* Dart: 3.0.0+
* Android: API 27+ (Android 8.1 Oreo or newer) and Kotlin 2.1.0+
* iOS: 17+ and Swift Package Manager
* Xcode 16+

## Installation

### Enable Swift Package Manager

The Privy Flutter SDK uses Swift Package Manager. To enable it, run:

```bash  theme={"system"}
flutter config --enable-swift-package-manager
```

<Note>
  You'll need to either use Flutter 3.24.0 on the main channel (experimental) or Flutter 3.27.0+ on
  stable. While 3.24.0 support is available by switching to Flutter's main channel, this is not
  recommended for production apps as the main channel can be unstable.
</Note>

### Add the Dependency

1. The Privy Flutter SDK is available on pub.dev. Add it to your `pubspec.yaml` file:

```yaml  theme={"system"}
dependencies:
  flutter:
    sdk: flutter
  privy_flutter: X.Y.Z # Replace with the latest version from pub.dev
```

2. Run the following command to install the dependency:

```bash  theme={"system"}
flutter pub get
```
\n