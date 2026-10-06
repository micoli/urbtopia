import {t} from '../../../i18n/t';

export function SlowedLines({count}: { count: number }) {
    return <p>{t('eco.slowedLines')}: {count}</p>;
}
