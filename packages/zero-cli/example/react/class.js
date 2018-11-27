import React, { Component } from 'react'

class ClassTypeComponent extends Component {
  constructor(){
    super()
    this.state = {
      count: 0
    }
  }
  render() {
    return <div>
      <p>Class Type Component</p>
      <b>Count: {this.state.count}</b><br/>
      <button onClick={(e)=>{this.setState({count: this.state.count+1})}}>Add</button>
    </div>

  }
}

export default ClassTypeComponent