from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class EmployeeBase(BaseModel):
    name: str
    experience: str
    daily_rate: float

class EmployeeCreate(EmployeeBase):
    pass

class Employee(EmployeeBase):
    id: int

    class Config:
        from_attributes = True

class AttendanceBase(BaseModel):
    employee_id: int
    week_id: str
    date: date
    status: str

class AttendanceCreate(AttendanceBase):
    pass

class Attendance(AttendanceBase):
    id: int

    class Config:
        from_attributes = True

class PayrollCalculateRequest(BaseModel):
    employee_id: int
    week_id: str
    no_of_working_days: float
    addtl_working_days: float = 0
    total_ot_hours: float = 0
    overtime_nd_hours: float = 0
    allowance: float = 0
    additional_pay: float = 0
    deduction: float = 0

class PayrollResponse(PayrollCalculateRequest):
    id: Optional[int] = None
    rate_per_day: float
    rate_per_hour: float
    basic_salary: float
    nd_per_hour: float
    nd_10pm_3am: float
    total_earnings: float
    weekly_gross: float
    ot_pay: float
    addtl_working_hrs_nd: float
    net_pay: float

    class Config:
        from_attributes = True
