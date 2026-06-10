from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter()

@router.get("/", response_model=List[schemas.Attendance])
def read_attendances(week_id: str = None, db: Session = Depends(get_db)):
    query = db.query(models.Attendance)
    if week_id:
        query = query.filter(models.Attendance.week_id == week_id)
    return query.all()

@router.post("/", response_model=schemas.Attendance)
def create_attendance(attendance: schemas.AttendanceCreate, db: Session = Depends(get_db)):
    # Check if exists, maybe update
    db_attendance = db.query(models.Attendance).filter(
        models.Attendance.employee_id == attendance.employee_id,
        models.Attendance.date == attendance.date
    ).first()
    
    if db_attendance:
        db_attendance.status = attendance.status
        db_attendance.week_id = attendance.week_id
    else:
        db_attendance = models.Attendance(**attendance.model_dump())
        db.add(db_attendance)
        
    db.commit()
    db.refresh(db_attendance)
    return db_attendance
