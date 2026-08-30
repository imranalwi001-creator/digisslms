import * as fs from "node:fs";
import * as path from "node:path";
import { createClient } from "@supabase/supabase-js";

// Load .env
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      process.env[key] = val;
    }
  }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

async function updateBrand() {
  if (!supabaseUrl || !supabaseKey) {
    console.log("Supabase env not found or not required");
    return;
  }
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from("site_settings")
    .update({ brand_name: "Digisschool", tagline: "Digital Islamic Boarding School LMS" })
    .eq("id", "default");

  if (error) {
    console.log("Error updating supabase site_settings:", error.message);
  } else {
    console.log("✅ Successfully updated site_settings in Supabase to Digisschool!");
  }
}

updateBrand().catch(console.error);
