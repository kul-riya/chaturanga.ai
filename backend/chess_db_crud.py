"""
CRUD operations class for Chess Database.
Provides methods for creating, reading, updating, and deleting records
across all database tables: players, games, openings, positions, moves, engine_analysis.
"""
from database_config import db_config
from pymysql import Error
from typing import Optional, Dict, List, Any


class ChessDBCRUD:
    """CRUD operations for Chess Database"""
    
    def __init__(self):
        self.db_config = db_config
    
    def _execute_query(self, query: str, params: tuple = None, fetch: bool = False, fetch_one: bool = False):
        """Execute a database query with proper error handling"""
        connection = None
        try:
            connection = self.db_config.get_connection()
            with connection.cursor() as cursor:
                cursor.execute(query, params or ())
                if fetch:
                    result = cursor.fetchall()
                elif fetch_one:
                    result = cursor.fetchone()
                else:
                    result = cursor.rowcount
                connection.commit()
                return result
        except Error as e:
            if connection:
                connection.rollback()
            print(f"Database error: {e}")
            raise
        finally:
            if connection:
                connection.close()
    
    # ==================== PLAYERS CRUD ====================
    
    def create_player(self, name: str, rating: Optional[int] = None, country: Optional[str] = None) -> int:
        """Create a new player and return the player ID"""
        query = "INSERT INTO players (name, rating, country) VALUES (%s, %s, %s)"
        params = (name, rating, country)
        self._execute_query(query, params)
        connection = self.db_config.get_connection()
        try:
            with connection.cursor() as cursor:
                result = cursor.fetchone()
                print(result)
                return result['id']
        finally:
            connection.close()
    
    def get_player(self, player_id: int) -> Optional[Dict]:
        """Get a player by ID"""
        query = "SELECT * FROM players WHERE id = %s"
        return self._execute_query(query, (player_id,), fetch_one=True)
    
    def get_all_players(self) -> List[Dict]:
        """Get all players"""
        query = "SELECT * FROM players ORDER BY id"
        return self._execute_query(query, fetch=True)
    
    def update_player(self, player_id: int, name: Optional[str] = None, 
                     rating: Optional[int] = None, country: Optional[str] = None) -> bool:
        """Update a player's information"""
        updates = []
        params = []
        if name is not None:
            updates.append("name = %s")
            params.append(name)
        if rating is not None:
            updates.append("rating = %s")
            params.append(rating)
        if country is not None:
            updates.append("country = %s")
            params.append(country)
        
        if not updates:
            return False
        
        params.append(player_id)
        query = f"UPDATE players SET {', '.join(updates)} WHERE id = %s"
        self._execute_query(query, tuple(params))
        return True
    
    def delete_player(self, player_id: int) -> bool:
        """Delete a player (cascade will handle related records)"""
        query = "DELETE FROM players WHERE id = %s"
        rows = self._execute_query(query, (player_id,))
        return rows > 0
    
    # ==================== OPENINGS CRUD ====================
    
    def create_opening(self, eco_code: str, name: str, move_sequence: Optional[str] = None) -> int:
        """Create a new opening and return the opening ID"""
        query = "INSERT INTO openings (eco_code, name, move_sequence) VALUES (%s, %s, %s)"
        params = (eco_code, name, move_sequence)
        self._execute_query(query, params)
        connection = self.db_config.get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT LAST_INSERT_ID() as id")
                result = cursor.fetchone()
                return result['id']
        finally:
            connection.close()
    
    def get_opening(self, opening_id: int) -> Optional[Dict]:
        """Get an opening by ID"""
        query = "SELECT * FROM openings WHERE id = %s"
        return self._execute_query(query, (opening_id,), fetch_one=True)
    
    def get_all_openings(self) -> List[Dict]:
        """Get all openings"""
        query = "SELECT * FROM openings ORDER BY eco_code"
        return self._execute_query(query, fetch=True)
    
    def update_opening(self, opening_id: int, eco_code: Optional[str] = None,
                      name: Optional[str] = None, move_sequence: Optional[str] = None) -> bool:
        """Update an opening"""
        updates = []
        params = []
        if eco_code is not None:
            updates.append("eco_code = %s")
            params.append(eco_code)
        if name is not None:
            updates.append("name = %s")
            params.append(name)
        if move_sequence is not None:
            updates.append("move_sequence = %s")
            params.append(move_sequence)
        
        if not updates:
            return False
        
        params.append(opening_id)
        query = f"UPDATE openings SET {', '.join(updates)} WHERE id = %s"
        self._execute_query(query, tuple(params))
        return True
    
    def delete_opening(self, opening_id: int) -> bool:
        """Delete an opening"""
        query = "DELETE FROM openings WHERE id = %s"
        rows = self._execute_query(query, (opening_id,))
        return rows > 0
    
    # ==================== GAMES CRUD ====================
    
    def create_game(self, player_white_id: int, player_black_id: int, 
               result: str = '*', opening_id: Optional[int] = None) -> int:
        """Create a new game and return the game ID"""
        connection = None
        try:
            connection = self.db_config.get_connection()
            with connection.cursor() as cursor:
                # Insert the game
                query = """INSERT INTO games (player_white_id, player_black_id, result, opening_id) 
                        VALUES (%s, %s, %s, %s)"""
                params = (player_white_id, player_black_id, result, opening_id)
                cursor.execute(query, params)
                
                # Get the last insert ID in the SAME connection
                cursor.execute("SELECT LAST_INSERT_ID() as id")
                result = cursor.fetchone()
                game_id = result['id']
                
                connection.commit()
                return game_id
        except Error as e:
            if connection:
                connection.rollback()
            print(f"Database error creating game: {e}")
            raise
        finally:
            if connection:
                connection.close()
    
    def get_game(self, game_id: int) -> Optional[Dict]:
        """Get a game by ID"""
        query = """SELECT g.*, 
                          pw.name as white_player_name, 
                          pb.name as black_player_name,
                          o.name as opening_name
                   FROM games g
                   LEFT JOIN players pw ON g.player_white_id = pw.id
                   LEFT JOIN players pb ON g.player_black_id = pb.id
                   LEFT JOIN openings o ON g.opening_id = o.id
                   WHERE g.id = %s"""
        return self._execute_query(query, (game_id,), fetch_one=True)
    
    def get_all_games(self) -> List[Dict]:
        """Get all games with player names"""
        query = """SELECT g.*, 
                          pw.name as white_player_name, 
                          pb.name as black_player_name,
                          o.name as opening_name
                   FROM games g
                   LEFT JOIN players pw ON g.player_white_id = pw.id
                   LEFT JOIN players pb ON g.player_black_id = pb.id
                   LEFT JOIN openings o ON g.opening_id = o.id
                   ORDER BY g.created_at DESC"""
        return self._execute_query(query, fetch=True)
    
    def update_game(self, game_id: int, result: Optional[str] = None, 
                   opening_id: Optional[int] = None) -> bool:
        """Update a game"""
        updates = []
        params = []
        if result is not None:
            updates.append("result = %s")
            params.append(result)
        if opening_id is not None:
            updates.append("opening_id = %s")
            params.append(opening_id)
        
        if not updates:
            return False
        
        params.append(game_id)
        query = f"UPDATE games SET {', '.join(updates)} WHERE id = %s"
        self._execute_query(query, tuple(params))
        return True
    
    def delete_game(self, game_id: int) -> bool:
        """Delete a game (cascade will handle related moves and positions)"""
        query = "DELETE FROM games WHERE id = %s"
        rows = self._execute_query(query, (game_id,))
        return rows > 0
    
    # ==================== POSITIONS CRUD ====================
    
    def create_position(self, fen: str, game_id: int, move_number: int,
                       is_check: bool = False, winner: Optional[str] = None) -> int:
        """Create or get a position by FEN. Returns position ID"""
        # First check if position exists
        query = "SELECT id FROM positions WHERE fen = %s LIMIT 1"
        existing = self._execute_query(query, (fen,), fetch_one=True)
        
        if existing:
            return existing['id']
        
        # Create new position
        query = """INSERT INTO positions (fen, game_id, move_number, is_check, winner) 
                   VALUES (%s, %s, %s, %s, %s)"""
        params = (fen, game_id, move_number, is_check, winner)
        self._execute_query(query, params)
        connection = self.db_config.get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT LAST_INSERT_ID() as id")
                result = cursor.fetchone()
                return result['id']
        finally:
            connection.close()
    
    def get_position(self, position_id: int) -> Optional[Dict]:
        """Get a position by ID"""
        query = "SELECT * FROM positions WHERE id = %s"
        return self._execute_query(query, (position_id,), fetch_one=True)
    
    def get_position_by_fen(self, fen: str) -> Optional[Dict]:
        """Get a position by FEN string"""
        query = "SELECT * FROM positions WHERE fen = %s LIMIT 1"
        return self._execute_query(query, (fen,), fetch_one=True)
    
    def get_positions_by_game(self, game_id: int) -> List[Dict]:
        """Get all positions for a game"""
        query = "SELECT * FROM positions WHERE game_id = %s ORDER BY move_number"
        return self._execute_query(query, (game_id,), fetch=True)
    
    def update_position(self, position_id: int, is_check: Optional[bool] = None,
                       winner: Optional[str] = None) -> bool:
        """Update a position"""
        updates = []
        params = []
        if is_check is not None:
            updates.append("is_check = %s")
            params.append(is_check)
        if winner is not None:
            updates.append("winner = %s")
            params.append(winner)
        
        if not updates:
            return False
        
        params.append(position_id)
        query = f"UPDATE positions SET {', '.join(updates)} WHERE id = %s"
        self._execute_query(query, tuple(params))
        return True
    
    def delete_position(self, position_id: int) -> bool:
        """Delete a position"""
        query = "DELETE FROM positions WHERE id = %s"
        rows = self._execute_query(query, (position_id,))
        return rows > 0
    
    # ==================== MOVES CRUD ====================
    
    def create_move(self, game_id: int, move_number: int, move_notation: str,
                   from_square: str, to_square: str, position_id: int,
                   promotion: Optional[str] = None) -> int:
        """Create a new move and return the move ID"""
        query = """INSERT INTO moves (game_id, move_number, move_notation, from_square, 
                                     to_square, promotion, position_id) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s)"""
        params = (game_id, move_number, move_notation, from_square, to_square, promotion, position_id)
        self._execute_query(query, params)
        connection = self.db_config.get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT LAST_INSERT_ID() as id")
                result = cursor.fetchone()
                return result['id']
        finally:
            connection.close()
    
    def get_move(self, move_id: int) -> Optional[Dict]:
        """Get a move by ID"""
        query = "SELECT * FROM moves WHERE id = %s"
        return self._execute_query(query, (move_id,), fetch_one=True)
    
    def get_moves_by_game(self, game_id: int) -> List[Dict]:
        """Get all moves for a game"""
        query = "SELECT * FROM moves WHERE game_id = %s ORDER BY move_number"
        return self._execute_query(query, (game_id,), fetch=True)
    
    def update_move(self, move_id: int, move_notation: Optional[str] = None,
                   promotion: Optional[str] = None) -> bool:
        """Update a move"""
        updates = []
        params = []
        if move_notation is not None:
            updates.append("move_notation = %s")
            params.append(move_notation)
        if promotion is not None:
            updates.append("promotion = %s")
            params.append(promotion)
        
        if not updates:
            return False
        
        params.append(move_id)
        query = f"UPDATE moves SET {', '.join(updates)} WHERE id = %s"
        self._execute_query(query, tuple(params))
        return True
    
    def delete_move(self, move_id: int) -> bool:
        """Delete a move"""
        query = "DELETE FROM moves WHERE id = %s"
        rows = self._execute_query(query, (move_id,))
        return rows > 0
    
    # ==================== ENGINE_ANALYSIS CRUD ====================
    
    def create_engine_analysis(self, position_id: int, eval_score: int,
                              depth: Optional[int] = None, best_move: Optional[str] = None) -> int:
        """Create a new engine analysis and return the ID"""
        query = """INSERT INTO engine_analysis (position_id, eval_score, depth, best_move) 
                   VALUES (%s, %s, %s, %s)"""
        params = (position_id, eval_score, depth, best_move)
        self._execute_query(query, params)
        connection = self.db_config.get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT LAST_INSERT_ID() as id")
                result = cursor.fetchone()
                return result['id']
        finally:
            connection.close()
    
    def get_engine_analysis(self, analysis_id: int) -> Optional[Dict]:
        """Get an engine analysis by ID"""
        query = "SELECT * FROM engine_analysis WHERE id = %s"
        return self._execute_query(query, (analysis_id,), fetch_one=True)
    
    def get_engine_analysis_by_position(self, position_id: int) -> Optional[Dict]:
        """Get engine analysis for a position"""
        query = "SELECT * FROM engine_analysis WHERE position_id = %s ORDER BY depth DESC LIMIT 1"
        return self._execute_query(query, (position_id,), fetch_one=True)
    
    def get_all_engine_analyses(self) -> List[Dict]:
        """Get all engine analyses"""
        query = "SELECT * FROM engine_analysis ORDER BY id DESC"
        return self._execute_query(query, fetch=True)
    
    def update_engine_analysis(self, analysis_id: int, eval_score: Optional[int] = None,
                              depth: Optional[int] = None, best_move: Optional[str] = None) -> bool:
        """Update an engine analysis"""
        updates = []
        params = []
        if eval_score is not None:
            updates.append("eval_score = %s")
            params.append(eval_score)
        if depth is not None:
            updates.append("depth = %s")
            params.append(depth)
        if best_move is not None:
            updates.append("best_move = %s")
            params.append(best_move)
        
        if not updates:
            return False
        
        params.append(analysis_id)
        query = f"UPDATE engine_analysis SET {', '.join(updates)} WHERE id = %s"
        self._execute_query(query, tuple(params))
        return True
    
    def delete_engine_analysis(self, analysis_id: int) -> bool:
        """Delete an engine analysis"""
        query = "DELETE FROM engine_analysis WHERE id = %s"
        rows = self._execute_query(query, (analysis_id,))
        return rows > 0
    
    # ==================== UTILITY METHODS ====================
    
    def record_move_and_position(self, game_id: int, fen: str, move_number: int,
                                move_notation: str, from_square: str, to_square: str,
                                is_check: bool = False, winner: Optional[str] = None,
                                promotion: Optional[str] = None) -> Dict[str, Any]:
        """
        Convenience method to record both a position and a move in one transaction.
        Returns dict with position_id and move_id.
        """
        connection = self.db_config.get_connection()
        try:
            with connection.cursor() as cursor:
                # Check if position exists
                cursor.execute("SELECT id FROM positions WHERE fen = %s LIMIT 1", (fen,))
                position = cursor.fetchone()
                
                if position:
                    position_id = position['id']
                else:
                    # Create new position
                    cursor.execute(
                        """INSERT INTO positions (fen, game_id, move_number, is_check, winner) 
                           VALUES (%s, %s, %s, %s, %s)""",
                        (fen, game_id, move_number, is_check, winner)
                    )
                    cursor.execute("SELECT LAST_INSERT_ID() as id")
                    position_id = cursor.fetchone()['id']
                
                # Create move
                cursor.execute(
                    """INSERT INTO moves (game_id, move_number, move_notation, from_square, 
                                         to_square, promotion, position_id) 
                       VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                    (game_id, move_number, move_notation, from_square, to_square, promotion, position_id)
                )
                cursor.execute("SELECT LAST_INSERT_ID() as id")
                move_id = cursor.fetchone()['id']
                
                connection.commit()
                return {'position_id': position_id, 'move_id': move_id}
        except Error as e:
            connection.rollback()
            print(f"Error recording move and position: {e}")
            raise
        finally:
            connection.close()

