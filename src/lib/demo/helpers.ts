import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { DEMO_USER_ID } from "./constants";

export function isDemoRequest(req: NextRequest): boolean {
  return req.nextUrl.searchParams.get("demo") === "true";
}

export function createDemoClient() {
  return createServiceClient();
}

export function getDemoUserId() {
  return DEMO_USER_ID;
}
