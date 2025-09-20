export const isAuthenticated = (): boolean => {
  const accessToken = localStorage.getItem("WCAApp.accessToken");
  const expiry = localStorage.getItem("WCAApp.tokenExpiry");
  return !!accessToken && !!expiry && Date.now() < parseInt(expiry, 10);
};
