"""
API endpoint handlers for Chess Database.
Handles POST /api/move, GET /api/metadata, POST /api/run-query, GET /api/sample-queries
"""
from flask import jsonify, request
from chess_db_crud import ChessDBCRUD
from db_schema import check_tables_exist
from database_config import db_config
from pymysql import Error


crud = ChessDBCRUD()


# Predefined analytics queries
SAMPLE_QUERIES = {
    "games_by_result": {
        "name": "Games by Result",
        "description": "Count games grouped by result",
        "query": """
            SELECT result, COUNT(*) as count 
            FROM games 
            GROUP BY result 
            ORDER BY count DESC
        """
    },
    "top_players_by_wins": {
        "name": "Top Players by Wins",
        "description": "Players with most wins (as white or black)",
        "query": """
            SELECT p.id, p.name, p.rating, p.country,
                   COUNT(CASE WHEN (g.player_white_id = p.id AND g.result = '1-0') 
                                  OR (g.player_black_id = p.id AND g.result = '0-1') 
                        THEN 1 END) as wins
            FROM players p
            LEFT JOIN games g ON (p.id = g.player_white_id OR p.id = g.player_black_id)
            GROUP BY p.id, p.name, p.rating, p.country
            HAVING wins > 0
            ORDER BY wins DESC
            LIMIT 10
        """
    },
    "average_moves_per_game": {
        "name": "Average Moves per Game",
        "description": "Calculate average number of moves per game",
        "query": """
            SELECT 
                COUNT(DISTINCT g.id) as total_games,
                COUNT(m.id) as total_moves,
                ROUND(COUNT(m.id) / COUNT(DISTINCT g.id), 2) as avg_moves_per_game
            FROM games g
            LEFT JOIN moves m ON g.id = m.game_id
        """
    },
    "check_positions_analysis": {
        "name": "Check Positions Analysis",
        "description": "Analyze how many positions resulted in check",
        "query": """
            SELECT 
                is_check,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM positions), 2) as percentage
            FROM positions
            GROUP BY is_check
        """
    },
    "most_common_openings": {
        "name": "Most Common Openings",
        "description": "Find the most frequently played openings",
        "query": """
            SELECT o.id, o.eco_code, o.name, COUNT(g.id) as games_played
            FROM openings o
            LEFT JOIN games g ON o.id = g.opening_id
            GROUP BY o.id, o.eco_code, o.name
            HAVING games_played > 0
            ORDER BY games_played DESC
            LIMIT 10
        """
    },
    "games_timeline": {
        "name": "Games Timeline",
        "description": "Count games created by date",
        "query": """
            SELECT 
                DATE(created_at) as game_date,
                COUNT(*) as games_count
            FROM games
            GROUP BY DATE(created_at)
            ORDER BY game_date DESC
            LIMIT 30
        """
    },
    "move_distribution": {
        "name": "Move Distribution",
        "description": "Distribution of moves by promotion piece",
        "query": """
            SELECT 
                COALESCE(promotion, 'none') as promotion_type,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM moves), 2) as percentage
            FROM moves
            GROUP BY promotion
            ORDER BY count DESC
        """
    },
    "positions_ending_games": {
        "name": "Positions Ending Games",
        "description": "Positions where games ended (have winner)",
        "query": """
            SELECT 
                winner,
                COUNT(*) as count
            FROM positions
            WHERE winner IS NOT NULL
            GROUP BY winner
            ORDER BY count DESC
        """
    }
}


def handle_record_move():
    """Handle POST /api/move - Record a move and position from frontend"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['game_id', 'fen', 'move_number', 'move_notation', 'from_square', 'to_square']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                "success": False,
                "error": f"Missing required fields: {', '.join(missing_fields)}"
            }), 400
        
        # Extract data
        game_id = data['game_id']
        fen = data['fen']
        move_number = data['move_number']
        move_notation = data['move_notation']
        from_square = data['from_square']
        to_square = data['to_square']
        is_check = data.get('is_check', False)
        winner = data.get('winner', None)
        promotion = data.get('promotion', None)
        
        # Record move and position
        result = crud.record_move_and_position(
            game_id=game_id,
            fen=fen,
            move_number=move_number,
            move_notation=move_notation,
            from_square=from_square,
            to_square=to_square,
            is_check=is_check,
            winner=winner,
            promotion=promotion
        )
        
        return jsonify({
            "success": True,
            "message": "Move and position recorded successfully",
            "data": result
        }), 201
        
    except Error as e:
        return jsonify({
            "success": False,
            "error": f"Database error: {str(e)}"
        }), 500
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Error recording move: {str(e)}"
        }), 500


def handle_get_metadata():
    """Handle GET /api/metadata - Return all table names, columns, and row counts"""
    try:
        connection = db_config.get_connection()
        metadata = {}
        
        try:
            with connection.cursor() as cursor:
                # Get all tables
                cursor.execute("SHOW TABLES")
                tables = [row[f'Tables_in_{db_config.database}'] for row in cursor.fetchall()]
                
                for table in tables:
                    # Get columns
                    cursor.execute(f"DESCRIBE {table}")
                    columns = cursor.fetchall()
                    column_info = [
                        {
                            "name": col['Field'],
                            "type": col['Type'],
                            "null": col['Null'],
                            "key": col['Key'],
                            "default": str(col['Default']) if col['Default'] is not None else None,
                            "extra": col['Extra']
                        }
                        for col in columns
                    ]
                    
                    # Get row count
                    cursor.execute(f"SELECT COUNT(*) as count FROM {table}")
                    row_count = cursor.fetchone()['count']
                    
                    metadata[table] = {
                        "columns": column_info,
                        "row_count": row_count
                    }
        
        finally:
            connection.close()
        
        return jsonify({
            "success": True,
            "database": db_config.database,
            "metadata": metadata
        }), 200
        
    except Error as e:
        return jsonify({
            "success": False,
            "error": f"Database error: {str(e)}"
        }), 500
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Error fetching metadata: {str(e)}"
        }), 500


def handle_run_query():
    """Handle POST /api/run-query - Execute arbitrary SQL queries"""
    try:
        data = request.json
        
        if not data or 'query' not in data:
            return jsonify({
                "success": False,
                "error": "Missing 'query' field in request body"
            }), 400
        
        query = data['query'].strip()
        
        # Security: Prevent destructive operations (optional safety check)
        destructive_keywords = ['DROP', 'TRUNCATE', 'DELETE', 'ALTER', 'CREATE', 'GRANT', 'REVOKE']
        if any(keyword in query.upper() for keyword in destructive_keywords):
            # For production, you might want to be more strict
            # For now, we'll allow it but log it
            pass
        
        # Validate query is not empty
        if not query:
            return jsonify({
                "success": False,
                "error": "Query cannot be empty"
            }), 400
        
        connection = db_config.get_connection()
        
        try:
            with connection.cursor() as cursor:
                # Execute query
                cursor.execute(query)
                
                # Try to fetch results (works for SELECT)
                try:
                    results = cursor.fetchall()
                    connection.commit()
                    return jsonify({
                        "success": True,
                        "query": query,
                        "row_count": len(results),
                        "data": results
                    }), 200
                except Exception:
                    # If fetch fails, it's likely an INSERT/UPDATE/DELETE
                    connection.commit()
                    affected_rows = cursor.rowcount
                    return jsonify({
                        "success": True,
                        "query": query,
                        "affected_rows": affected_rows,
                        "message": "Query executed successfully"
                    }), 200
        
        finally:
            connection.close()
        
    except Error as e:
        return jsonify({
            "success": False,
            "error": f"Database error: {str(e)}",
            "query": data.get('query', '')
        }), 500
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Error executing query: {str(e)}",
            "query": data.get('query', '')
        }), 500


def handle_get_sample_queries():
    """Handle GET /api/sample-queries - Return list of predefined analytics queries"""
    try:
        # Format queries for response
        queries_list = [
            {
                "id": query_id,
                "name": query_info["name"],
                "description": query_info["description"],
                "query": query_info["query"].strip()
            }
            for query_id, query_info in SAMPLE_QUERIES.items()
        ]
        
        return jsonify({
            "success": True,
            "count": len(queries_list),
            "queries": queries_list
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Error fetching sample queries: {str(e)}"
        }), 500


def handle_create_player():
    """Handle POST /api/player - Create a new player"""
    try:
        data = request.json
        
        if not data or 'name' not in data:
            return jsonify({
                "success": False,
                "error": "Missing required field: name"
            }), 400
        
        player_id = crud.create_player(
            name=data['name'],
            rating=data.get('rating'),
            country=data.get('country')
        )
        
        return jsonify({
            "success": True,
            "message": "Player created successfully",
            "data": {"id": player_id}
        }), 201
        
    except Error as e:
        return jsonify({
            "success": False,
            "error": f"Database error: {str(e)}"
        }), 500
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Error creating player: {str(e)}"
        }), 500


def handle_get_player(player_id):
    """Handle GET /api/player/<id> - Get a player by ID"""
    try:
        player = crud.get_player(int(player_id))
        
        if not player:
            return jsonify({
                "success": False,
                "error": "Player not found"
            }), 404
        
        return jsonify({
            "success": True,
            "data": player
        }), 200
        
    except ValueError:
        return jsonify({
            "success": False,
            "error": "Invalid player ID"
        }), 400
    except Error as e:
        return jsonify({
            "success": False,
            "error": f"Database error: {str(e)}"
        }), 500
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Error fetching player: {str(e)}"
        }), 500


def handle_get_all_players():
    """Handle GET /api/players - Get all players"""
    try:
        players = crud.get_all_players()
        
        return jsonify({
            "success": True,
            "count": len(players),
            "data": players
        }), 200
        
    except Error as e:
        return jsonify({
            "success": False,
            "error": f"Database error: {str(e)}"
        }), 500
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Error fetching players: {str(e)}"
        }), 500


def handle_ensure_computer_player():
    """Handle POST /api/ensure-computer - Ensure computer player with ID 1 exists"""
    try:
        connection = db_config.get_connection()
        try:
            with connection.cursor() as cursor:
                # Check if player with ID 1 exists
                cursor.execute("SELECT id, name FROM players WHERE id = 1")
                existing = cursor.fetchone()
                
                if existing:
                    # Player ID 1 exists, check if it's Computer
                    if existing['name'] != 'Computer':
                        # Update name to Computer
                        cursor.execute("UPDATE players SET name = 'Computer' WHERE id = 1")
                        connection.commit()
                    return jsonify({
                        "success": True,
                        "message": "Computer player (ID 1) exists",
                        "data": {"id": 1, "name": "Computer"}
                    }), 200
                else:
                    # Player ID 1 doesn't exist, we need to create it
                    # But auto-increment will give next ID, so we need a different approach
                    # Check total count
                    cursor.execute("SELECT COUNT(*) as count FROM players")
                    count = cursor.fetchone()['count']
                    
                    if count == 0:
                        # No players exist, create first one which will get ID 1
                        player_id = crud.create_player(name="Computer")
                        if player_id != 1:
                            # If we got a different ID, we need to handle this
                            # For now, just return the ID we got
                            return jsonify({
                                "success": True,
                                "message": "Computer player created",
                                "data": {"id": player_id, "name": "Computer"}
                            }), 200
                        return jsonify({
                            "success": True,
                            "message": "Computer player (ID 1) created",
                            "data": {"id": 1, "name": "Computer"}
                        }), 201
                    else:
                        # Players exist but ID 1 doesn't
                        # Try to create and see what ID we get, then update player with ID 1 if possible
                        # For now, just create and return whatever ID
                        player_id = crud.create_player(name="Computer")
                        return jsonify({
                            "success": True,
                            "warning": f"Computer player created with ID {player_id} (not 1)",
                            "data": {"id": player_id, "name": "Computer"}
                        }), 201
        finally:
            connection.close()
            
    except Error as e:
        return jsonify({
            "success": False,
            "error": f"Database error: {str(e)}"
        }), 500
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Error ensuring computer player: {str(e)}"
        }), 500


def handle_create_game():
    """Handle POST /api/game - Create a new game"""
    try:
        data = request.json
        
        required_fields = ['player_white_id', 'player_black_id']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                "success": False,
                "error": f"Missing required fields: {', '.join(missing_fields)}"
            }), 400
        
        player_white_id = int(data['player_white_id'])
        player_black_id = int(data['player_black_id'])
        
        # Verify players exist before creating game
        white_player = crud.get_player(player_white_id)
        if not white_player:
            return jsonify({
                "success": False,
                "error": f"Player with ID {player_white_id} does not exist"
            }), 404
        
        black_player = crud.get_player(player_black_id)
        if not black_player:
            return jsonify({
                "success": False,
                "error": f"Player with ID {player_black_id} does not exist"
            }), 404
        
        game_id = crud.create_game(
            player_white_id=player_white_id,
            player_black_id=player_black_id,
            result=data.get('result', '*'),
            opening_id=data.get('opening_id')
        )
        
        return jsonify({
            "success": True,
            "message": "Game created successfully",
            "data": {"id": game_id}
        }), 201
        
    except ValueError:
        return jsonify({
            "success": False,
            "error": "Invalid player ID(s) - must be valid integers"
        }), 400
    except Error as e:
        return jsonify({
            "success": False,
            "error": f"Database error: {str(e)}"
        }), 500
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Error creating game: {str(e)}"
        }), 500


def handle_update_game(game_id):
    """Handle PUT /api/game/<id> - Update game result or opening"""
    try:
        data = request.json
        
        if not data:
            return jsonify({
                "success": False,
                "error": "No data provided"
            }), 400
        
        result = data.get('result')
        opening_id = data.get('opening_id')
        
        if not result and opening_id is None:
            return jsonify({
                "success": False,
                "error": "Must provide either 'result' or 'opening_id'"
            }), 400
        
        updated = crud.update_game(int(game_id), result=result, opening_id=opening_id)
        
        if not updated:
            return jsonify({
                "success": False,
                "error": "Game not found or update failed"
            }), 404
        
        return jsonify({
            "success": True,
            "message": "Game updated successfully"
        }), 200
        
    except ValueError:
        return jsonify({
            "success": False,
            "error": "Invalid game ID"
        }), 400
    except Error as e:
        return jsonify({
            "success": False,
            "error": f"Database error: {str(e)}"
        }), 500
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Error updating game: {str(e)}"
        }), 500


def handle_create_opening():
    """Handle POST /api/opening - Create a new opening"""
    try:
        data = request.json
        
        if not data or 'name' not in data:
            return jsonify({
                "success": False,
                "error": "Missing required field: name"
            }), 400
        
        opening_id = crud.create_opening(
            eco_code=data.get('eco_code'),
            name=data['name'],
            move_sequence=data.get('move_sequence')
        )
        
        return jsonify({
            "success": True,
            "message": "Opening created successfully",
            "data": {"id": opening_id}
        }), 201
        
    except Error as e:
        return jsonify({
            "success": False,
            "error": f"Database error: {str(e)}"
        }), 500
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Error creating opening: {str(e)}"
        }), 500


def handle_find_or_create_opening():
    """Handle POST /api/opening/find-or-create - Find or create opening by move sequence"""
    try:
        data = request.json
        
        if not data or 'move_sequence' not in data:
            return jsonify({
                "success": False,
                "error": "Missing required field: move_sequence"
            }), 400
        
        move_sequence = data['move_sequence'].strip()
        
        # Try to find existing opening by move sequence
        connection = db_config.get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT id, eco_code, name FROM openings WHERE move_sequence = %s LIMIT 1",
                    (move_sequence,)
                )
                existing = cursor.fetchone()
                
                if existing:
                    return jsonify({
                        "success": True,
                        "data": {"id": existing['id'], "eco_code": existing['eco_code'], "name": existing['name']},
                        "found": True
                    }), 200
                
                # Create new opening if not found
                # Extract opening name from first few moves (simplified)
                moves = move_sequence.split()[:4]  # First 4 moves
                name = " ".join(moves)
                eco_code = None  # Could be determined by opening detection logic
                
                opening_id = crud.create_opening(
                    eco_code=eco_code,
                    name=name,
                    move_sequence=move_sequence
                )
                
                connection.commit()
                return jsonify({
                    "success": True,
                    "message": "Opening created successfully",
                    "data": {"id": opening_id, "eco_code": eco_code, "name": name},
                    "found": False
                }), 201
        finally:
            connection.close()
        
    except Error as e:
        return jsonify({
            "success": False,
            "error": f"Database error: {str(e)}"
        }), 500
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Error finding/creating opening: {str(e)}"
        }), 500

