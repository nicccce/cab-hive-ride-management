import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { RootState, AppDispatch } from '../store';

// 使用TypeScript类型的hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;