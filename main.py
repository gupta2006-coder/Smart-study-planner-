from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import mysql.connector
import bcrypt
from typing import Optional
import os

app = FastAPI()
# Request Models
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class TaskCreate(BaseModel):
    user_id: int
    title: str
    subject: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[str] = "Medium"

class TaskUpdate(BaseModel):
    status: Optional[str] = None
    title: Optional[str] = None
    priority: Optional[str] = None
    subject: Optional[str] = None
    due_date: Optional[str] = None

# Database Configuration
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": ""  # XAMPP default
}
DB_NAME = "study_planner"

def setup_database():
    """Ensures the database and required tables exist."""
    try:
        # Connect without database first to create it if missing
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Create database
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
        cursor.execute(f"USE {DB_NAME}")
        
        # Create users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                bio TEXT,
                school VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Add bio and school if they don't exist (for existing databases)
        cursor.execute("SHOW COLUMNS FROM users LIKE 'bio'")
        if not cursor.fetchone():
            cursor.execute("ALTER TABLE users ADD COLUMN bio TEXT")
        
        cursor.execute("SHOW COLUMNS FROM users LIKE 'school'")
        if not cursor.fetchone():
            cursor.execute("ALTER TABLE users ADD COLUMN school VARCHAR(255)")

        # Create tasks table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                subject VARCHAR(100),
                due_date DATE,
                priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
                status ENUM('Pending', 'Completed') DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        
        conn.commit()
        cursor.close()
        conn.close()
        print(f"Database '{DB_NAME}' initialized successfully.")
    except mysql.connector.Error as err:
        print(f"Critical Error during Database Setup: {err}")
        print("Please ensure XAMPP (MySQL) is running.")

def get_db_connection():
    try:
        return mysql.connector.connect(
            **DB_CONFIG,
            database=DB_NAME
        )
    except mysql.connector.Error as err:
        print(f"Error connecting to database: {err}")
        return None

# Run setup on module load
setup_database()

@app.post("/api/register")
def register(user: RegisterRequest):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cursor = conn.cursor(dictionary=True)
    
    # Check if email exists
    cursor.execute("SELECT id FROM users WHERE email = %s", (user.email,))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # hashed_password = pwd_context.hash(user.password)
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    cursor.execute("INSERT INTO users (name, email, password) VALUES (%s, %s, %s)",
                   (user.name, user.email, hashed_password))
    conn.commit()
    cursor.close()
    conn.close()
    
    return {"success": True, "message": "Registration successful"}

@app.post("/api/login")
def login(user: LoginRequest):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
        
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, name, email, password FROM users WHERE email = %s", (user.email,))
    db_user = cursor.fetchone()
    
    cursor.close()
    conn.close()

    if not db_user or not bcrypt.checkpw(user.password.encode('utf-8'), db_user['password'].encode('utf-8')):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    return {
        "success": True, 
        "user": {
            "id": db_user['id'], 
            "name": db_user['name'], 
            "email": db_user['email']
        }
    }

# Task Endpoints
@app.get("/api/tasks/{user_id}")
def get_tasks(user_id: int):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, title, subject, due_date as date, priority, status FROM tasks WHERE user_id = %s ORDER BY created_at DESC", (user_id,))
    tasks = cursor.fetchall()
    
    # Format date for frontend
    for task in tasks:
        if task['date']:
            task['date'] = task['date'].strftime('%Y-%m-%d')
            
    cursor.close()
    conn.close()
    return tasks

@app.post("/api/tasks")
def create_task(task: TaskCreate):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO tasks (user_id, title, subject, due_date, priority) VALUES (%s, %s, %s, %s, %s)",
        (task.user_id, task.title, task.subject, task.due_date, task.priority)
    )
    conn.commit()
    task_id = cursor.lastrowid
    cursor.close()
    conn.close()
    
    return {"success": True, "id": task_id}

@app.patch("/api/tasks/{task_id}")
def update_task(task_id: int, task: TaskUpdate):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cursor = conn.cursor()
    
    updates = []
    params = []
    
    if task.status is not None:
        updates.append("status = %s")
        params.append(task.status)
    if task.title is not None:
        updates.append("title = %s")
        params.append(task.title)
    if task.priority is not None:
        updates.append("priority = %s")
        params.append(task.priority)
    if task.subject is not None:
        updates.append("subject = %s")
        params.append(task.subject)
    if task.due_date is not None:
        updates.append("due_date = %s")
        params.append(task.due_date)
        
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    query = f"UPDATE tasks SET {', '.join(updates)} WHERE id = %s"
    params.append(task_id)
    
    cursor.execute(query, tuple(params))
    conn.commit()
    cursor.close()
    conn.close()
    
    return {"success": True}

@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: int):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tasks WHERE id = %s", (task_id,))
    conn.commit()
    cursor.close()
    conn.close()
    
    return {"success": True}

# Mount static files *after* defining API routes
if os.path.exists("css") and os.path.exists("js"):
    app.mount("/css", StaticFiles(directory="css"), name="css")
    app.mount("/js", StaticFiles(directory="js"), name="js")

# Mount root directory last for html files
app.mount("/", StaticFiles(directory=".", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
