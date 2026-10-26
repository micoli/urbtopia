import { useShowcase } from '../common/hooks';
import { VisitBannerView } from './VisitBannerView';

export function VisitBanner() {
    const visit = useShowcase(s => s.visit);
    const actions = useShowcase(s => s.actions);
    if (visit.kind !== 'visiting' || !actions) return null;
    return <VisitBannerView handle={visit.handle} cityName={visit.cityName} onLeave={actions.leaveVisit}/>;
}
