import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Task } from '@/types';

function getTaskStatusStyle(statusType: string) {
  switch (statusType) {
    case 'warning': return { pill: { backgroundColor: 'rgba(245,205,0,0.15)' }, text: { color: '#ffecac' }, border: '#f5cd00' };
    case 'primary': return { pill: { backgroundColor: 'rgba(0,229,255,0.12)' }, text: { color: '#00e5ff' }, border: '#00e5ff' };
    case 'success': return { pill: { backgroundColor: 'rgba(5,231,119,0.12)' }, text: { color: '#7dffa2' }, border: '#05e777' };
    default: return { pill: { backgroundColor: 'rgba(186,201,204,0.10)' }, text: { color: '#bac9cc' }, border: '#849396' };
  }
}

export const ProjectTabContent: React.FC<{ tasks: Task[]; onSelectTask?: (task: Task) => void }> = ({ tasks, onSelectTask }) => {
  const masterProjects = tasks.filter((t) => Boolean(t.isMasterProject));
  const projects = masterProjects.map((mp) => {
    const subTasks = tasks.filter((t) => t.masterTaskId && String(t.masterTaskId) === String(mp.id));
    const doneCount = subTasks.filter((t) => t.status === 'Hoàn thành').length;
    return {
      id: mp.id,
      name: mp.title,
      progress: mp.progress || 0,
      totalTasks: Math.max(subTasks.length, 1),
      doneTasks: doneCount,
      statusColor: (mp.progress || 0) === 100 ? '#05e777' : '#00e5ff',
      deadline: mp.deadline,
      budget: mp.budget,
      tasks: subTasks,
    };
  });

  const totalProjectCount = projects.length;
  const totalDoneTasks = projects.reduce((a, p) => a + p.doneTasks, 0);
  const totalPendingTasks = projects.reduce((a, p) => a + (p.totalTasks - p.doneTasks), 0);

  return (
    <View style={styles.container}>
      <View style={styles.projectSummaryRow}>
        <View style={styles.projectSummaryCard}>
          <MaterialIcons name="folder-open" size={22} color="#00e5ff" />
          <Text style={styles.projectSummaryNum}>{totalProjectCount}</Text>
          <Text style={styles.projectSummaryLabel}>Dự án</Text>
        </View>
        <View style={styles.projectSummaryCard}>
          <MaterialIcons name="assignment-turned-in" size={22} color="#7dffa2" />
          <Text style={[styles.projectSummaryNum, { color: '#7dffa2' }]}>{totalDoneTasks}</Text>
          <Text style={styles.projectSummaryLabel}>Task xong</Text>
        </View>
        <View style={styles.projectSummaryCard}>
          <MaterialIcons name="pending-actions" size={22} color="#f5cd00" />
          <Text style={[styles.projectSummaryNum, { color: '#f5cd00' }]}>{totalPendingTasks}</Text>
          <Text style={styles.projectSummaryLabel}>Đang làm</Text>
        </View>
      </View>

      {projects.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="folder-off" size={40} color="#3b494c" />
          <Text style={{ color: '#849396', fontSize: 13, marginTop: 8 }}>Chưa có dự án lớn nào</Text>
        </View>
      ) : (
        projects.map((project) => (
          <View key={project.id} style={styles.projectCard}>
            <View style={styles.projectCardHeader}>
              <View style={[styles.projectIconWrap, { backgroundColor: `${project.statusColor}18` }]}>
                <MaterialIcons name="folder" size={22} color={project.statusColor} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.projectName}>{project.name}</Text>
                <Text style={styles.projectMetaText}>Hạn: {project.deadline} • {project.doneTasks}/{project.totalTasks} tasks</Text>
              </View>
              <Text style={[styles.projectPercent, { color: project.statusColor }]}>{project.progress}%</Text>
            </View>

            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${project.progress}%`, backgroundColor: project.statusColor }]} />
            </View>

            {project.tasks.length > 0 && (
              <View style={{ gap: 8, marginTop: 10 }}>
                {project.tasks.map((task) => {
                  const st = getTaskStatusStyle(task.statusType);
                  return (
                    <TouchableOpacity
                      key={task.id}
                      style={[styles.projectTaskItem, { borderLeftColor: st.border }]}
                      onPress={() => onSelectTask?.(task)}
                      activeOpacity={onSelectTask ? 0.7 : 1}
                    >
                      <Text style={styles.projectTaskTitle}>{task.title}</Text>
                      <View style={[styles.statusPill, st.pill]}>
                        <Text style={[styles.statusPillText, st.text]}>{task.status}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 14 },
  projectSummaryRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  projectSummaryCard: { flex: 1, backgroundColor: '#192122', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59,73,76,0.3)' },
  projectSummaryNum: { fontSize: 18, fontWeight: '800', color: '#00e5ff', marginVertical: 2 },
  projectSummaryLabel: { fontSize: 11, color: '#849396' },
  emptyState: { paddingVertical: 40, alignItems: 'center' },
  projectCard: { backgroundColor: '#192122', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(59,73,76,0.3)', marginBottom: 12 },
  projectCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  projectIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  projectName: { fontSize: 14, fontWeight: '700', color: '#dce4e5' },
  projectMetaText: { fontSize: 11, color: '#849396', marginTop: 2 },
  projectPercent: { fontSize: 16, fontWeight: '800' },
  progressBarBg: { height: 6, backgroundColor: 'rgba(59,73,76,0.4)', borderRadius: 999, overflow: 'hidden' },
  progressBarFill: { height: '100%' },
  projectTaskItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#151d1e', padding: 10, borderRadius: 8, borderLeftWidth: 3 },
  projectTaskTitle: { fontSize: 12, color: '#dce4e5', flex: 1, marginRight: 8 },
  statusPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusPillText: { fontSize: 10, fontWeight: '700' },
});
