import { Redirect } from 'expo-router';

// Default route for /auth redirects to login
export default function AuthIndex() {
    return <Redirect href="/auth/login" />;
}
