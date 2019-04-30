from flask import jsonify

def handler():
  arr = [1,2,3]
  return jsonify(
      username="basic",
      email="a@h.com",
      arr=arr
  )