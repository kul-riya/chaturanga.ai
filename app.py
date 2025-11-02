# app.py
from flask import Flask, request, jsonify, abort
from models import db, User, Game, Move, BoardState
from datetime import datetime
import os

app = Flask(__name__)
DB_FILE = os.getenv('DB_FILE', 'chess.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{DB_FILE}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# helper
def get_or_404(model, id):
    obj = model.query.get(id)
    if not obj:
        abort(404, description=f"{model.__tablename__} {id} not found")
    return obj

@app.route('/')
def home():
    return "✅ Chess API is running successfully!"

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

# ----- USERS CRUD -----
@app.route('/users', methods=['POST'])
def create_user():
    data = request.get_json()
    if not data or 'username' not in data or 'password_hash' not in data:
        return jsonify({"error": "username and password_hash required"}), 400
    u = User(username=data['username'], password_hash=data['password_hash'], email=data.get('email'))
    db.session.add(u)
    db.session.commit()
    return jsonify(u.to_dict()), 201

@app.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    u = get_or_404(User, user_id)
    return jsonify(u.to_dict())

# ----- GAMES CRUD -----
@app.route('/games', methods=['POST'])
def create_game():
    data = request.get_json()
    req = data or {}
    if not req.get('player1_id'):
        return jsonify({"error": "player1_id is required"}), 400
    g = Game(
        player1_id=req['player1_id'],
        player2_id=req.get('player2_id'),
        opening_name=req.get('opening_name'),
        time_control_seconds=req.get('time_control_seconds')
    )
    db.session.add(g)
    db.session.commit()
    return jsonify(g.to_dict()), 201

@app.route('/games/<int:game_id>', methods=['GET'])
def get_game(game_id):
    g = get_or_404(Game, game_id)
    return jsonify(g.to_dict())

@app.route('/games/<int:game_id>', methods=['PATCH'])
def update_game(game_id):
    g = get_or_404(Game, game_id)
    data = request.get_json() or {}
    for k in ('result','end_time','opening_name'):
        if k in data:
            setattr(g, k, data[k])
    if 'end_time' in data and data['end_time'] is None:
        g.end_time = None
    db.session.commit()
    return jsonify(g.to_dict())

# ----- MOVES CRUD -----
@app.route('/games/<int:game_id>/moves', methods=['POST'])
def create_move(game_id):
    # Insert a move
    _ = get_or_404(Game, game_id)  # ensure game exists
    data = request.get_json() or {}
    required = ['move_number','side','san']
    for r in required:
        if r not in data:
            return jsonify({"error": f"{r} required"}), 400
    mv = Move(
        game_id=game_id,
        move_number=int(data['move_number']),
        side=data['side'],
        player_id=data.get('player_id'),
        from_sq=data.get('from_sq'),
        to_sq=data.get('to_sq'),
        san=data['san'],
        uci=data.get('uci'),
        move_time_ms=data.get('move_time_ms'),
        player_clock_ms=data.get('player_clock_ms'),
        engine_suggested_move=data.get('engine_suggested_move'),
        engine_eval=(int(data['engine_eval']) if data.get('engine_eval') is not None else None),
        created_at=datetime.utcnow(),
        is_capture=('x' in data['san']),
        is_check=('+' in data['san']),
        is_checkmate=('#' in data['san'])
    )
    db.session.add(mv)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "db error", "details": str(e)}), 500
    return jsonify(mv.to_dict()), 201

@app.route('/games/<int:game_id>/moves', methods=['GET'])
def list_moves(game_id):
    _ = get_or_404(Game, game_id)
    moves = Move.query.filter_by(game_id=game_id).order_by(Move.move_number, Move.side.desc()).all()
    return jsonify([m.to_dict() for m in moves])

@app.route('/moves/<int:move_id>', methods=['GET'])
def get_move(move_id):
    mv = get_or_404(Move, move_id)
    return jsonify(mv.to_dict())

@app.route('/moves/<int:move_id>', methods=['PATCH'])
def update_move(move_id):
    mv = get_or_404(Move, move_id)
    data = request.get_json() or {}
    # allow updating limited fields
    for k in ('san','uci','engine_suggested_move','engine_eval','move_time_ms','is_checkmate'):
        if k in data:
            setattr(mv, k, data[k])
    db.session.commit()
    return jsonify(mv.to_dict())

@app.route('/moves/<int:move_id>', methods=['DELETE'])
def delete_move(move_id):
    mv = get_or_404(Move, move_id)
    db.session.delete(mv)
    db.session.commit()
    return jsonify({"deleted": move_id})

# ----- BOARDSTATE CRUD -----
@app.route('/games/<int:game_id>/boardstates', methods=['POST'])
def create_boardstate(game_id):
    _ = get_or_404(Game, game_id)
    data = request.get_json() or {}
    if 'move_number' not in data or 'fen' not in data:
        return jsonify({"error":"move_number and fen required"}), 400
    bs = BoardState(game_id=game_id, move_number=int(data['move_number']), fen=data['fen'])
    db.session.add(bs)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error":"db error","details":str(e)}), 500
    return jsonify(bs.to_dict()), 201

@app.route('/games/<int:game_id>/boardstates/<int:move_number>', methods=['GET'])
def get_boardstate(game_id, move_number):
    bs = BoardState.query.filter_by(game_id=game_id, move_number=move_number).first()
    if not bs:
        return jsonify({"error":"snapshot not found"}), 404
    return jsonify(bs.to_dict())

# ----- Analytics endpoints -----
@app.route('/analytics/games_between', methods=['GET'])
def games_between():
    a = request.args.get('a', type=int)
    b = request.args.get('b', type=int)
    if not a or not b:
        return jsonify({"error":"provide a and b user ids"}), 400
    q = Game.query.filter(
        ((Game.player1_id==a)&(Game.player2_id==b)) | ((Game.player1_id==b)&(Game.player2_id==a))
    )
    return jsonify([g.to_dict() for g in q.all()])

@app.route('/analytics/top-openings', methods=['GET'])
def top_openings():
    from sqlalchemy import func
    rows = db.session.query(Game.opening_name, func.count(Game.game_id).label('cnt'))\
        .filter(Game.opening_name!=None)\
        .group_by(Game.opening_name).order_by(func.count(Game.game_id).desc()).limit(20).all()
    return jsonify([{"opening_name":r[0],"count":r[1]} for r in rows])

@app.route('/analytics/avg-move-time', methods=['GET'])
def avg_move_time():
    from sqlalchemy import func
    rows = db.session.query(func.avg(Move.move_time_ms)).filter(Move.move_time_ms!=None).all()
    avg_ms = rows[0][0]
    return jsonify({"avg_move_time_ms": float(avg_ms) if avg_ms else None})

@app.route('/analytics/engine-mismatch', methods=['GET'])
def engine_mismatch():
    # moves where engine suggestion available and differs from played SAN
    q = Move.query.filter(Move.engine_suggested_move!=None, Move.engine_suggested_move!=Move.san).all()
    return jsonify([m.to_dict() for m in q])

@app.route('/analytics/winrates', methods=['GET'])
def winrates():
    from sqlalchemy import func
    total = Game.query.count()
    if total == 0:
        return jsonify({"white_win_rate":None,"black_win_rate":None,"draw_rate":None})
    white = Game.query.filter_by(result='1-0').count()
    black = Game.query.filter_by(result='0-1').count()
    draw = Game.query.filter_by(result='1/2-1/2').count()
    return jsonify({
        "white_win_rate": white/total,
        "black_win_rate": black/total,
        "draw_rate": draw/total,
        "total_games": total
    })

# run
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
