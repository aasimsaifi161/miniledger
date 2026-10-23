import { app } from "./app";
import { config } from "./config";

const PORT = config.PORT;
const HOST = "0.0.0.0";

// Listen on 0.0.0.0 so devices on the same Wi-Fi network (like mobile phones) can reach it
app.listen(PORT, HOST, () => {
  console.log(`MiniLedger server listening on port ${PORT} (http://${HOST}:${PORT})`);
});
