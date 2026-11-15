import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_HEADERS, adminDenied, authenticateAdmin } from "@/lib/visitors/auth";

// Provides the browser login challenge. The page and reporting handler ALSO
// authorize at the data boundary; bypassing Proxy cannot expose the report.
export async function proxy(request: NextRequest) {
  const auth = await authenticateAdmin(request.headers.get("authorization"));
  if (auth !== "authorized") return adminDenied(auth);
  const response = NextResponse.next();
  for (const [name, value] of Object.entries(ADMIN_HEADERS)) response.headers.set(name, value);
  return response;
}

export const config = { matcher: ["/admin/visitors"] };
