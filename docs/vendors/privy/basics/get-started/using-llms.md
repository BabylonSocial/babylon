> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Build with AI tools

> Build with Privy faster using AI tools like Cursor, Claude, and other LLM powered coding assistants

## MCP server

[Model Context Protocol (MCP)](https://modelcontextprotocol.io/) is an open standard that lets AI assistants securely access external data sources. Privy's MCP server connects your AI coding assistant directly to our documentation, giving it live access to search and retrieve the exact information you need in real time.

### Setup with Cursor

<Steps>
  <Step title="Open MCP settings">
    In Cursor, open **Settings** and navigate to **Tools & MCP**, then click **Add MCP Server**
  </Step>

  <Step title="Add Privy docs server">
    In the `mcp.json` configuration file, add:

    ```json  theme={"system"}
    {
      "mcpServers": {
        "privy-docs": {
          "url": "https://docs.privy.io/mcp"
        }
      }
    }
    ```
  </Step>

  <Step title="Save and restart">Save the file and restart Cursor to apply the changes</Step>

  <Step title="Start building">
    Your AI assistant can now access Privy docs in real time. Try asking: "How do I add Privy login to my React app?"
  </Step>
</Steps>

### Setup with Claude Desktop

<Steps>
  <Step title="Find your config file">
    Open your Claude Desktop configuration file:

    * **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
    * **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
  </Step>

  <Step title="Add Privy MCP server">
    Add this to the `mcpServers` section:

    ```json  theme={"system"}
    {
      "mcpServers": {
        "privy-docs": {
          "url": "https://docs.privy.io/mcp"
        }
      }
    }
    ```
  </Step>

  <Step title="Restart Claude">
    Restart Claude Desktop to load the new server
  </Step>

  <Step title="Verify it works">
    Ask Claude: "Search Privy docs for wallet creation" to test the connection
  </Step>
</Steps>

## Static docs file

If your AI tool doesn't support MCP yet, you can use a static documentation file instead. This gives your AI assistant the entire Privy documentation as one text file.

<Warning>
  The static `llms-full.txt` file is a snapshot and may not include the latest updates. Use MCP when
  possible for always current docs.
</Warning>

### Setup with Cursor

<Steps>
  <Step title="Open docs settings">Go to **Settings** > **Features** > **Docs**</Step>

  <Step title="Add Privy docs">
    Click "Add new doc" and paste: `https://docs.privy.io/llms-full.txt`
  </Step>

  <Step title="Reference in chat">
    Use `@docs -> Privy` in your AI chat to reference the documentation
  </Step>
</Steps>

### Setup with Claude Desktop

<Steps>
  <Step title="Download the docs file">
    Download the static documentation file from: `https://docs.privy.io/llms-full.txt`
  </Step>

  <Step title="Add to your project">
    Save the file in your project directory or a known location on your system
  </Step>

  <Step title="Reference in chat">
    Drag and drop the file into your Claude Desktop chat, or use the attachment button to upload it. Claude will then have access to the full Privy documentation for that conversation
  </Step>
</Steps>
\n