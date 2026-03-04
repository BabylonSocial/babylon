import { defineConfig } from 'orval';

export default defineConfig({
  'babylon-hooks': {
    input: {
      target: './openapi.json',
    },
    output: {
      mode: 'tags-split',
      target: 'packages/api-hooks/src/generated',
      schemas: 'packages/api-hooks/src/generated/model',
      client: 'react-query',
      httpClient: 'fetch',
      baseUrl: '',
      override: {
        mutator: {
          path: './packages/api-hooks/src/orval-fetch.ts',
          name: 'orvalFetch',
        },
        fetch: {
          includeHttpResponseReturnType: false,
        },
        query: {
          useQuery: true,
          useMutation: true,
          useSuspenseQuery: true,
        },
      },
    },
  },
});
