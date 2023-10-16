from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
import redis

app = Flask(__name__, static_url_path='/static')
CORS(app)

# Redis setup
redis_client = redis.StrictRedis(host='localhost', port=6379, db=0)

# SQLAlchemy setup
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Import routes and models after creating the app and db instances
from routes import stock_routes
from models import stock_query
from utils import helpers

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)







