# models.py
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# Users table
class User(db.Model):
    __tablename__ = 'users'
    user_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(100), unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "username": self.username,
            "email": self.email,
            "created_at": self.created_at.isoformat()
        }

# Games table
class Game(db.Model):
    __tablename__ = 'games'
    game_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    player1_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    player2_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)
    result = db.Column(db.String(16), default='ongoing')  # '1-0', '0-1', '1/2-1/2', 'ongoing'
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    end_time = db.Column(db.DateTime, nullable=True)
    opening_name = db.Column(db.String(100), nullable=True)
    time_control_seconds = db.Column(db.Integer, nullable=True)

    def to_dict(self):
        return {
            "game_id": self.game_id,
            "player1_id": self.player1_id,
            "player2_id": self.player2_id,
            "result": self.result,
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "opening_name": self.opening_name
        }

# BoardStates table
class BoardState(db.Model):
    __tablename__ = 'boardstates'
    state_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    game_id = db.Column(db.Integer, db.ForeignKey('games.game_id'), nullable=False)
    move_number = db.Column(db.Integer, nullable=False)  # snapshot after this move number
    fen = db.Column(db.Text, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint('game_id', 'move_number', name='uix_game_move'),)

    def to_dict(self):
        return {
            "state_id": self.state_id,
            "game_id": self.game_id,
            "move_number": self.move_number,
            "fen": self.fen,
            "updated_at": self.updated_at.isoformat()
        }

# Moves table
class Move(db.Model):
    __tablename__ = 'moves'
    move_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    game_id = db.Column(db.Integer, db.ForeignKey('games.game_id'), nullable=False, index=True)
    move_number = db.Column(db.Integer, nullable=False)  # 1-based
    side = db.Column(db.String(1), nullable=False)  # 'W' or 'B' (whose move)
    player_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)
    from_sq = db.Column(db.String(2), nullable=True)
    to_sq = db.Column(db.String(2), nullable=True)
    san = db.Column(db.String(32), nullable=False)  # Standard Algebraic Notation
    uci = db.Column(db.String(8), nullable=True)    # UCI e.g., e2e4
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    move_time_ms = db.Column(db.Integer, nullable=True)
    player_clock_ms = db.Column(db.Integer, nullable=True)
    engine_suggested_move = db.Column(db.String(32), nullable=True)
    engine_eval = db.Column(db.Integer, nullable=True)  # user asked unsigned int; we'll keep integer >= 0
    is_capture = db.Column(db.Boolean, default=False)
    is_check = db.Column(db.Boolean, default=False)
    is_checkmate = db.Column(db.Boolean, default=False)

    __table_args__ = (db.UniqueConstraint('game_id', 'move_number', 'side', name='uix_game_move_side'),)

    def to_dict(self):
        return {
            "move_id": self.move_id,
            "game_id": self.game_id,
            "move_number": self.move_number,
            "side": self.side,
            "player_id": self.player_id,
            "from_sq": self.from_sq,
            "to_sq": self.to_sq,
            "san": self.san,
            "uci": self.uci,
            "created_at": self.created_at.isoformat(),
            "move_time_ms": self.move_time_ms,
            "player_clock_ms": self.player_clock_ms,
            "engine_suggested_move": self.engine_suggested_move,
            "engine_eval": self.engine_eval,
            "is_capture": self.is_capture,
            "is_check": self.is_check,
            "is_checkmate": self.is_checkmate
        }
