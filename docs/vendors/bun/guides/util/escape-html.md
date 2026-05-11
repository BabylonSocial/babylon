> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Escape an HTML string

The `Bun.escapeHTML()` utility can be used to escape HTML characters in a string. The following replacements are made.

* `"` becomes `"&quot;"`
* `&` becomes `"&amp;"`
* `'` becomes `"&#x27;"`
* `<` becomes `"&lt;"`
* `>` becomes `"&gt;"`

This function is optimized for large input. Non-string types will be converted to a string before escaping.

```ts  theme={"theme":{"light":"github-light","dark":"dracula"}}
Bun.escapeHTML("<script>alert('Hello World!')</script>");
// &lt;script&gt;alert(&#x27;Hello World!&#x27;)&lt;&#x2F;script&gt;
```

***

See [Docs > API > Utils](/runtime/utils) for more useful utilities.
