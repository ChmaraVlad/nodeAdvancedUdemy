const mongoose = require('mongoose')
const redis = require('redis')
const util = require('util')

const redisUrl = 'redis://127.0.0.1:6379'
const client = redis.createClient(redisUrl)
client.hget = util.promisify(client.hget)

const exec = mongoose.Query.prototype.exec

// reusable helper to toogle caching logic 
// could be executed on each query separately
mongoose.Query.prototype.cache = function (options = {}) {
  this.useCache = true

  // we use it to organise info using separated block with info with some indentificator as a key
  this.hashKey = JSON.stringify(options.key || 'defaultHashKey') 

  return this
}

mongoose.Query.prototype.exec = async function () {
  // we have not added cache() to query and cacheing is turned-off
  if(!this.useCache) {
    return exec.apply(this, arguments)
  }

  const query = this.getQuery()
  
  const key = {
    ...query, collection: this. mongooseCollection.name
  }

  const cachedValue = await client.hget(this.hashKey, key)

  if(cachedValue) {
    const doc =  JSON.parse(cachedValue)

    return Array.isArray(doc) 
    ? doc.map((item) => new this.model(item))
    : new this.model(doc)
  }

  const res = await exec.apply(this, arguments)
  // expire 10 sec
  client.hset(this.hashKey, key, JSON.stringify(res), 'EX', 10)

  return res
  
}

module.exports = {
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey))
  }
}
