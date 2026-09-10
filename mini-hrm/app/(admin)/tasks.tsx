import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTasksQuery } from '@/hooks/queries/useTaskQueries';

// ─── Helpers ──────────────────────────────────────────────────────────────────


function getTaskStyle(type: string) {
  switch (type) {
    case 'warning':
      return { border: '#f5cd00', pill: 'rgba(245,205,0,0.13)', text: '#ffecac' };
    case 'danger':
      return { border: '#ffb4ab', pill: 'rgba(255,180,171,0.13)', text: '#ffb4ab' };
    case 'primary':
      return { border: '#00e5ff', pill: 'rgba(0,229,255,0.10)', text: '#c3f5ff' };
    case 'success':
      return { border: '#05e777', pill: 'rgba(5,231,119,0.13)', text: '#7dffa2' };
    default:
      return { border: '#849396', pill: 'rgba(132,147,150,0.12)', text: '#bac9cc' };
  }
}

function getStageBadge(stage?: string) {
  switch (stage) {
    case 'design':
      return { label: '🎨 Thiết kế', bg: 'rgba(255,128,171,0.12)', text: '#ff80ab' };
    case 'development':
      return { label: '💻 Lập trình', bg: 'rgba(245,205,0,0.12)', text: '#f5cd00' };
    case 'testing':
      return { label: '🧪 Kiểm thử', bg: 'rgba(0,229,255,0.12)', text: '#00e5ff' };
    case 'completed':
    default:
      return { label: '🚀 Hoàn thành', bg: 'rgba(5,231,119,0.12)', text: '#05e777' };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminTasksScreen({ hideBackButton = false }: { hideBackButton?: boolean } = {}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { data: tasks = [] } = useTasksQuery();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<(typeof tasks)[0] | null>(null);


  // Route Guard: only admin can access this screen
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0d1516' }}>
        <ActivityIndicator size="large" color="#00e5ff" />
      </View>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Redirect href="/" />;
  }

  // Filter logic
  const filteredTasks = tasks.filter((t) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'master') return t.isMasterProject;
    if (selectedFilter === 'design') return t.pipelineStage === 'design';
    if (selectedFilter === 'dev') return t.pipelineStage === 'development';
    if (selectedFilter === 'testing') return t.pipelineStage === 'testing';
    if (selectedFilter === 'todo') return t.status === 'Cần làm';
    if (selectedFilter === 'doing') return t.status === 'Đang làm';
    if (selectedFilter === 'review') return t.status === 'Chờ test' || t.status === 'Chờ review';
    if (selectedFilter === 'done') return t.status === 'Hoàn thành';
    if (selectedFilter === 'overdue') return t.status === 'Trễ hạn';
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        {!hideBackButton && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(admin)/dashboard');
              }
            }}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={22} color="#bac9cc" />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1, marginLeft: hideBackButton ? 0 : 8 }}>
          <Text style={styles.headerTitle}>Quản lý Công việc</Text>
          <Text style={styles.headerSubtitle}>Giám sát tiến độ toàn hệ thống</Text>
        </View>
      </View>

      {/* Filter Horizontal Scroll */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
          nestedScrollEnabled={true}
          scrollEventThrottle={16}
        >
          {([
            { id: 'all', label: 'Tất cả' },
            { id: 'master', label: '🚀 Dự án Lớn' },
            { id: 'design', label: '🎨 Thiết kế' },
            { id: 'dev', label: '💻 Lập trình' },
            { id: 'testing', label: '🧪 Kiểm thử' },
            { id: 'review', label: 'Chờ duyệt/Review' },
            { id: 'done', label: 'Hoàn thành' },
            { id: 'overdue', label: 'Trễ hạn' },
          ] as const).map((filter) => {
            const isActive = selectedFilter === filter.id;
            return (
              <TouchableOpacity
                key={filter.id}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setSelectedFilter(filter.id)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Task List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        decelerationRate="normal"
      >
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="assignment-late" size={48} color="#3b494c" />
            <Text style={styles.emptyText}>Không tìm thấy công việc phù hợp</Text>
          </View>
        ) : (
          filteredTasks.map((task) => {
            const s = getTaskStyle(task.statusType);
            const prog = task.progress || 0;
            const progColor = prog === 100 ? '#05e777' : prog < 50 && task.status === 'Trễ hạn' ? '#ff4d4d' : '#00e5ff';
            return (
              <TouchableOpacity
                key={task.id}
                style={[styles.taskCard, { borderLeftColor: s.border }]}
                onPress={() => setSelectedTask(task)}
                activeOpacity={0.8}
              >
                <View style={styles.taskCardTop}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    {task.isMasterProject && (
                      <View style={[styles.statusPill, { backgroundColor: 'rgba(0, 229, 255, 0.15)', borderColor: '#00daf3', borderWidth: 1 }]}>
                        <Text style={[styles.statusText, { color: '#00daf3' }]}>
                          🚀 DỰ ÁN LỚN
                        </Text>
                      </View>
                    )}
                    {task.pipelineStage && (
                      <View style={[styles.statusPill, { backgroundColor: getStageBadge(task.pipelineStage).bg }]}>
                        <Text style={[styles.statusText, { color: getStageBadge(task.pipelineStage).text }]}>
                          {getStageBadge(task.pipelineStage).label}
                        </Text>
                      </View>
                    )}
                    <View style={[styles.statusPill, { backgroundColor: s.pill }]}>
                      <Text style={[styles.statusText, { color: s.text }]}>
                        {task.status}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={{ marginVertical: 8, gap: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <Text style={{ fontSize: 11, color: '#bac9cc', fontWeight: '600', flex: 1, marginRight: 8 }}>
                      {task.isMasterProject ? 'Tiến độ Tổng Dự án Lớn:' : task.masterTaskId ? `Tiến độ Chặng (${getStageBadge(task.pipelineStage).label}):` : 'Tiến độ:'}
                    </Text>
                    <View style={[styles.progBadge, { backgroundColor: `${progColor}22`, borderColor: `${progColor}55` }]}>
                      <Text style={{ fontSize: 11, color: progColor, fontWeight: '800', minWidth: 34, textAlign: 'center' }}>
                        {prog}%
                      </Text>
                    </View>
                  </View>

                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${prog}%`, backgroundColor: progColor },
                      ]}
                    />
                  </View>

                  {prog === 100 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <MaterialIcons name="check-circle" size={12} color="#05e777" />
                      <Text style={{ fontSize: 10, color: '#05e777', fontWeight: '600' }}>Hoàn thành 100%</Text>
                    </View>
                  )}
                </View>

                <View style={styles.taskCardBottom}>
                  <View style={styles.assigneeRow}>
                    <View style={styles.assigneeAvatar}>
                      <Text style={styles.assigneeInitials}>{task.assigneeInitials}</Text>
                    </View>
                    <Text style={styles.assigneeName}>{task.assigneeName}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {task.budget && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0, 229, 255, 0.08)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(0, 229, 255, 0.2)' }}>
                        <MaterialIcons name="account-balance-wallet" size={12} color="#00e5ff" />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#7dffa2' }}>{task.budget}</Text>
                      </View>
                    )}

                    <View style={styles.dueRow}>
                      <MaterialIcons name="schedule" size={13} color="#849396" />
                      <Text style={styles.dueText}>{task.deadline}</Text>
                    </View>
                  </View>
                </View>

                {/* Tap hint */}
                <View style={styles.tapHint}>
                  <MaterialIcons name="open-in-new" size={10} color="#3b494c" />
                  <Text style={styles.tapHintText}>Nhấn để xem chi tiết</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/assign-task')}
        activeOpacity={0.85}
      >
        <MaterialIcons name="add" size={24} color="#00363d" />
        <Text style={styles.fabText}>Giao việc mới</Text>
      </TouchableOpacity>

      {/* Task Detail Modal */}
      <Modal
        visible={!!selectedTask}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedTask(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedTask(null)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            {selectedTask && (() => {
              const s = getTaskStyle(selectedTask.statusType);
              const prog = selectedTask.progress || 0;
              const progColor = prog === 100 ? '#05e777' : prog < 50 && selectedTask.status === 'Trễ hạn' ? '#ff4d4d' : '#00e5ff';
              const stage = selectedTask.pipelineStage ? getStageBadge(selectedTask.pipelineStage) : null;
              return (
                <>
                  {/* Modal Handle */}
                  <View style={styles.modalHandle} />

                  {/* Modal Header */}
                  <View style={styles.modalHeader}>
                    <View style={{ flex: 1, gap: 6 }}>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {selectedTask.isMasterProject && (
                          <View style={[styles.statusPill, { backgroundColor: 'rgba(0,229,255,0.15)', borderColor: '#00daf3', borderWidth: 1 }]}>
                            <Text style={[styles.statusText, { color: '#00daf3' }]}>🚀 DỰ ÁN LỚN</Text>
                          </View>
                        )}
                        {stage && (
                          <View style={[styles.statusPill, { backgroundColor: stage.bg }]}>
                            <Text style={[styles.statusText, { color: stage.text }]}>{stage.label}</Text>
                          </View>
                        )}
                        <View style={[styles.statusPill, { backgroundColor: s.pill }]}>
                          <Text style={[styles.statusText, { color: s.text }]}>{selectedTask.status}</Text>
                        </View>
                      </View>
                      <Text style={styles.modalTitle}>{selectedTask.title}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedTask(null)} style={styles.modalClose}>
                      <MaterialIcons name="close" size={20} color="#bac9cc" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                    {/* Progress Section */}
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Tiến độ</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                        <View style={{ flex: 1 }}>
                          <View style={[styles.progressTrack, { height: 10 }]}>
                            <View style={[styles.progressFill, { width: `${prog}%`, backgroundColor: progColor, borderRadius: 999 }]} />
                          </View>
                        </View>
                        <View style={[styles.progBadgeLg, { backgroundColor: `${progColor}22`, borderColor: `${progColor}55` }]}>
                          <Text style={{ fontSize: 18, fontWeight: '800', color: progColor }}>{prog}%</Text>
                        </View>
                      </View>
                      {prog === 100 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(5,231,119,0.08)', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(5,231,119,0.2)' }}>
                          <MaterialIcons name="check-circle" size={16} color="#05e777" />
                          <Text style={{ fontSize: 13, color: '#05e777', fontWeight: '700' }}>Công việc đã hoàn thành 100%!</Text>
                        </View>
                      )}
                    </View>

                    {/* Info rows */}
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Thông tin</Text>
                      <View style={styles.infoGrid}>
                        <View style={styles.infoRow}>
                          <MaterialIcons name="person" size={15} color="#849396" />
                          <Text style={styles.infoLabel}>Người thực hiện</Text>
                          <Text style={styles.infoValue}>{selectedTask.assigneeName}</Text>
                        </View>
                        <View style={styles.infoRow}>
                          <MaterialIcons name="schedule" size={15} color="#849396" />
                          <Text style={styles.infoLabel}>Deadline</Text>
                          <Text style={[styles.infoValue, selectedTask.status === 'Trễ hạn' && { color: '#ff4d4d' }]}>
                            {selectedTask.deadline}
                          </Text>
                        </View>
                        {selectedTask.budget && (
                          <View style={styles.infoRow}>
                            <MaterialIcons name="account-balance-wallet" size={15} color="#849396" />
                            <Text style={styles.infoLabel}>Ngân sách</Text>
                            <Text style={[styles.infoValue, { color: '#7dffa2' }]}>{selectedTask.budget}</Text>
                          </View>
                        )}
                        {selectedTask.pipelineStage && (
                          <View style={styles.infoRow}>
                            <MaterialIcons name="timeline" size={15} color="#849396" />
                            <Text style={styles.infoLabel}>Giai đoạn</Text>
                            <Text style={[styles.infoValue, { color: stage?.text }]}>{stage?.label}</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Description if exists */}
                    {(selectedTask as any).description && (
                      <View style={styles.modalSection}>
                        <Text style={styles.modalSectionTitle}>Mô tả</Text>
                        <Text style={{ fontSize: 13, color: '#bac9cc', lineHeight: 20 }}>{(selectedTask as any).description}</Text>
                      </View>
                    )}
                  </ScrollView>
                </>
              );
            })()}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0d1516',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 73, 76, 0.35)',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(46, 54, 56, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00daf3',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#849396',
    marginTop: 2,
  },

  /* Filters */
  filterSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 73, 76, 0.2)',
  },
  filterScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#151d1e',
    borderWidth: 1,
    borderColor: 'rgba(59, 73, 76, 0.5)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(0, 218, 243, 0.12)',
    borderColor: '#00daf3',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#849396',
  },
  filterChipTextActive: {
    color: '#00daf3',
  },

  /* List */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    gap: 12,
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#849396',
  },

  /* Cards */
  taskCard: {
    backgroundColor: '#151d1e',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(59, 73, 76, 0.35)',
    borderLeftWidth: 4,
    position: 'relative',
  },
  progressTrack: {
    height: 7,
    backgroundColor: 'rgba(59, 73, 76, 0.5)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  progBadgeLg: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 70,
  },
  tapHint: {
    position: 'absolute',
    bottom: 6,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    opacity: 0.5,
  },
  tapHintText: {
    fontSize: 9,
    color: '#3b494c',
  },
  taskCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  taskTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#dce4e5',
    lineHeight: 20,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  taskCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 73, 76, 0.15)',
    paddingTop: 12,
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  assigneeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 218, 243, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 218, 243, 0.25)',
  },
  assigneeInitials: {
    fontSize: 9,
    fontWeight: '700',
    color: '#00daf3',
  },
  assigneeName: {
    fontSize: 12,
    color: '#bac9cc',
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueText: {
    fontSize: 11,
    color: '#849396',
  },

  /* FAB */
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#00daf3',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    shadowColor: '#00daf3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  fabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00363d',
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#151d1e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingBottom: 32,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderColor: 'rgba(0, 218, 243, 0.15)',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(132, 147, 150, 0.4)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 73, 76, 0.3)',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#dce4e5',
    lineHeight: 24,
  },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  modalSection: {
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(59, 73, 76, 0.25)',
  },
  modalSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#849396',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  infoGrid: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#849396',
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    color: '#dce4e5',
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
  },
});