import { artistOffer, fameCeiling, feeOfArtist, previewGathering, type Artist, type Building, type GameState } from '../../core';
import { t } from '../../i18n/t';
import { RadioChipGroup } from '../common/RadioChipGroup';
import { UrbsAmount } from '../common/UrbsAmount';
import { FameStars } from './FameStars';

interface ArtistChoiceProps {
  state: GameState;
  building: Building;
  artist: Artist;
  onChange: (id: string) => void;
}

export function ArtistChoice({ state, building, artist, onChange }: ArtistChoiceProps) {
  const options = artistOffer(state, building).map(candidate => {
    const preview = previewGathering(state, building, candidate);
    const net = preview.revenue - preview.cost;
    return {
      value: candidate.id,
      label: (
        <>
          <span className="artist-name">{candidate.name}</span>
          <FameStars fame={candidate.fame} />
          <small>{t(`show.kind.${candidate.kind}`)} · {t('show.fee')} <UrbsAmount value={feeOfArtist(candidate)} /></small>
          <small data-net={net >= 0 ? 'gain' : 'loss'}>{net >= 0 ? '+' : '−'}<UrbsAmount value={Math.abs(net)} /></small>
        </>
      ),
    };
  });
  return (
    <>
      <p className="tourism-label">{t('show.artist')}</p>
      <RadioChipGroup className="artist-choice" label={t('show.artist')} options={options} value={artist.id} onChange={onChange} />
      <p className="tourism-help">{t('show.ceiling').replace('{fame}', `${fameCeiling(state)}`)}</p>
    </>
  );
}
