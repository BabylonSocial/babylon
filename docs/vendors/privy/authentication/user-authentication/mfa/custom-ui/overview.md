> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Overview

Build custom MFA flows that match your app's design and user experience. Custom UIs give your app complete control over how users enroll in and verify MFA.

<Info>
  If you are using the **React** or **React Native** SDK, you can optionally use [Privy's default
  UIs](/authentication/user-authentication/mfa/default-ui) for MFA instead of building custom flows.
</Info>

## When to use custom UIs

Custom MFA UIs are appropriate when your app:

* Uses an SDK other than React or React Native (Swift, Android, Flutter, Unity)
* Requires a fully branded MFA experience that matches your app's design system
* Needs custom flows or logic around MFA enrollment and verification
* Integrates with existing authentication UIs in your app

## Getting started

Building a custom MFA experience involves three main areas:

<CardGroup cols={3}>
  <Card title="Enrollment" icon="user-plus" href="/authentication/user-authentication/mfa/enrollment/overview">
    Allow users to enroll in MFA with SMS, TOTP, or passkeys
  </Card>

  <Card title="Verification" icon="shield-check" href="/authentication/user-authentication/mfa/verify/overview">
    Guide users through completing MFA when required
  </Card>

  <Card title="MFA required listener" icon="bell" href="/authentication/user-authentication/mfa/listener">
    Know when MFA is required and trigger your custom UI
  </Card>
</CardGroup>

## Additional resources

<CardGroup cols={3}>
  <Card title="Unenrollment" icon="user-minus" href="/authentication/user-authentication/mfa/unenroll">
    Allow users to remove enrolled MFA methods
  </Card>

  <Card title="Error handling" icon="circle-exclamation" href="/authentication/user-authentication/mfa/errors">
    Handle errors during MFA flows
  </Card>

  <Card title="Default UI" icon="window" href="/authentication/user-authentication/mfa/default-ui">
    Use Privy's built-in MFA UI instead
  </Card>
</CardGroup>
\n