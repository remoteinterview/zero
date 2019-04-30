from flask import request

def handler():
  name = request.args.get('name')
  print("name" + name)
  return "Hello, " + name
