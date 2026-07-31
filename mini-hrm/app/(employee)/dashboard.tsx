import React, { useState } from 'react';
import { ScrollView, RefreshControl, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { EditProfileModal } from '@/components/EditProfileModal';
import {
  useEmployeeDashboard, ProfileHeader, CheckInCard, TaskSummaryWidget,
  LeaveRequestWidget, RecentActivityList, ProjectTabContent, ProfileTabContent,
  NotificationModal, CreateRequestModal, TaskDetailModal, AllTasksModal, EarlyCheckOutModal,
} from '@/features/employee';


export default function EmployeeDashboard() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const dash = useEmployeeDashboard();

  const handleRefresh = async () => {
    setRefreshing(true);
    await dash.refreshData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ProfileHeader
        user={dash.user}
        unreadNotiCount={dash.unreadNotiCount}
        onOpenNotificationModal={() => dash.setNotiModalVisible(true)}
        onOpenCreateRequestModal={dash.handleOpenModal}
        onLogout={dash.logout}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: Math.max(insets.bottom + 80, 100) }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#00e5ff" />}
        showsVerticalScrollIndicator={false}
      >
        {dash.activeTab === 'personal' && (
          <>
            <CheckInCard
              shiftInfo={dash.shiftInfo}
              checkInsHistory={dash.myHistory}
              wifiSSID={dash.wifiSSID}
              isCompanyWifi={dash.isCompanyWifi}
              onToggleWifi={dash.onToggleWifi}
              onCheckInPress={dash.handleCheckInPress}
            />

            <TaskSummaryWidget
              tasks={dash.myTasks}
              filteredTasks={dash.filteredMyTasks}
              stats={dash.taskStats}
              searchQuery={dash.searchTaskQuery}
              activeFilter={dash.taskFilter}
              onSearchChange={dash.setSearchTaskQuery}
              onFilterChange={dash.setTaskFilter as any}
              onSeeAllPress={() => dash.setAllTasksVisible(true)}
              onSelectTask={(task) => { dash.setSelectedTask(task); dash.setTaskDetailVisible(true); }}
            />
            <LeaveRequestWidget requests={dash.myRequests} onOpenCreateModal={dash.handleOpenModal} />
            <RecentActivityList activities={dash.recentActivities} />
          </>
        )}

        {dash.activeTab === 'project' && (
          <ProjectTabContent
            tasks={dash.tasks}
            onSelectTask={(task) => {
              dash.setSelectedTask(task);
              dash.setTaskDetailVisible(true);
            }}
          />
        )}

        {dash.activeTab === 'profile' && (
          <ProfileTabContent
            user={dash.user}
            activeEmp={dash.activeEmp}
            requests={dash.myRequests}
            onOpenCreateModal={dash.handleOpenModal}
            onEditProfile={() => dash.setShowEditProfileModal(true)}
            onLogout={dash.logout}
          />
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      {!dash.isAnyModalVisible && (
        <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {([
            { id: 'personal', icon: 'person', label: 'Cá nhân' },
            { id: 'project', icon: 'folder-open', label: 'Dự án' },
            { id: 'profile', icon: 'account-circle', label: 'Tài khoản' },
          ] as const).map((tab) => {
            const isActive = dash.activeTab === tab.id;
            return (
              <TouchableOpacity key={tab.id} style={[styles.navTab, isActive && styles.navTabActive]} onPress={() => dash.setActiveTab(tab.id)} activeOpacity={0.75}>
                <MaterialIcons name={tab.icon} size={22} color={isActive ? '#00e5ff' : '#849396'} />
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Modals */}
      <EarlyCheckOutModal
        visible={dash.earlyCheckOutModalVisible}
        shiftName={dash.shiftInfo.activeShiftName}
        shiftEndTime={dash.shiftInfo.shiftEndTime}
        remainingText={dash.shiftInfo.remainingText || ''}
        onCancel={() => dash.setEarlyCheckOutModalVisible(false)}
        onConfirm={dash.confirmEarlyCheckOut}
      />
      <NotificationModal visible={dash.notiModalVisible} onClose={() => dash.setNotiModalVisible(false)} notifications={dash.myNotifications} unreadCount={dash.unreadNotiCount} onMarkAsRead={dash.markNotificationAsRead} onMarkAllAsRead={dash.markAllNotificationsAsRead} />
      <AllTasksModal visible={dash.allTasksVisible} onClose={() => dash.setAllTasksVisible(false)} tasks={dash.myTasks} onSelectTask={(task) => { dash.setSelectedTask(task); dash.setTaskDetailVisible(true); }} />
      <CreateRequestModal visible={dash.modalVisible} onClose={() => dash.setModalVisible(false)} selectedType={dash.selectedType} onSelectType={dash.setSelectedType} applyDate={dash.applyDate} onApplyDateChange={dash.setApplyDate} reason={dash.reason} onReasonChange={dash.setReason} attachedFile={dash.attachedFile} onAttachFile={dash.handleAttachFile} onSubmit={dash.handleSubmitRequest} />
      <TaskDetailModal visible={dash.taskDetailVisible} onClose={() => dash.setTaskDetailVisible(false)} task={dash.selectedTask} showAllStatusOptions={dash.showAllStatusOptions} onToggleShowAllStatus={() => dash.setShowAllStatusOptions(!dash.showAllStatusOptions)} onUpdateStatus={dash.handleUpdateStatus} onProgressStep={dash.handleProgressStep} />
      <EditProfileModal visible={dash.showEditProfileModal} onClose={() => dash.setShowEditProfileModal(false)} />
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1516' },
  scroll: { flex: 1 },
  bottomNav: { flexDirection: 'row', backgroundColor: 'rgba(13,21,22,0.95)', borderTopWidth: 1, borderTopColor: 'rgba(59,73,76,0.3)', paddingTop: 8 },
  navTab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  navTabActive: {},
  navLabel: { fontSize: 11, color: '#849396', marginTop: 2 },
  navLabelActive: { color: '#00e5ff', fontWeight: '700' },
});
