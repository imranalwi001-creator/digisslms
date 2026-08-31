import { fetchAdminData, buildStudentRows } from "../src/lib/lms";

async function main() {
  const data = await fetchAdminData();
  const rows = buildStudentRows(data);
  console.log(`fetchAdminData retrieved ${rows.length} students:`);
  rows.forEach((r, i) => {
    console.log(` ${i + 1}. ${r.displayName} (${r.email}) - Role: ${r.role} - Grade: ${r.grade}`);
  });
}

main().catch(console.error);
