"""
Database configuration and connection management.
Uses PyMySQL (Python equivalent of mysql2/promise).
"""
import os
from dotenv import load_dotenv
import pymysql
from pymysql import Error

# Load environment variables
load_dotenv()

class DatabaseConfig:
    """Database configuration class"""
    
    def __init__(self):
        self.host = os.getenv('DB_HOST', 'localhost')
        self.port = int(os.getenv('DB_PORT', 3306))
        self.user = os.getenv('DB_USER', 'root')
        self.password = os.getenv('DB_PASSWORD', '')
        self.database = os.getenv('DB_NAME', 'chess_db')
        self.charset = 'utf8mb4'
    
    def get_connection(self):
        """Create and return a database connection"""
        try:
            connection = pymysql.connect(
                host=self.host,
                port=self.port,
                user=self.user,
                password=self.password,
                database=self.database,
                charset=self.charset,
                cursorclass=pymysql.cursors.DictCursor,
                autocommit=False
            )
            return connection
        except Error as e:
            print(f"Error connecting to MySQL: {e}")
            raise
    
    def get_connection_no_db(self):
        """Get connection without database (for initial setup)"""
        try:
            connection = pymysql.connect(
                host=self.host,
                port=self.port,
                user=self.user,
                password=self.password,
                charset=self.charset,
                cursorclass=pymysql.cursors.DictCursor,
                autocommit=False
            )
            return connection
        except Error as e:
            print(f"Error connecting to MySQL: {e}")
            raise

# Global instance
db_config = DatabaseConfig()

