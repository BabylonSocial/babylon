> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# IP allowlist

The IP allowlist restricts server-to-server API access to specific IP addresses and CIDR ranges. When enabled, only requests from allowlisted IP addresses can authenticate using the app secret. This protects against unauthorized API access if credentials are compromised.

<Info>
  The IP allowlist only applies to server-to-server requests using Basic authentication with your
  app secret. User authentication and dashboard access are not affected by this setting.
</Info>

## How it works

When your server makes an API request using Basic authentication (app ID and app secret), Privy validates the request's source IP address against your configured allowlist:

* If the allowlist is **empty**, all IP addresses are permitted (feature disabled)
* If the allowlist **contains entries**, only matching IP addresses can complete the request
* Non-matching requests receive a `403 Forbidden` error

## Supported formats

The IP allowlist supports three types of entries:

| Format       | Example       | Description               |
| ------------ | ------------- | ------------------------- |
| IPv4 address | `192.168.1.1` | Single IPv4 address       |
| IPv6 address | `2001:db8::1` | Single IPv6 address       |
| CIDR range   | `10.0.0.0/8`  | IP range in CIDR notation |

<Tip>
  Use CIDR notation to allowlist entire IP ranges. For example, `192.168.1.0/24` allows all
  addresses from `192.168.1.0` to `192.168.1.255`.
</Tip>

### IPv6-mapped IPv4 addresses

IPv6-mapped IPv4 addresses (e.g., `::ffff:192.168.1.1`) are automatically normalized to their standard IPv4 format for comparison. This ensures consistent matching regardless of how the client IP is reported.

## Configure the IP allowlist

Configure the IP allowlist in the [Privy Dashboard](https://dashboard.privy.io/apps?page=settings) under **Configuration > App settings**.

### Add IP addresses

1. Navigate to the **IP allowlist** section in your app settings
2. Enter IP addresses or CIDR ranges, one per line
3. Save your changes

<Warning>
  Before enabling the IP allowlist, ensure your server's IP addresses are added. Adding entries to
  an empty allowlist immediately enables IP restrictions, which may block your existing
  integrations.
</Warning>

## Error handling

When a request originates from a non-allowlisted IP address, the API returns a `403 Forbidden` error with a generic message. This prevents IP enumeration attacks by not revealing whether the IP allowlist is enabled or which IPs are allowed.

## Best practices

### Use CIDR ranges for cloud providers

Cloud infrastructure often uses dynamic IP addresses. Configure CIDR ranges for your cloud provider's IP ranges rather than individual addresses:

* For AWS, use the published [IP address ranges](https://docs.aws.amazon.com/general/latest/gr/aws-ip-ranges.html)
* For Google Cloud, use [Cloud NAT](https://cloud.google.com/nat/docs/overview) with static IPs
* For Azure, configure [outbound IP addresses](https://learn.microsoft.com/en-us/azure/virtual-network/ip-services/default-outbound-access)

### Test before enabling

Before adding entries to an empty allowlist:

1. Identify all IP addresses your servers use for outbound requests
2. Test the IP addresses using a staging environment
3. Add all required IP addresses before enabling

### Monitor for blocked requests

After enabling the IP allowlist, monitor your application logs for unexpected authentication failures. Blocked requests may indicate:

* Missing IP addresses in the allowlist
* Infrastructure changes that modified your outbound IP
\n