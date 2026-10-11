import { useEffect, useRef } from 'react';
import { t } from '../../../../i18n/t';
import type { Message } from '../../../../social/types';

interface MessageListProps {
    messages: Message[];
    loading: boolean;
}

export function MessageList({messages, loading}: MessageListProps) {
    const end = useRef<HTMLLIElement>(null);
    useEffect(() => {
        end.current?.scrollIntoView?.({block: 'nearest'});
    }, [messages.length]);
    if (!loading && messages.length === 0) return <p className="note note--muted">{t('friends.conversation.empty')}</p>;
    return <ul className="friends-messages" aria-live="polite">
        {messages.map(message => <li key={message.id} className="friends-message" data-from-me={message.fromMe}>
            <span>{message.body}</span>
            <time dateTime={new Date(message.at).toISOString()}>{new Date(message.at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</time>
        </li>)}
        <li ref={end} aria-hidden="true"/>
    </ul>;
}
