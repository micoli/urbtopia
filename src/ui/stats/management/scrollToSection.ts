export function scrollToSection(container: HTMLElement | null, id: string): void {
    container?.querySelector(`#${id}`)?.scrollIntoView({block: 'start', behavior: 'smooth'});
}
