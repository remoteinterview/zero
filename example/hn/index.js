import React, { Component } from 'react'
import "./style.css"
// import "./heading.css"

class ClassTypeComponent extends Component {
  static async getInitialProps({ req }){
    var stories = await fetch("/hn/api/stories").then((resp) => resp.json())
    // console.log("stories", stories)
    return {data: stories}
  }

  render() {
    return <div>
      <h1>HackerNews</h1>
      <b>Count: {this.props.data.length}</b><br/>
      <table>
        {this.props.data.map((story)=>{
          return <tr key={story.id}><a>{story.title}</a></tr>
        })}
      </table>
    </div>
  }
}

export default ClassTypeComponent