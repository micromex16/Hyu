import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { Loading } from '../../components/Loading';

export default function AppLayout() {
  const { session, loading } = useAuth();

  if (loading) return <Loading />;
  if (!session) return <Redirect href="/sign-in" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="log-food" options={{ presentation: 'modal' }} />
      <Stack.Screen name="edit-profile" options={{ presentation: 'modal' }} />
      <Stack.Screen name="edit-goals" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
