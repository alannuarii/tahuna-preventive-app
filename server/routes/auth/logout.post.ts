export default defineEventHandler(async (event) => {
  setCookie(event, 'auth_token', '', {
    path: '/',
    expires: new Date(0),
  })
  return { success: true }
})
