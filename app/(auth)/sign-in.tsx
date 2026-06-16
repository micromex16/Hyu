import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth';
import { color, font } from '../../theme';
import { Button } from '../../components/ui';

type Mode = 'sign-in' | 'sign-up';

export default function SignIn() {
  const { signInWithPassword, signUpWithPassword, sendMagicLink } = useAuth();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const reset = () => {
    setError(null);
    setNotice(null);
  };

  async function submit() {
    reset();
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    const { error } =
      mode === 'sign-in'
        ? await signInWithPassword(email, password)
        : await signUpWithPassword(email, password);
    setBusy(false);
    if (error) {
      setError(error);
    } else if (mode === 'sign-up') {
      setNotice('Account created. Check your email to confirm, then sign in.');
      setMode('sign-in');
    }
  }

  async function magicLink() {
    reset();
    if (!email.trim()) {
      setError('Enter your email first.');
      return;
    }
    setBusy(true);
    const { error } = await sendMagicLink(email);
    setBusy(false);
    if (error) setError(error);
    else setNotice('Magic link sent. Check your email to sign in.');
  }

  return (
    <SafeAreaView className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-center px-7"
      >
        <Text style={{ fontFamily: font.brand, fontSize: 64, color: color.ink, letterSpacing: -1 }}>hyu</Text>
        <Text style={{ fontFamily: font.ui, fontSize: 15, color: color.graphite, marginTop: 4 }}>
          {mode === 'sign-in' ? 'Sign in to keep your streak.' : 'Create your account.'}
        </Text>

        <View className="mt-8 gap-3">
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            inputMode="email"
          />
          <Input
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            autoCapitalize="none"
            secureTextEntry
          />
        </View>

        {error ? (
          <Text style={{ fontFamily: font.ui, fontSize: 13, color: color.bronze, marginTop: 12 }}>{error}</Text>
        ) : null}
        {notice ? (
          <Text style={{ fontFamily: font.ui, fontSize: 13, color: color.sageDeep, marginTop: 12 }}>{notice}</Text>
        ) : null}

        <Button
          label={mode === 'sign-in' ? 'Sign in' : 'Create account'}
          onPress={submit}
          disabled={busy}
          style={{ marginTop: 22 }}
        />

        <Pressable onPress={magicLink} disabled={busy} className="mt-4 items-center active:opacity-60">
          <Text style={{ fontFamily: font.ui, fontSize: 13, color: color.graphite }}>
            Email me a magic link instead
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            reset();
            setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
          }}
          className="mt-6 items-center active:opacity-70"
        >
          <Text style={{ fontFamily: font.ui, fontSize: 13, color: color.graphite }}>
            {mode === 'sign-in' ? 'No account? ' : 'Already have an account? '}
            <Text style={{ fontFamily: font.uiSemi, color: color.sageDeep }}>
              {mode === 'sign-in' ? 'Sign up' : 'Sign in'}
            </Text>
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor={color.graphite}
      style={{
        fontFamily: font.ui,
        fontSize: 16,
        color: color.ink,
        backgroundColor: color.porcelain,
        borderWidth: 1,
        borderColor: color.hair,
        borderRadius: 15,
        paddingHorizontal: 16,
        paddingVertical: 15,
      }}
      {...props}
    />
  );
}
