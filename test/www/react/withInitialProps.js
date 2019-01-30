import React, { Component } from 'react'

class ClassTypeComponent extends Component {
  static async getInitialProps({ req }){
    var json = await fetch("/api/fetch").then((resp) => resp.json())
    return {data: json}
  }

  render() {
    return (
      this.props.data.evens.join(",")
    )
  }
}

export default ClassTypeComponent