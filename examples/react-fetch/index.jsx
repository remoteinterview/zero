import { Component } from 'react'
class GithubStars extends Component {
  static async getInitialProps({ req }){
    const res = await fetch('https://api.github.com/repos/facebook/react')
    const json = await res.json()
    return {stars: json.stargazers_count}
  }

  render() {
    return (
      <div>
        <p>React has <b>{this.props.stars}</b> stars on GitHub</p>
      </div>
    )
  }
}

export default GithubStars