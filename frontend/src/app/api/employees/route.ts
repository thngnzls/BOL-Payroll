import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureTables } from "@/lib/schema";

// GET /api/employees — List all employees
export async function GET() {
  try {
    await ensureTables();
    const { rows } = await pool.query(
      "SELECT id, name, experience, daily_rate FROM employees ORDER BY id"
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error("GET /api/employees error:", error);
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}

// POST /api/employees — Create a new employee
export async function POST(request: NextRequest) {
  try {
    await ensureTables();
    const body = await request.json();
    const { name, experience, daily_rate } = body;

    if (!name || !experience || daily_rate == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { rows } = await pool.query(
      "INSERT INTO employees (name, experience, daily_rate) VALUES ($1, $2, $3) RETURNING id, name, experience, daily_rate",
      [name, experience, daily_rate]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error("POST /api/employees error:", error);
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}
