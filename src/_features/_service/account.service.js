import { config } from "../../flowChartConfig";
import { getNetworkService } from "./networkService";

const baseUrl = `${config.apiUrl}/login`;

const networkService = getNetworkService({
  //   checkAuth: accountService.checkAuth,
});

export const getAccountService = () => {
  const login = async (email, password) => {
    try {
      const response = await networkService.post(
        `${baseUrl}/authenticate`,
        { email, password },
        10000
      );

      return response.data;
    } catch (e) {
      return Promise.reject(e);
    }
  };
  return { login };
};
