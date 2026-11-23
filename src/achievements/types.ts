export interface AchievementMedalReceipt {
  medalCode: string;
  // False when the account already held this Medal, earned in another City or by an earlier try.
  earned: boolean;
}

export interface AchievementMedalClient {
  award(category: string, nameFr: string, nameEn: string): Promise<AchievementMedalReceipt>;
}
