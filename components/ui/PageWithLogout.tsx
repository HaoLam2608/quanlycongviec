// Utility component để bọc các trang với LogoutButton
import React from 'react';
import { StyleSheet, View } from 'react-native';
import LogoutButton from './LogoutButton';

interface PageWithLogoutProps {
    children: React.ReactNode;
    variant?: 'default' | 'icon' | 'text';
    position?: 'top-right' | 'top-left' | 'bottom-right';
    className?: string;
}

export default function PageWithLogout({
    children,
    variant = 'icon',
    position = 'top-right',
    className = ''
}: PageWithLogoutProps) {
    const getPositionStyles = () => {
        switch (position) {
            case 'top-left':
                return { position: 'absolute' as const, top: 20, left: 20, zIndex: 10 };
            case 'bottom-right':
                return { position: 'absolute' as const, bottom: 20, right: 20, zIndex: 10 };
            default:
                return { position: 'absolute' as const, top: 20, right: 20, zIndex: 10 };
        }
    };

    return (
        <View style={styles.container}>
            {children}
            <View style={getPositionStyles()}>
                <LogoutButton variant={variant} className={className} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
    },
});