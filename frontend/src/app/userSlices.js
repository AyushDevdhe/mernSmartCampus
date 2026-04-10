import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  data: null,
  isAuthenticated: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserData: (state, action) => {
      state.data = action.payload;
    },
    setIsAuthenticated: (state, action) => {
      state.isAuthenticated = action.payload;
    },
    clearUserData: (state) => {
      state.data = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUserData, setIsAuthenticated, clearUserData } =
  userSlice.actions;

export default userSlice.reducer;
