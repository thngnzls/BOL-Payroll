import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureTables } from "@/lib/schema";

// GET /api/attendance?week_id=2026-W24 — List attendances (optionally filtered by week)
export async function GET(request: NextRequest) {
  try {
    await ensureTables();
    const { searchParams } = new URL(request.url);
    const week_id = searchParams.get("week_id");

    let query = "SELECT id, employee_id, week_id, date, status FROM attendances";
    const values: string[] = [];

    if (week_id) {
      query += " WHERE week_id = $1";
      values.push(week_id);
    }

    query += " ORDER BY date, employee_id";
    const { rows } = await pool.query(query, values);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("GET /api/attendance error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}

// POST /api/attendance — Create or update attendance record
export async function POST(request: NextRequest) {
  try {
    await ensureTables();
    const body = await request.json();
    const { employee_id, week_id, date, status } = body;

    if (!employee_id || !week_id || !date || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Upsert: insert or update on conflict (employee_id, date)
    const { rows } = await pool.query(
      `INSERT INTO attendances (employee_id, week_id, date, status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (employee_id, date)
       DO UPDATE SET status = EXCLUDED.status, week_id = EXCLUDED.week_id
       RETURNING id, employee_id, week_id, date, status`,
      [employee_id, week_id, date, status]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error("POST /api/attendance error:", error);
    return NextResponse.json({ error: "Failed to save attendance" }, { status: 500 });
  }
}
