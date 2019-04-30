from flask import request

def handler():
  if request.method == 'POST':
    email = request.form.get('email')
    password = request.form.get('password')
    return 'Got ' + email

  return "POST email and password here"