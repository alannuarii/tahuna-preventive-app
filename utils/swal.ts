import Swal from 'sweetalert2'

export const showAlert = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  return Swal.fire({
    title: type === 'error' ? 'Kesalahan' : type === 'success' ? 'Sukses' : 'Pemberitahuan',
    text: message,
    icon: type,
    confirmButtonText: 'OK',
    confirmButtonColor: '#34d399',
    background: '#1a1a24',
    color: '#f8fafc',
    customClass: {
      popup: 'border border-gray-800 rounded-xl',
      confirmButton: 'rounded-lg px-4 py-2 font-semibold'
    }
  })
}

export const showConfirm = async (message: string, title: string = 'Apakah Anda Yakin?') => {
  const result = await Swal.fire({
    title: title,
    text: message,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#4b5563',
    confirmButtonText: 'Ya, Lanjutkan!',
    cancelButtonText: 'Batal',
    background: '#1a1a24',
    color: '#f8fafc',
    customClass: {
      popup: 'border border-gray-800 rounded-xl',
      confirmButton: 'rounded-lg px-4 py-2 font-semibold',
      cancelButton: 'rounded-lg px-4 py-2 font-semibold'
    }
  })
  return result.isConfirmed
}
