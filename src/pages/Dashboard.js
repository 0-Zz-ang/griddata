import * as React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemText,
  AppBar,
  Toolbar,
  IconButton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as echarts from "echarts";
import { useState, useEffect, useRef } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useTranslation } from "react-i18next";

const api_url = process.env.REACT_APP_LOCAL_URL;

export default function Dashboard(props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loginSuccessDays, setLoginSuccessDays] = useState(
    new Array(7).fill(0)
  );
  const loginChartRef = useRef(null);
  const dayChartRef = useRef(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const parsedUser = JSON.parse(user);
      setUserData(parsedUser);
      setLoginSuccessDays(parsedUser.loginSuccessDays);
    } else {
      navigate("/signin");
    }
  }, [navigate]);

  const toggleDrawer = (open) => (event) => {
    setDrawerOpen(open);
  };

  const handleLogout = async () => {
    if (!userData) {
      console.error(t("logout.logoutWarning"));
      return;
    }
    try {
      const response = await axios.post(`${api_url}/api/logout`, {
        record_no: userData.record_no,
      });
      if (response.status === 200) {
        alert(t("logout.logoutSuccess"));
        localStorage.removeItem("user");
        setUserData(null);
        navigate("/");
      } else {
        console.error(t("logout.logoutError"), response.status);
      }
    } catch (error) {
      console.error(t("logout.logoutError"), error);
      alert(t("logout.logoutError"));
    }
  };

  // 차트
  useEffect(() => {
    if (userData) {
      const loginChartDom = loginChartRef.current;
      const loginChart = echarts.init(loginChartDom);

      const data = [];
      if (userData.CountLoginSuccess > 0) {
        data.push({
          value: userData.CountLoginSuccess,
          name: t("login.loginSuccess"),
        });
      }
      if (userData.CountLoginFail > 0) {
        data.push({
          value: userData.CountLoginFail,
          name: t("login.loginFail"),
        });
      }

      const loginOption = {
        title: { text: t("dashboard.loginSuccessFailTitle"), left: "center" },
        series: [
          {
            name: t("dashboard.loginStats"),
            type: "pie",
            radius: "50%",
            data:
              data.length > 0
                ? data
                : [{ value: 1, name: t("dashboard.loginDataMissing") }],
          },
        ],
      };

      loginChart.setOption(loginOption);

      const dayChartDom = dayChartRef.current;
      const dayChart = echarts.init(dayChartDom);
      const maxLoginDayValue = Math.max(...loginSuccessDays);
      const dayOption = {
        title: { text: t("dashboard.weeklyLoginTitle"), left: "center" },
        xAxis: {
          type: "category",
          data: [
            t("days.sunday"),
            t("days.monday"),
            t("days.tuesday"),
            t("days.wednesday"),
            t("days.thursday"),
            t("days.friday"),
            t("days.saturday"),
          ],
        },
        yAxis: { type: "value" },

        series: [
          {
            data: loginSuccessDays.map((value, index) => ({
              value: value,
              itemStyle: {
                color: value === maxLoginDayValue ? "#ff4c4c" : "#3f51b5",
              },
            })),
            type: "bar",
            showBackground: true,
            backgroundStyle: { color: "rgba(180, 180, 180, 0.2)" },
          },
        ],
      };
      dayChart.setOption(dayOption);

      window.addEventListener("resize", () => {
        loginChart.resize();
        dayChart.resize();
      });

      return () => {
        loginChart.dispose();
        dayChart.dispose();
        window.removeEventListener("resize", () => {
          loginChart.resize();
          dayChart.resize();
        });
      };
    }
  }, [userData, loginSuccessDays, t]);

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* 상단 */}
      <AppBar position="fixed" sx={{ zIndex: 1201 }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={toggleDrawer(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap>
            {t("dashboard.home")}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* 사이드 */}
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        sx={{
          "& .MuiDrawer-paper": {
            width: 240,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            paddingTop: "60px",
          },
        }}
      >
        <Box sx={{ width: 240 }}>
          <List>
            <ListItem
              button
              onClick={() => {
                navigate("/dashboard");
                toggleDrawer(false)();
              }}
            >
              <ListItemText primary={t("dashboard.home")} />
            </ListItem>
            <ListItem button onClick={() => navigate("/gridData")}>
              <ListItemText primary={t("dashboard.dataView")} />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          backgroundColor: "#f5f7fa",
          padding: 3,
          marginTop: 8,
        }}
      >
        {/* 내 정보 */}
        <Card sx={{ width: "60%", mb: 4, boxShadow: 3, margin: "0 auto" }}>
          <CardContent sx={{ textAlign: "center", padding: 4 }}>
            <Avatar
              sx={{
                bgcolor: "#3f51b5",
                width: 80,
                height: 80,
                margin: "0 auto",
              }}
            >
              <AccountCircleIcon sx={{ fontSize: 60 }} />
            </Avatar>
            <Typography variant="h4">{userData?.name}</Typography>
            <Typography variant="body1">
              <strong>{t("general.email")}:</strong> {userData?.email}
            </Typography>
            <Typography variant="body1">
              <strong>{t("general.id")}:</strong> {userData?.id}
            </Typography>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: 3,
              }}
            >
              <IconButton
                variant="contained"
                onClick={handleLogout}
                sx={{
                  bgcolor: "#3f51b5",
                  color: "white",
                  padding: "10px 30px",
                  borderRadius: "5px",
                  fontSize: "16px",
                  "&:hover": {
                    bgcolor: "#303f9f",
                  },
                }}
              >
                {t("logout.logoutButton")}
              </IconButton>
            </Box>
          </CardContent>
        </Card>

        {/* 차트 표기 */}
        <Box
          sx={{
            display: "flex",
            gap: 4,
            justifyContent: "center",
            width: "100%",
            maxWidth: "1200px",
            margin: "0 auto",
            marginTop: 6,
          }}
        >
          <Box sx={{ flexGrow: 1, maxWidth: "600px", height: "400px" }}>
            <div
              ref={loginChartRef}
              style={{ width: "100%", height: "100%" }}
            />
          </Box>

          <Box sx={{ flexGrow: 1, maxWidth: "600px", height: "400px" }}>
            <div ref={dayChartRef} style={{ width: "100%", height: "100%" }} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
