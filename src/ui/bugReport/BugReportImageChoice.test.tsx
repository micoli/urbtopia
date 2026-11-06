import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { prefsStore } from '../../i18n/prefsStore';
import { BugReportImageChoice } from './BugReportImageChoice';

afterEach(() => prefsStore.getState().setLanguage('en'));

const render = (props: Partial<Parameters<typeof BugReportImageChoice>[0]>) =>
  renderToStaticMarkup(<BugReportImageChoice choice="map" onChange={() => {}} map="data:image/webp;base64,AA" screen="data:image/webp;base64,BB" {...props} />);

describe('BugReportImageChoice', () => {
  it('previews the chosen image without a warning for the map alone', () => {
    const html = render({ choice: 'map' });
    expect(html).toContain('src="data:image/webp;base64,AA"');
    expect(html).not.toContain('other players');
  });

  it('warns about other players on the whole screen', () => {
    const html = render({ choice: 'screen' });
    expect(html).toContain('src="data:image/webp;base64,BB"');
    expect(html).toContain('other players');
  });

  it('shows no preview when no image is chosen', () => {
    expect(render({ choice: 'none' })).not.toContain('<img');
  });

  it('disables a capture that could not be taken, and says so when none worked', () => {
    const html = render({ choice: 'none', map: null, screen: null });
    expect(html.match(/disabled=""/g)).toHaveLength(2);
    expect(html).toContain('could not be taken');
  });

  it('is available in French', () => {
    prefsStore.getState().setLanguage('fr');
    expect(render({ choice: 'screen' })).toContain('Écran complet');
  });
});
