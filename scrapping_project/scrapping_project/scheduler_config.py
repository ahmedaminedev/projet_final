# scheduler_config.py

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.mongodb import MongoDBJobStore
from pymongo import MongoClient

# Configuration de MongoDB
mongo_client = MongoClient('mongodb://localhost:27017/')
jobstore = MongoDBJobStore(database='scrapping', collection='apscheduler_jobs', client=mongo_client)

# Configuration du scheduler APScheduler
scheduler = BackgroundScheduler(jobstores={'default': jobstore})
scheduler.start()
