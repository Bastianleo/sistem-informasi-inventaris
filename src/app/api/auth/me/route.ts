import { getCurrentUser } from "@/lib/auth";
import { jsonOk } from "@/lib/api-response";

export async function GET() {
  const user = await getCurrentUser();
  return jsonOk(user);
}
