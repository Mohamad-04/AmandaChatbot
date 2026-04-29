from flask import Blueprint, send_from_directory
import os

frontend_bp = Blueprint('frontend', __name__)

FRONTEND_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', '..', 'frontend')
)


@frontend_bp.route('/', defaults={'path': ''})
@frontend_bp.route('/<path:path>')
def serve(path):
    if path == '':
        path = 'index.html'

    target = os.path.join(FRONTEND_DIR, path)

    if os.path.isdir(target):
        path = os.path.join(path, 'index.html').replace('\\', '/')
        target = os.path.join(FRONTEND_DIR, path)

    if os.path.isfile(target):
        return send_from_directory(FRONTEND_DIR, path)

    return {'error': 'Not found'}, 404
