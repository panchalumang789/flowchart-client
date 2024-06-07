import { config } from "../../flowChartConfig";
import { getNetworkService } from "./networkService";

const baseUrl = `${config.apiUrl}/users`;

const networkService = getNetworkService({});

const getAllUsers = async () => {
  try {
    const response = await networkService.get(baseUrl);
    return response.data;
  } catch (e) {
    return Promise.reject(e);
  }
};

const createUser = async (userData) => {
  try {
    const response = await networkService.post(baseUrl, userData);
    return response.data;
  } catch (e) {
    return Promise.reject(e);
  }
};

const updateUser = async (userData) => {
  try {
    const response = await networkService.put(
      `${baseUrl}/${userData?.id}`,
      userData
    );
    return response.data;
  } catch (e) {
    return Promise.reject(e);
  }
};

const deleteUser = async (userId) => {
  try {
    const response = await networkService.delete(`${baseUrl}/${userId}`);
    return response.data;
  } catch (e) {
    return Promise.reject(e);
  }
};

export const userService = { getAllUsers, createUser, updateUser, deleteUser };
