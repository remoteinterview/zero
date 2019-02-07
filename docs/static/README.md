# Static Files

Zero transpiles and bundles all the code files (`.js`, `.html`, `.jsx`, `.md`, etc). But otherwise it just serves the file as-is.

Your static files (images, documents, etc) can reside alongside your code files. It won't affect your code.

## Example
If you project is structured like this:
```
- project/
  - index.jsx
  - style.css
  - logo.png
```

If you visit `http://localhost:3000/` it will render your React page. The logo file is accessible at `http://localhost:3000/logo.png` as you would expect.
