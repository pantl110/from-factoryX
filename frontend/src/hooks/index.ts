// 공통 hooks
export { useAuthGuard } from './use-auth-guard'
export { default as useToast } from './use-toast'
export { usePortalDropdown } from './use-portal-dropdown'
export { usePassword } from './use-password'
export { default as usePagination } from './use-pagination'
export { useInput } from './use-input'
export { useDropdownFilter } from './use-dropdown-filter'
export { useCheckAll } from './use-check-all'

// Utility hooks
export { getToday } from './get-today'
export {
  extractNumbers,
  formatDate,
  formatBusinessNumber,
  formatPhoneNumber,
  formatFaxNumber,
  handleNumberKeyDown,
  formatTime,
  formatDateTime,
} from './format-number'

// User related hooks
export { useEmailVerification } from './users/use-email-verification'
export { useLogout } from './users/use-logout'
export { useMe } from './users/use-me'
export { useLogin } from './users/use-login'
export { useSignup } from './users/use-signup'
export { useResetPassword } from './users/use-reset-password'
export { useVerification } from './users/use-verification'

// Factory related hooks
export { default as useCreateFactory } from './factory/use-create-factory'
export { useGetFactoryList, useGetFactory } from './factory/use-get-factory'
export { default as useUpdateFactory } from './factory/use-update-factory'
export { default as useDeleteFactory } from './factory/use-delete-factory'

// Factory equipment related hooks
export { default as useCreateEquipment } from './factory-equipment/use-create-equipment'
export { default as useUpdateEquipment } from './factory-equipment/use-update-equipment'
export { default as useGetEquipment } from './factory-equipment/use-get-equipment'
export { default as useDeleteEquipment } from './factory-equipment/use-delete-equipment'
export { default as useGetEquipmentDetail } from './factory-equipment/use-get-equipment-detail'

// Factory client related hooks
export { default as useCreateClient } from './factory-client/use-create-client'
export { default as useGetClient } from './factory-client/use-get-client'
export { default as useGetClientDetail } from './factory-client/use-get-client-detail'
export { default as useUpdateClient } from './factory-client/use-update-client'
export { default as useDeleteClient } from './factory-client/use-delete-client'
export { default as useSearchClient } from './factory-client/use-search-client'

// Product related hooks
export { default as useCreateProduct } from './product/use-create-product'
export { default as useGetProduct } from './product/use-get-product'
export { default as useUpdateProduct } from './product/use-update-product'
export { default as useDeleteProduct } from './product/use-delete-product'
