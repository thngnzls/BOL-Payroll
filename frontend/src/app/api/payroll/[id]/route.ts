import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// DELETE /api/payroll/[id] — Delete a payroll record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await pool.query("DELETE FROM payrolls WHERE id = $1", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete payroll error:", error);
    return NextResponse.json(
      { error: "Failed to delete payroll" },
      { status: 500 },
    );
  }
}
