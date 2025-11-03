# Database Setup Guide

## Overview

This application uses MySQL database to store chess games, moves, positions, players, openings, and engine analysis data.

## Setup Instructions

### 1. Install MySQL

Make sure MySQL server is installed and running on your system.

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=chess_db
```

Replace `your_password_here` with your actual MySQL root password (or create a new MySQL user).

### 3. Install Python Dependencies

The required dependencies are already in `requirements.txt`. Install them:

```bash
pip install -r requirements.txt
```

Key dependencies:
- `PyMySQL==1.1.2` - MySQL connector (Python equivalent of mysql2/promise)
- `python-dotenv==1.1.1` - Environment variable management

### 4. Run the Application

Start the Flask server:

```bash
python app.py
```

The database schema will be automatically created on startup if it doesn't exist.

## Database Schema

The database includes 6 main tables:

1. **players** - Stores player information (name, rating, country)
2. **games** - Tracks game metadata (players, result, opening)
3. **openings** - Stores chess openings (ECO code, name, move sequence)
4. **positions** - Stores unique chess positions (FEN strings)
5. **moves** - Stores all moves played in games
6. **engine_analysis** - Stores engine evaluation data for positions

## API Endpoints

### POST /api/move
Record a move and position from the frontend.

**Request Body:**
```json
{
  "game_id": 1,
  "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
  "move_number": 1,
  "move_notation": "e2-e4",
  "from_square": "e2",
  "to_square": "e4",
  "is_check": false,
  "winner": null,
  "promotion": null
}
```

### GET /api/metadata
Returns all table names, columns, and row counts.

### POST /api/run-query
Execute arbitrary SQL queries.

**Request Body:**
```json
{
  "query": "SELECT * FROM games LIMIT 10"
}
```

### GET /api/sample-queries
Returns list of predefined analytics queries.

## CRUD Operations

The `ChessDBCRUD` class in `chess_db_crud.py` provides comprehensive CRUD operations for all tables:

- `create_player()`, `get_player()`, `update_player()`, `delete_player()`
- `create_game()`, `get_game()`, `update_game()`, `delete_game()`
- `create_opening()`, `get_opening()`, `update_opening()`, `delete_opening()`
- `create_position()`, `get_position()`, `update_position()`, `delete_position()`
- `create_move()`, `get_move()`, `update_move()`, `delete_move()`
- `create_engine_analysis()`, `get_engine_analysis()`, `update_engine_analysis()`, `delete_engine_analysis()`
- `record_move_and_position()` - Convenience method to record both move and position in one transaction

## Example Usage

### Using CRUD Class

```python
from chess_db_crud import ChessDBCRUD

crud = ChessDBCRUD()

# Create a player
player_id = crud.create_player(name="John Doe", rating=1500, country="USA")

# Create a game
game_id = crud.create_game(
    player_white_id=player_id,
    player_black_id=player_id,
    result="*"
)

# Record a move and position
result = crud.record_move_and_position(
    game_id=game_id,
    fen="rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
    move_number=1,
    move_notation="e2-e4",
    from_square="e2",
    to_square="e4"
)
```

### Using API Endpoints

```javascript
// Record a move from frontend
fetch('http://localhost:5000/api/move', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    game_id: 1,
    fen: chessGame.fen(),
    move_number: 1,
    move_notation: "e2-e4",
    from_square: "e2",
    to_square: "e4",
    is_check: false
  })
});

// Get metadata
fetch('http://localhost:5000/api/metadata')
  .then(res => res.json())
  .then(data => console.log(data));

// Get sample queries
fetch('http://localhost:5000/api/sample-queries')
  .then(res => res.json())
  .then(data => console.log(data));
```

## Troubleshooting

1. **Connection Error**: Check that MySQL is running and credentials in `.env` are correct.
2. **Table Already Exists**: This is normal - the schema creation is idempotent.
3. **Foreign Key Errors**: Ensure parent records exist before creating child records.

