from flask import Blueprint, send_from_directory
import os

admin_spa_bp = Blueprint('admin_spa', __name__)

ADMIN_SPA_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', '..', 'admin-dashboard', 'dist')
)


@admin_spa_bp.route('/admin-app/', defaults={'path': ''})
@admin_spa_bp.route('/admin-app/<path:path>')
def serve_admin_spa(path):
    if path and os.path.isfile(os.path.join(ADMIN_SPA_DIR, path)):
        return send_from_directory(ADMIN_SPA_DIR, path)
    # All unmatched paths return index.html for client-side routing
    return send_from_directory(ADMIN_SPA_DIR, 'index.html')
