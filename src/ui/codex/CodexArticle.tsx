import { ArticleBody } from '../../guide/ArticleBody';
import { ArticleLinkerContext, type ArticleLinker } from '../../guide/content/articleLinker';
import type { Article } from '../../guide/content/articles';
import { useGame } from '../common/hooks';
import { RulesStateContext } from './rulesStateContext';

interface CodexArticleProps {
  article: Article;
  linker: ArticleLinker;
}

export function CodexArticle({ article, linker }: CodexArticleProps) {
  const state = useGame(store => store.state);
  return (
    <ArticleLinkerContext value={linker}>
      <RulesStateContext value={state}>
        <div className="codex-article">
          <ArticleBody article={article} language={linker.language} />
        </div>
      </RulesStateContext>
    </ArticleLinkerContext>
  );
}
