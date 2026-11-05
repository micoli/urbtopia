import { ArticleBody } from './ArticleBody';
import type { Article } from './content/articles';
import type { GuideRoute } from './routes';

interface ArticlePageProps {
  route: GuideRoute;
  article: Article;
}

export function ArticlePage({ route, article }: ArticlePageProps) {
  return (
    <article className="guide-prose max-w-4xl">
      <ArticleBody article={article} language={route.language} />
    </article>
  );
}
