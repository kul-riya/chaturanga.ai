from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import os

from models import db, User, Game, Move, BoardState  # keep this import

DB_FILE = 'chess.db'
print("Saving DB to:", os.path.abspath(DB_FILE))

if os.path.exists(DB_FILE):
    print("Overwriting existing chess.db")
    os.remove(DB_FILE)

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{DB_FILE}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize DB with app before usage
db.init_app(app)

with app.app_context():
    db.create_all()
    # seed users
    u1 = User(username='riya', password_hash='hash1', email='riya@example.com')
    u2 = User(username='yash', password_hash='hash2', email='yash@example.com')
    db.session.add_all([u1, u2])
    db.session.commit()

    # seed game
    g = Game(player1_id=u1.user_id, player2_id=u2.user_id, opening_name='Ruy Lopez', result='ongoing')
    db.session.add(g)
    db.session.commit()

    # seed moves with timestamps + engine eval unsigned int
    base_time = datetime.utcnow()
    moves = [
        # (move_number, side, player_id, san, uci, move_time_ms, engine_eval)
        (1, 'W', u1.user_id, 'e4', 'e2e4', 12000, 35),
        (1, 'B', u2.user_id, 'e5', 'e7e5', 8000, 40),
        (2, 'W', u1.user_id, 'Nf3', 'g1f3', 15000, 22),
        (2, 'B', u2.user_id, 'Nc6', 'b8c6', 11000, 30),
        (3, 'W', u1.user_id, 'Bb5', 'f1b5', 18000, 28),
    ]
    for i, (mn, side, pid, san, uci, mt, ev) in enumerate(moves):
        mv = Move(
            game_id=g.game_id, move_number=mn, side=side, player_id=pid,
            san=san, uci=uci, move_time_ms=mt, engine_eval=ev,
            created_at=base_time + timedelta(seconds=i*5)
        )
        # crude capture detection:
        mv.is_capture = 'x' in san
        db.session.add(mv)
    db.session.commit()

    # create a board snapshot (FEN) after move 3 (example FEN)
    # Example FEN for the position after 3.Bb5 in Ruy Lopez: this is just an example string
    snapshot_fen = "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 2 3"
    bs = BoardState(game_id=g.game_id, move_number=3, fen=snapshot_fen)
    db.session.add(bs)
    db.session.commit()

    print("DB and dummy data created in chess.db")
