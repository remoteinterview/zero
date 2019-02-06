export default (props) =>(
  <h1>Hello {props.user?props.user.id:"World"}</h1>
)