import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { Loading } from '../../components/Loading';

export default function AuthLayout() {
  const { session, loading } = useAuth();

  if (loading) return <Loading />;
  if (session) return <Redirect href="/" />;

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }} />;
}
