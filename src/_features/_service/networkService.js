import axios from "axios";
import { config } from "../../flowChartConfig";

export function getNetworkService({ checkAuth }) {
  const getUserStorage = () => {
    return localStorage.getItem(`loginUser`);
  };

  async function _get(url, timeout = 60000) {
    const requestOptions = {
      headers: { "Content-Type": "application/json", ...authHeader(url) },
      timeout: timeout,
    };
    try {
      var response = await axios.get(url, requestOptions);
      return handleAxiosResponse(response);
    } catch (e) {
      return Promise.reject({
        code: e.code,
        error: e?.response?.data ? e?.response?.data : e.message,
      });
    }
  }

  async function _post(url, body, timeout = 0, headers) {
    const requestOptions = {
      headers: {
        "Content-Type": "application/json",
        ...authHeader(url),
        ...headers,
      },
      timeout: timeout,
    };

    try {
      var response = await axios.post(
        url,
        JSON.stringify(body),
        requestOptions
      );
      return handleAxiosResponse(response);
    } catch (e) {
      return Promise.reject({
        code: e.response?.status ?? 500,
        error: e.response?.data ?? {},
      });
    }
  }

  async function _put(url, body, timeout = 0) {
    let requestOptions = {
      headers: { "Content-Type": "application/json", ...authHeader(url) },
      timeout: timeout,
    };

    try {
      var response = await axios.put(url, body, requestOptions);
      return handleAxiosResponse(response);
    } catch (e) {
      return Promise.reject({
        code: e.code,
        error: e?.response?.data ? e?.response?.data : e.message,
      });
    }
  }

  // prefixed with underscored because delete is a reserved word in javascript
  async function _delete(url) {
    const requestOptions = {
      headers: authHeader(url),
    };
    try {
      const response = await axios.delete(url, requestOptions);
      return handleAxiosResponse(response);
    } catch (e) {
      return Promise.reject({
        code: e?.response?.status,
        error: e?.response?.data,
      });
    }
  }

  // helper functions
  function authHeader(url) {
    // return auth header with jwt if user is logged in and request is to the api url
    const user = JSON.parse(getUserStorage());
    const isLoggedIn = user && user.jwt_token;
    const isApiUrl = url.startsWith(config.apiUrl);
    if (isLoggedIn && isApiUrl) {
      return { Authorization: `Bearer ${user.jwt_token}` };
    } else {
      return {};
    }
  }

  function handleAxiosResponse(response) {
    if (response.status < 200 || response.status > 299) {
      //   checkAuth(response.status);
      const error =
        (response.data && response.data.message) || response.statusText;
      return Promise.reject(error);
    }
    if (response.headers["x-pagination"]) {
      response.headers["x-pagination"] = JSON.parse(
        response.headers["x-pagination"]
      );
    }
    return { headers: response.headers, data: response.data };
  }

  return {
    get: _get,
    post: _post,
    put: _put,
    delete: _delete,
  };
}
