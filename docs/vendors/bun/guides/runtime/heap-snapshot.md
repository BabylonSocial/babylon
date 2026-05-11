> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Inspect memory usage using V8 heap snapshots

Bun implements V8's heap snapshot API, which allows you to create snapshots of the heap at runtime. This helps debug memory leaks in your JavaScript/TypeScript application.

```ts snapshot.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
import v8 from "node:v8";

// Creates a heap snapshot file with an auto-generated name
const snapshotPath = v8.writeHeapSnapshot();
console.log(`Heap snapshot written to: ${snapshotPath}`);
```

***

## Inspect memory in Chrome DevTools

To view V8 heap snapshots in Chrome DevTools:

1. Open Chrome DevTools (F12 or right-click and select "Inspect")
2. Go to the "Memory" tab
3. Click the "Load" button (folder icon)
4. Select your `.heapsnapshot` file

<Frame><img src="https://mintcdn.com/bun-1dd33a4e/o4ey1PfJcT885lrd/images/chrome-devtools-memory.png?fit=max&auto=format&n=o4ey1PfJcT885lrd&q=85&s=8f11aeea8ad1f70974bb963f83c4decf" alt="Chrome DevTools Memory Tab" data-og-width="1770" width="1770" data-og-height="1201" height="1201" data-path="images/chrome-devtools-memory.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/o4ey1PfJcT885lrd/images/chrome-devtools-memory.png?w=280&fit=max&auto=format&n=o4ey1PfJcT885lrd&q=85&s=e6e1a5ebf8ad30c43544a41f085dbdfe 280w, https://mintcdn.com/bun-1dd33a4e/o4ey1PfJcT885lrd/images/chrome-devtools-memory.png?w=560&fit=max&auto=format&n=o4ey1PfJcT885lrd&q=85&s=303daf97c88002cd3765b80df8e64543 560w, https://mintcdn.com/bun-1dd33a4e/o4ey1PfJcT885lrd/images/chrome-devtools-memory.png?w=840&fit=max&auto=format&n=o4ey1PfJcT885lrd&q=85&s=84c80aef8460adb98de500d4bc7c8c4e 840w, https://mintcdn.com/bun-1dd33a4e/o4ey1PfJcT885lrd/images/chrome-devtools-memory.png?w=1100&fit=max&auto=format&n=o4ey1PfJcT885lrd&q=85&s=6b7e5032419ac91bc5711d87d0588e70 1100w, https://mintcdn.com/bun-1dd33a4e/o4ey1PfJcT885lrd/images/chrome-devtools-memory.png?w=1650&fit=max&auto=format&n=o4ey1PfJcT885lrd&q=85&s=dd9e20c03c566243048aae4d59999aa4 1650w, https://mintcdn.com/bun-1dd33a4e/o4ey1PfJcT885lrd/images/chrome-devtools-memory.png?w=2500&fit=max&auto=format&n=o4ey1PfJcT885lrd&q=85&s=ed77a018c5bd2a2ca06905dd96198c6a 2500w" /></Frame>
