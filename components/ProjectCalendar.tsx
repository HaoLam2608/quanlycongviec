import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// --- 1. Định nghĩa Interface ---
export interface CalendarTask {
    id: number;
    tentask?: string;
    title?: string;
    tenSubtask?: string;
    name?: string;
    trangThai?: string;
    status?: string;
    ngayBatDau?: string;
    startDate?: string;
    ngayKetThuc?: string;
    endDate?: string;
    type?: 'task' | 'subtask';
    parentId?: number | null;
    taskId?: number; // ID của task cha (cho subtask)
    subtasks?: CalendarTask[]; // Danh sách subtask (cho task)
}

interface ProjectCalendarProps {
    tasks: CalendarTask[];
    year: number;
    month: number;
    onMonthChange: (year: number, month: number) => void;
}

interface TaskBar {
    task: CalendarTask;
    startDay: number;
    endDay: number;
    row: number;
    color: string;
}

// --- 2. Helper Functions ---
const getStatusColor = (status: string): string => {
    const s = status?.toLowerCase() || '';
    if (s.includes('hoàn thành') || s === 'completed') return '#10B981'; // Green
    if (s.includes('đang') || s === 'in_progress') return '#F59E0B'; // Orange
    if (s.includes('chờ') || s === 'pending') return '#3B82F6'; // Blue
    if (s.includes('quá hạn')) return '#EF4444'; // Red
    return '#9CA3AF'; // Gray default
};

// --- 3. Component Chính ---
export const ProjectCalendar: React.FC<ProjectCalendarProps> = ({
    tasks,
    year,
    month,
    onMonthChange,
}) => {

    // Tạo ma trận lịch và thanh công việc
    const { matrix, taskBars } = useMemo(() => {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const rows: (number | null)[][] = [];
        let cells: (number | null)[] = [];

        // Tạo ma trận ngày
        for (let i = 0; i < firstDay; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) {
            cells.push(d);
            if (cells.length === 7) {
                rows.push(cells);
                cells = [];
            }
        }
        if (cells.length > 0) {
            while (cells.length < 7) cells.push(null);
            rows.push(cells);
        }

        // Tính toán vị trí thanh công việc
        const bars: TaskBar[] = [];
        const monthStart = new Date(year, month, 1).setHours(0, 0, 0, 0);
        const monthEnd = new Date(year, month + 1, 0).setHours(23, 59, 59, 999);

        tasks.forEach(task => {
            const startStr = task.ngayBatDau || task.startDate;
            const endStr = task.ngayKetThuc || task.endDate;
            if (!startStr) return;

            const taskStart = new Date(startStr).setHours(0, 0, 0, 0);
            const taskEnd = endStr ? new Date(endStr).setHours(23, 59, 59, 999) : taskStart;

            // Chỉ hiển thị task có giao với tháng hiện tại
            if (taskEnd < monthStart || taskStart > monthEnd) return;

            // Tính ngày bắt đầu và kết thúc trong tháng
            const startDay = taskStart <= monthStart
                ? 1
                : new Date(taskStart).getDate();
            const endDay = taskEnd >= monthEnd
                ? daysInMonth
                : new Date(taskEnd).getDate();

            bars.push({
                task,
                startDay,
                endDay,
                row: 0, // Sẽ tính sau
                color: getStatusColor(task.trangThai || task.status || ''),
            });
        });

        // Sắp xếp và phân phối vào các hàng để tránh chồng lấn
        bars.sort((a, b) => a.startDay - b.startDay);
        const rowOccupied: number[][] = []; // rowOccupied[row] = [endDay1, endDay2, ...]

        bars.forEach(bar => {
            let assignedRow = -1;
            for (let r = 0; r < rowOccupied.length; r++) {
                const lastEndInRow = Math.max(...rowOccupied[r]);
                if (lastEndInRow < bar.startDay) {
                    assignedRow = r;
                    rowOccupied[r].push(bar.endDay);
                    break;
                }
            }
            if (assignedRow === -1) {
                assignedRow = rowOccupied.length;
                rowOccupied.push([bar.endDay]);
            }
            bar.row = assignedRow;
        });

        return { matrix: rows, taskBars: bars };
    }, [tasks, year, month]);

    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

    return (
        <View style={styles.container}>
            {/* Header: Điều hướng tháng */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.navButton}
                    onPress={() => month === 0 ? onMonthChange(year - 1, 11) : onMonthChange(year, month - 1)}
                >
                    <Ionicons name="chevron-back" size={20} color="#374151" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                    Tháng {month + 1}, {year}
                </Text>

                <TouchableOpacity
                    style={styles.navButton}
                    onPress={() => month === 11 ? onMonthChange(year + 1, 0) : onMonthChange(year, month + 1)}
                >
                    <Ionicons name="chevron-forward" size={20} color="#374151" />
                </TouchableOpacity>
            </View>

            {/* Body: Lưới lịch */}
            <View style={styles.calendarBody}>
                {/* Hàng Thứ */}
                <View style={styles.weekRow}>
                    {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, idx) => (
                        <Text key={idx} style={styles.weekDayText}>{day}</Text>
                    ))}
                </View>

                {/* Các Ngày */}
                {matrix.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.weekContainer}>
                        <View style={styles.daysRow}>
                            {row.map((day, colIndex) => {
                                if (!day) return <View key={colIndex} style={styles.dayCell} />;
                                const isToday = isCurrentMonth && day === today.getDate();

                                return (
                                    <View key={colIndex} style={styles.dayCell}>
                                        <View style={[
                                            styles.dateCircle,
                                            isToday && styles.todayCircle,
                                        ]}>
                                            <Text style={[
                                                styles.dayText,
                                                isToday && styles.activeDayText
                                            ]}>
                                                {day}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>

                        {/* Thanh công việc */}
                        <View style={styles.taskBarsContainer}>
                            {taskBars
                                .filter(bar => {
                                    // Tìm xem thanh này có trong tuần này không
                                    const weekStart = row.find(d => d !== null) || 1;
                                    const weekEnd = row.filter(d => d !== null).pop() || weekStart;
                                    return bar.endDay >= weekStart && bar.startDay <= weekEnd;
                                })
                                .map((bar, idx) => {
                                    const weekStart = row.find(d => d !== null) || 1;
                                    const weekEnd = row.filter(d => d !== null).pop() || weekStart;

                                    // Tính vị trí bắt đầu trong tuần (0-6)
                                    const startCol = Math.max(0, row.findIndex(d => d === bar.startDay));
                                    const actualStart = startCol >= 0 ? startCol : 0;

                                    // Tính độ rộng (số ngày)
                                    const endCol = row.findIndex(d => d === bar.endDay);
                                    const actualEnd = endCol >= 0 ? endCol : row.findIndex(d => d === weekEnd);
                                    const span = actualEnd - actualStart + 1;

                                    // Nếu task bắt đầu trước tuần này
                                    const barStartCol = bar.startDay < weekStart ? 0 : actualStart;
                                    // Nếu task kết thúc sau tuần này
                                    const barSpan = bar.endDay > weekEnd
                                        ? 7 - barStartCol
                                        : Math.min(span, 7 - barStartCol);

                                    if (barSpan <= 0) return null;

                                    const taskName = bar.task.tentask
                                        || bar.task.title
                                        || bar.task.tenSubtask
                                        || bar.task.name
                                        || 'Công việc';
                                    const isSubtask = bar.task.type === 'subtask';

                                    return (
                                        <View
                                            key={`${bar.task.id}-${idx}`}
                                            style={[
                                                styles.taskBar,
                                                {
                                                    backgroundColor: bar.color,
                                                    left: `${(barStartCol / 7) * 100}%`,
                                                    width: `${(barSpan / 7) * 100}%`,
                                                    top: bar.row * 24,
                                                    height: isSubtask ? 18 : 20,
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[styles.taskBarText, isSubtask && styles.subtaskBarText]}
                                                numberOfLines={1}
                                            >
                                                {taskName}
                                            </Text>
                                        </View>
                                    );
                                })}
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    navButton: {
        padding: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
    },
    calendarBody: {
        width: '100%',
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 8,
    },
    weekDayText: {
        flex: 1,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    weekContainer: {
        marginBottom: 8,
        minHeight: 70,
    },
    daysRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 4,
    },
    dayCell: {
        flex: 1,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    activeDayText: {
        color: '#fff',
        fontWeight: '700',
    },
    todayCircle: {
        backgroundColor: '#667eea',
    },
    taskBarsContainer: {
        position: 'relative',
        width: '100%',
        minHeight: 60,
        paddingHorizontal: 2,
    },
    taskBar: {
        position: 'absolute',
        height: 20,
        borderRadius: 4,
        paddingHorizontal: 6,
        justifyContent: 'center',
        overflow: 'hidden',
    },
    taskBarText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#fff',
    },
    subtaskBarText: {
        fontSize: 10,
        fontWeight: '500',
    },
});