from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, Boolean
from sqlalchemy.orm import relationship
from .database import Base

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    experience = Column(String) # Labor, Tiler, Foreman, etc.
    daily_rate = Column(Float)

    attendances = relationship("Attendance", back_populates="employee")
    payrolls = relationship("Payroll", back_populates="employee")

class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    week_id = Column(String, index=True) # e.g. "2023-W42"
    date = Column(Date)
    status = Column(String) # Present, Absent

    employee = relationship("Employee", back_populates="attendances")

class Payroll(Base):
    __tablename__ = "payrolls"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    week_id = Column(String, index=True)
    
    # Inputs & metrics
    no_of_working_days = Column(Float, default=0)
    addtl_working_days = Column(Float, default=0)
    total_ot_hours = Column(Float, default=0)
    overtime_nd_hours = Column(Float, default=0) # Overtime (Hour with ND)
    
    allowance = Column(Float, default=0)
    additional_pay = Column(Float, default=0)
    deduction = Column(Float, default=0)
    
    # Stored Calculations
    rate_per_day = Column(Float)
    rate_per_hour = Column(Float)
    basic_salary = Column(Float)
    nd_per_hour = Column(Float)
    nd_10pm_3am = Column(Float)
    total_earnings = Column(Float)
    weekly_gross = Column(Float)
    ot_pay = Column(Float)
    addtl_working_hrs_nd = Column(Float)
    net_pay = Column(Float)

    employee = relationship("Employee", back_populates="payrolls")
