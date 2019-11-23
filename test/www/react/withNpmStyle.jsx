// this would break SSR because of CSS import from node_modules

import 'bulma/css/bulma.css'
module.exports = ()=>(
  <button className="button">Button</button>
)
