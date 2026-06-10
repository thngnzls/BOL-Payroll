import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { ensureTables } from "@/lib/schema";

// GET /api/employees/[id] — Get a single employee by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await ensureTables();
    const { id } = await params;
    const { rows } = await pool.query(
      "SELECT id, name, experience, daily_rate FROM employees WHERE id = $1",
      [id],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("GET /api/employees/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee" },
      { status: 500 },
    );
  }
}

// PUT /api/employees/[id] — Update an employee
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, experience, daily_rate } = body;

    const { rows } = await pool.query(
      "UPDATE employees SET name = $1, experience = $2, daily_rate = $3 WHERE id = $4 RETURNING *",
      [name, experience, daily_rate, id],
    );

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Update employee error:", error);
    return NextResponse.json(
      { error: "Failed to update employee" },
      { status: 500 },
    );
  }
}

// DELETE /api/employees/[id] — Delete an employee
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await pool.query("DELETE FROM employees WHERE id = $1", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete employee error:", error);
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 500 },
    );
  }
}
