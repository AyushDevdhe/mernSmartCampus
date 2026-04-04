import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";

// import React from 'react';
import { useState } from "react";
import { styled, alpha } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import InputBase from "@mui/material/InputBase";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";

export const Dashboard = () => {

  const user = JSON.parse(localStorage.getItem("user"));




  const Search = styled("div")(({ theme }) => ({
    position: "relative",
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    "&:hover": {
      backgroundColor: alpha(theme.palette.common.white, 0.25),
    },
    marginLeft: 0,
    width: "100%",
    [theme.breakpoints.up("sm")]: {
      marginLeft: theme.spacing(1),
      width: "auto",
    },
  }));

  const SearchIconWrapper = styled("div")(({ theme }) => ({
    padding: theme.spacing(0, 2),
    height: "100%",
    position: "absolute",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }));

  const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: "inherit",
    width: "100%",
    "& .MuiInputBase-input": {
      padding: theme.spacing(1, 1, 1, 0),
      // vertical padding + font size from searchIcon
      paddingLeft: `calc(1em + ${theme.spacing(4)})`,
      transition: theme.transitions.create("width"),
      [theme.breakpoints.up("sm")]: {
        width: "12ch",
        "&:focus": {
          width: "20ch",
        },
      },
    },
  }));

  const [open, setOpen] = useState(false);

  return (
    <>
      <h2>Welcome</h2>

      {/* <p>
        FullName: {user.firstName} {user.lastName}
      </p>
      <p>PRN: {user.prn}</p>
      <p>Email: {user.email}</p> */}

      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="open drawer"
              sx={{ mr: 2 }}
              onClick={() => setOpen(true)}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ flexGrow: 1, display: { xs: "none", sm: "block" } }}
            >
              Smart Campus
            </Typography>

            <Search>
              <SearchIconWrapper>
                <SearchIcon />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder="Search…"
                inputProps={{ "aria-label": "search" }}
              />
            </Search>
          </Toolbar>
        </AppBar>

        <p>Name: {user.firstName} {user.lastName}</p>
        <p>PRN: {user.prn}</p>
        <p>Email: {user.email}</p>

        <Drawer anchor="left" open={open} onClose={() => setOpen(false)}>
          <List sx={{ width: 250 }}>
            <ListItem button>
              <ListItemText primary="Wifi" />
            </ListItem>
            <ListItem button>
              <ListItemText primary="Electricity" />
            </ListItem>
            <ListItem button>
              <ListItemText primary="Cleaning" />
            </ListItem>
            <ListItem button>
              <ListItemText primary="Exam Queries"></ListItemText>
            </ListItem>

            <ListItem button>
              <ListItemText primary="Result Queries"></ListItemText>
            </ListItem>

            <ListItem button>
              <ListItemText primary="Subject Related Queries"></ListItemText>
            </ListItem>

            <ListItem button>
              <ListItemText primary="Teacher Related Queries"></ListItemText>
            </ListItem>

            <ListItem button>
              <ListItemText primary="Attendance Queries"></ListItemText>
            </ListItem>

            <ListItem button>
              <ListItemText primary="Feedback"></ListItemText>
            </ListItem>
          </List>
        </Drawer>
      </Box>
    </>
  );
};

export default Dashboard;
