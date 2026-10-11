import { AvatarImage } from './AvatarImage';

interface HandleLabelProps {
    userId: string;
    handle: string;
    avatar: string | null;
}

export function HandleLabel({userId, handle, avatar}: HandleLabelProps) {
    return <span className="handle-label">
        <AvatarImage userId={userId} avatar={avatar}/>
        <strong>{handle}</strong>
    </span>;
}
