> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Managing your allowlist with Airtable

**If you use [Airtable](https://airtable.com/) or a similar tool to manage a waitlist of wallet addresses for your app, you can easily set up a [Privy allowlist](/user-management/users/managing-users/allowlist) and manage it from the same interface.** Just follow the steps outlined below.

## 0. Prerequisites

This guide assumes:

* You have an allowlist enabled for your Privy app. If you would like to enable an allowlist for your app, please [reach out](https://privy.io/slack)!
* You are managing a waitlist of users with Airtable, and that the base at minimum includes the user's wallet address and a boolean/checkbox column for whether the user should be invited off the waitlist or not.

## 1. Create an automation

In your Airtable with your waitlist, create a custom automation by clicking on "Automations" in the top right corner of your screen, and then clicking "Create a custom automation" from the dropdown. You can find Airtable's complete instructions around automations [here](https://support.airtable.com/docs/creating-an-airtable-automation#setup).

## 2. Configure a trigger for your automation

Once you start creating your custom automation, click "Add a trigger", and select the "When a record is updated" option.

Then, in the right sidebar that appears, under "Table", select the name of your Airtable base with your waitlist. Under "Fields", select the column from your base that indicates whether or not a user should be invited off your waitlist.

This configures your automation to run whenever you update this column (whether the user is allowed or not) for any record.

## 3. Set up your script

After you've configured your trigger, click "Add action" in the same automation. This will set up an action that runs whenever your automation is triggered.

First, you need to configure the inputs for your action. In the right sidebar, under "Input Variables", create the following two variables:

* the user's wallet address. Set the `Name` as 'address' and `Value` as the column in your table with the user's wallet address.
* whether or not the user should be invited off the waitlist. Set the `Name` as 'isAllowed' and `Value` as the corresponding column in your table.

Next, after you've configured your input variables, copy the following script into your code box and replace the variables at the top with your corresponding values. The script essentially parses the input variables you just configured, and makes a request to Privy's API to [add the corresponding user to your app's allowlist](/user-management/users/managing-users/allowlist).

```tsx  theme={"system"}
// These are variables to set up our script
const appId = /* paste your Privy App ID here */;
const appSecret = /* Paste your Privy App Secret */;
const base64 = /* Paste a base-64 encoding of appId + ":" + appSecret */
const url = `https://auth.privy.io/api/v1/apps/${appId}/allowlist`;

// This parses the input variables we configured earlier
const inputConfig = input.config();
const isAllowed = inputConfig.isAllowed;
const address = inputConfig.address;

async function addToAllowlist() {
    const data = {'type': 'wallet', 'value': address};

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${base64}`,
                'privy-app-id': appId
            },
            body: JSON.stringify(data)
        })
        console.log(response);
    } catch (error) {
        console.log(error.data);
    }
}

if (isAllowed) {
    addToAllowlist();
}
```

## 4. Enable your script!

**That's it! You can now manage your app's allowlist directly from Airtable.** Just go ahead and enable the automation.

If you’d like to test this automation before enabling it, in the right sidebar, you can scroll down and select a test record to use to make sure things work smoothly.
\n