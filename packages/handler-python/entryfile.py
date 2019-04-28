import os
import imp
import socket
import sys
from flask import Flask

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

# import logging
# log = logging.getLogger('flask')
# log.setLevel(logging.ERROR)



print("hosting", sys.argv[1] + '/')
@app.route(sys.argv[1] + '/', defaults={'path': ''})
@app.route(sys.argv[1] +'/<path:path>')
def root(path):
  module = importFromURI(sys.argv[2], True)
  return module.handler()


# fetch a new free port
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.bind(('localhost', 0))
port = sock.getsockname()[1]
sock.close()
print("python running", port)
os.write(3, bytes(str(port) + '\n', 'utf8'))
app.run(port=port, debug=False)
