import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useLogout } from '../../hooks/useLogout';

interface LogoutButtonProps {
    variant?: 'default' | 'icon' | 'text';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    showConfirm?: boolean;
    iconType?: 'logout' | 'exit' | 'power' | 'door';
}

export default function LogoutButton({
    variant = 'default',
    size = 'md',
    className = '',
    showConfirm = true,
    iconType = 'logout'
}: LogoutButtonProps) {
    const { logout } = useLogout();

    const handleLogout = () => {
        if (showConfirm) {
            Alert.alert(
                'Đăng xuất',
                'Bạn có chắc chắn muốn đăng xuất không?',
                [
                    {
                        text: 'Hủy',
                        style: 'cancel',
                    },
                    {
                        text: 'Đăng xuất',
                        style: 'destructive',
                        onPress: logout,
                    },
                ]
            );
        } else {
            logout();
        }
    };

    const getVariantStyles = () => {
        switch (variant) {
            case 'icon':
                return styles.iconButton;
            case 'text':
                return styles.textButton;
            default:
                return styles.defaultButton;
        }
    };

    const getSizeStyles = () => {
        switch (size) {
            case 'sm':
                return styles.smallSize;
            case 'lg':
                return styles.largeSize;
            default:
                return styles.mediumSize;
        }
    };

    const getIconSize = () => {
        switch (size) {
            case 'sm':
                return 22;
            case 'lg':
                return 32;
            default:
                return 26;
        }
    };

    const renderIcon = () => {
        const iconSize = getIconSize();
        const color = "white";

        switch (iconType) {
            case 'exit':
                return <AntDesign name="logout" size={iconSize} color={color} />;
            case 'power':
                return <Ionicons name="power" size={iconSize} color={color} />;
            case 'door':
                return <MaterialIcons name="meeting-room" size={iconSize} color={color} />;
            default:
                return <MaterialIcons name="logout" size={iconSize} color={color} />;
        }
    };

    return (
        <TouchableOpacity
            style={[getVariantStyles(), getSizeStyles()]}
            onPress={handleLogout}
            activeOpacity={0.7}
        >
            {variant === 'icon' ? (
                renderIcon()
            ) : (
                <Text style={[styles.text, variant === 'text' && styles.textColor]}>
                    {variant === 'text' ? 'Đăng xuất' : 'Đăng xuất'}
                </Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    // Button variants
    iconButton: {
        backgroundColor: '#dc2626', // Màu đỏ đậm hơn
        borderRadius: 25,
        padding: 12,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        minWidth: 50,
        minHeight: 50,
        borderWidth: 1,
        borderColor: '#b91c1c',
    },
    textButton: {
        backgroundColor: 'transparent',
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    defaultButton: {
        backgroundColor: '#dc2626',
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 12,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        borderWidth: 1,
        borderColor: '#b91c1c',
    },

    // Size variants
    smallSize: {
        padding: 10,
        minWidth: 44,
        minHeight: 44,
    },
    mediumSize: {
        padding: 12,
        minWidth: 50,
        minHeight: 50,
    },
    largeSize: {
        padding: 16,
        minWidth: 60,
        minHeight: 60,
    },

    // Text styles
    text: {
        fontWeight: '600',
        fontSize: 14,
        color: 'white',
        textAlign: 'center',
    },
    textColor: {
        color: '#ef4444',
    },
});