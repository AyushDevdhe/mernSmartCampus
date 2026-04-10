import { configureStore } from "@reduxjs/toolkit";

//importing userReducers here
import userReducer from "./userSlices";

export const store = configureStore({
  reducer: {
    user: userReducer,
  },
});
