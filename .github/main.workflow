workflow "Test" {
  on = "push"
  resolves = ["bootstrap && test"]
}

action "npm install" {
  uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
  runs = "npm install"
}

action "bootstrap && test" {
  uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
  runs = "npm run bootstrap && npm test"
  needs = ["npm install"]
}
