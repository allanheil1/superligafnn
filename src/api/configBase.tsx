import axios from "axios";

export const MinhaApiAxios = axios.create({
  baseURL: "https://api.sleeper.app/v1/",
  timeout: 10000,
});
