const createEntry = componentPath => {
  componentPath = componentPath.replace(/\\/g, "/"); // fix slashes for fwd on windows
  componentPath = componentPath.startsWith(".")
    ? componentPath
    : "./" + componentPath;
  return `
var React = require("react")
import { Helmet, HelmetProvider } from 'react-helmet-async';

// we add React to global scope to allow react pages without require('react') in them.
window.React = React
var App = require('${componentPath}')
App = (App && App.default)?App.default : App;
const { hydrate } = require('react-dom')


const props = JSON.parse(
  initial_props.innerHTML
)
const el = React.createElement(App, props)

const helmetApp = (
  <HelmetProvider>
    {el}
  </HelmetProvider>
)
hydrate(helmetApp, document.getElementById("_react_root"))
`;
};

// this snippet is added if the file is mdx

const createHotReloadWrap = componentPath => {
  componentPath = componentPath.replace(/\\/g, "/"); // fix slashes for fwd on windows
  componentPath = componentPath.startsWith(".")
    ? componentPath
    : "./" + componentPath;
  return `
import { hot } from 'react-hot-loader';

var App = require('${componentPath}')
App = (App && App.default)?App.default : App;
export default hot(module)(App)
`;
};

// wraps mdx required code if we have MDX files and deps in project
// otherwise it's just an empty wrap exporting component as-is

const createMDXWrap = (componentPath, isMDX) => {
  componentPath = componentPath.replace(/\\/g, "/"); // fix slashes for fwd on windows
  componentPath = componentPath.startsWith(".")
    ? componentPath
    : "./" + componentPath;
  // return an empty wrap
  if (!isMDX) {
    return `
var AppAndExports = require('${componentPath}')
var App = (AppAndExports && AppAndExports.default)?AppAndExports.default : AppAndExports;
module.exports = {
  originalApp: AppAndExports,
  default: App
}
`;
  }

  return `
import Highlight, {defaultProps} from 'prism-react-renderer'
import {mdx} from '@mdx-js/react'
import {MDXProvider} from '@mdx-js/react'
var AppAndExports = require('${componentPath}')
var App = (AppAndExports && AppAndExports.default)?AppAndExports.default : AppAndExports;

const CodeBlock = ({children, className}) => {
  const language = className?className.replace(/language-/, '') : false
  return (
    <Highlight {...defaultProps} code={children.trim()} language={language}>
      {({className, style, tokens, getLineProps, getTokenProps}) => (
        <pre className={className} style={undefined}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({line, key: i})} style={undefined}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({token, key})} style={undefined} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  )
}

const components = {
  code: CodeBlock,
  pre: props => <div {...props} />
}

const WrappedApp = (props)=>(
  <MDXProvider components={components}>
    <App {...props} />
  </MDXProvider>
)


module.exports = {
  originalApp: AppAndExports,
  default: WrappedApp
}

`;
};

module.exports = {
  createEntry,
  createHotReloadWrap,
  createMDXWrap
};
