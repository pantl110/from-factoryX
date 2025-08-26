// 공통 hooks
// export { useAuthGuard } from './use-auth-guard';
export { default as useToast } from './use-toast';
export { usePortalDropdown } from './use-portal-dropdown';
export { usePassword } from './use-password';
export { default as usePagination } from './use-pagination';
export { useInput } from './use-input';
export { useDropdownFilter } from './use-dropdown-filter';
export { useCheckAll } from './use-check-all';
export { usePeriodSelector } from './use-period-selector';

// Utility hooks
export { getToday } from './get-today';
export {
  extractNumbers,
  formatDate,
  formatBusinessNumber,
  formatPhoneNumber,
  formatFaxNumber,
  handleNumberKeyDown,
  formatTime,
  formatDateTime,
} from './format-number';

// User related hooks
export { useEmailVerification } from './users/use-email-verification';
export { useLogout } from './users/use-logout';
export { useMe } from './users/use-me';
export { useLogin } from './users/use-login';
export { useSignup } from './users/use-signup';
export { useResetPassword } from './users/use-reset-password';
export { useVerification } from './users/use-verification';
export { useWithdraw } from './users/use-withdraw';

// Factory related hooks
export { default as useCreateFactory } from './factory/use-create-factory';
export { useGetFactoryList, useGetFactory } from './factory/use-get-factory';
export { default as useUpdateFactory } from './factory/use-update-factory';
export { default as useDeleteFactory } from './factory/use-delete-factory';

// Factory equipment related hooks
export { default as useCreateEquipment } from './factory/factory-equipment/use-create-equipment';
export { default as useUpdateEquipment } from './factory/factory-equipment/use-update-equipment';
export { default as useGetEquipment } from './factory/factory-equipment/use-get-equipment';
export { default as useDeleteEquipment } from './factory/factory-equipment/use-delete-equipment';
export { default as useGetEquipmentDetail } from './factory/factory-equipment/use-get-equipment-detail';

// Factory client related hooks
export { default as useCreateClient } from './factory/factory-client/use-create-client';
export { default as useGetClient } from './factory/factory-client/use-get-client';
export { default as useGetClientDetail } from './factory/factory-client/use-get-client-detail';
export { default as useUpdateClient } from './factory/factory-client/use-update-client';
export { default as useDeleteClient } from './factory/factory-client/use-delete-client';

// Project related hooks
export { default as useCreateProject } from './project/use-create-project';
export { default as useDeleteProject } from './project/use-delete-project';
export { default as useUpdateProjectStatus } from './project/use-update-project-status';
export { default as useUpdateProjectTransactDate } from './project/use-update-project-transact-date';
export { default as useGetProjects } from './project/use-get-projects';
export { default as useGetProjectStatus } from './project/use-get-project-status';
export { default as useCloneProject } from './project/project-plan/use-clone-project';

// Project log related hooks
export { default as useCreateProjectLog } from './project/project-log/use-create-project-log';
export { default as useGetProjectLogs } from './project/project-log/use-get-project-logs';
export { default as useUpdateProjectLog } from './project/project-log/use-update-project-log';

// Project plan related hooks
export { default as useCreateOrUpdateProjectPlan } from './project/project-plan/use-create-or-update-project-plan';
export { default as useGetProjectPlans } from './project/project-plan/use-get-project-plans';

// Project refund related hooks
export { default as useCreateRefund } from './project/project-refund/use-create-refund';
export { default as useGetRefundDetail } from './project/project-refund/use-get-refund-detail';
export { default as useUpdateRefund } from './project/project-refund/use-update-refund';
// export { default as useRegisterProductionFromRefund } from './project/project-refund/use-register-production-from-refund';

// Notification related hooks
export { default as useGetNotifications } from './notification/use-get-notifications';
export { default as useMarkAllNotificationsRead } from './notification/use-mark-all-notifications-read';
export { default as useGetNotificationDetail } from './notification/use-get-notification-detail';

// Tax related hooks
export { default as useTaxApi } from './tax/use-tax-api';
export { default as useCreateTaxInvoice } from './tax/use-create-tax-invoice';
export { default as useGetTaxInvoiceState } from './tax/use-get-tax-invoice-state';
export { default as useGetPublishedTaxInvoices } from './tax/use-get-published-tax-invoices';
export { default as useUpdateTaxInvoice } from './tax/use-update-tax-invoice';
export { default as useGetPendingTaxInvoices } from './tax/use-get-pending-tax-invoices';
export { default as useGetUnlinkedTaxInvoices } from './tax/use-get-unlinked-tax-invoices';
export { default as useLinkTaxInvoice } from './tax/use-link-tax-invoice';
export { default as useGetTaxInvoiceByMaterialHistory } from './tax/use-get-tax-invoice-by-material-history';
export { default as useGetTaxInvoiceDetail } from './tax/use-get-tax-invoice-detail';
export { default as usePublishTaxInvoice } from './tax/use-publish-tax-invoice';
export { default as useCancelTaxInvoice } from './tax/use-cancel-tax-invoice';
export { default as useDeleteTaxInvoice } from './tax/use-delete-tax-invoice';
export { useCheckBarobill } from './tax/barobil/use-check-barobill';
export {
  useBarobillRegister,
  useBarobillCorpCertUrl,
  useBarobillCertCheck,
} from './tax/barobil/use-barobill';

// Cash receipt related hooks
export { useGetCashReceipts } from './tax/cash-receipt/use-get-cash-receipts';
export { default as useGetCashReceiptDetail } from './tax/cash-receipt/use-get-cash-receipt-detail';

// AWS related hooks
export { default as useUploadFile } from './aws/use-upload-file';

// Factory member related hooks
export { default as useInviteMember } from './factory/factory-member/use-invite-member';
export { default as useGetMembers } from './factory/factory-member/use-get-members';
export { default as useDeleteMember } from './factory/factory-member/use-delete-member';
export { default as useUpdateMember } from './factory/factory-member/use-update-member';
export { default as useGetMember } from './factory/factory-member/use-get-member';

// Product related hooks
export { default as useCreateProduct } from './stock/product/use-create-product';
export { default as useGetProduct } from './stock/product/use-get-product';
export { default as useUpdateProduct } from './stock/product/use-update-product';
export { default as useDeleteProduct } from './stock/product/use-delete-product';
export { default as useCreateSingleProduct } from './stock/product/use-create-single-product';
export { default as useAssignProduct } from './stock/product/use-assign-product';

// Product history related hooks
export { default as useProductHistory } from './stock/use-product-history';

// Material related hooks
export { default as useCreateMaterial } from './stock/material/use-create-material';
export { default as useGetMaterial } from './stock/material/use-get-material';
export { default as useUpdateMaterial } from './stock/material/use-update-material';
export { default as useDeleteMaterial } from './stock/material/use-delete-material';
export { default as useAssignMaterialProduct } from './stock/material/use-assign-material-product';

// Material history related hooks
export { default as useCreateMaterialHistory } from './stock/material-history/use-create-material-history';
export { default as useCreateSingleMaterialHistory } from './stock/material-history/use-create-single-material-history';
export { default as useGetMaterialHistory } from './stock/material-history/use-get-material-history';

// Material product related hooks
export { default as useMaterialProduct } from './stock/use-material-product';
export { useMaterialStatus } from './stock/use-material-status';

// Location related hooks
export { default as useLocation } from './stock/use-location';

// Document related hooks
export { default as useOcrUpload } from './document/quotation/use-ocr-upload';
export { default as useGetDetailQuotation } from './document/use-get-quotation';
export { default as useSaveDraftQuotation } from './document/quotation/use-save-draft-quotation';
export { default as useStartProduction } from './document/quotation/use-start-production';
export { default as useGetQuotationProducts } from './document/quotation/use-get-quotation-products';
export { default as useGetQuotationProductDetail } from './document/quotation/use-get-quotation-product-detail';
export { default as useGetQuotationHistory } from './document/quotation/use-get-quotation-history';
export { useUpdateQuotationProductDelivery } from './document/quotation/use-update-quotation-product-delivery';

// Production related hooks // 생산계획에서 form 유효성 검사 훅
export { useProductionPlanValidation } from './production/use-production-plan-validation';

// dashboard related hooks
export { default as useGetTodayProductionPlans } from './dashboard/use-get-today-production-plans';
export { default as useGetUndeliveredProducts } from './dashboard/use-get-undelivered-products';
export { default as useGetDashboard } from './dashboard/use-get-dashboard';

// websocket related hooks
export { useWebSocket } from './websocket/use-websocket';
