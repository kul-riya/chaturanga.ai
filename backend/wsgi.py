import pymysql
pymysql.install_as_MySQLdb()
from app import app  # your uploaded app.py defines Flask app variable named app
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

