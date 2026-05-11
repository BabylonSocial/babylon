> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Use TanStack Start with Bun

[TanStack Start](https://tanstack.com/start/latest) is a full-stack framework powered by TanStack Router. It supports full-document SSR, streaming, server functions, bundling and more, powered by TanStack Router and [Vite](https://vite.dev/).

***

<Steps>
  <Step title="Create a new TanStack Start app">
    Use the interactive CLI to create a new TanStack Start app.

    ```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    bunx @tanstack/cli create my-tanstack-app
    ```
  </Step>

  <Step title="Start the dev server">
    Change to the project directory and run the dev server with Bun.

    ```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    cd my-tanstack-app
    bun --bun run dev
    ```

    This starts the Vite dev server with Bun.
  </Step>

  <Step title="Update scripts in package.json">
    Modify the scripts field in your `package.json` by prefixing the Vite CLI commands with `bun --bun`. This ensures that Bun executes the Vite CLI for common tasks like `dev`, `build`, and `preview`.

    ```json package.json icon="file-json" theme={"theme":{"light":"github-light","dark":"dracula"}}
    {
      "scripts": {
        "dev": "bun --bun vite dev", // [!code ++]
        "build": "bun --bun vite build", // [!code ++]
        "serve": "bun --bun vite preview" // [!code ++]
      }
    }
    ```
  </Step>
</Steps>

***

## Hosting

To host your TanStack Start app, you can use [Nitro](https://nitro.build/) or a custom Bun server for production deployments.

<Tabs>
  <Tab title="Nitro">
    <Steps>
      <Step title="Add Nitro to your project">
        Add [Nitro](https://nitro.build/) to your project. This tool allows you to deploy your TanStack Start app to different platforms.

        ```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
        bun add nitro
        ```
      </Step>

      <Step title={<span>Update your <code>vite.config.ts</code> file</span>}>
        Update your `vite.config.ts` file to include the necessary plugins for TanStack Start with Bun.

        ```ts vite.config.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
        // other imports...
        import { nitro } from "nitro/vite"; // [!code ++]

        const config = defineConfig({
          plugins: [
            tanstackStart(),
            nitro({ preset: "bun" }), // [!code ++]
            // other plugins...
          ],
        });

        export default config;
        ```

        <Note>
          The `bun` preset is optional, but it configures the build output specifically for Bun's runtime.
        </Note>
      </Step>

      <Step title="Update the start command">
        Make sure `build` and `start` scripts are present in your `package.json` file:

        ```json package.json icon="file-json" theme={"theme":{"light":"github-light","dark":"dracula"}}
          {
            "scripts": {
              "build": "bun --bun vite build", // [!code ++]
              // The .output files are created by Nitro when you run `bun run build`.
              // Not necessary when deploying to Vercel.
              "start": "bun run .output/server/index.mjs" // [!code ++]
            }
          }
        ```

        <Note>
          You do **not** need the custom `start` script when deploying to Vercel.
        </Note>
      </Step>

      <Step title="Deploy your app">
        Check out one of our guides to deploy your app to a hosting provider.

        <Note>
          When deploying to Vercel, you can either add the `"bunVersion": "1.x"` to your `vercel.json` file, or add it to the `nitro` config in your `vite.config.ts` file:

          <Warning>
            Do **not** use the `bun` Nitro preset when deploying to Vercel.
          </Warning>

          ```ts vite.config.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
          export default defineConfig({
            plugins: [
              tanstackStart(),
              nitro({
                preset: "bun", // [!code --]
                vercel: { // [!code ++]
                  functions: { // [!code ++]
                    runtime: "bun1.x", // [!code ++]
                  }, // [!code ++]
              }, // [!code ++]
              }),
            ],
          });
          ```
        </Note>
      </Step>
    </Steps>
  </Tab>

  <Tab title="Custom Server">
    <Note>
      This custom server implementation is based on [TanStack's Bun template](https://github.com/TanStack/router/blob/main/examples/react/start-bun/server.ts). It provides fine-grained control over static asset serving, including configurable memory management that preloads small files into memory for fast serving while serving larger files on-demand. This approach is useful when you need precise control over resource usage and asset loading behavior in production deployments.
    </Note>

    <Steps>
      <Step title="Create the production server">
        Create a `server.ts` file in your project root with the following custom server implementation:

        ```ts server.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" expandable theme={"theme":{"light":"github-light","dark":"dracula"}}
        /**
        * TanStack Start Production Server with Bun
        *
        * A high-performance production server for TanStack Start applications that
        * implements intelligent static asset loading with configurable memory management.
        *
        * Features:
        * - Hybrid loading strategy (preload small files, serve large files on-demand)
        * - Configurable file filtering with include/exclude patterns
        * - Memory-efficient response generation
        * - Production-ready caching headers
        *
        * Environment Variables:
        *
        * PORT (number)
        *   - Server port number
        *   - Default: 3000
        *
        * ASSET_PRELOAD_MAX_SIZE (number)
        *   - Maximum file size in bytes to preload into memory
        *   - Files larger than this will be served on-demand from disk
        *   - Default: 5242880 (5MB)
        *   - Example: ASSET_PRELOAD_MAX_SIZE=5242880 (5MB)
        *
        * ASSET_PRELOAD_INCLUDE_PATTERNS (string)
        *   - Comma-separated list of glob patterns for files to include
        *   - If specified, only matching files are eligible for preloading
        *   - Patterns are matched against filenames only, not full paths
        *   - Example: ASSET_PRELOAD_INCLUDE_PATTERNS="*.js,*.css,*.woff2"
        *
        * ASSET_PRELOAD_EXCLUDE_PATTERNS (string)
        *   - Comma-separated list of glob patterns for files to exclude
        *   - Applied after include patterns
        *   - Patterns are matched against filenames only, not full paths
        *   - Example: ASSET_PRELOAD_EXCLUDE_PATTERNS="*.map,*.txt"
        *
        * ASSET_PRELOAD_VERBOSE_LOGGING (boolean)
        *   - Enable detailed logging of loaded and skipped files
        *   - Default: false
        *   - Set to "true" to enable verbose output
        *
        * ASSET_PRELOAD_ENABLE_ETAG (boolean)
        *   - Enable ETag generation for preloaded assets
        *   - Default: true
        *   - Set to "false" to disable ETag support
        *
        * ASSET_PRELOAD_ENABLE_GZIP (boolean)
        *   - Enable Gzip compression for eligible assets
        *   - Default: true
        *   - Set to "false" to disable Gzip compression
        *
        * ASSET_PRELOAD_GZIP_MIN_SIZE (number)
        *   - Minimum file size in bytes required for Gzip compression
        *   - Files smaller than this will not be compressed
        *   - Default: 1024 (1KB)
        *
        * ASSET_PRELOAD_GZIP_MIME_TYPES (string)
        *   - Comma-separated list of MIME types eligible for Gzip compression
        *   - Supports partial matching for types ending with "/"
        *   - Default: text/,application/javascript,application/json,application/xml,image/svg+xml
        *
        * Usage:
        *   bun run server.ts
        */

        import path from 'node:path'

        // Configuration
        const SERVER_PORT = Number(process.env.PORT ?? 3000)
        const CLIENT_DIRECTORY = './dist/client'
        const SERVER_ENTRY_POINT = './dist/server/server.js'

        // Logging utilities for professional output
        const log = {
          info: (message: string) => {
            console.log(`[INFO] ${message}`)
          },
          success: (message: string) => {
            console.log(`[SUCCESS] ${message}`)
          },
          warning: (message: string) => {
            console.log(`[WARNING] ${message}`)
          },
          error: (message: string) => {
            console.log(`[ERROR] ${message}`)
          },
          header: (message: string) => {
            console.log(`\n${message}\n`)
          },
        }

        // Preloading configuration from environment variables
        const MAX_PRELOAD_BYTES = Number(
          process.env.ASSET_PRELOAD_MAX_SIZE ?? 5 * 1024 * 1024, // 5MB default
        )

        // Parse comma-separated include patterns (no defaults)
        const INCLUDE_PATTERNS = (process.env.ASSET_PRELOAD_INCLUDE_PATTERNS ?? '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .map((pattern: string) => convertGlobToRegExp(pattern))

        // Parse comma-separated exclude patterns (no defaults)
        const EXCLUDE_PATTERNS = (process.env.ASSET_PRELOAD_EXCLUDE_PATTERNS ?? '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .map((pattern: string) => convertGlobToRegExp(pattern))

        // Verbose logging flag
        const VERBOSE = process.env.ASSET_PRELOAD_VERBOSE_LOGGING === 'true'

        // Optional ETag feature
        const ENABLE_ETAG = (process.env.ASSET_PRELOAD_ENABLE_ETAG ?? 'true') === 'true'

        // Optional Gzip feature
        const ENABLE_GZIP = (process.env.ASSET_PRELOAD_ENABLE_GZIP ?? 'true') === 'true'
        const GZIP_MIN_BYTES = Number(process.env.ASSET_PRELOAD_GZIP_MIN_SIZE ?? 1024) // 1KB
        const GZIP_TYPES = (
          process.env.ASSET_PRELOAD_GZIP_MIME_TYPES ??
          'text/,application/javascript,application/json,application/xml,image/svg+xml'
        )
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean)

        /**
        * Convert a simple glob pattern to a regular expression
        * Supports * wildcard for matching any characters
        */
        function convertGlobToRegExp(globPattern: string): RegExp {
          // Escape regex special chars except *, then replace * with .*
          const escapedPattern = globPattern
            .replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&')
            .replace(/\*/g, '.*')
          return new RegExp(`^${escapedPattern}$`, 'i')
        }

        /**
        * Compute ETag for a given data buffer
        */
        function computeEtag(data: Uint8Array): string {
          const hash = Bun.hash(data)
          return `W/"${hash.toString(16)}-${data.byteLength.toString()}"`
        }

        /**
        * Metadata for preloaded static assets
        */
        interface AssetMetadata {
          route: string
          size: number
          type: string
        }

        /**
        * In-memory asset with ETag and Gzip support
        */
        interface InMemoryAsset {
          raw: Uint8Array
          gz?: Uint8Array
          etag?: string
          type: string
          immutable: boolean
          size: number
        }

        /**
        * Result of static asset preloading process
        */
        interface PreloadResult {
          routes: Record<string, (req: Request) => Response | Promise<Response>>
          loaded: AssetMetadata[]
          skipped: AssetMetadata[]
        }

        /**
        * Check if a file is eligible for preloading based on configured patterns
        */
        function isFileEligibleForPreloading(relativePath: string): boolean {
          const fileName = relativePath.split(/[/\\]/).pop() ?? relativePath

          // If include patterns are specified, file must match at least one
          if (INCLUDE_PATTERNS.length > 0) {
            if (!INCLUDE_PATTERNS.some((pattern) => pattern.test(fileName))) {
              return false
            }
          }

          // If exclude patterns are specified, file must not match any
          if (EXCLUDE_PATTERNS.some((pattern) => pattern.test(fileName))) {
            return false
          }

          return true
        }

        /**
        * Check if a MIME type is compressible
        */
        function isMimeTypeCompressible(mimeType: string): boolean {
          return GZIP_TYPES.some((type) =>
            type.endsWith('/') ? mimeType.startsWith(type) : mimeType === type,
          )
        }

        /**
        * Conditionally compress data based on size and MIME type
        */
        function compressDataIfAppropriate(
          data: Uint8Array,
          mimeType: string,
        ): Uint8Array | undefined {
          if (!ENABLE_GZIP) return undefined
          if (data.byteLength < GZIP_MIN_BYTES) return undefined
          if (!isMimeTypeCompressible(mimeType)) return undefined
          try {
            return Bun.gzipSync(data.buffer as ArrayBuffer)
          } catch {
            return undefined
          }
        }

        /**
        * Create response handler function with ETag and Gzip support
        */
        function createResponseHandler(
          asset: InMemoryAsset,
        ): (req: Request) => Response {
          return (req: Request) => {
            const headers: Record<string, string> = {
              'Content-Type': asset.type,
              'Cache-Control': asset.immutable
                ? 'public, max-age=31536000, immutable'
                : 'public, max-age=3600',
            }

            if (ENABLE_ETAG && asset.etag) {
              const ifNone = req.headers.get('if-none-match')
              if (ifNone && ifNone === asset.etag) {
                return new Response(null, {
                  status: 304,
                  headers: { ETag: asset.etag },
                })
              }
              headers.ETag = asset.etag
            }

            if (
              ENABLE_GZIP &&
              asset.gz &&
              req.headers.get('accept-encoding')?.includes('gzip')
            ) {
              headers['Content-Encoding'] = 'gzip'
              headers['Content-Length'] = String(asset.gz.byteLength)
              const gzCopy = new Uint8Array(asset.gz)
              return new Response(gzCopy, { status: 200, headers })
            }

            headers['Content-Length'] = String(asset.raw.byteLength)
            const rawCopy = new Uint8Array(asset.raw)
            return new Response(rawCopy, { status: 200, headers })
          }
        }

        /**
        * Create composite glob pattern from include patterns
        */
        function createCompositeGlobPattern(): Bun.Glob {
          const raw = (process.env.ASSET_PRELOAD_INCLUDE_PATTERNS ?? '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
          if (raw.length === 0) return new Bun.Glob('**/*')
          if (raw.length === 1) return new Bun.Glob(raw[0])
          return new Bun.Glob(`{${raw.join(',')}}`)
        }

        /**
        * Initialize static routes with intelligent preloading strategy
        * Small files are loaded into memory, large files are served on-demand
        */
        async function initializeStaticRoutes(
          clientDirectory: string,
        ): Promise<PreloadResult> {
          const routes: Record<string, (req: Request) => Response | Promise<Response>> =
            {}
          const loaded: AssetMetadata[] = []
          const skipped: AssetMetadata[] = []

          log.info(`Loading static assets from ${clientDirectory}...`)
          if (VERBOSE) {
            console.log(
              `Max preload size: ${(MAX_PRELOAD_BYTES / 1024 / 1024).toFixed(2)} MB`,
            )
            if (INCLUDE_PATTERNS.length > 0) {
              console.log(
                `Include patterns: ${process.env.ASSET_PRELOAD_INCLUDE_PATTERNS ?? ''}`,
              )
            }
            if (EXCLUDE_PATTERNS.length > 0) {
              console.log(
                `Exclude patterns: ${process.env.ASSET_PRELOAD_EXCLUDE_PATTERNS ?? ''}`,
              )
            }
          }

          let totalPreloadedBytes = 0

          try {
            const glob = createCompositeGlobPattern()
            for await (const relativePath of glob.scan({ cwd: clientDirectory })) {
              const filepath = path.join(clientDirectory, relativePath)
              const route = `/${relativePath.split(path.sep).join(path.posix.sep)}`

              try {
                // Get file metadata
                const file = Bun.file(filepath)

                // Skip if file doesn't exist or is empty
                if (!(await file.exists()) || file.size === 0) {
                  continue
                }

                const metadata: AssetMetadata = {
                  route,
                  size: file.size,
                  type: file.type || 'application/octet-stream',
                }

                // Determine if file should be preloaded
                const matchesPattern = isFileEligibleForPreloading(relativePath)
                const withinSizeLimit = file.size <= MAX_PRELOAD_BYTES

                if (matchesPattern && withinSizeLimit) {
                  // Preload small files into memory with ETag and Gzip support
                  const bytes = new Uint8Array(await file.arrayBuffer())
                  const gz = compressDataIfAppropriate(bytes, metadata.type)
                  const etag = ENABLE_ETAG ? computeEtag(bytes) : undefined
                  const asset: InMemoryAsset = {
                    raw: bytes,
                    gz,
                    etag,
                    type: metadata.type,
                    immutable: true,
                    size: bytes.byteLength,
                  }
                  routes[route] = createResponseHandler(asset)

                  loaded.push({ ...metadata, size: bytes.byteLength })
                  totalPreloadedBytes += bytes.byteLength
                } else {
                  // Serve large or filtered files on-demand
                  routes[route] = () => {
                    const fileOnDemand = Bun.file(filepath)
                    return new Response(fileOnDemand, {
                      headers: {
                        'Content-Type': metadata.type,
                        'Cache-Control': 'public, max-age=3600',
                      },
                    })
                  }

                  skipped.push(metadata)
                }
              } catch (error: unknown) {
                if (error instanceof Error && error.name !== 'EISDIR') {
                  log.error(`Failed to load ${filepath}: ${error.message}`)
                }
              }
            }

            // Show detailed file overview only when verbose mode is enabled
            if (VERBOSE && (loaded.length > 0 || skipped.length > 0)) {
              const allFiles = [...loaded, ...skipped].sort((a, b) =>
                a.route.localeCompare(b.route),
              )

              // Calculate max path length for alignment
              const maxPathLength = Math.min(
                Math.max(...allFiles.map((f) => f.route.length)),
                60,
              )

              // Format file size with KB and actual gzip size
              const formatFileSize = (bytes: number, gzBytes?: number) => {
                const kb = bytes / 1024
                const sizeStr = kb < 100 ? kb.toFixed(2) : kb.toFixed(1)

                if (gzBytes !== undefined) {
                  const gzKb = gzBytes / 1024
                  const gzStr = gzKb < 100 ? gzKb.toFixed(2) : gzKb.toFixed(1)
                  return {
                    size: sizeStr,
                    gzip: gzStr,
                  }
                }

                // Rough gzip estimation (typically 30-70% compression) if no actual gzip data
                const gzipKb = kb * 0.35
                return {
                  size: sizeStr,
                  gzip: gzipKb < 100 ? gzipKb.toFixed(2) : gzipKb.toFixed(1),
                }
              }

              if (loaded.length > 0) {
                console.log('\n📁 Preloaded into memory:')
                console.log(
                  'Path                                          │    Size │ Gzip Size',
                )
                loaded
                  .sort((a, b) => a.route.localeCompare(b.route))
                  .forEach((file) => {
                    const { size, gzip } = formatFileSize(file.size)
                    const paddedPath = file.route.padEnd(maxPathLength)
                    const sizeStr = `${size.padStart(7)} kB`
                    const gzipStr = `${gzip.padStart(7)} kB`
                    console.log(`${paddedPath} │ ${sizeStr} │  ${gzipStr}`)
                  })
              }

              if (skipped.length > 0) {
                console.log('\n💾 Served on-demand:')
                console.log(
                  'Path                                          │    Size │ Gzip Size',
                )
                skipped
                  .sort((a, b) => a.route.localeCompare(b.route))
                  .forEach((file) => {
                    const { size, gzip } = formatFileSize(file.size)
                    const paddedPath = file.route.padEnd(maxPathLength)
                    const sizeStr = `${size.padStart(7)} kB`
                    const gzipStr = `${gzip.padStart(7)} kB`
                    console.log(`${paddedPath} │ ${sizeStr} │  ${gzipStr}`)
                  })
              }
            }

            // Show detailed verbose info if enabled
            if (VERBOSE) {
              if (loaded.length > 0 || skipped.length > 0) {
                const allFiles = [...loaded, ...skipped].sort((a, b) =>
                  a.route.localeCompare(b.route),
                )
                console.log('\n📊 Detailed file information:')
                console.log(
                  'Status       │ Path                            │ MIME Type                    │ Reason',
                )
                allFiles.forEach((file) => {
                  const isPreloaded = loaded.includes(file)
                  const status = isPreloaded ? 'MEMORY' : 'ON-DEMAND'
                  const reason =
                    !isPreloaded && file.size > MAX_PRELOAD_BYTES
                      ? 'too large'
                      : !isPreloaded
                        ? 'filtered'
                        : 'preloaded'
                  const route =
                    file.route.length > 30
                      ? file.route.substring(0, 27) + '...'
                      : file.route
                  console.log(
                    `${status.padEnd(12)} │ ${route.padEnd(30)} │ ${file.type.padEnd(28)} │ ${reason.padEnd(10)}`,
                  )
                })
              } else {
                console.log('\n📊 No files found to display')
              }
            }

            // Log summary after the file list
            console.log() // Empty line for separation
            if (loaded.length > 0) {
              log.success(
                `Preloaded ${String(loaded.length)} files (${(totalPreloadedBytes / 1024 / 1024).toFixed(2)} MB) into memory`,
              )
            } else {
              log.info('No files preloaded into memory')
            }

            if (skipped.length > 0) {
              const tooLarge = skipped.filter((f) => f.size > MAX_PRELOAD_BYTES).length
              const filtered = skipped.length - tooLarge
              log.info(
                `${String(skipped.length)} files will be served on-demand (${String(tooLarge)} too large, ${String(filtered)} filtered)`,
              )
            }
          } catch (error) {
            log.error(
              `Failed to load static files from ${clientDirectory}: ${String(error)}`,
            )
          }

          return { routes, loaded, skipped }
        }

        /**
        * Initialize the server
        */
        async function initializeServer() {
          log.header('Starting Production Server')

          // Load TanStack Start server handler
          let handler: { fetch: (request: Request) => Response | Promise<Response> }
          try {
            const serverModule = (await import(SERVER_ENTRY_POINT)) as {
              default: { fetch: (request: Request) => Response | Promise<Response> }
            }
            handler = serverModule.default
            log.success('TanStack Start application handler initialized')
          } catch (error) {
            log.error(`Failed to load server handler: ${String(error)}`)
            process.exit(1)
          }

          // Build static routes with intelligent preloading
          const { routes } = await initializeStaticRoutes(CLIENT_DIRECTORY)

          // Create Bun server
          const server = Bun.serve({
            port: SERVER_PORT,

            routes: {
              // Serve static assets (preloaded or on-demand)
              ...routes,

              // Fallback to TanStack Start handler for all other routes
              '/*': (req: Request) => {
                try {
                  return handler.fetch(req)
                } catch (error) {
                  log.error(`Server handler error: ${String(error)}`)
                  return new Response('Internal Server Error', { status: 500 })
                }
              },
            },

            // Global error handler
            error(error) {
              log.error(
                `Uncaught server error: ${error instanceof Error ? error.message : String(error)}`,
              )
              return new Response('Internal Server Error', { status: 500 })
            },
          })

          log.success(`Server listening on http://localhost:${String(server.port)}`)
        }

        // Initialize the server
        initializeServer().catch((error: unknown) => {
          log.error(`Failed to start server: ${String(error)}`)
          process.exit(1)
        })
        ```
      </Step>

      <Step title="Update package.json scripts">
        Add a `start` script to run the custom server:

        ```json package.json icon="file-json" theme={"theme":{"light":"github-light","dark":"dracula"}}
        {
          "scripts": {
            "build": "bun --bun vite build",
            "start": "bun run server.ts" // [!code ++]
          }
        }
        ```
      </Step>

      <Step title="Build and run">
        Build your application and start the server:

        ```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
        bun run build
        bun run start
        ```

        The server will start on port 3000 by default (configurable via `PORT` environment variable).
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Columns cols={3}>
  <Card title="Vercel" href="/guides/deployment/vercel" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/vercel.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=0119630345a5bb2be83f4a3078be0839" data-og-width="24" width="24" data-og-height="24" height="24" data-path="icons/ecosystem/vercel.svg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/vercel.svg?w=280&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=558d403f7191ced79eb680a6a9c886e8 280w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/vercel.svg?w=560&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=c930549ba6b93cf10881abb59cf53688 560w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/vercel.svg?w=840&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=72519021875a8e288e76916aec80cf86 840w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/vercel.svg?w=1100&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=0443b5ff8b3e68549cf24d09d4e6f849 1100w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/vercel.svg?w=1650&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=9e1b92cb9521b194cbe4d743473b8fd3 1650w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/vercel.svg?w=2500&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=23c8b364b3c11691bc72f0715a38ffa0 2500w">
    Deploy on Vercel
  </Card>

  <Card title="Render" href="/guides/deployment/render" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/render.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=b7fd7095e654b99d8ef8b7eca930a2be" data-og-width="24" width="24" data-og-height="24" height="24" data-path="icons/ecosystem/render.svg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/render.svg?w=280&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=c6e2b4582098d021e0300bb4b96ec732 280w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/render.svg?w=560&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=a91ace1d58717926da57197a5ad9ea2e 560w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/render.svg?w=840&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=3ae50e53c0f2df147ea909bfef0effb6 840w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/render.svg?w=1100&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=1678f0f67ff95fccc7287923efa29609 1100w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/render.svg?w=1650&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=eccbb96422883aa345abde24de2c1425 1650w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/render.svg?w=2500&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=f1c23653ff4eaeca1c99c3075684ef9d 2500w">
    Deploy on Render
  </Card>

  <Card title="Railway" href="/guides/deployment/railway" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/railway.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=4553ea0f84b066a50753461143fd2824" data-og-width="24" width="24" data-og-height="24" height="24" data-path="icons/ecosystem/railway.svg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/railway.svg?w=280&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=cd8d8aacd5f2f2efd839130a3b17bcbf 280w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/railway.svg?w=560&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=f9fc9e1b3d6a579f9c18d4ddbfbd5f7f 560w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/railway.svg?w=840&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=b57068a5eb013420e823a1a050956b81 840w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/railway.svg?w=1100&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5a2645f0e6a459ccef063d8ce5d366bd 1100w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/railway.svg?w=1650&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=247388532e03805e97803133456f39bb 1650w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/railway.svg?w=2500&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=3bbb0345be3bbef71abb718114a73654 2500w">
    Deploy on Railway
  </Card>

  <Card title="DigitalOcean" href="/guides/deployment/digital-ocean" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/digitalocean.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=76100ce98a846b41e66d11c3c0dd5a37" data-og-width="24" width="24" data-og-height="24" height="24" data-path="icons/ecosystem/digitalocean.svg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/digitalocean.svg?w=280&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=f05172448d816bf4d5a541a730dd84cd 280w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/digitalocean.svg?w=560&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=be3f886375f8a954ddfc878a3c9987f3 560w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/digitalocean.svg?w=840&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=3c5bf434379f8b1de244b61c0225cccf 840w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/digitalocean.svg?w=1100&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=ff4c79649694e0e8d5567079f4dfa4af 1100w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/digitalocean.svg?w=1650&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=c8fd92cca5737fa100a8cbe88312e722 1650w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/digitalocean.svg?w=2500&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=b630a0e5a68905fca14ed14d16a95d75 2500w">
    Deploy on DigitalOcean
  </Card>

  <Card title="AWS Lambda" href="/guides/deployment/aws-lambda" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/aws.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=2249c35058c03bf3646a117a36bb8a77" data-og-width="24" width="24" data-og-height="24" height="24" data-path="icons/ecosystem/aws.svg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/aws.svg?w=280&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=59f04e1dc2ae7a68bbfdcb42c21f70a3 280w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/aws.svg?w=560&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=7c131a955113089cd6e1da2c03832b89 560w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/aws.svg?w=840&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=ee29bf860e425db34e3d2a8dd8f1f2d7 840w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/aws.svg?w=1100&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=6942c6cc8e4dd9abe551481d474d0b4b 1100w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/aws.svg?w=1650&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=76ed53ffb325947b7ce7c811eda7f3be 1650w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/ecosystem/aws.svg?w=2500&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=69e3a0e0cb384d192c22bcf8e819fde0 2500w">
    Deploy on AWS Lambda
  </Card>

  <Card title="Google Cloud Run" href="/guides/deployment/google-cloud-run" icon="https://mintcdn.com/bun-1dd33a4e/cfVIaCNGtFU88Wgc/icons/ecosystem/gcp.svg?fit=max&auto=format&n=cfVIaCNGtFU88Wgc&q=85&s=a99e6cb0cfadfeb9ea3b6451de38cfd6" data-og-width="24" width="24" data-og-height="24" height="24" data-path="icons/ecosystem/gcp.svg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/cfVIaCNGtFU88Wgc/icons/ecosystem/gcp.svg?w=280&fit=max&auto=format&n=cfVIaCNGtFU88Wgc&q=85&s=a6f174aab45cb9ca3897b5778f7633b1 280w, https://mintcdn.com/bun-1dd33a4e/cfVIaCNGtFU88Wgc/icons/ecosystem/gcp.svg?w=560&fit=max&auto=format&n=cfVIaCNGtFU88Wgc&q=85&s=cfad48954d945d8d67aba73f18d2aa13 560w, https://mintcdn.com/bun-1dd33a4e/cfVIaCNGtFU88Wgc/icons/ecosystem/gcp.svg?w=840&fit=max&auto=format&n=cfVIaCNGtFU88Wgc&q=85&s=6ffa7b2f6e6c11ac40fc9a5488427774 840w, https://mintcdn.com/bun-1dd33a4e/cfVIaCNGtFU88Wgc/icons/ecosystem/gcp.svg?w=1100&fit=max&auto=format&n=cfVIaCNGtFU88Wgc&q=85&s=b6dd2138983435a4d422b71b91d0b15f 1100w, https://mintcdn.com/bun-1dd33a4e/cfVIaCNGtFU88Wgc/icons/ecosystem/gcp.svg?w=1650&fit=max&auto=format&n=cfVIaCNGtFU88Wgc&q=85&s=46ad1c3252441bd6fbc4bfb971d46f51 1650w, https://mintcdn.com/bun-1dd33a4e/cfVIaCNGtFU88Wgc/icons/ecosystem/gcp.svg?w=2500&fit=max&auto=format&n=cfVIaCNGtFU88Wgc&q=85&s=79fc209305615cfabb18fbe87e222dfb 2500w">
    Deploy on Google Cloud Run
  </Card>
</Columns>

***

## Templates

<Columns cols={2}>
  <Card title="Todo App with Tanstack + Bun" img="https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-tanstack-todo.png?fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=2158d48f96cabb9a5e4d66ff94bab5fa" href="https://github.com/bun-templates/bun-tanstack-todo" arrow="true" cta="Go to template" data-og-width="2212" width="2212" data-og-height="1326" height="1326" data-path="images/templates/bun-tanstack-todo.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-tanstack-todo.png?w=280&fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=0e1f90a6dade2be32710ff67945bdd25 280w, https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-tanstack-todo.png?w=560&fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=8c6339f2027e3a6ebc86b93060e45fee 560w, https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-tanstack-todo.png?w=840&fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=56ebc5fb5d7176e5ee5198a5300160a0 840w, https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-tanstack-todo.png?w=1100&fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=3b1c86c693d452b801e5c0616e13bc5c 1100w, https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-tanstack-todo.png?w=1650&fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=f368130e0191ed8fa32ee53c9852676f 1650w, https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-tanstack-todo.png?w=2500&fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=c653afe62e8df7f16cc6a15b5bc06f16 2500w">
    A Todo application built with Bun, TanStack Start, and PostgreSQL.
  </Card>

  <Card title="Bun + TanStack Start Application" img="https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-tanstack-basic.png?fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=9636defcaa30d79a3e8fe00740b3846f" href="https://github.com/bun-templates/bun-tanstack-basic" arrow="true" cta="Go to template" data-og-width="2212" width="2212" data-og-height="1326" height="1326" data-path="images/templates/bun-tanstack-basic.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-tanstack-basic.png?w=280&fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=69800904d8b235c7c84f39c7474aa96f 280w, https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-tanstack-basic.png?w=560&fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=c28ae7ca097c319bedfac6ede7524f05 560w, https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-tanstack-basic.png?w=840&fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=33277701216f83bf535bc06bafa0473b 840w, https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-tanstack-basic.png?w=1100&fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=508b495c353078478353e57eee757834 1100w, https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-tanstack-basic.png?w=1650&fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=616c7f24b1c6c6c6ae096eee0a5f492b 1650w, https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-tanstack-basic.png?w=2500&fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=5ee6ef5e5def6b77964f0bdcc7134fd0 2500w">
    A TanStack Start template using Bun with SSR and file-based routing.
  </Card>

  <Card title="Basic Bun + Tanstack Starter" img="https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-tanstack-start.png?fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=49d7a4fab3a407cae793c7348a633ca6" href="https://github.com/bun-templates/bun-tanstack-start" arrow="true" cta="Go to template" data-og-width="2212" width="2212" data-og-height="1326" height="1326" data-path="images/templates/bun-tanstack-start.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-tanstack-start.png?w=280&fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=a2fdd3cfd287eae37e993d313cb294a9 280w, https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-tanstack-start.png?w=560&fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=6bd00107343d858e7ef618bbb2801f34 560w, https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-tanstack-start.png?w=840&fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=b8f1e3a21be9c72f1533c3c7604fa592 840w, https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-tanstack-start.png?w=1100&fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=354f673b4b120d0f1ba31d5431b5bbe6 1100w, https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-tanstack-start.png?w=1650&fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=27eddabb06a64fb94f808d8f1aa02a09 1650w, https://mintcdn.com/bun-1dd33a4e/M5IN-LfyV8DoQVZm/images/templates/bun-tanstack-start.png?w=2500&fit=max&auto=format&n=M5IN-LfyV8DoQVZm&q=85&s=f4e3ff9ff0fd4cfe08d5906a41026c6c 2500w">
    The basic TanStack starter using the Bun runtime and Bun's file APIs.
  </Card>
</Columns>

***

[→ See TanStack Start's official documentation](https://tanstack.com/start/latest/docs/framework/react/guide/hosting) for more information on hosting.
