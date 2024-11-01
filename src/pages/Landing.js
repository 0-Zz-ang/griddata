import React from "react";
import { Button, Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useRecoilState } from "recoil";
import { languageState } from "../recoil/atoms";

function Landing() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [language, setLanguage] = useRecoilState(languageState);

  const handleLogin = () => {
    navigate("/signin");
  };

  const toggleLanguage = () => {
    setLanguage((prevLang) => (prevLang === "ko" ? "en" : "ko"));
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <Button
        variant="outlined"
        color="secondary"
        onClick={toggleLanguage}
        sx={{
          position: "absolute",
          top: 16, // 상단 여백
          right: 16, // 오른쪽 여백
        }}
      >
        {language === "ko" ? "Switch to English" : "한국어로 전환"}
      </Button>
      <Typography variant="h2" gutterBottom>
        {t("general.welcome")}
      </Typography>
      <Typography variant="h6" gutterBottom>
        {t("general.loginPrompt")}
      </Typography>
      <Button variant="contained" color="primary" onClick={handleLogin}>
        {t("general.login")}
      </Button>
    </Box>
  );
}

export default Landing;
