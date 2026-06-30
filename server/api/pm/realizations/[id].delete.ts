import { deleteRealization } from '~/server/utils/realization'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  try {
    const success = await deleteRealization(id)
    if (!success) {
      throw createError({ statusCode: 404, statusMessage: 'Not found' })
    }

    return { success: true, message: 'Deleted' }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: 'Server error' })
  }
})
