# Markdown and MDX

Zero automatically converts all `.md` files to HTML pages. 

Zero also supports [MDX](https://mdxjs.com/). This means you can use JSX in-between your markdown like this:

```markdown
import Graph from './components/graph'

## Here's a graph

<Graph />
```

## Importing `.md` Components

You can also import one markdown (or MDX) into another. Like this:

```markdown
import License from './license.md'
# Hello, world!

<License />
```

## Populating `<head>`
Zero turns your Markdown into HTML page, you might want to set head tags of this page like `<title>`, `<meta>`, etc. for improved SEO. Zero has [React Helmet](https://github.com/nfl/react-helmet) set up which you can also use in your `.md` and `.mdx` files:

```markdown
import {Helmet} from "react-helmet";

<Helmet>
  <meta charset="ISO-8859-1" />
  <title>Page Title</title>
  <link rel="canonical" href="http://mysite.com/example" />
</Helmet>

# Page Heading
This page has a title and meta tags set.
```

You can check all the supported tags [here](https://github.com/nfl/react-helmet#reference-guide).