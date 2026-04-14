import { dashboardData as adminDashboardData } from '../../../admin-dashboard/dashboard/server/dashboardData.js'
import { dashboardData as driverDashboardData } from '../../../driver-dashboard/server/dashboardData.js'

export const dashboardData = {
  ...adminDashboardData,
  podWorkflowRecords: driverDashboardData.podWorkflowRecords ?? [],
  walletStats: driverDashboardData.walletStats ?? [],
  paymentHistory: driverDashboardData.paymentHistory ?? [],
  payoutMethods: driverDashboardData.payoutMethods ?? [],
}
