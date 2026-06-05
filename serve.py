#!/usr/bin/env python3
"""Static server on port 3213 with extensionless HTML and clean URLs."""
import http.server
import os
import socketserver
from pathlib import Path

PORT = 3213
ROOT = Path(__file__).resolve().parent


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        path = self.path.split("?", 1)[0].split("#", 1)[0]
        if path != "/" and not os.path.splitext(path)[1]:
            candidates = [
                path,
                path + ".html",
                path.rstrip("/") + "/index.html",
                path + "/index.html",
            ]
            for c in candidates:
                local = ROOT / c.lstrip("/")
                if local.is_file():
                    self.path = c
                    break
        return super().do_GET()


if __name__ == "__main__":
    os.chdir(ROOT)
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving {ROOT} at http://localhost:{PORT}/")
        httpd.serve_forever()
