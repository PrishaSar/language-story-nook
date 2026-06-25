import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    runtime: "Node.js",
    nodeVersion: process.version,
    time: new Date().toISOString(),
  });
}
