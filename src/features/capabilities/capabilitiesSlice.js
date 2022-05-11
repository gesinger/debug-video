import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  ffprobeExists: null,
};

export const capabilitiesSlice = createSlice({
  name: 'capabilities',
  initialState,
  reducers: {
    setFfprobeExists: (state, action) => {
      state.ffprobeExists = action.payload;
    },
  },
})

export const {
  setFfprobeExists,
} = capabilitiesSlice.actions;
export default capabilitiesSlice.reducer;
