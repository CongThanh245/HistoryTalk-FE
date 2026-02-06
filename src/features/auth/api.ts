import { axiosClient } from "@/configs/axios.client";
import { LoginRequest, RegisterRequest } from "./models/request";
import { Token } from "./models/response";

export const AuthService = {
  login: async (req: LoginRequest): Promise<Result<Token>> => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const response = await axiosClient.post("/auth/sign-in", req);

    return response.data;
  },

  register: async (req: RegisterRequest): Promise<Result<null>> => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const response = await axiosClient.post("/auth/sign-up", req);
    return response.data;
  },
};
