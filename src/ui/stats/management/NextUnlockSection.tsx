import {t} from '../../../i18n/t';
import {SectionHeading} from '../../common/SectionHeading';
import {NextUnlock} from '../NextUnlock';

export function NextUnlockSection() {
    return <section id="next-unlock" className="eco-wide">
        <SectionHeading>{t('eco.nextUnlock')}</SectionHeading>
        <NextUnlock/>
    </section>;
}
