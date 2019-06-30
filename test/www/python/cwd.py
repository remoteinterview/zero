import os
import traceback

def handler():
  file = open("text.txt", "r")
  str = file.read()
  file.close()
  return str