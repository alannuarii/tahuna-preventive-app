const splitCatatan = (catatan: string | null | undefined) => {
  if (!catatan) return { textPart: '', warningPart: '' }

  let textPart = catatan.trim()
  let warningPart = ''

  const warningIndex = textPart.indexOf('[⚠️ SYSTEM PARSING WARNINGS]')
  if (warningIndex !== -1) {
    warningPart = textPart.substring(warningIndex).trim()
    textPart = textPart.substring(0, warningIndex).trim()
  }

  try {
    const parsed = JSON.parse(textPart)
    if (parsed && typeof parsed === 'object') {
      let extracted = ''
      if (parsed.data && typeof parsed.data === 'object') {
        extracted = parsed.data.text || parsed.data.message || parsed.data.body || ''
      }
      if (!extracted) {
        extracted = parsed.text || parsed.message || parsed.body || ''
      }
      if (extracted) {
        textPart = extracted
      }
    }
  } catch (e) {
    // Ignore invalid JSON
  }

  // Normalize newline
  textPart = textPart
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/<br\s*\/?>/gi, '\n')

  return { textPart, warningPart }
}

export const formatCatatanText = (catatan: string | null | undefined): string => {
  const { textPart } = splitCatatan(catatan)
  return textPart || '-'
}

export const hasCatatanWarnings = (catatan: string | null | undefined): boolean => {
  const { warningPart } = splitCatatan(catatan)
  return !!warningPart
}

export const getCatatanWarnings = (catatan: string | null | undefined): string[] => {
  const { warningPart } = splitCatatan(catatan)
  if (!warningPart) return []
  return warningPart
    .split('\n')
    .filter(line => line.trim().startsWith('-'))
    .map(line => line.trim().substring(1).trim())
}

export const formatCatatan = (catatan: string | null | undefined): string => {
  const { textPart, warningPart } = splitCatatan(catatan)
  if (!textPart) return '-'
  if (warningPart) {
    return `${textPart}\n\n${warningPart}`
  }
  return textPart
}
