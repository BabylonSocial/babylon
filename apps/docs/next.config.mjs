import nextra from 'nextra';

const withNextra = nextra({
  latex: true,
  search: {
    codeblocks: true,
  },
  defaultShowCopyCode: true,
});

export default withNextra({
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  // Use trailing slash to avoid [[...mdxPath]].html generation warning
  trailingSlash: true,
  // Enable cache components for Next.js 16
  cacheComponents: true,
  // Redirect root to documentation
  async redirects() {
    return [
      {
        source: '/',
        destination: '/documentation',
        permanent: false,
      },
    ];
  },
});
