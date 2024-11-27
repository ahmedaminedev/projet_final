
from flask import Flask, request
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route('/progress/', methods=['POST'])
def handle_progress():
    data = request.json
    progress = data.get('progress')
    page_id = data.get('page_id')
    
    # Log les données reçues
    print(f"Received data: {data}")
    
    if progress is not None and page_id is not None:
        print(f"Progress for page {page_id}: {progress}")
        socketio.emit('progress', {'page_id': page_id, 'progress': progress})
    else:
        print(f"Received invalid data: {data}")
    return ''


@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

if __name__ == '__main__':
    socketio.run(app, host='localhost', port=5000)
