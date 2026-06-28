import "dotenv/config";
import { app } from "./app";

const port = Number(process.env.PORT) || 3001;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`SBX Monitoramento — API rodando em http://localhost:${port}`);
});
