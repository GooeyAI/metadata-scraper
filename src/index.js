const metascraper = require("metascraper")([
  require("metascraper-title")(),
  require("metascraper-description")(),
  require("metascraper-image")(),
]);
const got = require("got");
const zmq = require("zeromq");
const twitter = require("twitter-text");

require("dotenv").config();
const BIND_ADDR = process.env.BIND_ADDR;
const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_SEC) * 1000;

(async function () {
  const sock = zmq.socket("rep");
  await sock.bind(BIND_ADDR);
  console.log(`serving @ "${BIND_ADDR}"`);

  sock.on("message", async function (msg) {
    msg = JSON.parse(msg);
    console.log("<", msg);

    let response = await dispatch(msg);

    msg = JSON.stringify(response);
    console.log(">", msg);

    await sock.send(msg);
  });
})();

async function dispatch({ cmd, data }) {
  switch (cmd) {
    case "extractUrls":
      return twitter.extractUrls(data);
    case "fetchMetadata":
      let url;
      for (url of data) {
        try {
          let metadata = await fetchMetadata(url);
          metadata.url = url;
          return metadata;
        } catch (e) {
          console.log("!", url, e);
        }
      }
      break;
  }
  return {};
}

async function fetchMetadata(targetUrl) {
  const { body: html, url } = await got(targetUrl, {
    timeout: {
      request: REQUEST_TIMEOUT_MS,
    },
    retry: {
      limit: 0,
    },
  });
  return await metascraper({ html, url });
}
