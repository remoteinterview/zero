const { getStories, getStoryDetails } = require("./_helpers/getStories")
module.exports = async (req, res)=>{
  var list = await getStories()
  
  var stories = await getStoryDetails(list.slice(0, 40))
  //console.log(stories)
  res.write(JSON.stringify(stories))
  res.end()
}