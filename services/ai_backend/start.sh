#!/bin/bash
# Start a minimal HTTP health server so Render can detect the service is alive.
# Render scans for HTTP on $PORT (default 10000); gRPC runs separately on 8765.
python -c "
import http.server, threading, os

class H(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'OK')
    def log_message(self, *a): pass

port = int(os.environ.get('PORT', 10000))
httpd = http.server.HTTPServer(('0.0.0.0', port), H)
t = threading.Thread(target=httpd.serve_forever)
t.daemon = True
t.start()
print(f'Health server listening on {port}')
" &

exec python server.py
