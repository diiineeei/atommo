<template>

<div class="main-container">


<h1 class="page-title">Produtos</h1>

<div class="content">
  <div class="left-panel">
    <!-- Scanner toolbar -->
    <div class="scanner-toolbar">
      <div class="scanner-left">
        <v-switch
          color="blue-accent-2"
          hide-details
          inset
          v-model="habilitarLeitor"
          :label="`Leitor de código de barras: ${habilitarLeitor ? 'Ativo' : 'Inativo'}`"
        />
      </div>
      <div class="scanner-search">
        <v-text-field
          v-model="filtroNome"
          variant="outlined"
          density="comfortable"
          hide-details
          clearable
          label="Buscar por nome"
          prepend-inner-icon="mdi-magnify"
          class="scanner-search-input"
        />
      </div>
      <div class="scanner-right">
        <span class="scanner-last">
          <template v-if="ultimoCodigo">Último código: <strong>{{ ultimoCodigo }}</strong></template>
        </span>
        <v-btn
          variant="outlined"
          color="blue-accent-2"
          prepend-icon="mdi-refresh"
          :loading="recarregando"
          :disabled="recarregando"
          @click="recarregarProdutos"
        >Atualizar</v-btn>
      </div>
      <v-snackbar v-model="snackbar" timeout="2200" :color="snackbarColor" location="top right">
        {{ snackbarText }}
      </v-snackbar>
    </div>

  <section class="products-grid">
    <ProductCard
      v-for="product in filteredProducts"
      :key="product.ID"
      :productnome="product.nome"
      :productvalor="product.valor"
      :productDesc="product.descricao"
      :productimagemURL="product.imagemURL"
      :showActions="store.isAdmin"
      @edit="abrirEdicao(product)"
      @delete="confirmarExclusao(product)"
      @add-to-cart="onAddToCart(product)"
    />
  </section>

  <aside v-if="store.productsCar.length > 0" class="cart-aside">
    <div class="cart-panel" :class="{ 'cart-panel--fixed': shouldFixCart }">
      <CarrinhoCompras />
    </div>
  </aside>
  </div>

</div>

</div>

  <!-- Dialog de edição -->
  <EditarProdutoDialog
    v-model="edicaoAberta"
    :produto="produtoEditando"
    @salvo="onProdutoSalvo"
  />

  <!-- Confirmação de exclusão -->
  <v-dialog v-model="excluirAberta" max-width="480">
    <v-card>
      <v-card-title class="text-h6">Excluir produto</v-card-title>
      <v-card-text>
        Tem certeza que deseja excluir "{{ produtoExcluindo?.nome }}"?
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="excluirAberta = false">Cancelar</v-btn>
        <v-btn color="error" :loading="excluindo" @click="excluirProduto">Excluir</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

</template>


<script setup>
import  ProductCard  from './ProductCard.vue'
import EditarProdutoDialog from './EditarProdutoDialog.vue'
import CarrinhoCompras from './CarrinhoSideBar.vue';
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { produtosAppStore } from '@/store/app'
const store = produtosAppStore()
const shouldFixCart = computed(() => store.productsCar.length > 0)

// Barcode scanner handling
const habilitarLeitor = ref(true)
const ultimoCodigo = ref('')
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// Atualização manual de produtos
const recarregando = ref(false)
async function recarregarProdutos(){
  try{
    recarregando.value = true
    await store.loadProducts?.()
    notificar('Produtos atualizados', 'success')
  } catch (e) {
    notificar('Falha ao atualizar produtos', 'error')
  } finally {
    recarregando.value = false
  }
}

// Search filter by name
const filtroNome = ref('')
const filteredProducts = computed(() => {
  const term = (filtroNome.value || '').trim().toLowerCase()
  if (!term) return store.products
  return store.products.filter((p) =>
    (p?.nome ?? '').toLowerCase().includes(term) ||
    (p?.descricao ?? '').toLowerCase().includes(term)
  )
})

// Edição/Exclusão de produtos
const edicaoAberta = ref(false)
const produtoEditando = ref(null)
const excluirAberta = ref(false)
const produtoExcluindo = ref(null)
const excluindo = ref(false)

function abrirEdicao(produto){
  try{ store.listarProprietarios?.() }catch(_){ /* noop */ }
  produtoEditando.value = produto
  edicaoAberta.value = true
}

function onProdutoSalvo(){
  notificar('Produto atualizado', 'success')
}

function confirmarExclusao(produto){
  produtoExcluindo.value = produto
  excluirAberta.value = true
}

async function excluirProduto(){
  try{
    excluindo.value = true
    const id = produtoExcluindo.value?.ID ?? produtoExcluindo.value?.id
    const { ok, notFound } = await store.deletarProduto(id)
    if(ok || notFound){
      notificar('Produto excluído', 'success')
    }
  } finally {
    excluindo.value = false
    excluirAberta.value = false
  }
}

let buffer = ''
let lastKeyTs = 0
const INTERVALO_MAXIMO_MS = 100 // janela de tempo entre teclas do leitor

function notificar(msg, color = 'success'){
  snackbarText.value = msg
  snackbarColor.value = color
  snackbar.value = true
}

let audioCtx

function playBeep(type = 'success') {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)()
    const o = audioCtx.createOscillator()
    const g = audioCtx.createGain()
    const now = audioCtx.currentTime
    const duration = 0.2 // um pouco mais longo
    const freq = type === 'error' ? 300 : 1000 // mais contraste e frequências mais audíveis

    o.type = 'square' // 'square' soa mais forte que 'sine'
    o.frequency.setValueAtTime(freq, now)

    // aumenta o volume máximo
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(0.6, now + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration)

    o.connect(g)
    g.connect(audioCtx.destination)
    o.start(now)
    o.stop(now + duration)
  } catch (e) {
    // falha silenciosa se o contexto de áudio não estiver disponível
  }
}

function getBarcodeFromProduct(p){
  if(!p || typeof p !== 'object') return ''
  // Prioridade de chaves comuns
  const candidates = ['codigoDeBarras']
  for(const key of candidates){
    if(p[key] != null && p[key] !== '') return String(p[key])
  }
  return ''
}

function processarCodigo(codigo){
  const code = String(codigo || '').trim()
  if(!code) return
  ultimoCodigo.value = code

  const produto = store.products.find(p => String(getBarcodeFromProduct(p)) === code)
  if(!produto){
    notificar('Produto não encontrado para o código: ' + code, 'error')
    playBeep('error')
    return
  }
  onAddToCart(produto)
  notificar(`Adicionado ao carrinho: ${produto.nome}`,'success')
  playBeep('success')
}

function onKeydownGlobal(e){
  if(!habilitarLeitor.value) return
  // Evitar capturar quando usuário está digitando em inputs normais
  const tag = (document.activeElement?.tagName || '').toUpperCase()
  if(tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return

  const now = Date.now()
  if(now - lastKeyTs > INTERVALO_MAXIMO_MS){
    buffer = ''
  }
  lastKeyTs = now

  if(e.key === 'Enter'){
    e.preventDefault()
    const code = buffer
    buffer = ''
    if(code) processarCodigo(code)
    return
  }

  // Aceita apenas dígitos e letras comuns (alguns leitores podem enviar letras)
  const char = e.key
  if(char.length === 1 && /[0-9A-Za-z]/.test(char)){
    buffer += char
  }
}

onMounted(()=>{
  window.addEventListener('keydown', onKeydownGlobal)
})
onBeforeUnmount(()=>{
  window.removeEventListener('keydown', onKeydownGlobal)
})

const getProductId = (item) => {
  if (!item) return ''
  if (item.cartId) return item.cartId
  if (item.ID !== undefined && item.ID !== null) return item.ID
  if (item.id !== undefined && item.id !== null) return item.id
  if (item.nome) {
    return `${item.nome}-${item.valor ?? ''}`
  }
  return JSON.stringify(item)
}

function onAddToCart(product) {
  const cartId = getProductId(product)
  const productIndex = store.productsCar.findIndex(
    (productCar) => getProductId(productCar) === cartId
  )

  if (productIndex >= 0) {
    store.productsCar[productIndex].quantity += 1
    playBeep('success')
    return
  }

  store.productsCar.push({
    ...product,
    cartId,
    quantity: 1
  })
  playBeep('success')
}


// setTimeout(()=>{
//   let chickenProductIndex;
//   store.products.filter((product,index)=>{
//     if(product.nome == "Chicken") chickenProductIndex = index
//   })
//   // store.products[chickenProductIndex].imagemURL = "https://seara.com.br/wp-content/uploads/2022/10/7894904797905_Frango_inteiro_congelado_Seara_PRINCIPAL_520x440.png"
// },5000)

</script>

<style>
.main-container{
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 28px 32px 56px;
  box-sizing: border-box;

}

.left-panel{
  display: flex;
  flex-direction: column;
}

.scanner-toolbar{
  width: 100%;
  margin: 0 0 16px 0;
  display: grid;
  grid-template-columns: auto minmax(200px, 420px) 1fr;
  gap: 16px;
  align-items: center;
}

.scanner-last{
  color: #334155;
}

.scanner-right{
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.scanner-search{
  flex: 1;
  max-width: 520px;
  margin: 0 16px;
}

.scanner-search-input{
  width: 100%;
}

.page-title{
  width: 100%;
  max-width: 1360px;
  margin: 0 auto 44px;
  font-size: clamp(1.9rem, 1.5rem + 1vw, 2.7rem);
  font-weight: 700;
  color: #1f2933;
}

.content{
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 24px;
  align-items: start;
}

.products-grid{
  display: grid;
  width: 100%;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  padding: 8px 0;
}

.cart-aside{
  position: relative;
  width: 100%;
}

.cart-panel{
  position: sticky;
  top: calc(var(--app-header-height, 96px) + 24px);
  max-height: calc(100vh - var(--app-header-height, 96px) - 48px);
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.cart-panel--fixed{
  position: fixed;
  top: calc(var(--app-header-height, 96px) + 96px);
  right: max(60px, calc((100vw - 1660px) / 2 + 20px));
  width: clamp(320px, 26vw, 560px);
  max-width: calc(100vw - 64px);
  max-height: calc(100vh - var(--app-header-height, 96px) - 48px);
  z-index: 10;
  box-shadow: 0 16px 48px rgba(15, 23, 42, 0.12);
}

.cart-panel :deep(.cart-wrapper){
  width: 100%;
  height: 100%;
  max-height: inherit;
}

.cart-panel :deep(.cart-list){
  max-height: calc(100vh - var(--app-header-height, 96px) - 120px);
}

@media (max-width: 1280px){
  .main-container{
    padding-left: 20px;
    padding-right: 20px;
  }

  .page-title{
    margin-bottom: 32px;
  }

  .content{
    grid-template-columns: minmax(0, 1fr) 300px;
    gap: 20px;
  }

  .products-grid{
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 18px;
  }

  .cart-panel--fixed{
    top: calc(var(--app-header-height, 96px) + 96px);
    right: max(28px, calc((100vw - 1280px) / 2 + 16px));
    width: clamp(280px, 28vw, 340px);
  }
}

@media (max-width: 960px){
  .page-title{
    text-align: center;
  }

  .content{
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .cart-panel{
    position: static;
    max-height: none;
  }

  .cart-panel--fixed{
    position: static;
    right: auto;
    width: 100%;
    max-width: 100%;
    box-shadow: none;
  }

  .cart-panel :deep(.cart-list){
    max-height: calc(100vh - var(--app-header-height, 96px) - 120px);
  }
}

@media (max-width: 720px){
  .main-container{
    padding: 20px 16px 40px;
  }
  /* toolbar empilha em 1 coluna no mobile */
  .scanner-toolbar{
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .scanner-left{ width: 100%; }
  .scanner-search{ max-width: none; margin: 0; width: 100%; }
  .scanner-right{ width: 100%; justify-content: flex-end; }
  .products-grid{ gap: 12px; }
}

@media (max-width: 600px){
  .page-title{
    font-size: clamp(1.6rem, 1.2rem + 2vw, 2rem);
    margin-bottom: 20px;
  }
  .products-grid{
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
  /* redundante, mas mantém consistência em telas muito estreitas */
  .scanner-toolbar{ grid-template-columns: 1fr; }
  .scanner-right{ width: 100%; display: flex; justify-content: space-between; }
}

/* força 2 colunas estáveis na maioria dos celulares comuns */
@media (max-width: 600px){
  .products-grid{ grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
/* telefones muito estreitos: 1 coluna para legibilidade */
@media (max-width: 380px){
  .products-grid{ grid-template-columns: 1fr; }
}
</style>
