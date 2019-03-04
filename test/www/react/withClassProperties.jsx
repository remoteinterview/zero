import { Component } from 'react'
class Button extends Component {
  state = { clicked: false };
  handleClick = () => this.setState({ clicked: true });
  render() {
    return <button onClick={this.handleClick}>Click Me!</button>;
  }
}

export default Button