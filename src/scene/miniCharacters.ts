export const MINI_CHARACTER_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f'] as const;

export const MINI_CHARACTER_FILES: readonly string[] = (['female', 'male'] as const).flatMap(gender => MINI_CHARACTER_LETTERS.map(letter => `character-${gender}-${letter}`));
