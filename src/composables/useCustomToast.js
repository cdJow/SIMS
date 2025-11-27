import { useToast } from 'primevue/usetoast';

export function useCustomToast() {
  const toast = useToast();

  const showToast = (severity, summary, detail = '', life = 3000) => {
    toast.add({
      severity,
      summary,
      detail,
      life,
      group: 'bc' // Use the custom template group
    });
  };

  const showSuccess = (summary, detail = '', life = 3000) => {
    showToast('success', summary, detail, life);
  };

  const showError = (summary, detail = '', life = 3000) => {
    showToast('error', summary, detail, life);
  };

  const showWarning = (summary, detail = '', life = 3000) => {
    showToast('warn', summary, detail, life);
  };

  const showInfo = (summary, detail = '', life = 3000) => {
    showToast('info', summary, detail, life);
  };

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
}