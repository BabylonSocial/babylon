> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

To keep your Privy app secure, Privy supports role based access control so you can limit different teammate's access permissions in the Dashboard. There are three teammate roles with different levels of access to your dashboard and account settings. Each role provides specific permissions designed to support different responsibilities within your organization.

## Role overview

| Role          | Access Level  | Primary Use Case                                                                               |
| ------------- | ------------- | ---------------------------------------------------------------------------------------------- |
| **Admin**     | Full access   | Team leads, account owners, and senior developers who need complete control                    |
| **Developer** | Most features | Developers who need to build and configure applications                                        |
| **Viewer**    | Read-only     | Stakeholders, support engineers, and teammates who need visibility without editing permissions |

## Detailed permissions

### Admin

Admins have full access to the dashboard and can manage all aspects of your Privy account.

**Team management:**

* Invite new teammates
* Manage teammate roles and permissions
* Remove teammates from the account

**Account management:**

* Update account payment methods
* Change billing tiers and subscription settings

**Security controls:**

* Create and delete app secrets
* Configure JWT authentication settings
* Rotate webhook verification keys
* Delete applications permanently

### Developer

Developers can view, create, and edit most dashboard features but cannot manage team settings or billing.

**Application development:**

* Create new applications
* Configure login methods and authentication
* Set up wallets and blockchain integrations
* Configure webhooks and API settings

**Limited access:**

* **Cannot** manage team roles or invite teammates
* **Cannot** update payment methods or billing settings
* **Cannot** delete applications
* **Cannot** create or delete app secrets
* **Cannot** configure JWT authentication settings
* **Cannot** rotate webhook verification keys

### Viewer

Viewers have read-only access to the dashboard for monitoring and visibility purposes.

**Read-only access:**

* View all applications and their configurations
* Access analytics and user data

**No editing permissions:**

* **Cannot** create, edit, or delete any configurations
* **Cannot** invite teammates or manage roles
* **Cannot** update billing or payment information

## Managing team roles

<Info>Only Admins can invite new teammates and assign roles.</Info>

### Inviting teammates

1. Navigate to the [Account page](https://dashboard.privy.io/account) in your dashboard
2. Click "Invite teammate"
3. Enter the email address of the person you want to invite
4. Select their role from the dropdown menu
5. Click "Send invitation"

### Changing roles

Admins can update teammate roles at any time:

1. Go to the [Account page](https://dashboard.privy.io/account)
2. Find the teammate whose role you want to change
3. Click on their current role dropdown
4. Select the new role
5. Confirm the change

### Removing teammates

Only Admins can remove teammates from the account:

1. Navigate to the [Account page](https://dashboard.privy.io/account)
2. Find the teammate you want to remove
3. Click the "Remove" button next to their name
4. Confirm the removal

<Warning>
  Removing a teammate immediately revokes their access to your Privy dashboard and all associated
  applications.
</Warning>

## Best practices

### Role assignment guidelines

* **Start with Viewer access**: Give new teammates Viewer access initially to let them familiarize themselves with your setup
* **Use Developer for most technical work**: Developers can handle day-to-day application building and configuration
* **Limit Admin access**: Only assign Admin roles to team leads and senior developers who need full account control

### Security considerations

* **Regularly review teammate access**: Audit your teammates and their roles periodically
* **Use the principle of least privilege**: Assign the minimum role necessary for each teammate's responsibilities
* **Remove access promptly**: When teammates leave your organization, remove their access immediately

<Tip>
  Need help determining the right role for a teammate? Consider their daily responsibilities and
  start with the most restrictive role that allows them to complete their work.
</Tip>
\n