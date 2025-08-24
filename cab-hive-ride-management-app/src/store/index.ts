import { configureStore } from '@reduxjs/toolkit'
import userSlice from './slices/userSlice'
import driverSlice from './slices/driverSlice'
import vehicleSlice from './slices/vehicleSlice'

export const store = configureStore({
  reducer: {
    user: userSlice,
    driver: driverSlice,
    vehicle: vehicleSlice
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
      }
    })
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch