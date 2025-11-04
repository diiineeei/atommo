<template>
<v-container id="container" fluid class="pa-md-0">
    <v-row class="d-flex justify-space-between">
        <v-col id="timeline-container" cols="12" class="d-none d-md-flex">
            <v-timeline direction="horizontal" line-inset="40"  truncate-line="both">
                <v-timeline-item dot-color="grey-lighten-5" size="x-large" :icon-color="timeline == 0 ? 'blue-accent-3':'grey-lighten-1'" fill-dot icon="mdi-cart"></v-timeline-item>
                <v-timeline-item dot-color="grey-lighten-5" size="x-large" :icon-color="timeline == 1 ? 'blue-accent-3':'grey-lighten-1'" fill-dot icon="mdi-account"></v-timeline-item>
                <v-timeline-item dot-color="grey-lighten-5" size="x-large" :icon-color="timeline == 2 ? 'blue-accent-3':'grey-lighten-1'" fill-dot icon="mdi-credit-card-outline"></v-timeline-item>
                <v-timeline-item dot-color="grey-lighten-5" size="x-large" :icon-color="timeline == 3 ? 'blue-accent-3':'grey-lighten-1'" fill-dot icon="mdi-check-circle"></v-timeline-item>
            </v-timeline>
        </v-col>

        <v-col id="carrinho-container" class="bg-white pa-10 rounded" cols="12" md="8">
            <v-row>
                <v-col cols="12" class="d-flex justify-space-between py-5">
                    <p class="text-h5 font-weight-bold text-center d-flex align-self-end text-grey-darken-3">
                        <v-badge color="success" class="mr-3" :content="store.productsCar.length">
                            <v-icon icon="mdi-cart" ></v-icon>
                        </v-badge>
                        PRODUTOS
                    </p>
                    <v-btn @click="clearCart()" prepend-icon="mdi-delete" variant="outlined" color="red">REMOVER TODOS</v-btn>
                </v-col>

                <v-divider/>

                <v-col>
                <v-list class="bg-white" id="products-list">

                <ProdutosCarrinhosMainVue
                v-for="produto in store.productsCar"
                :produto="produto"
                :key="getProductId(produto)"
                @changeItemQuantity="(type)=>changeItemQuantity(produto, type)"
                />
                </v-list>
                </v-col>
            </v-row>
        </v-col>
        <v-col id="total-container" class="bg-white pa-5" cols="12" md="4" lg="3" style="min-height: 600px;">
            <ProdutosResumo/>
        </v-col>
    </v-row>
</v-container>
</template>

<script setup>
import {ref} from 'vue';
import {produtosAppStore} from '@/store/app'
import ProdutosCarrinhosMainVue from './ComponentesCarrinhos/ProdutosCarrinhosMain.vue';
import ProdutosResumo from './ComponentesCarrinhos/ProdutosResumo.vue';
const store = produtosAppStore()
const timeline = ref(0)

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

 const changeItemQuantity = ((produto, type)=>{
    const index = store.productsCar.findIndex(
        (productCar) => getProductId(productCar) === getProductId(produto)
    )
    if (index === -1) {
        return
    }

    if (type === "delete") {
        store.productsCar.splice(index, 1)
        return
    }

    if (type === "add") {
        store.productsCar[index].quantity += 1
        return
    }

    if (type === "remove") {
        if (store.productsCar[index].quantity <= 1) {
            store.productsCar.splice(index, 1)
        } else {
            store.productsCar[index].quantity -= 1
        }
    }
 })

    const clearCart = (()=>{
        store.productsCar = []
    })


</script>


<style scoped>

#products-list{
  max-height: calc(100vh - var(--app-header-height, 72px) - 280px);
  overflow-y: auto;
}

#products-list::-webkit-scrollbar {
  width: 10px;
}
#products-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}
#products-list::-webkit-scrollbar-thumb:hover {
  background: #a0a0a0;
}
#products-list::-webkit-scrollbar-thumb{
  border-radius: 100px;
  background: #cecece;
}

#container{
    width: 80%;
}

@media(max-width: 960px){
    #container{
        width: 100%;
    }
}
</style>
