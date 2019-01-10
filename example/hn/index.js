import React, { Component } from 'react'
import 'bootstrap/dist/css/bootstrap.css';
import "./style.css"
// import "./heading.css"

class ClassTypeComponent extends Component {
  static async getInitialProps({ req }){
    var stories = await fetch("/hn/api/stories").then((resp) => resp.json())
    return {data: stories, user: req.user}
  }

  render() {
    return (
      <div>
      <div className="container-fluid">
        <div className="header-section">
          <header>
            <nav>
              <a href="/hn"><img id="topImage" src="/hn/img/y18.gif" alt="" /></a>
              <a className="main-link" href="/hn">Hacker News</a>
              <a href="">new {this.props.user?this.props.user.id:""}</a>
              <span>|</span>
              <a href="#">comments</a>
              <span>|</span>
              <a href="#">show</a>
              <span>|</span>
              <a href="#">ask</a>
              <span>|</span>
              <a href="#">jobs</a>
              <span>|</span>
              <a href="#">submit</a>
            </nav>
          </header>
      </div>
          <div className="main-section">

            <table>
              <tbody>
                <tr id="table-header"></tr>
                {this.props.data.map((story, i)=>{
                  return (
                    <tr>
                      <td>
                          <span className="number">{i+1}.</span> {story.title} <small>(domain.com)</small><br />
                        <span className="commentStuff">{story.score} points by {story.by} 1 hour ago | hide | {story.descendants} comments</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td id="more">More</td>
                </tr>
              </tfoot>

            </table>
          </div>
      </div>
      <div className="container-fluid footer">
        <div className="footer-menu">
          <a href="">Guidelines</a>
          <span>|</span>
          <a href="#">FAQ</a>
          <span>|</span>
          <a href="#">Support</a>
          <span>|</span>
          <a href="#">API</a>
          <span>|</span>
          <a href="#">Security</a>
          <span>|</span>
          <a href="#">Lists</a>
          <span>|</span>
          <a href="">Bookmarklet</a>
          <span>|</span>
          <a href="#">DMCA</a>
          <span>|</span>
          <a href="#">Apply to YC</a>
          <span>|</span>
          <a href="#">Contact</a>
        </div>
        <div className="searchInput">
          <label for="search">Search</label>
          <input type="text" id="search" />
        </div>
      </div>
</div>
    )
  }
}

export default ClassTypeComponent