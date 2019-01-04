const { basePath } = require("./_constants")
async function getStories(){
  var res = await fetch(`${basePath}/topstories.json`)
  return await res.json()
}

async function getStoryDetails(ids){
  var stories = await Promise.all( ids.map(async (id)=>{
    return await fetch(`${basePath}/item/${id}.json`).then((res)=>res.json())
  }))
  return stories
}

module.exports = { getStories, getStoryDetails }