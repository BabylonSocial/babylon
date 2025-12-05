'use client';

import { ArrowLeft, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { Skeleton } from '@/components/shared/Skeleton';

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

interface ArticlePost {
  id: string;
  type: string;
  content: string;
  fullContent: string | null;
  articleTitle: string | null;
  byline: string | null;
  biasScore: number | null;
  sentiment: string | null;
  slant: string | null;
  category: string | null;
  authorId: string;
  authorName: string;
  authorUsername: string | null;
  authorProfileImageUrl: string | null;
  timestamp: string;
}

export default function ArticlePage({ params }: ArticlePageProps) {
  const { id: articleId } = use(params);
  const router = useRouter();

  const [article, setArticle] = useState<ArticlePost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadArticle = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch from posts API since articles are posts with type='article'
        const response = await fetch(`/api/posts/${articleId}`);

        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          const errorMsg = result.error?.message || 'Failed to load article';
          setError(errorMsg);
          setIsLoading(false);
          return;
        }

        const result = await response.json();
        const articleData = result.data || result;

        // Verify it's actually an article
        if (articleData.type !== 'article') {
          // Redirect to regular post page if not an article
          router.replace(`/post/${articleId}`);
          return;
        }

        setArticle(articleData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load article');
      } finally {
        setIsLoading(false);
      }
    };

    loadArticle();
  }, [articleId, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-feed space-y-4 px-4 py-3">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-3">
        <div className="text-center">
          <h1 className="mb-2 font-bold text-2xl">Article Not Found</h1>
          <p className="mb-4 text-muted-foreground">
            {error || 'The article you are looking for does not exist.'}
          </p>
          <button
            onClick={() => router.push('/feed')}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  const publishedDate = new Date(article.timestamp);

  return (
    <PageContainer>
      {/* Desktop: Multi-column layout */}
      <div className="hidden flex-1 overflow-hidden lg:flex">
        {/* Left: Article content area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Desktop: Top bar with back button */}
          <div className="sticky top-0 z-10 shrink-0 border-border border-b bg-background shadow-sm">
            <div className="px-6 py-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-[#0066FF]" />
                  <h1 className="font-semibold text-lg">Article</h1>
                </div>
              </div>
            </div>
          </div>

          {/* Article content */}
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-feed">
              <article className="px-4 py-4 sm:px-6 sm:py-5">
                {/* Article title */}
                <h1 className="mb-4 font-bold text-3xl text-foreground leading-tight sm:text-4xl">
                  {article.articleTitle}
                </h1>

                {/* Article metadata */}
                <div className="mb-6 flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
                  <span className="font-semibold text-[#0066FF]">
                    {article.authorName}
                  </span>
                  {article.byline && (
                    <>
                      <span>·</span>
                      <span>{article.byline}</span>
                    </>
                  )}
                  <span>·</span>
                  <time>
                    {publishedDate.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </time>
                </div>

                {/* Full article content */}
                <div className="prose prose-lg prose-invert mb-6 max-w-none">
                  {(article.fullContent || article.content)
                    .split('\n\n')
                    .map((paragraph, i) => (
                      <p
                        key={i}
                        className="mb-4 text-base text-foreground leading-relaxed sm:text-lg"
                      >
                        {paragraph}
                      </p>
                    ))}
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet: Single column layout */}
      <div className="flex flex-1 flex-col overflow-hidden lg:hidden">
        {/* Mobile header */}
        <div className="sticky top-0 z-10 shrink-0 border-border border-b bg-background">
          <div className="flex items-center gap-4 px-4 py-3">
            <button
              onClick={() => router.back()}
              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-[#0066FF]" />
              <h1 className="font-semibold text-lg">Article</h1>
            </div>
          </div>
        </div>

        {/* Mobile content */}
        <div className="flex-1 overflow-y-auto">
          <article className="px-4 py-4 sm:px-6 sm:py-5">
            {/* Article title */}
            <h1 className="mb-4 font-bold text-2xl text-foreground leading-tight sm:text-3xl">
              {article.articleTitle}
            </h1>

            {/* Article metadata */}
            <div className="mb-4 flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
              <span className="font-semibold text-[#0066FF]">
                {article.authorName}
              </span>
              {article.byline && (
                <>
                  <span>·</span>
                  <span>{article.byline}</span>
                </>
              )}
              <span>·</span>
              <time>
                {publishedDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </time>
            </div>

            {/* Full article content */}
            <div className="prose prose-invert mb-4 max-w-none">
              {(article.fullContent || article.content)
                .split('\n\n')
                .map((paragraph, i) => (
                  <p
                    key={i}
                    className="mb-4 text-base text-foreground leading-relaxed"
                  >
                    {paragraph}
                  </p>
                ))}
            </div>
          </article>
        </div>
      </div>
    </PageContainer>
  );
}
