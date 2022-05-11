import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  showPreferences: false,
  useKeyboardShortcuts: true,
  useNumberKeyboardShortcuts: true,
  maxTableHeight: 300,
  useMaxTableHeight: true,
};

export const preferencesSlice = createSlice({
  name: 'preferencesSlice',
  initialState,
  reducers: {
    setShowPreferences: (state, action) => {
      state.showPreferences = action.payload;
    },
    setUseKeyboardShortcuts: (state, action) => {
      state.useKeyboardShortcuts = action.payload;
    },
    setUseNumberKeyboardShortcuts: (state, action) => {
      state.useNumberKeyboardShortcuts = action.payload;
    },
    setMaxTableHeight: (state, action) => {
      state.maxTableHeight = action.payload;
    },
    setUseMaxTableHeight: (state, action) => {
      state.useMaxTableHeight = action.payload;
    },
  },
})

export const {
  setShowPreferences,
  setUseKeyboardShortcuts,
  setUseNumberKeyboardShortcuts,
  setMaxTableHeight,
  setUseMaxTableHeight,
} = preferencesSlice.actions;
export default preferencesSlice.reducer;
