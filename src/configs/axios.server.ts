import axios from "axios";
import { cookies } from "next/headers";
import { AUTH_COOKIE_KEYS } from "@/constants/routes";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
const BASE_PATH = process.env.NEXT_PUBLIC_API_BASE_PATH ?? "/api/v1";


// Instance không auth — dùng cho public data
export const axiosServer = axios.create({
  baseURL: `${BASE_URL}${BASE_PATH}`,
  timeout: 90000,
  headers: { "Content-Type": "application/json" },
});

// Instance có auth — dùng cho protected routes
export async function getAuthAxios() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_KEYS.TOKEN)?.value;

  return axios.create({
    baseURL: BASE_URL,
    timeout: 90000,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
}
