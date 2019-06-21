from flask import jsonify
def handler(nestedParam):
  return jsonify(
      nestedParam=nestedParam
  )