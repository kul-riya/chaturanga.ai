from flask import Flask, jsonify, request
from flask_cors import CORS
from db_schema import create_schema, check_tables_exist
from api_endpoints import (
    handle_record_move,
    handle_get_metadata,
    handle_run_query,
    handle_get_sample_queries,
    handle_create_player,
    handle_get_player,
    handle_get_all_players,
    handle_create_game,
    handle_update_game,
    handle_create_opening,
    handle_find_or_create_opening,
    handle_ensure_computer_player
)

# Initialize Flask app
app = Flask(__name__)

# Allow requests from frontend (React)
CORS(app, origins=["http://localhost:5173"])

# Initialize database on app startup (Flask 2.3+ compatible)
with app.app_context():
    try:
        print("Initializing database schema...")
        create_schema()
        tables_check = check_tables_exist()
        if tables_check['all_exist']:
            print("All tables exist and are ready!")
        else:
            print(f"Warning: Missing tables: {tables_check['missing_tables']}")
    except Exception as e:
        print(f"Error initializing database: {e}")

# Home route
@app.route('/')
def home():
    return jsonify({"message": "Chess Database API", "version": "1.0.0"})

# Example API route (GET)
@app.route('/hello', methods=['GET'])
def hello():
    return jsonify({"message": "Hello from Flask!"})

# Example API route (POST)
@app.route('/api/echo', methods=['POST'])
def echo():
    data = request.json  # get JSON from request body
    return jsonify({"you_sent": data})

# ==================== Database API Endpoints ====================

@app.route('/api/move', methods=['POST'])
def record_move():
    """POST /api/move - Record a move and position from frontend"""
    return handle_record_move()

@app.route('/api/metadata', methods=['GET'])
def get_metadata():
    """GET /api/metadata - Return all table names, columns, and row counts"""
    return handle_get_metadata()

@app.route('/api/run-query', methods=['POST'])
def run_query():
    """POST /api/run-query - Execute arbitrary SQL queries"""
    return handle_run_query()

@app.route('/api/sample-queries', methods=['GET'])
def get_sample_queries():
    """GET /api/sample-queries - Return list of predefined analytics queries"""
    return handle_get_sample_queries()

# ==================== Player API Endpoints ====================

@app.route('/api/player', methods=['POST'])
def create_player():
    """POST /api/player - Create a new player"""
    return handle_create_player()

@app.route('/api/player/<int:player_id>', methods=['GET'])
def get_player(player_id):
    """GET /api/player/<id> - Get a player by ID"""
    return handle_get_player(player_id)

@app.route('/api/players', methods=['GET'])
def get_all_players():
    """GET /api/players - Get all players"""
    return handle_get_all_players()

# ==================== Game API Endpoints ====================

@app.route('/api/game', methods=['POST'])
def create_game():
    """POST /api/game - Create a new game"""
    return handle_create_game()

@app.route('/api/game/<int:game_id>', methods=['PUT'])
def update_game(game_id):
    """PUT /api/game/<id> - Update game result or opening"""
    return handle_update_game(game_id)

# ==================== Opening API Endpoints ====================

@app.route('/api/opening', methods=['POST'])
def create_opening():
    """POST /api/opening - Create a new opening"""
    return handle_create_opening()

@app.route('/api/opening/find-or-create', methods=['POST'])
def find_or_create_opening():
    """POST /api/opening/find-or-create - Find or create opening by move sequence"""
    return handle_find_or_create_opening()

@app.route('/api/ensure-computer', methods=['POST'])
def ensure_computer_player():
    """POST /api/ensure-computer - Ensure computer player with ID 1 exists"""
    return handle_ensure_computer_player()

# Run server
if __name__ == '__main__':
    app.run(debug=True)
