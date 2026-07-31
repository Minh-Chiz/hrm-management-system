import { useMemo } from 'react';
import { useUsersQuery } from '@/hooks/queries/useUserQueries';
import { useRequestsQuery } from '@/hooks/queries/useRequestQueries';
import { useCheckInLogsQuery } from '@/hooks/queries/useCheckInQueries';
import { Employee, PendingRequest } from '@/types';

export function useAdminDashboard() {
  const { data: employeesData, isLoading: usersLoading, refetch: refetchUsers } = useUsersQuery();
  const { data: requestsData, isLoading: requestsLoading, refetch: refetchRequests } = useRequestsQuery();
  const { data: checkInsData, isLoading: checkInsLoading, refetch: refetchCheckIns } = useCheckInLogsQuery();

  const employees: Employee[] = useMemo(() => employeesData || [], [employeesData]);
  const requests: PendingRequest[] = useMemo(() => requestsData || [], [requestsData]);
  const checkIns = useMemo(() => checkInsData || [], [checkInsData]);

  const todayStr = useMemo(() => new Date().toLocaleDateString('vi-VN'), []);

  const stats = useMemo(() => {
    const totalEmployees = employees.length;
    const onlineCount = employees.filter((e) => e.status === 'Active').length;
    const pendingRequestsCount = requests.filter((r) => r.status === 'pending').length;
    const todayLeavesCount = requests.filter(
      (r) => r.type === 'Nghỉ phép' && r.status === 'approved' && r.date === todayStr
    ).length;

    return {
      totalEmployees,
      onlineCount,
      pendingRequestsCount,
      todayLeavesCount,
    };
  }, [employees, requests, todayStr]);

  const recentActivity = useMemo(() => {
    return checkIns.slice(0, 5);
  }, [checkIns]);

  const isLoading = usersLoading || requestsLoading || checkInsLoading;

  const refetchAll = async () => {
    await Promise.all([refetchUsers(), refetchRequests(), refetchCheckIns()]);
  };

  return {
    employees,
    requests,
    checkIns,
    stats,
    recentActivity,
    todayStr,
    isLoading,
    refetchAll,
  };
}
