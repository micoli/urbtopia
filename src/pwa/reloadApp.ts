const UPDATE_WAIT_MS = 3000;

interface ReloadDeps {
  checkForUpdate: () => Promise<unknown>;
  reload: () => void;
}

const browserDeps: ReloadDeps = {
  checkForUpdate: async () => (await navigator.serviceWorker?.getRegistration())?.update(),
  reload: () => window.location.reload(),
};

export async function reloadApp({ checkForUpdate, reload }: ReloadDeps = browserDeps): Promise<void> {
  const patience = new Promise((resolve) => setTimeout(resolve, UPDATE_WAIT_MS));
  await Promise.race([checkForUpdate().catch(() => {}), patience]);
  reload();
}
