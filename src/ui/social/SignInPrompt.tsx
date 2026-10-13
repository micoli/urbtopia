import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';

interface SignInPromptProps {
    onSignIn: () => void;
}

export function SignInPrompt({onSignIn}: SignInPromptProps) {
    return <div className="social-sign-in">
        <p>{t('social.signIn.text')}</p>
        <ActionButton variant="primary" onClick={onSignIn}>{t('social.signIn.button')}</ActionButton>
    </div>;
}
