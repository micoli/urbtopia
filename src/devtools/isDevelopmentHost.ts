export function isDevelopmentHost(hostname: string): boolean {
  if (['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname)) return true;
  const octets = hostname.split('.');
  if (octets.length !== 4 || !octets.every((octet) => /^\d{1,3}$/.test(octet) && Number(octet) <= 255)) return false;
  return octets[0] === '10' || (octets[0] === '192' && octets[1] === '168');
}
