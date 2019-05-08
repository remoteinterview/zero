import os
import imp
import socket
import sys
from flask import Flask
from waitress import serve

# Make relative imports for the child handler
sys.path.append(os.path.dirname(os.path.realpath(sys.argv[2])))

# import handler module from absolute path
def importFromURI(uri, absl=False):
	if not absl:
		uri = os.path.normpath(os.path.join(os.path.dirname(__file__), uri))
	path, fname = os.path.split(uri)
	mname, ext = os.path.splitext(fname)
		
	no_ext = os.path.join(path, mname)
	if os.path.exists(no_ext + '.pyc'):
		try:
			return imp.load_compiled(mname, no_ext + '.pyc')
		except:
			pass
	if os.path.exists(no_ext + '.py'):
		try:
			return imp.load_source(mname, no_ext + '.py')
		except:
			pass

app = Flask(__name__)


@app.route(sys.argv[1] + '/', defaults={'path': ''},  methods = ['GET', 'POST'])
@app.route(sys.argv[1] +'/<path:path>', methods = ['GET', 'POST'])
def root(path):
  module = importFromURI(sys.argv[2], True)
  return module.handler()


# fetch a new free port
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.bind(('localhost', 0))
port = sock.getsockname()[1]
sock.close()
os.write(4, bytes(str(port) + '\n', 'utf8'))
serve(app, host='0.0.0.0', port=port, _quiet=True)