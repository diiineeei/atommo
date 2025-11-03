import { defineStore } from 'pinia';
import { ref, watch, computed } from 'vue';
import axios from 'axios'; // Importe o Axios

export const produtosAppStore = defineStore('products', () => {
  const products = ref([]); // Inicialmente vazio
  const productsCar = ref([]);

  const user = ref({
    name: '',
    email: '',
    token: '',
    nivelAcesso: 'vendedor',
    compras: []
  });
  const users = ref([])
  const isAdmin = computed(() => String(user.value.nivelAcesso || '').toLowerCase() === 'admin')

  function applyAuthHeader(token){
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }

  function normalizeItem(raw){
    const i = raw || {}
    return {
      id: i.ID ?? i.id ?? i.cartId ?? undefined,
      nome: i.nome ?? i.productnome ?? i.name ?? '',
      valor: Number(i.valor ?? i.preco ?? i.price ?? 0),
      quantidade: Number(i.quantidade ?? i.qtd ?? i.quantity ?? 0),
      imagemURL: i.imagemURL ?? i.productimagemURL ?? i.imageUrl ?? undefined,
      codigoDeBarras: i.codigoDeBarras ?? i.barcode ?? i.ean ?? undefined,
    }
  }

  function normalizePedido(raw){
    const p = raw || {}
    const itens = Array.isArray(p.itens) ? p.itens.map(normalizeItem) : []
    const quantidadeItens = p.quantidadeItens ?? itens.reduce((a,i)=> a + Number(i.quantidade||0), 0)
    const total = p.total ?? itens.reduce((a,i)=> a + Number(i.valor||0) * Number(i.quantidade||0), 0)
    return {
      id: p.id ?? p.ID ?? p.numero ?? `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      criadoEm: p.criadoEm ?? p.createdAt ?? p.data ?? new Date().toISOString(),
      total,
      quantidadeItens,
      pagamento: p.pagamento || {
        metodo: p.metodoPagamento || 'pix',
        parcelas: p.parcelas || 1,
      },
      itens,
      pendenteSync: !!p.pendenteSync,
    }
  }

  function saveSession(){
    try{
      const payload = {
        name: user.value.name || '',
        email: user.value.email || '',
        token: user.value.token || '',
        nivelAcesso: user.value.nivelAcesso || 'vendedor',
        compras: Array.isArray(user.value.compras) ? user.value.compras : []
      }
      localStorage.setItem('app.auth', JSON.stringify(payload))
    }catch(e){ /* noop */ }
  }

  function loadSession(){
    try{
      const raw = localStorage.getItem('app.auth')
      if(!raw) return
      const saved = JSON.parse(raw)
      user.value.name = saved?.name || ''
      user.value.email = saved?.email || ''
      user.value.token = saved?.token || ''
      user.value.nivelAcesso = saved?.nivelAcesso || 'vendedor'
      user.value.compras = Array.isArray(saved?.compras) ? saved.compras : []
      applyAuthHeader(user.value.token)
      // tenta sincronizar compras pendentes assim que sessão é restaurada
      // sem await para não bloquear
      setTimeout(() => { try{ sincronizarComprasPendentes() }catch(_){} }, 0)
    }catch(e){ /* noop */ }
  }

  function clearSession(){
    user.value.name = ''
    user.value.email = ''
    user.value.token = ''
    user.value.nivelAcesso = 'vendedor'
    try{ localStorage.removeItem('app.auth') }catch(e){ /* noop */ }
    applyAuthHeader('')
  }

  // Atualiza header e salva sempre que token mudar
  watch(() => user.value.token, (tk) => {
    applyAuthHeader(tk)
    saveSession()
  })

  // Função para carregar produtos da API
  async function loadProducts() {
    try {
      const response = await axios.get('http://localhost:8080/api/lista/produtos');
      // const response = await axios.get('https://app-lojinha-vielkaxmma-uc.a.run.app/api/lista/produtos');
      products.value = response.data;
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      // Trate o erro conforme necessário
    }
  }

  // Carrega histórico de compras da API e mescla com pendentes locais
  async function carregarHistorico(){
    try{
      const { data } = await axios.get('http://localhost:8080/api/compras')
      // suporta respostas em vários formatos
      const lista = Array.isArray(data?.compras) ? data.compras : (Array.isArray(data) ? data : [])
      const normalizados = lista.map(normalizePedido)

      // mantem pendentes locais não enviados
      const pendentes = (user.value.compras || []).filter(c => c?.pendenteSync)

      // dedup por id (pendentes primeiro)
      const mapa = new Map()
      for(const p of [...pendentes, ...normalizados]){
        if(!mapa.has(p.id)) mapa.set(p.id, p)
      }
      user.value.compras = Array.from(mapa.values())
      saveSession()
      return { ok: true, total: user.value.compras.length }
    }catch(error){
      console.error('Erro ao carregar histórico:', error)
      return { ok: false, error }
    }
  }

  // Atualiza um produto via PATCH e reflete na lista local
  async function atualizarProduto(id, patch = {}){
    try{
      if(id == null) throw new Error('id_invalido')
      // filtra apenas campos aceitos pelo backend
      const permitidos = ['nome','descricao','valor','emEstoque','imagemURL','codigoDeBarras']
      const payload = {}
      for(const k of permitidos){
        if (Object.prototype.hasOwnProperty.call(patch, k)) payload[k] = patch[k]
      }
      const { data } = await axios.patch(`http://localhost:8080/api/produtos/${id}`, payload)
      // Atualiza item na lista local
      const pid = data?.ID ?? id
      const idx = products.value.findIndex(p => (p?.ID ?? p?.id) === pid)
      if(idx >= 0){
        products.value[idx] = { ...products.value[idx], ...data }
      }
      return { ok: true, produto: data }
    }catch(error){
      console.error('Erro ao atualizar produto:', error)
      return { ok: false, error }
    }
  }

  // Deleta um produto e remove da lista local
  async function deletarProduto(id){
    try{
      if(id == null) throw new Error('id_invalido')
      const res = await axios.delete(`http://localhost:8080/api/produtos/${id}`)
      if(res?.status === 204 || res?.status === 200){
        products.value = products.value.filter(p => (p?.ID ?? p?.id) !== id)
        return { ok: true }
      }
      return { ok: false, status: res?.status }
    }catch(error){
      if(error?.response?.status === 404){
        products.value = products.value.filter(p => (p?.ID ?? p?.id) !== id)
        return { ok: false, notFound: true }
      }
      console.error('Erro ao deletar produto:', error)
      return { ok: false, error }
    }
  }

  // Tenta reenviar compras pendentes
  async function sincronizarComprasPendentes(){
    const pendentes = (user.value.compras || []).filter(c => c?.pendenteSync)
    if(!pendentes.length) return { ok: true, reenviadas: 0 }
    let sucesso = 0
    for(const pedido of pendentes){
      try{
        const { data } = await axios.post('http://localhost:8080/api/compras', pedido)
        const normalizado = normalizePedido(data || pedido)
        // substitui na lista atual
        const idx = user.value.compras.findIndex(c => c.id === pedido.id)
        if(idx >= 0){
          user.value.compras[idx] = { ...normalizado, pendenteSync: false }
        }
        sucesso++
      }catch(_e){
        // mantém como pendente
      }
    }
    saveSession()
    return { ok: true, reenviadas: sucesso }
  }

  // Finaliza a compra atual, envia para API, e persiste no histórico
  async function finalizarCompra(opcoes = {}){
    const itens = (productsCar.value || []).map(p => ({
      id: p.ID ?? p.id ?? p.cartId ?? undefined,
      nome: p.nome,
      valor: p.valor,
      quantidade: p.quantity,
      imagemURL: p.imagemURL ?? p.productimagemURL ?? undefined,
      codigoDeBarras: p.codigoDeBarras ?? undefined,
    }))

    if(!itens.length){
      return { ok: false, motivo: 'carrinho_vazio' }
    }

    const total = itens.reduce((acc, i) => acc + Number(i.valor || 0) * Number(i.quantidade || 0), 0)
    const agora = new Date()
    const pedido = {
      id: `${agora.getTime()}-${Math.random().toString(36).slice(2,8)}`,
      criadoEm: agora.toISOString(),
      total,
      quantidadeItens: itens.reduce((a,i)=> a + Number(i.quantidade||0), 0),
      pagamento: {
        metodo: opcoes.metodoPagamento || 'pix',
        parcelas: opcoes.parcelas || 1,
      },
      itens,
    }

    // Tenta salvar remotamente sempre
    let persistido = null
    try{
      const { data } = await axios.post('http://localhost:8080/api/compras', pedido)
      persistido = normalizePedido(data || pedido)
      persistido.pendenteSync = false
    }catch(e){
      console.warn('Falha ao salvar compra remotamente, marcando como pendente.')
      persistido = { ...normalizePedido(pedido), pendenteSync: true }
    }

    user.value.compras = Array.isArray(user.value.compras) ? user.value.compras : []
    user.value.compras.unshift(persistido) // mais recente primeiro
    saveSession()

    // Limpa carrinho
    productsCar.value = []

    return { ok: true, pedido: persistido }
  }

  // Gestão de usuários (somente admin)
  async function listarUsuarios(params = {}){
    try{
      const { page = 1, limit = 20 } = params
      const { data, headers } = await axios.get('http://localhost:8080/api/users', { params: { page, limit } })
      users.value = Array.isArray(data) ? data : (Array.isArray(data?.users) ? data.users : [])
      const total = Number(headers?.['x-total-count'] || headers?.['X-Total-Count'] || users.value.length)
      return { ok: true, total, users: users.value }
    }catch(error){
      console.error('Erro ao listar usuários:', error)
      return { ok: false, error }
    }
  }

  async function criarUsuario(payload){
    try{
      const permitidos = ['name','email','password','nivelAcesso']
      const body = {}
      for(const k of permitidos){ if(Object.prototype.hasOwnProperty.call(payload, k)) body[k] = payload[k] }
      const { data } = await axios.post('http://localhost:8080/api/users', body, { headers: { 'Content-Type': 'application/json' } })
      if(data){ users.value.unshift(data) }
      return { ok: true, user: data }
    }catch(error){
      console.error('Erro ao criar usuário:', error)
      return { ok: false, error }
    }
  }

  async function atualizarUsuario(id, patch = {}){
    try{
      if(id == null) throw new Error('id_invalido')
      const permitidos = ['name','email','password','nivelAcesso']
      const body = {}
      for(const k of permitidos){ if(Object.prototype.hasOwnProperty.call(patch, k)) body[k] = patch[k] }
      const { data } = await axios.patch(`http://localhost:8080/api/users/${id}`, body, { headers: { 'Content-Type': 'application/json' } })
      const idx = users.value.findIndex(u => (u?.ID ?? u?.id) === id)
      if(idx >= 0){ users.value[idx] = { ...users.value[idx], ...data } }
      return { ok: true, user: data }
    }catch(error){
      console.error('Erro ao atualizar usuário:', error)
      return { ok: false, error }
    }
  }

  async function deletarUsuario(id){
    try{
      if(id == null) throw new Error('id_invalido')
      const res = await axios.delete(`http://localhost:8080/api/users/${id}`)
      if(res?.status === 204 || res?.status === 200){
        users.value = users.value.filter(u => (u?.ID ?? u?.id) !== id)
        return { ok: true }
      }
      return { ok: false, status: res?.status }
    }catch(error){
      if(error?.response?.status === 404){
        users.value = users.value.filter(u => (u?.ID ?? u?.id) !== id)
        return { ok: false, notFound: true }
      }
      console.error('Erro ao deletar usuário:', error)
      return { ok: false, error }
    }
  }

  // Inicialização da Store
  loadSession();
  // Carrega produtos após restaurar sessão (se houver)
  loadProducts();

  return { products, productsCar, user, users, isAdmin, loadProducts, loadSession, clearSession, finalizarCompra, carregarHistorico, sincronizarComprasPendentes, atualizarProduto, deletarProduto, listarUsuarios, criarUsuario, atualizarUsuario, deletarUsuario }; // Retorne também a função loadProducts se necessário
});
