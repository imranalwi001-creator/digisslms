import { getTursoClient } from "../src/lib/turso";

async function main() {
  const db = getTursoClient();
  const extraCols = [
    { name: "headline", type: "TEXT" },
    { name: "banner_url", type: "TEXT" },
    { name: "social_link", type: "TEXT" },
    { name: "leaderboard_opt_out", type: "INTEGER DEFAULT 0" },
    { name: "level", type: "TEXT DEFAULT 'info'" },
  ];

  for (const col of extraCols) {
    try {
      await db.execute(`ALTER TABLE profiles ADD COLUMN ${col.name} ${col.type};`);
      console.log(`✅ Added column ${col.name} to profiles`);
    } catch {
      // already exists
    }
  }

  try {
    await db.execute("ALTER TABLE announcements ADD COLUMN level TEXT DEFAULT 'info';");
    console.log("✅ Added column level to announcements");
  } catch {
    // already exists
  }

  console.log("🎉 Profile columns check complete!");
}

main().catch(console.error);
