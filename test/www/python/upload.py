from flask import request
from werkzeug import secure_filename

def handler():
  if request.method == 'POST':
    f = request.files['file']
    # print("hello " + f)
    f.save(secure_filename(f.filename))
    return 'file uploaded successfully'