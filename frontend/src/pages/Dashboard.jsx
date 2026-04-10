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
// import Button from "@mui/material/Button";
import ListItemButton from "@mui/material/ListItemButton";

export const Dashboard = () => {
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
  const [activeSection, setActiveSection] = useState("profile");
  const [queryType, setQueryType] = useState("");
  const [priority, setPriority] = useState("");
  const [description, setDescription] = useState("");

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

        {/* {activeSection === "profile" && (
          <>
            <p>
              Name: {user.firstName} {user.lastName}
            </p>
            <p>PRN: {user.prn}</p>
            <p>Email: {user.email}</p>
          </>
        )} */}

        {activeSection === "queries" && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Add Query
            </Typography>

            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Query Type
            </Typography>

            <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
              <button onClick={() => setQueryType("Academic")}>Academic</button>
              <button onClick={() => setQueryType("Technical")}>
                Technical
              </button>
              <button onClick={() => setQueryType("Attendance")}>
                Attendance
              </button>
              <button onClick={() => setQueryType("Exam")}>Exam</button>
            </Box>

            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Priority
            </Typography>

            <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
              <button onClick={() => setPriority("Low")}>Low</button>
              <button onClick={() => setPriority("Medium")}>Medium</button>
              <button onClick={() => setPriority("High")}>High</button>
            </Box>

            <textarea
              rows="5"
              cols="50"
              placeholder="Enter query description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <br />
            <br />
            <p>Selected Type: {queryType}</p>
            <p>Selected Priority: {priority}</p>

            <button>Submit Query</button>
          </Box>
        )}

        <Drawer anchor="left" open={open} onClose={() => setOpen(false)}>
          <List sx={{ width: 250 }}>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  setActiveSection("profile");
                  setOpen(false);
                }}
              >
                <ListItemText primary="Profile" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton
                onClick={() => {
                  setActiveSection("queries");
                  setOpen(false);
                }}
              >
                <ListItemText primary="Queries" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton>
                <ListItemText primary="Exam" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton>
                <ListItemText primary="Subject" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton>
                <ListItemText primary="Teacher Related Queries" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton>
                <ListItemText primary="Attendance" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton>
                <ListItemText primary="Safety" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton>
                <ListItemText primary="College Erp System" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton>
                <ListItemText primary="Feedback" />
              </ListItemButton>
            </ListItem>
          </List>
        </Drawer>
      </Box>
    </>
  );
};

export default Dashboard;
