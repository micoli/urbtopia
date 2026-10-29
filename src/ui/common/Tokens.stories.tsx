import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import tokensCss from '../../tokens.css?raw';

interface Token {
  name: string;
  value: string;
}

const TOKENS: Token[] = [...tokensCss.matchAll(/^\s*(--[\w-]+):\s*([^;]+);/gm)].map(([, name, value]) => ({ name: name!, value: value!.trim() }));

const startingWith = (...prefixes: string[]) => TOKENS.filter(({ name }) => prefixes.some((prefix) => name.startsWith(prefix)));

const sample: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', fontSize: 13 };
const label: CSSProperties = { width: 240, fontFamily: 'monospace', opacity: 0.85 };
const value: CSSProperties = { fontFamily: 'monospace', opacity: 0.55 };

function Group({ title, tokens, preview }: { title: string; tokens: Token[]; preview: (token: Token) => CSSProperties }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h3 style={{ margin: '0 0 8px' }}>{title}</h3>
      {tokens.map((token) => (
        <div key={token.name} style={sample}>
          <span style={label}>{token.name}</span>
          <span style={{ ...preview(token), flex: 'none' }} aria-hidden="true" />
          <span style={value}>{token.value}</span>
        </div>
      ))}
    </section>
  );
}

const swatch = (token: Token): CSSProperties => ({ width: 56, height: 28, borderRadius: 6, background: `var(${token.name})`, border: '1px solid var(--white-a20)' });
const radius = (token: Token): CSSProperties => ({ width: 56, height: 36, borderRadius: `var(${token.name})`, background: 'var(--color-accent)' });
const space = (token: Token): CSSProperties => ({ width: `var(${token.name})`, height: 12, background: 'var(--color-accent)' });
const shadow = (token: Token): CSSProperties => ({ width: 56, height: 36, borderRadius: 8, background: 'var(--color-surface-solid)', boxShadow: `var(${token.name})` });
const duration = (token: Token): CSSProperties => ({ width: token.name.startsWith('--duration') ? 'calc(var(' + token.name + ') / 4)' : 56, height: 8, borderRadius: 4, background: 'var(--color-accent)' });

function Tokens() {
  return (
    <div style={{ width: 'min(900px, 92vw)', boxSizing: 'border-box', padding: 24, borderRadius: 'var(--radius-2xl)', background: 'var(--color-surface-solid)', color: 'var(--color-text)' }}>
      <p style={{ opacity: 0.7, marginTop: 0 }}>Read from <code>src/tokens.css</code>. The game CSS uses these names only: <code>build/cssTokens.test.ts</code> fails on a literal colour, radius or font size.</p>
      <Group title="Surface and text colours" tokens={startingWith('--color-surface', '--color-text', '--color-on', '--color-ink')} preview={swatch} />
      <Group title="Accent and status colours" tokens={startingWith('--color-accent', '--color-positive', '--color-warning', '--color-danger', '--color-caution', '--color-alert', '--color-info')} preview={swatch} />
      <Group title="Chain, series and venue colours" tokens={startingWith('--color-chain', '--color-series', '--color-felt', '--color-card', '--color-urbs', '--swatch')} preview={swatch} />
      <Group title="Overlays on dark surfaces" tokens={startingWith('--white-a', '--black-a')} preview={swatch} />
      <Group title="Radii" tokens={startingWith('--radius')} preview={radius} />
      <Group title="Spacing" tokens={startingWith('--space')} preview={space} />
      <Group title="Shadows" tokens={startingWith('--shadow')} preview={shadow} />
      <Group title="Motion" tokens={startingWith('--duration', '--ease')} preview={duration} />
      <section style={{ marginBottom: 32 }}>
        <h3 style={{ margin: '0 0 8px' }}>Font sizes and weights</h3>
        {startingWith('--font-size', '--font-weight').map((token) => (
          <div key={token.name} style={sample}>
            <span style={label}>{token.name}</span>
            <span style={token.name.startsWith('--font-size') ? { fontSize: `var(${token.name})` } : { fontWeight: `var(${token.name})`, fontSize: 'var(--font-size-lg)' }}>Urbix city</span>
            <span style={value}>{token.value}</span>
          </div>
        ))}
      </section>
    </div>
  );
}

const meta = { title: 'Design/Tokens', component: Tokens, parameters: { layout: 'padded' } } satisfies Meta<typeof Tokens>;

export default meta;
type Story = StoryObj<typeof meta>;

export const All: Story = {};
