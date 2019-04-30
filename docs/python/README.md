# Python

_Only available in [zero@beta](https://www.npmjs.com/package/zero/v/beta) right now._

Zero allows you to define your API endpoints as individual functions. Each such function resides in it's own file. The function should be named `handler`. If your function resides in `./api/process.py` file, it's exposed at `http://<SERVER>/api/process`.

Zero uses [flask](http://flask.pocoo.org/) internally. Which means you can use any of the awesome flask imports like `jsonify` and `request`.

## Example

```python
# hello.py
def handler():
  return "Hello"
```

The above file exports a function named `handler`. When you visit [http://127.0.0.1:3000/hello](http://127.0.0.1:3000/hello), Zero calls `handler()` and the response is sent back to browser.

## Before You Start

You must [install Python3](https://www.python.org/downloads/) before using Zero for Python.

## Printing To Console

It's common to use `print()` for debugging. You must use `flush=True` for your print statements to work. Like this: `print("Hello", flush=True)`

## JSON Response

APIs usually respond in JSON format. This means you can use flask's `jsonify` module to create JSON response.

### Example

```python
from flask import jsonify

def handler():
  arr = [1, 2, 3]
  return jsonify(
      username="basic",
      email="a@h.com",
      arr=arr
  )
```

## URL Parameters

Here is an example of how to get URL parameters sent by browser (the `?id=1&....` part of URL) in your Python handler:

```python
# hello.py
from flask import request

def handler():
  name = request.args.get('name')
  return "Hello, " + name
```

Visiting [http://127.0.0.1:3000/hello?name=luke](http://127.0.0.1:3000/hello?name=luke) will now print `Hello, luke`.

## Requirements.txt

Zero can auto-install dependencies using `pip`. Just add a `requirements.txt` file to your project root.

### Example

```txt
numpy==1.15.0
pandas==0.20.3
```

## POST Data

Here is an example of how to get POST data (sent from an HTML form) in your Python handler:

```python
# login.py
from flask import request

def handler():
  if request.method == 'POST':
    email = request.form.get('email')
    password = request.form.get('password')
    if password == "secretpassword":
      return "Success"

  return "Failed"
```

Here is an example HTML form:

```html
<!-- index.html -->
<html>
  <body>
    <form action="/login" method="POST">
      <input type="email" name="email" />
      <input type="password" name="password" />
      <input type="submit" />
    </form>
  </body>
</html>
```

## File Upload

Here is an example of how to handle file upload in your Python handler:

```python
# upload.py
from flask import request
from werkzeug import secure_filename

def handler():
  if request.method == 'POST':
    f = request.files['file']
    f.save(secure_filename(f.filename))
    return 'file uploaded successfully'
```

Here is an example HTML form to send file to your API:

```html
<!-- index.html -->
<html>
  <body>
    <form action="/upload" method="POST" enctype="multipart/form-data">
      <input type="file" name="file" />
      <input type="submit" />
    </form>
  </body>
</html>
```
