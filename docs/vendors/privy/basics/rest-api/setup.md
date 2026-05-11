> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Setup

## Prerequisites

Before you begin, make sure you have [set up your Privy app and obtained your app ID](/basics/get-started/dashboard/create-new-app) from the Privy Dashboard.

## Base URL

All requests to the Privy API must be made to the following base URL:

```
https://api.privy.io
```

HTTPS is required for all requests. HTTP requests will be rejected.

## Authentication

All API endpoints require authentication using Basic Auth and a Privy App ID header. Include the following headers with every request:

<ParamField header="Authorization" type="string" example="Basic ouihv9248hosd9020oihj0v10d=" required>
  Basic Auth header with your app ID as the username and your app secret as the password.
</ParamField>

<ParamField header="privy-app-id" type="string" example="cla06f34x0001mh08l8nsr496" required>
  Your Privy app ID as a string.
</ParamField>

Requests missing either of these headers will be rejected by Privy's middleware.

<Info>
  Your Privy app ID and app secret can be found in the [**App settings** >
  **Basics**](https://dashboard.privy.io/apps?page=settings\&tab=basics) tab for your app.
</Info>

## Examples

<Tabs>
  <Tab title="JavaScript">
    ```javascript  theme={"system"}
    fetch('https://api.privy.io/v1/wallets', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa('insert-your-app-id' + ':' + 'insert-your-app-secret')}`,
        'privy-app-id': 'insert-your-app-id',
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => console.log(data));
    ```
  </Tab>

  <Tab title="cURL">
    ```bash  theme={"system"}
    curl -X GET "https://api.privy.io/v1/wallets" \
      --user "insert-your-app-id:insert-your-app-secret" \
      -H "privy-app-id: insert-your-app-id" \
      -H "Content-Type: application/json"
    ```
  </Tab>

  <Tab title="Python">
    ```python  theme={"system"}
    import requests
    import base64

    app_id = "insert-your-app-id"
    app_secret = "insert-your-app-secret"

    auth_string = f"{app_id}:{app_secret}"
    encoded_auth = base64.b64encode(auth_string.encode()).decode()

    headers = {
        "Authorization": f"Basic {encoded_auth}",
        "privy-app-id": app_id,
        "Content-Type": "application/json"
    }

    response = requests.get("https://api.privy.io/v1/wallets", headers=headers)
    data = response.json()
    ```
  </Tab>
</Tabs>
\n