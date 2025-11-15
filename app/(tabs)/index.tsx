import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function Index() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to member-dashboard as default tab
        router.replace('/member-dashboard');
    }, []);

    return null;
}