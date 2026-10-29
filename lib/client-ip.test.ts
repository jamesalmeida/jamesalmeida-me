import { describe, expect, it } from "vitest";
import { parseClientIp } from "./client-ip";

describe("parseClientIp", () => {
  it("keeps a single IPv4 or IPv6 address", () => {
    expect(parseClientIp(" 203.0.113.4 ")).toBe("203.0.113.4");
    expect(parseClientIp("10.0.0.1")).toBe("10.0.0.1");
    expect(parseClientIp("255.255.255.255")).toBe("255.255.255.255");
    expect(parseClientIp("2001:DB8::1")).toBe("2001:db8::1");
    expect(parseClientIp("::1")).toBe("::1");
    expect(parseClientIp("::ffff:192.0.2.1")).toBe("::ffff:192.0.2.1");
  });

  it("drops missing, unknown, and anything that is not one address", () => {
    expect(parseClientIp(undefined)).toBeUndefined();
    expect(parseClientIp("")).toBeUndefined();
    expect(parseClientIp("unknown")).toBeUndefined();
    expect(parseClientIp("1.2.3.4, 10.0.0.1")).toBeUndefined();
    expect(parseClientIp("256.1.1.1")).toBeUndefined();
    expect(parseClientIp("1.2.3")).toBeUndefined();
    expect(parseClientIp("203.0.113.4 extra")).toBeUndefined();
    expect(parseClientIp("<script>")).toBeUndefined();
    expect(parseClientIp("::::")).toBeUndefined();
    expect(parseClientIp("notes")).toBeUndefined();
  });
});
