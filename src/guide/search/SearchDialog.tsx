import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { t } from '../../i18n/t';
import { docsRootOf, hrefOf, type GuideRoute } from '../routes';
import { loadSearchIndex } from './loadSearchIndex';
import type { SearchItem } from './searchIndex';
import { searchResults } from './searchResults';

interface SearchDialogProps {
  route: GuideRoute;
  onClose: () => void;
}

export function SearchDialog({ route, onClose }: SearchDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [items, setItems] = useState<readonly SearchItem[]>([]);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const results = searchResults(items, query);

  useEffect(() => {
    dialog.current?.showModal();
    loadSearchIndex(docsRootOf(route), route.language).then(setItems, () => setFailed(true));
  }, [route]);

  const open = (item: SearchItem | undefined) => {
    if (item) location.href = hrefOf(route, item.path);
  };

  const navigate = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown') setActive(index => Math.min(index + 1, results.length - 1));
    else if (event.key === 'ArrowUp') setActive(index => Math.max(index - 1, 0));
    else if (event.key === 'Enter') open(results[active]);
    else return;
    event.preventDefault();
  };

  return (
    <dialog
      ref={dialog}
      aria-label={t('guide.search')}
      className="mx-auto mt-[12vh] w-[min(40rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
      onClose={onClose}
      onClick={event => { if (event.target === dialog.current) dialog.current.close(); }}
    >
      <input
        autoFocus
        type="search"
        className="w-full border-b border-line bg-transparent px-5 py-4 text-base outline-none"
        placeholder={t('guide.searchPlaceholder')}
        aria-label={t('guide.search')}
        aria-controls="guide-search-results"
        value={query}
        onChange={event => { setQuery(event.target.value); setActive(0); }}
        onKeyDown={navigate}
      />
      <ul id="guide-search-results" role="listbox" className="m-0 max-h-[60vh] list-none overflow-y-auto p-2">
        {failed && <li className="px-3 py-6 text-center text-sm text-muted">{t('codex.loadFailed')}</li>}
        {!failed && query.trim() !== '' && results.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">{t('guide.noResults')}</li>}
        {results.map((item, index) => (
          <li key={item.path} role="option" aria-selected={index === active}>
            <a
              className="block rounded-lg px-3 py-2 text-ink no-underline aria-selected:bg-panel"
              aria-selected={index === active}
              href={hrefOf(route, item.path)}
              onMouseEnter={() => setActive(index)}
            >
              <span className="block text-xs text-muted">{item.section}</span>
              <span className="block font-medium">{item.title}</span>
              {item.summary && <span className="block truncate text-sm text-muted">{item.summary}</span>}
            </a>
          </li>
        ))}
      </ul>
    </dialog>
  );
}
