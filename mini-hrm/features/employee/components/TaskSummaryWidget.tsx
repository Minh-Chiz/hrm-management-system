import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TaskSummaryWidgetProps } from '../types/dashboard';
import { Task } from '@/types';

function getTaskStatusStyle(statusType: string) {
  switch (statusType) {
    case 'warning': return { pill: { backgroundColor: 'rgba(245,205,0,0.15)' }, text: { color: '#ffecac' }, border: '#f5cd00' };
    case 'primary': return { pill: { backgroundColor: 'rgba(0,229,255,0.12)' }, text: { color: '#00e5ff' }, border: '#00e5ff' };
    case 'success': return { pill: { backgroundColor: 'rgba(5,231,119,0.12)' }, text: { color: '#7dffa2' }, border: '#05e777' };
    default: return { pill: { backgroundColor: 'rgba(186,201,204,0.10)' }, text: { color: '#bac9cc' }, border: '#849396' };
  }
}

function getStageBadge(stage?: string) {
  switch (stage) {
    case 'design': return { label: '🎨 Thiết kế', text: '#ff80ab', bg: 'rgba(255,128,171,0.2)' };
    case 'development': return { label: '💻 Lập trình', text: '#f5cd00', bg: 'rgba(245,205,0,0.2)' };
    case 'testing': return { label: '🧪 QA', text: '#00e5ff', bg: 'rgba(0,229,255,0.2)' };
    case 'completed': return { label: '✅ Xong', text: '#05e777', bg: 'rgba(5,231,119,0.2)' };
    default: return { label: 'Công việc', text: '#bac9cc', bg: 'rgba(132,147,150,0.2)' };
  }
}

export const TaskSummaryWidget: React.FC<TaskSummaryWidgetProps> = ({
  tasks,
  filteredTasks,
  stats,
  searchQuery,
  activeFilter,
  onSearchChange,
  onFilterChange,
  onSeeAllPress,
  onSelectTask,
}) => {
  const filterList = ['Tất cả', 'Đang làm', 'Chờ test/review', 'Hoàn thành', 'Trễ hạn'];

  return (
    <View style={styles.container}>
      {/* Analytics Card */}
      <Text style={styles.sectionTitle}>Hiệu suất làm việc</Text>
      <View style={styles.analyticsCard}>
        <View style={styles.gaugeCircle}>
          <Text style={styles.gaugePercent}>{stats.completionPercentage}%</Text>
          <Text style={styles.gaugeLabel}>HOÀN THÀNH</Text>
        </View>
        <View style={styles.analyticsStats}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Tổng công việc:</Text>
            <Text style={styles.statValue}>{stats.totalTasks}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Đã hoàn thành:</Text>
            <Text style={[styles.statValue, { color: '#7dffa2' }]}>{stats.completedTasks}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Lượt điểm danh:</Text>
            <Text style={[styles.statValue, { color: '#00daf3' }]}>{stats.totalCheckInsCount}</Text>
          </View>
        </View>
      </View>

      {/* Task List Header & Filters */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Công việc của tôi</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={onSeeAllPress}>
          <Text style={styles.seeAllLink}>Xem tất cả</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={18} color="#849396" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm công việc..."
          placeholderTextColor="#849396"
          value={searchQuery}
          onChangeText={onSearchChange}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <MaterialIcons name="close" size={18} color="#849396" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
        {filterList.map((filter) => {
          const isSelected = activeFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, isSelected && styles.filterChipSelected]}
              onPress={() => onFilterChange(filter)}
            >
              <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Task Cards */}
      <View style={styles.taskList}>
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="task-alt" size={28} color="#00e5ff" style={{ opacity: 0.8 }} />
            <Text style={styles.emptyTitle}>Không có công việc nào</Text>
          </View>
        ) : (
          filteredTasks.slice(0, 4).map((task) => {
            const st = getTaskStatusStyle(task.statusType);
            const stage = getStageBadge(task.pipelineStage);
            return (
              <TouchableOpacity
                key={task.id}
                style={[styles.taskCard, { borderLeftColor: st.border }]}
                activeOpacity={0.75}
                onPress={() => onSelectTask(task)}
              >
                <View style={styles.taskCardTop}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                    {task.pipelineStage && (
                      <View style={{ backgroundColor: stage.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: stage.text }}>{stage.label}</Text>
                      </View>
                    )}
                    <View style={[styles.statusPill, st.pill]}>
                      <Text style={[styles.statusPillText, st.text]}>{task.status}</Text>
                    </View>
                  </View>
                </View>

                <View style={{ marginTop: 6, gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 11, color: '#bac9cc' }}>Tiến độ:</Text>
                    <Text style={{ fontSize: 11, color: '#00e5ff', fontWeight: '700' }}>{task.progress || 0}%</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${task.progress || 0}%` }]} />
                  </View>
                </View>

                <View style={styles.taskMeta}>
                  <MaterialIcons name="event" size={12} color="#849396" />
                  <Text style={styles.taskMetaText}>Hạn: {task.deadline}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#dce4e5', marginBottom: 10 },
  analyticsCard: { backgroundColor: '#192122', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(59,73,76,0.3)', flexDirection: 'row', gap: 14, marginBottom: 16 },
  gaugeCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#242b2d', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#00e5ff' },
  gaugePercent: { fontSize: 18, fontWeight: '800', color: '#00e5ff' },
  gaugeLabel: { fontSize: 8, color: '#849396', fontWeight: '700', marginTop: 2 },
  analyticsStats: { flex: 1, justifyContent: 'center', gap: 4 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { fontSize: 12, color: '#849396' },
  statValue: { fontSize: 12, color: '#dce4e5', fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  seeAllLink: { fontSize: 12, color: '#00e5ff', fontWeight: '600' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#192122', borderRadius: 10, paddingHorizontal: 10, height: 40, borderWidth: 1, borderColor: 'rgba(59,73,76,0.3)', marginBottom: 10 },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, color: '#dce4e5', fontSize: 13 },
  filterScrollView: { marginBottom: 12 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#192122', marginRight: 6, borderWidth: 1, borderColor: 'rgba(59,73,76,0.3)' },
  filterChipSelected: { backgroundColor: 'rgba(0,229,255,0.15)', borderColor: '#00e5ff' },
  filterChipText: { fontSize: 12, color: '#849396' },
  filterChipTextSelected: { color: '#00e5ff', fontWeight: '700' },
  taskList: { gap: 10 },
  emptyState: { paddingVertical: 20, alignItems: 'center' },
  emptyTitle: { color: '#849396', fontSize: 13, marginTop: 6 },
  taskCard: { backgroundColor: '#192122', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(59,73,76,0.3)', borderLeftWidth: 4 },
  taskCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskTitle: { fontSize: 14, fontWeight: '700', color: '#dce4e5', flex: 1, marginRight: 8 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusPillText: { fontSize: 10, fontWeight: '700' },
  progressBarBg: { height: 5, backgroundColor: 'rgba(59,73,76,0.4)', borderRadius: 999, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#00e5ff' },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  taskMetaText: { fontSize: 11, color: '#849396' },
});
