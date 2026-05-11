> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Analytics CORS Errors

You may occasionally see CORS errors in your browser console that look like this:

```
Access to fetch at 'https://auth.privy.io/api/v1/analytics_events' from origin has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

These CORS errors are related to background analytics requests and **do not impact your application's functionality**. They are benign errors that can safely be ignored.

The Privy SDK sends anonymous usage analytics in the background, and these requests occasionally trigger CORS warnings in your browser's developer console. While they appear as errors, they do not affect your application's performance or user experience.

<Info>
  Still have questions? Reach out to our [support team](https://privy.io/slack) - we're here to
  help!
</Info>
\n