> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Single sign-on

> Configure SSO authentication for your team using Okta, Microsoft Entra ID, Google Workspace, or any SAML 2.0 provider

Single sign-on (SSO) allows your team members to access the Privy dashboard using your organization's identity provider. With SSO enabled, team members can authenticate using their existing corporate credentials, eliminating the need to manage separate login credentials for Privy.

<Info>
  SSO is available as an add-on for all plan tiers. Admins should visit the [Account / Settings
  sub-tab](https://dashboard.privy.io/account?account=settings) of the Dashboard to enable SSO.
</Info>

## How SSO works

When SSO is configured for your account, team members with email addresses from your verified domain are automatically redirected to your organization's identity provider when logging into the Privy dashboard. After successful authentication, they are redirected back to the dashboard with full access based on their assigned role.

SSO authentication integrates seamlessly with Privy's role-based access control. Learn more about [team roles](/basics/get-started/dashboard/teammate-roles).

## Supported identity providers

Privy's supports all major identity providers, including:

* **Okta**
* **Microsoft Entra ID** (formerly Azure AD)
* **Google Workspace**
* **OneLogin**
* **JumpCloud**
* **Rippling**
* And any SAML 2.0 compatible identity provider

## Prerequisites

Before setting up SSO, ensure:

* Your account has Admin access to the Privy dashboard
* Your organization has an active identity provider
* Your organization's IT team can configure SAML applications
* Your team members use email addresses from a domain you control

## Setting up SSO

### Domain verification

Domain verification ensures that only authorized members of your organization can use SSO to access your Privy account.

1. Navigate to the [Account page](https://dashboard.privy.io/account) in your dashboard
2. Click on the **Settings** sub-tab
3. In the **Single-Sign-On (SSO)** section, enter the domain you want to verify (e.g., `yourcompany.com`)
4. Add the provided TXT record to your domain's DNS configuration
5. Wait for DNS propagation (typically 15 minutes to one hour)

<Info>
  You can verify multiple domains for your account. All verified domains will use the same SSO
  configuration and identity provider.
</Info>

### Identity provider configuration

After verifying your domain, configure your identity provider to communicate with Privy:

1. On the **Settings** sub-tab, click **Configure identity provider**
2. Click **Open setup portal** to access the configuration interface
3. In the portal, select your identity provider from the list
4. Follow the provider-specific instructions to create a new SAML application
5. Copy the ACS URL and Entity ID from the portal into your identity provider's configuration
6. Download the metadata file or copy the SSO URL and certificate from your identity provider
7. Upload or paste these values in the configuration portal
8. Test the connection to ensure it's working correctly

<Tip>
  The configuration portal provides step-by-step instructions tailored to your specific identity
  provider. Follow these carefully to ensure proper configuration.
</Tip>

## Using SSO

Once SSO is configured and active, team members can sign in using SSO:

### For team members

1. Go to the [Privy dashboard login page](https://dashboard.privy.io)
2. Enter your work email address
3. You will be automatically redirected to your organization's identity provider
4. Authenticate using your corporate credentials
5. You will be redirected back to the Privy dashboard

### For admins

As an Admin, you can still access the dashboard using your original login method if needed. This ensures you can always access your account even if there are issues with the SSO configuration.

## Managing SSO

### Adding additional domains

You can add multiple domains to your SSO configuration:

1. Go to the **Settings** sub-tab on the [Account page](https://dashboard.privy.io/account)
2. Enter the new domain and press **Add**
3. Follow the domain verification process described above

All verified domains will use the same identity provider configuration.

### Removing domains

To remove a domain from your SSO configuration:

1. Navigate to the **Settings** sub-tab
2. Find the domain you want to remove
3. Click "Delete" in the domain's dropdown menu
4. Confirm the removal

<Warning>
  Removing your last verified domain will disable SSO for your account. Team members will need to
  use their original login method to access the dashboard.
</Warning>

### Updating identity provider settings

To update your identity provider configuration:

1. Navigate to the [Account page](https://dashboard.privy.io/account)
2. Click on the **Settings** sub-tab
3. In the **SSO configuration** section, click **Manage configuration**
4. Make your changes in the configuration portal
5. Test the connection to verify the changes

## Security considerations

### Automatic account provisioning

By default, automatic account provisioning is disabled. This means only team members who have been explicitly invited can log in via SSO.

To enable automatic provisioning:

1. Navigate to the [Account page](https://dashboard.privy.io/account)
2. Click on the **Settings** sub-tab
3. In the **Single-Sign-On (SSO)** section, toggle on "Enable automatic account provisioning"

When enabled, users who sign in via SSO for the first time will automatically have their team member account created. New SSO users are assigned the **Viewer** role by default. An Admin must manually update their role if they need elevated permissions.

### Session management

SSO sessions in the Privy dashboard are independent of your identity provider's sessions. Logging out of your identity provider does not automatically log you out of the Privy dashboard.

## Troubleshooting

### Domain verification fails

If domain verification is not working:

* Verify the TXT record was added correctly to your DNS configuration
* Wait longer for DNS propagation (can take up to 24 hours in some cases)
* Check for typos in the verification token
* Ensure the TXT record is added to the root domain, not a subdomain

### Users cannot sign in via SSO

If team members are having trouble signing in:

* Verify the domain is properly verified in the Privy dashboard
* Ensure the identity provider connection is marked as active
* Check that the user's email domain matches a verified domain
* Test the connection in the configuration portal
* Verify the user exists in your identity provider

### Connection not active

If your SSO connection is not showing as active:

* Complete all steps in the identity provider configuration
* Upload or enter all required SAML metadata
* Test the connection in the configuration portal

<Tip>For technical issues with SSO configuration, please [reach out](https://privy.io/slack).</Tip>

## Best practices

### Planning your rollout

* **Communicate changes**: Notify your team before enabling SSO about the new login process
* **Document backup access**: Ensure team members know how to request access if they have login issues

### Ongoing management

* **Review regularly**: Periodically review which domains are verified and ensure they're still needed
* **Monitor new users**: When new SSO users join, verify they have the appropriate role assigned
* **Keep contact information updated**: Ensure your identity provider's administrator contact information is current

### Security recommendations

* **Enable MFA at the identity provider**: Require multi-factor authentication in your identity provider for an additional security layer
* **Use the principle of least privilege**: Assign the minimum role necessary when promoting SSO users from Viewer
* **Regular access reviews**: Audit your team members and their roles periodically
\n