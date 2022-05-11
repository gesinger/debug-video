import { createSlice } from '@reduxjs/toolkit';

const initialState = { input: false };

export const focusSlice = createSlice({
  name: 'focus',
  initialState,
  reducers: {
    setInput: (state, action) => {
      state.input = action.payload;
    },
  },
})

export const { setInput } = focusSlice.actions;
export default focusSlice.reducer;
