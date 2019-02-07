// This is a React component, which gets `props.user`
// and displays either a login button or the logged-in user's info

export default ({user})=>{
  if (!user){
    return (
      <a href="/google-login-nodejs/login">Login with Google</a>
    )
  }
  else{
    return (
      <b>Logged in as {user.name} ({user.email})</b>
    )
  }
}