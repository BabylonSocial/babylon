> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Setting up SMS or WhatsApp login

Privy enables your users to log in to their account via SMS or WhatsApp. Your account can be set up for **either** SMS or WhatsApp, but **not both** at the same time. Your chosen configuration will apply to all applications under your Privy account.

<Info>
  We recommend including alternative login options alongside SMS or enabling [Multi-Factor
  Authentication](/authentication/user-authentication/mfa) to ensure broad accessibility in regions
  without SMS coverage and to allow users to access their accounts in the event that they lose SMS
  access.
</Info>

<AccordionGroup>
  <Accordion title="US and Canada only SMS support">
    <Note>
      Included on all plans.
    </Note>

    This enables SMS log in for only US and Canada.
  </Accordion>

  <Accordion title="International SMS support">
    <Note>
      International SMS via BYO Twilio is available only for accounts on Scale and Enterprise plans.
      Reach out to [support@privy.io](mailto:support@privy.io) to request access.
    </Note>

    With your own Twilio account, you can configure geo-permissions for specific regions, implement custom fraud detection rules, set spending limits, and access comprehensive logging through Twilio's dashboard.

    1. You can [sign up for a Twilio account here](https://www.twilio.com/try-twilio), if you don't already have one. Ensure that your Twilio account is a paid account, fully onboarded, and fully verified.

    2. After you create an account, you'll have access to the Twilio Console, where you can configure a [Verify service](https://www.twilio.com/docs/verify) and [region coverage](https://www.twilio.com/docs/verify/preventing-toll-fraud/verify-geo-permissions).

    3. Reach out to us at [support@privy.io](mailto:support@privy.io) and provide the following Twilio credentials:

    * Privy app ID
    * Twilio Account SID
    * Twilio Auth token
    * Twilio Verify service SID

    <Note>
      Out-of-the-box international SMS is only available for accounts on Enterprise plans. Reach out to
      [support@privy.io](mailto:support@privy.io) to request access.
    </Note>

    <Warning>
      Privy uses Twilio to deliver international SMS, and underlying carrier costs are passed through to
      your account. Refer to [Twilio's pricing
      here](https://assets.cdn.prod.twilio.com/pricing-csv/SMSPricing.csv).
    </Warning>

    **Privy supports these regions:**

    | Region         | Region Code |
    | -------------- | ----------- |
    | Argentina      | +54         |
    | Australia      | +61         |
    | Canada         | +1          |
    | Chile          | +56         |
    | Czech Republic | +420        |
    | Germany        | +49         |
    | Hong Kong      | +852        |
    | Hungary        | +36         |
    | Japan          | +81         |
    | New Zealand    | +64         |
    | Portugal       | +351        |
    | Saudi Arabia   | +966        |
    | Singapore      | +65         |
    | South Korea    | +82         |
    | Sweden         | +46         |
    | Taiwan         | +886        |
    | Thailand       | +66         |
    | Turkey         | +90         |
    | United Kingdom | +44         |
    | United States  | +1          |

    To enable international SMS regions beyond our default coverage, you'll need to connect your own Twilio account to Privy, i.e., BYO Twilio.
  </Accordion>

  <Accordion title="WhatsApp support">
    <Note>
      Available only for accounts on Scale and Enterprise plans. Reach out to
      [support@privy.io](mailto:support@privy.io) to request access.
    </Note>

    This enables WhatsApp log in for all regions that WhatsApp supports.
  </Accordion>
</AccordionGroup>
\n