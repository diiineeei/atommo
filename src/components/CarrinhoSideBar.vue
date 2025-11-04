<template>

    <v-container class="cart-wrapper">
        <v-row>

            <v-col cols="12" class="mx-0 pa-0">
                <v-list lines="one" class="bg-transparent pa-4 cart-list" transition="fade-transition" elevation="3">
                    <div class="cart-header">
                        <h2 class="text-h4 text-center mb-0">
                            <v-badge color="success" :content="store.productsCar.length">
                                <v-icon icon="mdi-cart" size="small"></v-icon>
                            </v-badge>
                            CARRINHO
                        </h2>
                    </div>

                    <div class="cart-items">
                        <v-list-item v-for="produto in store.productsCar" :key="getProductId(produto)" color="primary" rounded="sm"
                            class="my-5">
                            <v-container class="item-main-container pa-0">
                                <div class="mr-5 w-50" >
                                <v-list-item-title>{{ produto.nome }}</v-list-item-title>
                                <v-list-item-subtitle>{{ productvalor(produto) }}</v-list-item-subtitle>
                                </div>
                              <div class="d-flex align-center">
                                <v-btn variant="text" icon="mdi-minus-circle" color="red-accent-2"
                                @click="changeItemQuantity(produto,'remove')"
                                ></v-btn>
                                {{ produto.quantity }}
                                <v-btn variant="text" icon="mdi-plus-circle" color="blue-accent-4"
                                @click="changeItemQuantity(produto,'add')"
                                ></v-btn>
                              </div>
                            </v-container>
                            <template v-slot:prepend>
                                <v-avatar size="85" rounded="0">
                                    <v-img :src="produto.imagemURL"></v-img>
                                </v-avatar>
                            </template>
                            <template v-slot:append>
                                <v-hover v-slot="{ isHovering, props }">
                                    <v-btn v-bind="props" :icon="isHovering ? 'mdi-delete-empty' : 'mdi-delete'" variant="text"
                                        elevation="0" color="red-darken-1"
                                        @click="removeItem(produto)"
                                        class="d-none d-sm-flex"/>
                                </v-hover>
                            </template>
                        </v-list-item>
                    </div>

                    <div class="cart-footer">
                        <h2 class="text-center text-h5 text-md-h4 mb-3">Total: {{ precoTotal }}</h2>
                        <v-btn append-icon="mdi-shopping-outline" color="blue-accent-3" to="/carrinho" block>Finalizar</v-btn>
                    </div>
                </v-list>
            </v-col>
        </v-row>


    </v-container>
</template>

<script setup>
import { computed } from 'vue';
import {produtosAppStore} from '@/store/app'
const store = produtosAppStore()

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

const precoTotal = computed(() => {
    const value = store.productsCar.reduce((total, produtoAtual) => total + produtoAtual.valor * produtoAtual.quantity, 0);
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    })
})

const productvalor = ((produto) => {
    const value = produto.valor * produto.quantity
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    })
})

/* const props = defineProps({
    produtos: Array
})
 */

 const changeItemQuantity = ((produto, type)=>{
    const index = store.productsCar.findIndex(
        (productCar) => getProductId(productCar) === getProductId(produto)
    )
    if (index === -1) {
        return
    }

    if (type === "add") {
        store.productsCar[index].quantity += 1
        return
    }

    if (type === "remove") {
        const nextQuantity = store.productsCar[index].quantity - 1
        if (nextQuantity <= 0) {
            removeItem(produto)
        } else {
            store.productsCar[index].quantity = nextQuantity
        }
    }
 })

 const removeItem = ((produto)=>{
    const index = store.productsCar.findIndex(
        (productCar) => getProductId(productCar) === getProductId(produto)
    )
    if (index === -1) {
        return
    }

    store.productsCar.splice( index, 1)
 })

</script>

<style scoped>
.cart-wrapper{
    max-height: calc(100vh - var(--app-header-height, 72px));
    overflow: hidden;
}

.item-main-container{
    display: flex;
    align-items: center;
}

.cart-list{
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: calc(100vh - var(--app-header-height, 72px) - 120px);
}

.cart-items{
    flex: 1;
    overflow-y: auto;
    padding-right: 4px;
    min-height: 0;
}

.cart-footer{
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    width: 100%;
}

.cart-items::-webkit-scrollbar {
  width: 8px;
}
.cart-items::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
}
.cart-items::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

@media (max-width: 960px){
  .cart-wrapper{ max-height: none; }
  .cart-list{ gap: 12px; }
  .item-main-container{ gap: 8px; }
}

@media (max-width: 600px){
  .cart-list{ gap: 8px; }
  .cart-items{ padding-right: 0; }
  .cart-footer h2{ font-size: 1.1rem !important; }
  .cart-wrapper :deep(.v-avatar){ width: 56px !important; height: 56px !important; }
  .cart-wrapper :deep(.v-list-item){ padding-left: 8px; padding-right: 6px; }
}
</style>
