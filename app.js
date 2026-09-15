const { createServer } = require("http");
const next = require("next");

const port = Number.parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOST || "0.0.0.0";
const dev = process.env.NODE_ENV !== "production";

const nextApp = next({ dev, hostname, port });
const handle = nextApp.getRequestHandler();

nextApp
  .prepare()
  .then(() => {
    createServer((req, res) => handle(req, res)).listen(port, hostname, () => {
      console.log(`E-GOTO ready on http://${hostname}:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start E-GOTO:", error);
    process.exit(1);
  });
