from flask import Flask, jsonify, request
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)

# Allow requests from frontend (React)
CORS(app)

# Home route
@app.route('/')
def home():
    return jsonify({"message": "Hello from Flask!"})

# Example API route (GET)
@app.route('/hello', methods=['GET'])
def hello():
    return jsonify({"message": "Hello from Flask!"})

# Example API route (POST)
@app.route('/api/echo', methods=['POST'])
def echo():
    data = request.json  # get JSON from request body
    return jsonify({"you_sent": data})

# Run server
if __name__ == '__main__':
    app.run(debug=True)
