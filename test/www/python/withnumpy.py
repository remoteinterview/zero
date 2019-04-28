from flask import jsonify
import numpy as np

def handler():
  arr = np.array([2,3,4])
  return jsonify(
      username="aaaa",
      email="a@h.com",
      arr=arr
  )