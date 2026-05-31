<template>
  <div class="flex h-[100dvh] overflow-hidden">

    <!-- Sidebar -->
    <Sidebar :sidebarOpen="sidebarOpen" @close-sidebar="sidebarOpen = false" variant="v2" />

    <!-- Content area -->
    <div class="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden bg-white dark:bg-gray-900">

      <!-- Site header -->
      <Header :sidebarOpen="sidebarOpen" @toggle-sidebar="sidebarOpen = !sidebarOpen" variant="v3" />

      <main class="grow">

        <div class="relative">

          <!-- Content -->
          <div class="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">

            <!-- Page header -->
            <div class="sm:flex sm:justify-between sm:items-center mb-4 md:mb-2">

              <!-- Left: Title -->
              <div class="mb-4 sm:mb-0">
                <h1 class="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">$47,347.09</h1>
              </div>

              <!-- Right: Actions  -->
              <div class="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">

                <!-- Delete button -->
                <DeleteButton :selectedItems="selectedItems" />

                <!-- Search form -->
                <div class="hidden sm:block">
                  <SearchForm />
                </div>

                <!-- Export button -->
                <button class="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white">Export Transactions</button>

              </div>

            </div>

            <div class="mb-5">
              <span>Transactions from </span>
              <DropdownTransaction />
            </div>

            <!-- Filters -->
            <div class="mb-5">
              <ul class="flex flex-wrap -m-1">
                <li class="m-1">
                  <button class="inline-flex items-center justify-center text-sm font-medium leading-5 rounded-full px-3 py-1 border border-transparent shadow-xs bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-800 transition">View All</button>
                </li>
                <li class="m-1">
                  <button class="inline-flex items-center justify-center text-sm font-medium leading-5 rounded-full px-3 py-1 border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-xs bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 transition">Completed</button>
                </li>
                <li class="m-1">
                  <button class="inline-flex items-center justify-center text-sm font-medium leading-5 rounded-full px-3 py-1 border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-xs bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 transition">Pending</button>
                </li>
                <li class="m-1">
                  <button class="inline-flex items-center justify-center text-sm font-medium leading-5 rounded-full px-3 py-1 border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-xs bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 transition">Canceled</button>
                </li>
              </ul>
            </div>

            <!-- Table -->
            <TransactionsTable @change-selection="updateSelectedItems($event)" @open-transactionpanel="transactionPanelOpen = true" />

            <!-- Pagination -->
            <div class="mt-8">
              <PaginationClassic />
            </div>

          </div>

          <TransactionPanel :transactionPanelOpen="transactionPanelOpen" @close-transactionpanel="transactionPanelOpen = false" />

        </div>

      </main>

    </div>

  </div>
</template>

<script>
import { ref } from 'vue'
import Sidebar from '../../partials/Sidebar.vue'
import Header from '../../partials/Header.vue'
import DeleteButton from '../../partials/actions/DeleteButton.vue'
import SearchForm from '../../components/SearchForm.vue'
import DropdownTransaction from '../../components/DropdownTransaction.vue'
import TransactionsTable from '../../partials/finance/TransactionsTable02.vue'
import TransactionPanel from '../../partials/finance/TransactionPanel.vue'
import PaginationClassic from '../../components/PaginationClassic.vue'

export default {
  name: 'TransactionDetails',
  components: {
    Sidebar,
    Header,
    DeleteButton,
    SearchForm,
    DropdownTransaction,
    TransactionsTable,
    TransactionPanel,
    PaginationClassic,
  },
  setup() {
    const sidebarOpen = ref(false)
    const selectedItems = ref([])
    const transactionPanelOpen = ref(true)

    const updateSelectedItems = (selected) => {
      selectedItems.value = selected
    }

    return {
      sidebarOpen,
      selectedItems,
      transactionPanelOpen,
      updateSelectedItems,
    }
  },
}
</script>