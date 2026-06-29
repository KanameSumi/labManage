import axios from "axios";

const axios_instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || undefined,
  headers: {
    "Content-Type": "application/json",
  },
});
 
axios_instance.interceptors.request.use(
  function (config) {
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);
axios_instance.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    const originalConfig = error.config;
    
    if (
      error.response &&
      error.response.status === 401 &&
      !originalConfig.retry
    ) {
      // 認証エラーの場合は、リフレッシュトークンを使ってリトライ
      originalConfig.retry = true;
      
      if (originalConfig.url === "/api/home/login") {
        return Promise.reject(error);
      }
      
      return axios_instance
        .post("/api/home/retry", { refresh: "" })
        .then((response) => {
          return axios_instance(originalConfig);
        })
        .catch(function (error) {
          // 💡 リフレッシュトークンでの復活にも失敗したらログイン画面へ
          window.location.href = "/login";
          return Promise.reject(error);
        });
    }
    return Promise.reject(error);
  }
);

export default axios_instance;