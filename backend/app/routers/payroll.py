from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db
from ..core.payroll_calc import calculate_payroll

router = APIRouter()

@router.post("/calculate", response_model=schemas.PayrollResponse)
def calculate_payroll_preview(request: schemas.PayrollCalculateRequest, db: Session = Depends(get_db)):
    employee = db.query(models.Employee).filter(models.Employee.id == request.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    response = calculate_payroll(request, employee)
    return response

@router.post("/save", response_model=schemas.PayrollResponse)
def save_payroll(request: schemas.PayrollCalculateRequest, db: Session = Depends(get_db)):
    employee = db.query(models.Employee).filter(models.Employee.id == request.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    calculated = calculate_payroll(request, employee)
    
    # Save to db
    db_payroll = models.Payroll(**calculated.model_dump(exclude={"id"}))
    
    db.add(db_payroll)
    db.commit()
    db.refresh(db_payroll)
    
    calculated.id = db_payroll.id
    return calculated

@router.get("/", response_model=List[schemas.PayrollResponse])
def get_payrolls(week_id: str = None, db: Session = Depends(get_db)):
    query = db.query(models.Payroll)
    if week_id:
        query = query.filter(models.Payroll.week_id == week_id)
    payrolls = query.all()
    
    responses = []
    for p in payrolls:
        # Convert ORM to schema
        responses.append(schemas.PayrollResponse.model_validate(p))
    return responses
