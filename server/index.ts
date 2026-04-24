import express from "express";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT) || 3000;
const API_KEY = process.env.API_KEY?.trim();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONT_PATH = path.resolve(__dirname, "../front");

app.use(express.static(FRONT_PATH));

app.get("/", (_req, res) => {
  res.sendFile(path.join(FRONT_PATH, "index.html"));
});

app.get("/api/weather", async (req, res) => {
  const city = String(req.query.city ?? "").trim();

  if (!city) {
    return res.status(400).json({
      message: "Digite o nome de uma cidade para buscar."
    });
  }

  if (!API_KEY || API_KEY === "Chave_API") {
    return res.status(500).json({
      message: "API_KEY nao configurada no arquivo .env."
    });
  }

  const url = new URL("https://api.openweathermap.org/data/2.5/weather");
  url.searchParams.set("q", city);
  url.searchParams.set("appid", API_KEY);
  url.searchParams.set("units", "metric");
  url.searchParams.set("lang", "pt_br");

  try {
    const response = await fetch(url.toString());
    const data = (await response.json()) as any;

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({
          message: "Cidade nao encontrada. Verifique o nome e tente novamente."
        });
      }

      if (response.status === 401) {
        return res.status(401).json({
          message: "API_KEY invalida ou inativa na OpenWeather."
        });
      }

      if (response.status === 429) {
        return res.status(429).json({
          message: "Limite de requisicoes da API atingido. Tente novamente em instantes."
        });
      }

      return res.status(response.status).json({
        message: data?.message || "Erro ao consultar a API de clima."
      });
    }

    const weather = data.weather?.[0] ?? {};

    return res.json({
      city: data.name,
      country: data.sys?.country,
      temp: data.main?.temp,
      feelsLike: data.main?.feels_like,
      humidity: data.main?.humidity,
      description: weather.description ?? "Sem descricao",
      iconUrl: weather.icon
        ? `https://openweathermap.org/img/wn/${weather.icon}@2x.png`
        : ""
    });
  } catch {
    return res.status(500).json({
      message: "Falha de conexao ao consultar o clima."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
