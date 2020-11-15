import axios from "axios";

export const getAccessToken = async () => {
  const {
    data: { jwt: accessToken },
  } = await axios.post(`https://tst-api.hydeoutplatform.com//auth/local`, {
    identifier: "usrTstAuthenticatedWithSeasonPass@gmail.com",
    password: "usrTstAuthenticatedWithSeasonPass@gmail.com!",
  });
  return accessToken;
};

export const getCategoryOptions = async () => {
  const accessToken = await getAccessToken();
  const res = await axios.get(
    `https://tst-api.hydeoutplatform.com/category-options-per-users`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  console.log(res);
  return res;
};
