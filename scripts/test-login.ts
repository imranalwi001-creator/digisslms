import { tursoLogin } from "../src/lib/turso-auth";

async function main() {
  console.log("Testing admin login with username 'admin' and password 'bissmillah'...");
  const res1 = await tursoLogin("admin", "bissmillah");
  console.log("Result 1 (admin):", res1);

  console.log("\nTesting admin login with email 'admin@continuum.lms'...");
  const res2 = await tursoLogin("admin@continuum.lms", "bissmillah");
  console.log("Result 2 (admin@continuum.lms):", res2);
}

main().catch(console.error);
