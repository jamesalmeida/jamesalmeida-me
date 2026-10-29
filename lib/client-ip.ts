// An IP worth storing on a blocked conversation. Rate limiting still uses the raw
// header value (lib/rate-limit.ts); this drops "unknown" and anything that is
// not one address, so a header can't write arbitrary text into the admin view.

const IPV4 =
  /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

function isIpv6(value: string): boolean {
  if (!/^[0-9a-f:]+$/.test(value) || !value.includes(":")) return false;
  const halves = value.split("::");
  if (halves.length > 2) return false;
  const groups = halves.flatMap((half) => (half ? half.split(":") : []));
  if (groups.length === 0 || groups.length > 8) return false;
  if (groups.some((group) => group.length === 0 || group.length > 4)) return false;
  if (halves.length === 1) return groups.length === 8;
  return groups.length < 8;
}

/** A single IPv4 or IPv6 address, or undefined when the header isn't one. */
export function parseClientIp(value: string | null | undefined): string | undefined {
  const ip = value?.trim().toLowerCase() ?? "";
  if (!ip || ip === "unknown" || ip.length > 45) return undefined;
  if (IPV4.test(ip)) return ip;
  if (ip.startsWith("::ffff:")) {
    const mapped = ip.slice("::ffff:".length);
    if (IPV4.test(mapped)) return ip;
  }
  if (isIpv6(ip)) return ip;
  return undefined;
}
