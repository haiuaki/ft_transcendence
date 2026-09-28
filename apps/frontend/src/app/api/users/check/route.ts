import { NextResponse } from "next/server";
import { Pool } from "pg";

export const db = new Pool({
  connectionString: "postgresql://nlienard:trytry@localhost:5432/transcendence",
});

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    if (!email)
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
    const result = await db.query(`SELECT id FROM users WHERE email = $1 LIMIT 1`, [email])
    const exists = result.rows.length > 0;
    if (exists)
        return NextResponse.json({ exists: true }, { status: 200 });
    return NextResponse.json({ error: false }, { status: 200 });
}