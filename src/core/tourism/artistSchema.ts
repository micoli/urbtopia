import { z } from 'zod';

export const ARTIST_KINDS = ['solo', 'group'] as const;

const artistSchema = z.strictObject({
  id: z.string().regex(/^artist-\d{3}$/),
  name: z.string().regex(/\S/, 'must not be blank'),
  kind: z.enum(ARTIST_KINDS),
  // 1 (local act) to 5 (headliner).
  fame: z.int().min(1).max(5),
});

export const artistsSchema = z
  .strictObject({ $schema: z.string().optional(), artists: z.array(artistSchema).min(1) })
  .meta({ title: 'Artists', description: 'assets/defs/tourism/artists.json: the invented Artists who play the Concert hall, with their Fame.' });

export type Artist = z.infer<typeof artistSchema>;
