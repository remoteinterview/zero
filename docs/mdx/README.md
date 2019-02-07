# Markdown and MDX

Zero automatically converts all `.md` files to HTML pages. 

Zero also supports [MDX](https://mdxjs.com/). This means you can use JSX in between your markdown like this:

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
