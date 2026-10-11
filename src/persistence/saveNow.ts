// Writes the save at once, if it changed: the trade steps need it before they call the server (ADR 0028).
export const saveNowHandle = { current: (): void => {} };
