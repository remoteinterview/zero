from flask import jsonify
import numpy as np

def handler():
  arr = np.array([2,3,5]).tolist()
  return jsonify(
      username="aaaa",
      email="a@h.com",
      arr=arr
  )