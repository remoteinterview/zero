from flask import jsonify
def handler():
  arr = [1,2,3]
  printMsg()
  return jsonify(
      username="basic",
      email="a@h.com",
      arr=arr
  )

def printMsg():
    print("abc", flush=True)
    return "Check your console"