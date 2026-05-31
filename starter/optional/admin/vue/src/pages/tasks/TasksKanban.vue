<template>
  <div class="flex h-[100dvh] overflow-hidden">

    <!-- Sidebar -->
    <Sidebar :sidebarOpen="sidebarOpen" @close-sidebar="sidebarOpen = false" />

    <!-- Content area -->
    <div class="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
      
      <!-- Site header -->
      <Header :sidebarOpen="sidebarOpen" @toggle-sidebar="sidebarOpen = !sidebarOpen" />

      <main class="grow">
        <div class="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">

          <!-- Page header -->
          <div class="sm:flex sm:justify-between sm:items-center mb-8">

            <!-- Left: Title -->
            <div class="mb-4 sm:mb-0">
              <h1 class="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Acme Inc. Tasks</h1>
            </div>

            <!-- Right: Actions  -->
            <div class="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
              <!-- Add board button -->
              <button class="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white">Add Board</button>              
            </div>

          </div>

          <!-- Filters -->
          <div class="mb-4 border-b border-gray-200 dark:border-gray-700/60">
            <ul class="text-sm font-medium flex flex-nowrap -mx-4 sm:-mx-6 lg:-mx-8 overflow-x-scroll no-scrollbar">
              <li class="pb-3 mr-6 last:mr-0 first:pl-4 sm:first:pl-6 lg:first:pl-8 last:pr-4 sm:last:pr-6 lg:last:pr-8">
                <router-link class="text-violet-500 whitespace-nowrap" to="#0">View All</router-link>
              </li>
              <li class="pb-3 mr-6 last:mr-0 first:pl-4 sm:first:pl-6 lg:first:pl-8 last:pr-4 sm:last:pr-6 lg:last:pr-8">
                <router-link class="text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 whitespace-nowrap" to="#0">Web Sprint</router-link>
              </li>
              <li class="pb-3 mr-6 last:mr-0 first:pl-4 sm:first:pl-6 lg:first:pl-8 last:pr-4 sm:last:pr-6 lg:last:pr-8">
                <router-link class="text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 whitespace-nowrap" to="#0">Marketing</router-link>
              </li>
              <li class="pb-3 mr-6 last:mr-0 first:pl-4 sm:first:pl-6 lg:first:pl-8 last:pr-4 sm:last:pr-6 lg:last:pr-8">
                <router-link class="text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 whitespace-nowrap" to="#0">Development</router-link>
              </li>
            </ul>
          </div>          

          <!-- Cards -->
          <div class="grid grid-cols-12 gap-x-4 gap-y-8">
            <!-- Tasks column -->
            <TasksGroups title="To Do’s">
              <Task01 />
              <Task02 />
              <Task03 />              
            </TasksGroups>
            <!-- Tasks column -->
            <TasksGroups title="In Progress">
              <Task04 />
              <Task05 />
            </TasksGroups>
            <!-- Tasks column -->
            <TasksGroups title="Completed">
              <Task06 />
              <Task07 />
            </TasksGroups>
            <!-- Tasks column -->
            <TasksGroups title="Notes">
              <Task08 />
              <Task09 />
            </TasksGroups>            
          </div>

        </div>
      </main>

    </div> 

  </div>
</template>

<script>
import { ref } from 'vue'
import Sidebar from '../../partials/Sidebar.vue'
import Header from '../../partials/Header.vue'
import TasksGroups from '../../partials/tasks/TasksGroups.vue'
import Task01 from '../../partials/tasks/Task01.vue'
import Task02 from '../../partials/tasks/Task02.vue'
import Task03 from '../../partials/tasks/Task03.vue'
import Task04 from '../../partials/tasks/Task04.vue'
import Task05 from '../../partials/tasks/Task05.vue'
import Task06 from '../../partials/tasks/Task06.vue'
import Task07 from '../../partials/tasks/Task07.vue'
import Task08 from '../../partials/tasks/Task08.vue'
import Task09 from '../../partials/tasks/Task09.vue'

export default {
  name: 'TasksKanban',
  components: {
    Sidebar,
    Header,
    TasksGroups,
    Task01,
    Task02,
    Task03,
    Task04,
    Task05,
    Task06,
    Task07,
    Task08,
    Task09,
  },
  setup() {

    const sidebarOpen = ref(false)

    return {
      sidebarOpen,
    }  
  }
}
</script>