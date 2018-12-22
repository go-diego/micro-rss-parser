const { parse } = require('url')
const { send } = require('micro')
const got = require('got');
const feedparser = require('feedparser-promised');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')

    //console.log("REQ", req);

    const { query: { url } } = parse(req.url, true)
    if (!url) return send(res, 401, { message: 'Please supply an URL for an rss feed in the url query parameter.' })

    // check the cached version. If build date has changed, bust cache
    // const cachedResult = cache.get(url)
    // if (cachedResult) return send(res, 200, cachedResult)

    let statusCode, data
    try {
        const httpOptions = {
            uri: url,
        };

        const feedparserOptions = {
            feedurl: url,
            // normalize: false,
            // addmeta: false,
            // resume_saxerror: true
        };

        data = await feedparser.parse(httpOptions, feedparserOptions);
        statusCode = 200
    } catch (err) {
        console.log(err)
        statusCode = 401
        data = { message: `Parsing feed from "${url}" failed.`, suggestion: 'Make sure your URL is correct.' }
    }

    send(res, statusCode, data)

    // Cache results for 24 hours
    // cache.put(url, data, TWENTY_FOUR_HOURS)
}