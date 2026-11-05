import { ARTICLES, translationOf } from './articles';
import { useArticleLinker } from './articleLinker';

interface ArticleLinkProps {
  slug: string;
  children?: string;
}

export function ArticleLink({ slug, children }: ArticleLinkProps) {
  const linker = useArticleLinker();
  const article = ARTICLES.find(candidate => candidate.section === 'mechanics' && candidate.slug === slug);
  const label = children ?? (article ? translationOf(article, linker.language).meta.title : slug);
  if (!article) return <>{label}</>;
  return <a {...linker.article(article)}>{label}</a>;
}
