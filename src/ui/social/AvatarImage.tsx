import { avatarOf } from '../../social/avatar';

interface AvatarImageProps {
    userId: string;
    avatar: string | null;
}

export function AvatarImage({userId, avatar}: AvatarImageProps) {
    return <img className="avatar" src={`${import.meta.env.BASE_URL}avatars/${avatarOf(userId, avatar)}.png`} alt="" width={40} height={40} loading="lazy" draggable={false}/>;
}
