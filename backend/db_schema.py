"""
Database schema initialization module.
Creates all required tables if they don't exist.
"""
from database_config import db_config
from pymysql import Error


def create_schema():
    """Create database and all tables if they don't exist"""
    connection = None
    try:
        # First, connect without database to create it if needed
        connection = db_config.get_connection_no_db()
        
        with connection.cursor() as cursor:
            # Create database if it doesn't exist
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_config.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            connection.commit()
        
        connection.close()
        
        # Now connect to the database
        connection = db_config.get_connection()
        
        with connection.cursor() as cursor:
            # 1. Create players table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS players (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(50) NOT NULL,
                    rating INT,
                    country VARCHAR(50),
                    INDEX idx_name (name),
                    INDEX idx_rating (rating)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            
            # 2. Create openings table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS openings (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    eco_code VARCHAR(10),
                    name VARCHAR(100) NOT NULL,
                    move_sequence TEXT,
                    INDEX idx_eco (eco_code)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            
            # 3. Create games table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS games (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    player_white_id INT NOT NULL,
                    player_black_id INT NOT NULL,
                    result ENUM('1-0','0-1','1/2-1/2','*') DEFAULT '*',
                    opening_id INT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (player_white_id) REFERENCES players(id) ON DELETE CASCADE,
                    FOREIGN KEY (player_black_id) REFERENCES players(id) ON DELETE CASCADE,
                    FOREIGN KEY (opening_id) REFERENCES openings(id) ON DELETE SET NULL,
                    INDEX idx_white (player_white_id),
                    INDEX idx_black (player_black_id),
                    INDEX idx_result (result),
                    INDEX idx_created (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            
            # 4. Create positions table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS positions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    fen TEXT NOT NULL,
                    game_id INT NOT NULL,
                    move_number INT NOT NULL,
                    is_check BOOLEAN DEFAULT FALSE,
                    winner VARCHAR(10),
                    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_fen_game (fen(500), game_id),
                    INDEX idx_game (game_id),
                    INDEX idx_move_number (move_number),
                    INDEX idx_winner (winner)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            
            # 5. Create moves table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS moves (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    game_id INT NOT NULL,
                    move_number INT NOT NULL,
                    move_notation VARCHAR(20) NOT NULL,
                    from_square VARCHAR(5) NOT NULL,
                    to_square VARCHAR(5) NOT NULL,
                    promotion VARCHAR(2),
                    position_id INT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
                    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE,
                    INDEX idx_game (game_id),
                    INDEX idx_move_number (move_number),
                    INDEX idx_position (position_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            
            # 6. Create engine_analysis table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS engine_analysis (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    position_id INT NOT NULL,
                    eval_score INT,
                    depth INT,
                    best_move VARCHAR(20),
                    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE,
                    INDEX idx_position (position_id),
                    INDEX idx_eval (eval_score)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            
            connection.commit()
            print("Database schema created successfully!")
            return True
            
    except Error as e:
        if connection:
            connection.rollback()
        print(f"Error creating schema: {e}")
        raise
    finally:
        if connection:
            connection.close()


def check_tables_exist():
    """Check if all required tables exist"""
    connection = None
    try:
        connection = db_config.get_connection()
        with connection.cursor() as cursor:
            cursor.execute("SHOW TABLES")
            existing_tables = {row[f'Tables_in_{db_config.database}'] for row in cursor.fetchall()}
            
            required_tables = {'players', 'games', 'openings', 'positions', 'moves', 'engine_analysis'}
            missing_tables = required_tables - existing_tables
            
            return {
                'all_exist': len(missing_tables) == 0,
                'existing_tables': list(existing_tables),
                'missing_tables': list(missing_tables),
                'required_tables': list(required_tables)
            }
    except Error as e:
        print(f"Error checking tables: {e}")
        raise
    finally:
        if connection:
            connection.close()


if __name__ == "__main__":
    # For testing schema creation
    create_schema()
    result = check_tables_exist()
    print(f"Tables check: {result}")

