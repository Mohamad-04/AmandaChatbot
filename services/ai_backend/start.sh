#!/bin/bash
# Run HTTP health server in background (keeps Render happy) + gRPC server in foreground.
python -c "
import http.server, os

class H(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'OK')
    def log_message(self, *a): pass

port = int(os.environ.get('PORT', 10000))
httpd = http.server.HTTPServer(('0.0.0.0', port), H)
print(f'Health server listening on {port}', flush=True)
httpd.serve_forever()
" &

exec python server.py
