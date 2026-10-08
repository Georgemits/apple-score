import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Liveness + database check for load balancers and uptime monitors. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", database: "ok", time: new Date().toISOString() });
  } catch (error) {
    console.error("health:", error);
    return NextResponse.json(
      { status: "degraded", database: "unreachable", time: new Date().toISOString() },
      { status: 503 }
    );
  }
}
