import { FIXTURES, fixtureFootprint, type ExampleFixture } from '../../core';
import { t } from '../../i18n/t';
import { Icon } from '../common/Icon';
import { useFixturePicture } from '../venue/useFixturePicture';

interface InteriorExamplePieceProps {
  fixture: ExampleFixture;
}

const FRONT_ICONS = ['arrowDown', 'arrowLeft', 'arrowUp', 'arrowRight'] as const;

// One Fixture of an example, on the tiles it covers, with an arrow toward the side it faces.
export function InteriorExamplePiece({ fixture }: InteriorExamplePieceProps) {
  const picture = useFixturePicture(fixture.type);
  const { width, depth } = fixtureFootprint(fixture.type, fixture.rotation);
  const name = t(`venue.fixture.${fixture.type}`);
  return (
    <div
      className={`interior-example__piece interior-example__piece--${FIXTURES[fixture.type].role ?? 'other'}`}
      style={{ gridColumn: `${fixture.x + 1} / span ${width}`, gridRow: `${fixture.y + 1} / span ${depth}` }}
      title={name}
      role="img"
      aria-label={name}
    >
      {picture ? <img src={picture} alt="" draggable={false} /> : null}
      <Icon name={FRONT_ICONS[fixture.rotation]} className="interior-example__front" />
    </div>
  );
}
