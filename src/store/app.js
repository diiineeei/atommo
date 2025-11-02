import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import axios from 'axios'; // Importe o Axios

export const produtosAppStore = defineStore('products', () => {
  const products = ref([]); // Inicialmente vazio
  const productsCar = ref([]);

  const user = ref({
    name: '',
    email: '',
    token: '',
    compras: []
  });

  function applyAuthHeader(token){
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }

  function saveSession(){
    try{
      const payload = {
        name: user.value.name || '',
        email: user.value.email || '',
        token: user.value.token || '',
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
      user.value.compras = Array.isArray(saved?.compras) ? saved.compras : []
      applyAuthHeader(user.value.token)
    }catch(e){ /* noop */ }
  }

  function clearSession(){
    user.value.name = ''
    user.value.email = ''
    user.value.token = ''
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

  // Finaliza a compra atual e persiste no histórico do usuário
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

    // Tenta salvar remotamente (opcional). Ignora falhas silenciosamente.
    try{
      if(opcoes?.salvarRemoto){
        await axios.post('http://localhost:8080/api/compras', pedido)
      }
    }catch(e){
      // noop: mantemos local mesmo assim
      console.warn('Falha ao salvar compra remotamente, mantendo apenas localmente.')
    }

    user.value.compras = Array.isArray(user.value.compras) ? user.value.compras : []
    user.value.compras.unshift(pedido) // mais recente primeiro
    saveSession()

    // Limpa carrinho
    productsCar.value = []

    return { ok: true, pedido }
  }

  // Inicialização da Store
  loadSession();
  // Carrega produtos após restaurar sessão (se houver)
  loadProducts();

  return { products, productsCar, user, loadProducts, loadSession, clearSession, finalizarCompra }; // Retorne também a função loadProducts se necessário
});
