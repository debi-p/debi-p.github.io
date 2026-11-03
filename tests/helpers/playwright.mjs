export async function loadPlaywright() {
  const specifier = process.env.PLAYWRIGHT_MODULE_PATH || 'playwright';
  return import(specifier);
}
