async function getStories(){
  var res = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json")
  return await res.json()
}

async function getStoryDetails(ids){
  var stories = await Promise.all( ids.map(async (id)=>{
    return await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then((res)=>res.json())
  }))
  return stories
}

module.exports = async (req, res)=>{
  var list = await getStories()
  
  var stories = await getStoryDetails(list.slice(0, 10))
  console.log(stories)
  res.write(JSON.stringify(stories))
  res.end()
}