import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import axios from 'axios'

// Base URL configurável via window.APP_CONFIG.apiBaseUrl ou VITE_API_BASE_URL
const API_BASE = (typeof window !== 'undefined' && window.APP_CONFIG && window.APP_CONFIG.apiBaseUrl) || import.meta.env.VITE_API_BASE_URL || ''
axios.defaults.baseURL = API_BASE ? API_BASE.replace(/\/$/, '') : ''

export const produtosAppStore = defineStore('atommo', () => {
  // Estado essencial de autenticação e gestão de usuários
  const user = ref({ id: '', name: '', email: '', token: '', nivelAcesso: 'cliente' })
  const users = ref([])

  // Loading global baseado em requisições Axios em andamento
  const pendingRequests = ref(0)
  const globalLoading = computed(() => pendingRequests.value > 0)
  const isAdmin = computed(() => String(user.value.nivelAcesso || '').toLowerCase() === 'admin')

  // Interceptores Axios (contagem de pendências)
  let interceptorsInstalled = false
  function setupAxiosInterceptors(){
    if (interceptorsInstalled) return
    interceptorsInstalled = true
    axios.interceptors.request.use((config) => { pendingRequests.value++; return config }, (e) => Promise.reject(e))
    axios.interceptors.response.use(
      (res) => { pendingRequests.value = Math.max(0, pendingRequests.value - 1); return res },
      (err) => { pendingRequests.value = Math.max(0, pendingRequests.value - 1); return Promise.reject(err) }
    )
  }

  function applyAuthHeader(token){
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    else delete axios.defaults.headers.common['Authorization']
  }

  function saveSession(){
    try{ localStorage.setItem('app.auth', JSON.stringify({ id: user.value.id||'', name: user.value.name||'', email: user.value.email||'', token: user.value.token||'', nivelAcesso: user.value.nivelAcesso||'cliente' })) }catch{}
  }
  function loadSession(){
    try{
      const raw = localStorage.getItem('app.auth'); if(!raw) return
      const saved = JSON.parse(raw)
      user.value.id = saved?.id || ''
      user.value.name = saved?.name || ''
      user.value.email = saved?.email || ''
      user.value.token = saved?.token || ''
      user.value.nivelAcesso = saved?.nivelAcesso || 'cliente'
      applyAuthHeader(user.value.token)
    }catch{}
  }
  function clearSession(){
    user.value = { id: '', name: '', email: '', token: '', nivelAcesso: 'cliente' }
    try{ localStorage.removeItem('app.auth') }catch{}
    applyAuthHeader('')
  }
  watch(() => user.value.token, (tk) => { applyAuthHeader(tk); saveSession() })

  // Gestão de usuários (admin)
  async function listarUsuarios(params = {}){
    try{
      const { page = 1, limit = 20 } = params
      const { data, headers } = await axios.get('/users', { params: { page, limit } })
      const list = Array.isArray(data) ? data : (Array.isArray(data?.users) ? data.users : [])
      users.value = list.map(u => ({ ...u, nivelAcesso: u?.nivelAcesso || u?.role || 'user' }))
      const total = Number(headers?.['x-total-count'] || headers?.['X-Total-Count'] || users.value.length)
      return { ok: true, total, users: users.value }
    }catch(error){ console.error('Erro ao listar usuários:', error); return { ok: false, error } }
  }
  async function criarUsuario(payload){
    try{
      const permitidos = ['name','email','password','nivelAcesso','role']
      const body = {}
      for(const k of permitidos){ if(Object.prototype.hasOwnProperty.call(payload, k)) body[k] = payload[k] }
      if (body.role && !body.nivelAcesso) body.nivelAcesso = body.role
      if (!body.role && body.nivelAcesso) body.role = body.nivelAcesso
      const { data } = await axios.post('/users', body, { headers: { 'Content-Type': 'application/json' } })
      if(data){ users.value.unshift(data) }
      return { ok: true, user: data }
    }catch(error){ console.error('Erro ao criar usuário:', error); return { ok: false, error } }
  }
  async function atualizarUsuario(id, patch = {}){
    try{
      if(id == null) throw new Error('id_invalido')
      const permitidos = ['name','email','password','nivelAcesso','role']
      const body = {}
      for(const k of permitidos){ if(Object.prototype.hasOwnProperty.call(patch, k)) body[k] = patch[k] }
      if (body.role && !body.nivelAcesso) body.nivelAcesso = body.role
      if (!body.role && body.nivelAcesso) body.role = body.nivelAcesso
      const { data } = await axios.put(`/users/${id}`, body, { headers: { 'Content-Type': 'application/json' } })
      const idx = users.value.findIndex(u => (u?.ID ?? u?.id) === id)
      if(idx >= 0){ users.value[idx] = { ...users.value[idx], ...data } }
      return { ok: true, user: data }
    }catch(error){ console.error('Erro ao atualizar usuário:', error); return { ok: false, error } }
  }
  async function deletarUsuario(id){
    try{
      if(id == null) throw new Error('id_invalido')
      const res = await axios.delete(`/users/${id}`)
      if(res?.status === 204 || res?.status === 200){ users.value = users.value.filter(u => (u?.ID ?? u?.id) !== id); return { ok: true } }
      return { ok: false, status: res?.status }
    }catch(error){
      if(error?.response?.status === 404){ users.value = users.value.filter(u => (u?.ID ?? u?.id) !== id); return { ok: false, notFound: true } }
      console.error('Erro ao deletar usuário:', error); return { ok: false, error }
    }
  }

  // Métricas de monitoramento
  async function enviarMetricas(snapshot){
    try{
      const payload = { snapshot, userId: user.value.id || undefined, at: new Date().toISOString(), userAgent: navigator.userAgent }
      const { data } = await axios.post('/metrics', payload, { headers: { 'Content-Type': 'application/json' } })
      return { ok: true, data }
    }catch(error){ console.error('Erro ao enviar métricas:', error); return { ok: false, error } }
  }
  async function listarMetricas(params = {}){
    try{
      const { userId, limit = 50 } = params
      const { data } = await axios.get('/metrics', { params: { userId, limit } })
      const list = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : [])
      return { ok: true, items: list }
    }catch(error){ console.error('Erro ao listar métricas:', error); return { ok: false, error } }
  }
  async function obterMetrica(id){
    try{
      const { data } = await axios.get(`/metrics/${id}`)
      return { ok: true, item: data }
    }catch(error){ console.error('Erro ao obter métrica:', error); return { ok: false, error } }
  }

  // Init
  setupAxiosInterceptors();
  loadSession();

  return { user, users, isAdmin, globalLoading, loadSession, clearSession, listarUsuarios, criarUsuario, atualizarUsuario, deletarUsuario, enviarMetricas, listarMetricas, obterMetrica }
})
