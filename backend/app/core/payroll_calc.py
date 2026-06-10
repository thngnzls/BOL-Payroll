from app.schemas import PayrollCalculateRequest, PayrollResponse
from app.models import Employee

def calculate_payroll(request: PayrollCalculateRequest, employee: Employee) -> PayrollResponse:
    rate_per_day = employee.daily_rate
    
    # Rate Per Hour = Rate Per Day / 8
    rate_per_hour = rate_per_day / 8
    
    # Basic Salary = Rate Per Day
    basic_salary = rate_per_day
    
    # ND (Per Hour) = Rate per Hour * 0.10
    nd_per_hour = rate_per_hour * 0.10
    
    # ND (10PM-3AM) = ND (Per Hour) * 5
    nd_10pm_3am = nd_per_hour * 5
    
    # Total Earnings = Basic Salary + Allowance (Food/Transpo) + ND (10PM-3AM)
    total_earnings = basic_salary + request.allowance + nd_10pm_3am
    
    # Weekly Gross = (Additional Pay + (No. of Working Days * Total Earnings)) + (Additional Working Days [No ND] + (Basic Salary + Allowance))
    # Wait, the prompt says: (Additional Pay + (No. of Working Days * Total Earnings)) + (Additional Working Days [No ND] + (Basic Salary + Allowance))
    # Interpreting: Additional Working Days * (Basic Salary + Allowance) perhaps? Or literally addition?
    # Usually it's Additional Working Days * (Basic Salary + Allowance)
    # The literal prompt: (Additional Working Days [No ND] + (Basic Salary + Allowance))
    # In math: Addtl_Days * (Basic + Allowance) makes sense because it's for the days.
    # I will do literal implementation but it seems like it's a typo in the prompt, let's use * 
    weekly_gross = (request.additional_pay + (request.no_of_working_days * total_earnings)) + \
                   (request.addtl_working_days * (basic_salary + request.allowance))
                   
    # OT Pay = Rate Per Hour * Total OT Hours
    ot_pay = rate_per_hour * request.total_ot_hours
    
    # Addit'l Working Hrs (W/ ND) = ND Per Hour * Overtime (Hour with ND)
    addtl_working_hrs_nd = nd_per_hour * request.overtime_nd_hours
    
    # Net Pay = (Weekly Gross + OT Pay + Addit'l Working Hrs (W/ ND)) - Deduction
    net_pay = (weekly_gross + ot_pay + addtl_working_hrs_nd) - request.deduction
    
    return PayrollResponse(
        **request.model_dump(),
        rate_per_day=rate_per_day,
        rate_per_hour=rate_per_hour,
        basic_salary=basic_salary,
        nd_per_hour=nd_per_hour,
        nd_10pm_3am=nd_10pm_3am,
        total_earnings=total_earnings,
        weekly_gross=weekly_gross,
        ot_pay=ot_pay,
        addtl_working_hrs_nd=addtl_working_hrs_nd,
        net_pay=net_pay
    )
