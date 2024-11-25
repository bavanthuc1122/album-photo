import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()
load_dotenv('.env.local')

def get_db_connection(db_name='cusomerthuc'):
    try:
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', '1122'),
            database=db_name
        )
        return connection
    except Error as e:
        print(f"Error connecting to MySQL {db_name}: {e}")
        return None

def execute_query(query, params=None, db_name='photo_albums'):
    connection = None
    cursor = None
    try:
        connection = get_db_connection(db_name)
        if not connection:
            return None

        cursor = connection.cursor(dictionary=True)
        cursor.execute(query, params or ())
        
        if query.strip().upper().startswith(('SELECT', 'SHOW')):
            result = cursor.fetchall()
            return result
        else:
            connection.commit()
            return cursor.rowcount

    except Error as e:
        print(f"Error executing query: {e}")
        if connection:
            connection.rollback()
        return None
        
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()