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
  },
});

export const { setUserData, setIsAuthenticated } = userSlice.actions;

export default userSlice.reducer;
