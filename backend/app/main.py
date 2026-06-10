from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import employees, attendance, payroll

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Payroll System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(employees.router, prefix="/api/employees", tags=["employees"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["attendance"])
app.include_router(payroll.router, prefix="/api/payroll", tags=["payroll"])

@app.get("/")
def read_root():
    return {"message": "Welcome to BEAM of LIGHTS Builders Payroll API"}
