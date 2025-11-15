import { MemberProject } from '@/types/member';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ProjectCardProps {
    project: MemberProject;
    onPress: () => void;
}

export default function ProjectCard({ project, onPress }: ProjectCardProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Đang thực hiện':
                return '#3B82F6';
            case 'Hoàn thành':
                return '#10B981';
            case 'Tạm dừng':
                return '#F59E0B';
            case 'Hủy bỏ':
                return '#EF4444';
            default:
                return '#6B7280';
        }
    };

    const completionRate = (project.completedTasks / project.totalTasks) * 100;

    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <View style={styles.header}>
                <Text style={styles.name} numberOfLines={1}>
                    {project.name}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) }]}>
                    <Text style={styles.statusText}>{project.status}</Text>
                </View>
            </View>

            <Text style={styles.description} numberOfLines={2}>
                {project.description}
            </Text>

            <View style={styles.meta}>
                <View style={styles.metaItem}>
                    <Ionicons name="person-outline" size={14} color="#6B7280" />
                    <Text style={styles.metaText}>{project.manager}</Text>
                </View>
                <View style={styles.metaItem}>
                    <Ionicons name="people-outline" size={14} color="#6B7280" />
                    <Text style={styles.metaText}>{project.totalMembers}</Text>
                </View>
            </View>

            <View style={styles.progress}>
                <View style={styles.progressInfo}>
                    <Text style={styles.progressLabel}>Tiến độ</Text>
                    <Text style={styles.progressValue}>{project.progress}%</Text>
                </View>
                <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: `${project.progress}%` }]} />
                </View>
            </View>

            <View style={styles.stats}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{project.totalTasks}</Text>
                    <Text style={styles.statLabel}>Tổng CV</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#10B981' }]}>{project.completedTasks}</Text>
                    <Text style={styles.statLabel}>Hoàn thành</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                        {project.totalTasks - project.completedTasks}
                    </Text>
                    <Text style={styles.statLabel}>Còn lại</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    name: {
        flex: 1,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#fff',
    },
    description: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
        marginBottom: 12,
    },
    meta: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: '#6B7280',
    },
    progress: {
        marginBottom: 12,
    },
    progressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    progressLabel: {
        fontSize: 12,
        color: '#6B7280',
    },
    progressValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#667eea',
    },
    progressBarContainer: {
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#667eea',
        borderRadius: 3,
    },
    stats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 11,
        color: '#6B7280',
    },
});
