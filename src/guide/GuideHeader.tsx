import { t } from '../i18n/t';
import { LanguageSwitch } from './LanguageSwitch';
import { gameRootOf, hrefOf, type GuideRoute } from './routes';
import { SearchButton } from './search/SearchButton';
import { ThemeToggle } from './ThemeToggle';

interface GuideHeaderProps {
  route: GuideRoute;
  onOpenMenu: () => void;
  onOpenSearch: () => void;
}

export function GuideHeader({ route, onOpenMenu, onOpenSearch }: GuideHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4">
        <button type="button" className="guide-icon-button lg:hidden" aria-label={t('guide.openMenu')} onClick={onOpenMenu}>
          <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <a href={hrefOf(route, `${route.language}/`)} className="flex min-w-0 items-center gap-2 font-semibold tracking-tight text-ink no-underline">
          <img src={`${gameRootOf(route)}icon-192.png`} alt="" width={28} height={28} className="size-7 rounded-md" />
          <span className="truncate">{t('guide.name')}</span>
        </a>
        <div className="ml-auto flex items-center gap-2">
          <SearchButton onOpen={onOpenSearch} />
          <LanguageSwitch route={route} />
          <ThemeToggle />
          <a className="guide-button" href={gameRootOf(route)}>{t('guide.play')}</a>
        </div>
      </div>
    </header>
  );
}
