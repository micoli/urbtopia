import { createContext, type MouseEvent } from 'react';

export interface FixtureLink {
  href: string;
  onClick?: (event: MouseEvent) => void;
}

// How a page of the Codex links to the page of a Fixture: a path in the Guide, a view in the game.
export const FixtureLinkContext = createContext<(pageId: string) => FixtureLink>(pageId => ({ href: `#${pageId}` }));
