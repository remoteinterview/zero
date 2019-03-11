const examples = [
  'basic-login-nodejs',
  'express-with-middlewares',
  'google-login-nodejs',
  'markdown',
  'markdown-with-css',
  'mdx-with-jsx',
  'react-basic-css',
  'react-custom-charset',
  'react-fetch',
  'react-head-elements'
]

const exampleLinks = (exs) => {
  return exs.map((ex) => <li key={ex}><a href={ex}>{ex}</a></li>)
}

export default () => {
  return (
    <div>
      <h2>Examples</h2>
      <ul>
        {exampleLinks(examples)}
      </ul>
    </div>
  );
}