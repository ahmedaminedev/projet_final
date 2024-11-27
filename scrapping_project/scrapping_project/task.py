# myapp/tasks.py

from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime

def my_task():
    print("Executing my task at", datetime.now())
