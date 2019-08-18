const mongoose = require('mongoose')
const redis = require('redis')
const util = require('util')
const keys = require('../config/keys')

const redisClient = redis.createClient(keys.redisUrl)
redisClient.hget = util.promisify(redisClient.hget)

const exec = mongoose.Query.prototype.exec

mongoose.Query.prototype.cache = function(options = {}) {
	this.useCache = true
	this.hashKey = JSON.stringify(options.key || '')

	return this
}

mongoose.Query.prototype.exec = async function() {
	if (!this.useCache) {
		return exec.apply(this, arguments)
	}

	const key = JSON.stringify(
		Object.assign({}, this.getQuery(), {
			collection: this.mongooseCollection.name
		})
	)

	const cacheValue = await redisClient.hget(this.hashKey, key)

	if (cacheValue) {
		const doc = JSON.parse(cacheValue)

		return Array.isArray(doc)
			? doc.map(d => new this.model(d))
			: new this.model(doc)
	}

	const result = await exec.apply(this, arguments)

	redisClient.hset(this.hashKey, key, JSON.stringify(result))

	return result
}

module.exports = {
	clearHash(hashKey) {
		redisClient.del(JSON.stringify(hashKey))
	}
}
