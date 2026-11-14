import { passagesFromArticle } from '../../advisor/rulesPassages';

export const plainTextOfArticle = (source: string, nameOfEntry: (id: string) => string): string =>
  passagesFromArticle(source, nameOfEntry).map(passage => passage.text).join('\n');
