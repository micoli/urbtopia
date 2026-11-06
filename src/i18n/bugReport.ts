const texts = {
  'bugReport.title': ['Report an issue', 'Signaler un bug/évolution'],
  'bugReport.settings.description': ['Tell us what went wrong or what evolution you need, with a screenshot and your city.', 'Dites-nous ce qui ne va pas ou votre demande d\'évolution, avec une capture et votre ville.'],
  'bugReport.settings.needEmail': ['Attach an email to your account to report a bug.', 'Attachez un e-mail à votre compte pour signaler un bug.'],
  'bugReport.description.label': ['What happened?', "Que s'est-il passé ?"],
  'bugReport.description.placeholder': ['Describe the problem and how to see it again', 'Décrivez le problème et comment le revoir'],
  'bugReport.image.label': ['Screenshot', "Capture d'écran"],
  'bugReport.image.map': ['Map only', 'Carte seule'],
  'bugReport.image.screen': ['Whole screen', 'Écran complet'],
  'bugReport.image.none': ['No image', "Pas d'image"],
  'bugReport.image.warning': ["The whole screen can show other players' names and messages. Check the preview.", "L'écran complet peut montrer les noms et messages d'autres joueurs. Vérifiez l'aperçu."],
  'bugReport.image.preview': ['Preview of the screenshot', "Aperçu de la capture d'écran"],
  'bugReport.image.unavailable': ['The screenshot could not be taken.', "La capture d'écran n'a pas pu être prise."],
  'bugReport.city': ['Attach my city', 'Joindre ma ville'],
  'bugReport.city.tooLarge': ['Your city is too large to be attached.', 'Votre ville est trop grande pour être jointe.'],
  'bugReport.sent.title': ['Sent with your report', 'Envoyé avec votre signalement'],
  'bugReport.sent.context': ['Game version, device, screen size and recent errors', "Version du jeu, appareil, taille d'écran et dernières erreurs"],
  'bugReport.sent.camera': ['Camera position, zoom and level', 'Position, zoom et niveau de la caméra'],
  'bugReport.send': ['Send', 'Envoyer'],
  'bugReport.retry': ['Retry', 'Réessayer'],
  'bugReport.cancel': ['Cancel', 'Annuler'],
  'bugReport.sending': ['Sending…', 'Envoi…'],
  'bugReport.done': ['Thank you, your report was sent.', 'Merci, votre signalement est envoyé.'],
  'bugReport.error.offline': ['The report could not be sent. Check your connection and retry.', "Le signalement n'a pas pu être envoyé. Vérifiez votre connexion et réessayez."],
  'bugReport.error.rateLimited': ['You sent too many reports today. Try again later.', "Vous avez envoyé trop de signalements aujourd'hui. Réessayez plus tard."],
  'bugReport.error.invalid': ['The report was refused. Shorten the text or remove the attachments.', "Le signalement a été refusé. Raccourcissez le texte ou retirez les pièces jointes."],
  'bugReport.error.account': ['Attach an email to your account to report a bug.', 'Attachez un e-mail à votre compte pour signaler un bug.'],
  'bugReport.error.unknown': ['Something went wrong. Retry in a moment.', "Un problème est survenu. Réessayez dans un instant."],
  'bugReport.inbox.title': ['My reports', 'Mes signalements'],
  'bugReport.inbox.empty': ['You have not sent any report.', "Vous n'avez envoyé aucun signalement."],
  'bugReport.inbox.new': ['New reply', 'Nouvelle réponse'],
  'bugReport.inbox.back': ['Back', 'Retour'],
  'bugReport.status.new': ['Sent', 'Envoyé'],
  'bugReport.status.seen': ['Seen', 'Vu'],
  'bugReport.status.resolved': ['Resolved', 'Résolu'],
  'bugReport.thread.you': ['You', 'Vous'],
  'bugReport.thread.team': ['Team', 'Équipe'],
  'bugReport.reply.placeholder': ['Write a reply', 'Écrire une réponse'],
  'bugReport.reply.send': ['Reply', 'Répondre'],
  'bugReport.reply.closed': ['This report is resolved. Send a new report if the problem comes back.', 'Ce signalement est résolu. Envoyez-en un nouveau si le problème revient.'],
  'bugReport.error.closed': ['This report is resolved: it takes no more replies.', "Ce signalement est résolu : il n'accepte plus de réponses."],
} as const;

export type BugReportMessageKey = keyof typeof texts;

export function bugReportMessages(language: 'en' | 'fr'): Record<BugReportMessageKey, string> {
  const index = language === 'en' ? 0 : 1;
  const entries = Object.entries(texts).map(([key, pair]) => [key, pair[index]]);
  return Object.fromEntries(entries) as Record<BugReportMessageKey, string>;
}
