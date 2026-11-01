import { useGuideRoute } from '../guideRouteContext';
import { articlePathOf, hrefOf } from '../routes';
import { ARTICLES, translationOf } from './articles';

interface ArticleLinkProps {
  slug: string;
  children?: string;
}

export function ArticleLink({ slug, children }: ArticleLinkProps) {
  const route = useGuideRoute();
  const article = ARTICLES.find(candidate => candidate.section === 'mechanics' && candidate.slug === slug);
  const label = children ?? (article ? translationOf(article, route.language).meta.title : slug);
  if (!article) return <>{label}</>;
  return <a href={hrefOf(route, articlePathOf(route.language, article))}>{label}</a>;
}
