const { parse } = require("url");
const { send } = require("micro");
const Parser = require("rss-parser");

const parserOptions = {
    customFields: {
        item: [
            ["media:thumbnail", "media_thumbnail"],
            ["media:content", "media_content"],
            ["pubDate", "publication_date"],
            ["contentSnippet", "content_snippet"],
            ["isoDate", "iso_date"]
        ]
    }
};
const parser = new Parser(parserOptions);

module.exports = async (req, res) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
        "https://www.oxomo.co",
        "https://development.oxomo.co",
        "https://oxomo.netlify.com"
    ];

    if (process.env.NODE_ENV === "development") {
        allowedOrigins.push("http://localhost:8001");
    }

    if (allowedOrigins.indexOf(req.headers.origin) > -1) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

    const {
        query: { url, isLatest }
    } = parse(req.url, true);

    if (!url)
        return send(res, 500, {
            error:
                "Please supply an URL for an rss feed in the url query parameter."
        });

    // check the cached version. If build date has changed, bust cache
    // const cachedResult = cache.get(url)
    // if (cachedResult) return send(res, 200, cachedResult)

    let statusCode, data;
    try {
        data = await parser.parseURL(url);
        const items = data.items.map(datum => {
            return {
                ...datum,
                link: datum.link ? datum.link.trim() : null,
                title: datum.title ? datum.title.trim() : null,
                pubDate: datum.pubDate ? datum.pubDate.trim() : null,
                publication_date: datum.publication_date
                    ? datum.publication_date.trim()
                    : null,
                guid: datum.guid ? datum.guid.trim() : null,
                categories: datum.categories
                    ? datum.categories.map(category => category.trim())
                    : null,
                media_content: datum.media_content
                    ? datum.media_content.$
                        ? { ...datum.media_content.$ }
                        : datum.media_content
                    : null,
                media_thumbnail: datum.media_thumbnail
                    ? datum.media_thumbnail.$
                        ? { ...datum.media_thumbnail.$ }
                        : datum.media_thumbnail
                    : null
            };
        });
        data.items = isLatest === "true" ? [items[0]] : items;
        statusCode = 200;

        // Cache results for 24 hours
        // cache.put(url, data, TWENTY_FOUR_HOURS)
    } catch (err) {
        // TODO: if time out, get from cache
        statusCode = 500;
        data = {
            error: err.message
        };
    }

    send(res, statusCode, data);
};
